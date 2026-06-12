import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import {traceIdFormat} from "./trace-format";
import {env} from "../config/env";

const fileTransport = new DailyRotateFile({
    filename: `${env.LOG_DIR}/app-%DATE%.log`,
    datePattern: "YYYY-MM-DD",
    maxFiles: env.LOG_MAX_FILES,
    zippedArchive: true,
    format: winston.format.combine(
        traceIdFormat(),
        winston.format.json()
    )
});

export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: winston.format.combine(
        traceIdFormat(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({}),
        fileTransport
    ]
});
