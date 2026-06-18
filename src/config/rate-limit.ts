import { env } from "./env";

/**
 * Rate limiting configuration per tier.
 *
 * Key format di Redis:
 *   {APP_NAME}:ratelimit:{tier}:{identifier}
 *
 * Contoh:
 *   belajar-typescript-restful-api:ratelimit:global:192.168.1.100
 *   belajar-typescript-restful-api:ratelimit:auth:192.168.1.100
 *   belajar-typescript-restful-api:ratelimit:api:eko
 */
export const RATE_LIMIT = {
    GLOBAL: {
        WINDOW_MS: env.RATE_LIMIT_GLOBAL_WINDOW_MS,
        MAX: env.RATE_LIMIT_GLOBAL_MAX,
        KEY_PREFIX: `${env.APP_NAME}:ratelimit:global:`,
    },
    AUTH: {
        WINDOW_MS: env.RATE_LIMIT_AUTH_WINDOW_MS,
        MAX: env.RATE_LIMIT_AUTH_MAX,
        KEY_PREFIX: `${env.APP_NAME}:ratelimit:auth:`,
    },
    API: {
        WINDOW_MS: env.RATE_LIMIT_API_WINDOW_MS,
        MAX: env.RATE_LIMIT_API_MAX,
        KEY_PREFIX: `${env.APP_NAME}:ratelimit:api:`,
    },
};
