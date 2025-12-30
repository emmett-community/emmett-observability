# @emmett-community/emmett-observability

Application-level observability helpers for Emmett apps. This package wires OpenTelemetry tracing and Pino logging in a way that is explicit, opt-in, and friendly to application composition.

[![npm version](https://img.shields.io/npm/v/@emmett-community/emmett-observability.svg)](https://www.npmjs.com/package/@emmett-community/emmett-observability) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Build and test](https://github.com/emmett-community/emmett-observability/actions/workflows/build_and_test.yml/badge.svg)](https://github.com/emmett-community/emmett-observability/actions/workflows/build_and_test.yml)

## Features

- ✅ Explicit tracing initialization (OTLP or console exporter)
- ✅ Pino logger factory with trace correlation
- ✅ Shared conventions for attributes and span naming
- ✅ No side effects on import

## Why this package exists

Applications need consistent observability wiring without pulling in Emmett core packages or hiding OpenTelemetry concepts. This package provides a small, explicit layer that applications can opt into while keeping infrastructure concerns outside domain logic.

## How it relates to other emmett-community packages

- It is **only for applications**.
- It is **not** a dependency of any emmett-* core packages (pubsub, firestore, express, etc).
- It shares conventions with the rest of the ecosystem but stays decoupled from domain code.

## Why it is optional

Observability choices (tracing exporters, sampling, logger configuration) are infrastructure decisions that vary per application. This package keeps those decisions explicit and keeps imports silent by default.

## Installation

```bash
npm install @emmett-community/emmett-observability
```

## Quick start

```typescript
import { initTracing, createLogger } from '@emmett-community/emmett-observability';

const shutdown = await initTracing({
  serviceName: 'billing-api',
  serviceVersion: '1.2.0',
  environment: 'production',
  exporter: { type: 'otlp', options: { url: 'http://localhost:4318/v1/traces' } },
  sampling: { ratio: 1 },
});

const logger = createLogger({
  serviceName: 'billing-api',
  environment: 'production',
  logLevel: 'info',
});

logger.info({ event: 'startup' }, 'service-ready');

process.on('SIGTERM', async () => {
  await shutdown();
  process.exit(0);
});
```

## Tracing

```typescript
import { initTracing } from '@emmett-community/emmett-observability';

const shutdown = await initTracing({
  serviceName: 'payments-api',
  environment: 'staging',
  exporter: { type: 'console' },
  sampling: { ratio: 0.25, parentBased: true },
});

// ...start spans with @opentelemetry/api

await shutdown();
```

## Logging

```typescript
import { context, trace } from '@opentelemetry/api';
import { createLogger } from '@emmett-community/emmett-observability';

const logger = createLogger({ serviceName: 'orders-api', environment: 'dev' });
const tracer = trace.getTracer('orders');

const span = tracer.startSpan('http.request');
context.with(trace.setSpan(context.active(), span), () => {
  logger.info({ route: '/health' }, 'request');
  span.end();
});
```

When tracing is active, log entries include `trace_id` and `span_id` fields.

## Pretty logs (development)

By default, logging outputs JSON. To enable pretty logs locally, set `LOG_PRETTY=true`. If `LOG_PRETTY` is not set, pretty logs are enabled when `NODE_ENV` is `development` or `test`. Production output remains JSON.

```bash
LOG_PRETTY=true node ./dist/index.js
```

## Conventions

```typescript
import { createSpanName, LogAttributes } from '@emmett-community/emmett-observability';

const spanName = createSpanName({
  component: 'http',
  operation: 'request',
  target: 'GET /health',
});

// LogAttributes.traceId => "trace_id"
// LogAttributes.spanId => "span_id"
```

## Auto-instrumentation

This package does not auto-register instrumentations. If you want auto-instrumentation, register it explicitly in your application after initializing tracing:

```typescript
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { initTracing } from '@emmett-community/emmett-observability';

await initTracing({
  serviceName: 'orders-api',
  exporter: { type: 'otlp' },
});

registerInstrumentations({
  instrumentations: [getNodeAutoInstrumentations()],
});
```

## What this package intentionally does NOT do

- Initialize tracing or logging on import
- Create spans for you automatically
- Depend on any emmett-* core package
- Depend on Google Cloud SDKs
- Include domain logic or business rules
- Hide OpenTelemetry concepts behind abstractions

## Testing

```bash
npm run test:unit
npm run test:int
npm run test:e2e
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

---

Made with ❤️ by the Emmett Community
