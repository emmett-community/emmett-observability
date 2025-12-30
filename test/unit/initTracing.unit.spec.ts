import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isSpanContextValid, trace } from '@opentelemetry/api';
import { createLogger } from '../../src/logging/createLogger';

void describe('initTracing - unit', () => {
  void it('does not initialize tracing unless called', () => {
    trace.disable();

    createLogger({
      serviceName: 'unit-app',
      environment: 'test',
      logLevel: 'info',
    });

    const tracer = trace.getTracer('unit-no-init');
    const span = tracer.startSpan('no-op');
    const spanContext = span.spanContext();

    span.end();

    assert.equal(isSpanContextValid(spanContext), false);
  });
});
