import {PrismaClient} from "@prisma/client";
import {trace, SpanStatusCode} from "@opentelemetry/api";
import {logger} from "./logging";

const tracer = trace.getTracer("prisma");

const baseClient = new PrismaClient({
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
    ]
});

baseClient.$on("error", (e) => {
    logger.error({event: "prisma:error", message: e.message, target: e.target});
})

baseClient.$on("warn", (e) => {
    logger.warn({event: "prisma:warn", message: e.message, target: e.target});
})

baseClient.$on("info", (e) => {
    logger.info({event: "prisma:info", message: e.message, target: e.target});
})

baseClient.$on("query", (e) => {
    logger.debug({event: "prisma:query", query: e.query, duration: e.duration});
})

export const prismaClient = baseClient.$extends({
    query: {
        $allModels: {
            async $allOperations({model, operation, args, query}) {
                const span = tracer.startSpan(`prisma.${model}.${operation}`);
                try {
                    const result = await query(args);
                    span.end();
                    return result;
                } catch (err) {
                    span.recordException(err as Error);
                    span.setStatus({code: SpanStatusCode.ERROR});
                    span.end();
                    throw err;
                }
            }
        }
    }
});
