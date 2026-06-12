import winston from "winston";
import {traceIdFormat} from "./trace-format";
import {env} from "../config/env";

export const logger = winston.createLogger({
    level: env.LOG_LEVEL,
    format: winston.format.combine(
        traceIdFormat(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console({})
    ]
})
