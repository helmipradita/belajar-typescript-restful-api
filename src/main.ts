import "./config/env";
import {env} from "./config/env";
import {shutdownTracing} from "./app/tracing";
import {app} from "./app/app";
import {logger} from "./app/logging";
import {prismaClient} from "./app/database";

const server = app.listen(env.PORT, () => {
    logger.info("Listening on port " + env.PORT);
});

const gracefulShutdown = async (signal: string) => {
    logger.info({event: "shutdown", signal, message: "Shutting down gracefully..."});

    server.close(() => {
        logger.info({event: "shutdown", message: "HTTP server closed"});
    });

    await prismaClient.$disconnect();
    logger.info({event: "shutdown", message: "Prisma disconnected"});

    await shutdownTracing();

    process.exit(0);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
    logger.error({event: "unhandled_rejection", error: String(reason)});
});

process.on("uncaughtException", (error) => {
    logger.error({event: "uncaught_exception", error: String(error)});
    process.exit(1);
});
