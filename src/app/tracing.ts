import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { logger } from './logging';
import {env} from '../config/env';

let sdk: NodeSDK | null = null;
let sdkStarted = false;

if (!env.OTEL_SDK_DISABLED) {
  sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': { enabled: false },
        '@opentelemetry/instrumentation-dns': { enabled: false },
        '@opentelemetry/instrumentation-net': { enabled: false },
      }),
    ],
  });

  sdk.start();
  sdkStarted = true;

  logger.info({
    event: 'tracing_configured',
    service: env.OTEL_SERVICE_NAME,
    endpoint: `${env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
    tracing_enabled: true,
  });
} else {
  logger.info({
    event: 'tracing_disabled',
    service: env.OTEL_SERVICE_NAME,
    tracing_enabled: false,
  });
}

export async function shutdownTracing(): Promise<void> {
  if (!sdkStarted || !sdk) return;

  try {
    await sdk.shutdown();
    logger.info({ event: 'tracing_shutdown' });
  } catch (err) {
    logger.error({ event: 'tracing_shutdown_error', error: String(err) });
  }
}
