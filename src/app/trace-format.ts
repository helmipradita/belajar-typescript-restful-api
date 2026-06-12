import {context, trace} from "@opentelemetry/api";
import winston from "winston";

export const traceIdFormat = winston.format((info) => {
    const span = trace.getSpan(context.active());
    const spanContext = span?.spanContext();
    if (spanContext) {
        info.trace_id = spanContext.traceId;
    }
    return info;
});
