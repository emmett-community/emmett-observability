import assert from 'node:assert/strict';
import { context, trace } from '@opentelemetry/api';
import { describe, it } from 'node:test';
import type { Logger } from 'pino';
import { createLogger } from '../../src/logging/createLogger';
import { initTracing } from '../../src/tracing/initTracing';
import { captureStdout, parseJsonLogs } from '../helpers/logCapture';

const runApp = (logger?: Logger) => {
  const tracer = trace.getTracer('e2e-app');
  const span = tracer.startSpan('app.request');

  context.with(trace.setSpan(context.active(), span), () => {
    if (logger) logger.info({ event: 'work' }, 'work');
  });

  span.end();
};

void describe('Observability e2e', () => {
  void it('runs only with explicit wiring and shuts down cleanly', async () => {
    const shutdown = await initTracing({
      serviceName: 'e2e-app',
      exporter: { type: 'console' },
    });

    const { logs, restore } = captureStdout();

    try {
      runApp();

      const logger = createLogger({
        serviceName: 'e2e-app',
        environment: 'test',
      });

      runApp(logger);
    } finally {
      restore();
      await shutdown();
      trace.disable();
    }

    const entries = parseJsonLogs(logs);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].msg, 'work');
    assert.equal(entries[0].event, 'work');
  });
});
