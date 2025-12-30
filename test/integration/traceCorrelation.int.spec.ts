import assert from 'node:assert/strict';
import { context, trace } from '@opentelemetry/api';
import { describe, it } from 'node:test';
import { createLogger } from '../../src/logging/createLogger';
import { initTracing } from '../../src/tracing/initTracing';
import { captureStdout, parseJsonLogs } from '../helpers/logCapture';

void describe('Observability integration', () => {
  void it('correlates logs and spans with the same trace_id', async () => {
    const shutdown = await initTracing({
      serviceName: 'integration-app',
      exporter: { type: 'console' },
    });

    const { logs, restore } = captureStdout();

    const logger = createLogger({
      serviceName: 'integration-app',
      environment: 'test',
    });

    const tracer = trace.getTracer('integration');
    const span = tracer.startSpan('integration-span');
    const spanContext = span.spanContext();

    try {
      context.with(trace.setSpan(context.active(), span), () => {
        logger.info({ route: '/health' }, 'healthcheck');
      });
    } finally {
      restore();
      span.end();
      await shutdown();
      trace.disable();
    }

    const entries = parseJsonLogs(logs);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].trace_id, spanContext.traceId);
    assert.equal(entries[0].span_id, spanContext.spanId);
  });

  void it('supports init and shutdown lifecycle', async () => {
    const shutdown = await initTracing({
      serviceName: 'integration-app',
      exporter: { type: 'console' },
    });

    await shutdown();
    trace.disable();

    assert.ok(true);
  });
});
