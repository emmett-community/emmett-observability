import {
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

export const ResourceAttributes = {
  serviceName: SEMRESATTRS_SERVICE_NAME,
  serviceVersion: SEMRESATTRS_SERVICE_VERSION,
  deploymentEnvironment: SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} as const;

export const LogAttributes = {
  traceId: 'trace_id',
  spanId: 'span_id',
} as const;
