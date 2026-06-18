import rateLimit, {RateLimitRequestHandler} from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import {redis} from "../app/redis";
import {RATE_LIMIT} from "../config/rate-limit";
import {env} from "../config/env";
import {logger} from "../app/logging";
import {rateLimitBlockedTotal} from "../app/metrics";
import type {Request} from "express";

/**
 * Helper: buat Redis store untuk rate-limiter tier.
 * Prefix key dibedakan per tier supaya tidak bentrok.
 */
function createStore(prefix: string) {
    return new RedisStore({
        prefix,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sendCommand: (...args: string[]) => redis.call(args[0], ...args.slice(1)) as any,
    });
}

/**
 * Helper: skip handler — matikan semua limiter kalau RATE_LIMIT_ENABLED=false
 */
function skipAll(): boolean {
    return !env.RATE_LIMIT_ENABLED;
}

/**
 * Helper: default rate limit message format (konsisten dengan error middleware)
 */
function createMessage(text: string) {
    return {errors: [{message: text}]};
}

// ──────────────────────────────────────────────────
// Tier 1: Global Rate Limiter
// ──────────────────────────────────────────────────
// Member Proteksi: per-IP untuk semua endpoint.
// Pengecualian: healthz, health, metrics (infrastructure).
export const globalLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: RATE_LIMIT.GLOBAL.WINDOW_MS,
    max: RATE_LIMIT.GLOBAL.MAX,
    standardHeaders: true,
    legacyHeaders: false,
    validate: {ip: false},
    store: createStore(RATE_LIMIT.GLOBAL.KEY_PREFIX),
    keyGenerator: (req: Request) => req.ip ?? "unknown",
    skip: (req: Request) => {
        if (skipAll()) return true;
        return ["/healthz", "/health", "/metrics"].some((p) => req.path.endsWith(p));
    },
    message: createMessage("Too many requests, please try again later"),
    handler: (req: Request, res) => {
        logger.warn({
            event: "rate_limit.exceeded",
            tier: "global",
            method: req.method,
            path: req.path,
            ip: req.ip,
        });
        rateLimitBlockedTotal.inc({tier: "global", method: req.method});
        res.status(429).json(createMessage("Too many requests, please try again later"));
    },
});

// ──────────────────────────────────────────────────
// Tier 2: Auth Rate Limiter (Strict)
// ──────────────────────────────────────────────────
// Member Proteksi: per-IP untuk login/register/refresh.
// Mencegah brute force credential stuffing.
export const authLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: RATE_LIMIT.AUTH.WINDOW_MS,
    max: RATE_LIMIT.AUTH.MAX,
    standardHeaders: true,
    legacyHeaders: false,
    validate: {ip: false},
    store: createStore(RATE_LIMIT.AUTH.KEY_PREFIX),
    keyGenerator: (req: Request) => req.ip ?? "unknown",
    skip: skipAll,
    message: createMessage("Too many login attempts, please try again later"),
    handler: (req: Request, res) => {
        logger.warn({
            event: "rate_limit.exceeded",
            tier: "auth",
            method: req.method,
            path: req.path,
            ip: req.ip,
        });
        rateLimitBlockedTotal.inc({tier: "auth", method: req.method});
        res.status(429).json(createMessage("Too many login attempts, please try again later"));
    },
});

// ──────────────────────────────────────────────────
// Tier 3: API Rate Limiter (Per-User)
// ──────────────────────────────────────────────────
// Member Proteksi: per-user untuk authenticated routes.
// Key = username dari JWT (tanpa DB lookup).
export const apiLimiter: RateLimitRequestHandler = rateLimit({
    windowMs: RATE_LIMIT.API.WINDOW_MS,
    max: RATE_LIMIT.API.MAX,
    standardHeaders: true,
    legacyHeaders: false,
    validate: {ip: false},
    store: createStore(RATE_LIMIT.API.KEY_PREFIX),
    keyGenerator: (req: Request) => {
        const user = (req as any).user;
        return user?.username ?? req.ip ?? "unknown";
    },
    skip: skipAll,
    message: createMessage("Too many requests, please slow down"),
    handler: (req: Request, res) => {
        logger.warn({
            event: "rate_limit.exceeded",
            tier: "api",
            method: req.method,
            path: req.path,
            ip: req.ip,
            user: (req as any).user?.username,
        });
        rateLimitBlockedTotal.inc({tier: "api", method: req.method});
        res.status(429).json(createMessage("Too many requests, please slow down"));
    },
});
