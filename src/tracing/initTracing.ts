import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import {
  AlwaysOnSampler,
  ConsoleSpanExporter,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
  type Sampler,
} from '@opentelemetry/sdk-trace-base';
import { ResourceAttributes } from '../conventions/attributes';

export type SamplingOptions = {
  ratio?: number;
  parentBased?: boolean;
};

export type OtlpExporterOptions = {
  url?: string;
  headers?: Record<string, string>;
};

export type TracingExporterOptions =
  | { type: 'otlp'; options?: OtlpExporterOptions }
  | { type: 'console' };

export type TracingOptions = {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  sampling?: SamplingOptions;
  exporter?: TracingExporterOptions;
};

export type TracingShutdown = () => Promise<void>;

const validateSamplingRatio = (ratio: number): number => {
  if (!Number.isFinite(ratio))
    throw new RangeError('Sampling ratio must be a number between 0 and 1.');
  if (ratio < 0 || ratio > 1)
    throw new RangeError('Sampling ratio must be between 0 and 1.');
  return ratio;
};

const buildSampler = (sampling?: SamplingOptions): Sampler | undefined => {
  if (!sampling) return undefined;

  const { ratio, parentBased } = sampling;
  const rootSampler =
    ratio === undefined
      ? new AlwaysOnSampler()
      : new TraceIdRatioBasedSampler(validateSamplingRatio(ratio));

  if (parentBased === false) return rootSampler;

  return new ParentBasedSampler({ root: rootSampler });
};

const buildResource = (options: TracingOptions): Resource => {
  const attributes: Record<string, string> = {
    [ResourceAttributes.serviceName]: options.serviceName,
  };

  if (options.serviceVersion)
    attributes[ResourceAttributes.serviceVersion] = options.serviceVersion;

  if (options.environment)
    attributes[ResourceAttributes.deploymentEnvironment] = options.environment;

  return new Resource(attributes);
};

const buildExporter = (exporter?: TracingExporterOptions) => {
  if (!exporter || exporter.type === 'otlp') {
    return new OTLPTraceExporter(
      exporter?.type === 'otlp' ? exporter.options : undefined,
    );
  }

  return new ConsoleSpanExporter();
};

export const initTracing = async (
  options: TracingOptions,
): Promise<TracingShutdown> => {
  const resource = buildResource(options);
  const sampler = buildSampler(options.sampling);
  const exporter = buildExporter(options.exporter);

  const sdk = new NodeSDK({
    resource,
    sampler,
    traceExporter: exporter,
  });

  await sdk.start();

  return () => sdk.shutdown();
};
