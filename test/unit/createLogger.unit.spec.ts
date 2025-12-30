import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { context, trace } from '@opentelemetry/api';
import { createLogger } from '../../src/logging/createLogger';
import { initTracing } from '../../src/tracing/initTracing';
import { captureStdout, parseJsonLogs } from '../helpers/logCapture';

void describe('createLogger - unit', () => {
  void it('logs without tracing initialized', () => {
    const { logs, restore } = captureStdout();

    try {
      const logger = createLogger({
        serviceName: 'unit-app',
        environment: 'test',
        logLevel: 'info',
      });

      logger.info({ event: 'unit' }, 'logger-ready');
    } finally {
      restore();
    }

    const entries = parseJsonLogs(logs);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].msg, 'logger-ready');
    assert.equal(entries[0].event, 'unit');
    assert.equal(entries[0]['service.name'], 'unit-app');
    assert.equal(entries[0]['deployment.environment'], 'test');
    assert.ok(!('trace_id' in entries[0]));
    assert.ok(!('span_id' in entries[0]));
  });

  void it('injects trace context when tracing is active', async () => {
    const shutdown = await initTracing({
      serviceName: 'unit-app',
      exporter: { type: 'console' },
    });

    const { logs, restore } = captureStdout();

    const logger = createLogger({
      serviceName: 'unit-app',
      environment: 'test',
      logLevel: 'info',
    });

    const tracer = trace.getTracer('unit-logger');
    const span = tracer.startSpan('logger-span');
    const spanContext = span.spanContext();

    try {
      context.with(trace.setSpan(context.active(), span), () => {
        logger.info({ event: 'trace' }, 'logger-traced');
      });
    } finally {
      restore();
      span.end();
      await shutdown();
      trace.disable();
    }

    const entries = parseJsonLogs(logs);

    assert.equal(entries.length, 1);
    assert.equal(entries[0].msg, 'logger-traced');
    assert.equal(entries[0].event, 'trace');
    assert.equal(entries[0].trace_id, spanContext.traceId);
    assert.equal(entries[0].span_id, spanContext.spanId);
  });
});
