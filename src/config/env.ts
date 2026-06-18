import "dotenv/config";
import {z} from "zod";

const envSchema = z.object({
    APP_NAME: z.string().min(1).default("belajar-typescript-restful-api"),
    NODE_ENV: z.enum(["development", "production", "test"]),
    PORT: z.coerce.number().int().positive(),
    DATABASE_URL: z.string().min(1),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]),
    LOG_DIR: z.string().default("logs"),
    LOG_MAX_FILES: z.string().default("14d"),
    JWT_SECRET: z.string().min(1),
    JWT_ACCESS_EXPIRES_IN: z.string().min(1),
    JWT_REFRESH_EXPIRES_IN: z.string().min(1),
    BODY_LIMIT: z.string().default("1mb"),
    CORS_ORIGIN: z.string().default("*"),
    OTEL_EXPORTER_OTLP_ENDPOINT: z.string().min(1),
    OTEL_SERVICE_NAME: z.string().min(1),
    OTEL_SDK_DISABLED: z.string().optional(),

    // Redis — required like MySQL
    REDIS_URL: z.string().min(1, "REDIS_URL is required"),

    // Rate Limiting — master switch + tier configs
    RATE_LIMIT_ENABLED: z.string().optional(),
    RATE_LIMIT_GLOBAL_MAX: z.coerce.number().int().positive().default(60),
    RATE_LIMIT_GLOBAL_WINDOW_MS: z.coerce.number().int().positive().default(60000),
    RATE_LIMIT_AUTH_MAX: z.coerce.number().int().positive().default(20),
    RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
    RATE_LIMIT_API_MAX: z.coerce.number().int().positive().default(500),
    RATE_LIMIT_API_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error("Missing or invalid environment variables:");
    for (const issue of parsed.error.issues) {
        const path = issue.path.join(".");
        console.error(`  - ${path}: ${issue.message}`);
    }
    process.exit(1);
}

export const env = {
    ...parsed.data,
    OTEL_SDK_DISABLED: parsed.data.OTEL_SDK_DISABLED === "true",
    RATE_LIMIT_ENABLED: parsed.data.RATE_LIMIT_ENABLED === "true",
} as const;
