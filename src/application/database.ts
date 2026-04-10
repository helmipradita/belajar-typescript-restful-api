import {PrismaClient} from "@prisma/client";
import {logger} from "./logging";

// Limit connection pool size for test environment to avoid "too many connections" error
const connectionLimit = process.env.NODE_ENV === "test" ? 1 : undefined;

export const prismaClient = new PrismaClient({
    log: [
        {
            emit: "event",
            level: "query"
        },
        {
            emit: "event",
            level: "error"
        },
        {
            emit: "event",
            level: "info"
        },
        {
            emit: "event",
            level: "warn"
        }
    ],
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

prismaClient.$on("error", (e) => {
    logger.error(e);
})

prismaClient.$on("warn", (e) => {
    logger.warn(e);
})

prismaClient.$on("info", (e) => {
    logger.info(e);
})

prismaClient.$on("query", (e) => {
    logger.info(e);
})
