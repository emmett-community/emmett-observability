import { context, isSpanContextValid, trace } from '@opentelemetry/api';
import pino, { type LevelWithSilent, type Logger } from 'pino';
import { LogAttributes, ResourceAttributes } from '../conventions/attributes';

export type LoggerOptions = {
  serviceName: string;
  environment?: string;
  logLevel?: LevelWithSilent;
};

const shouldUsePretty = (): boolean => {
  if (process.env.LOG_PRETTY === 'true') return true;

  const nodeEnv = process.env.NODE_ENV;

  return nodeEnv === 'development' || nodeEnv === 'test';
};

const buildBaseBindings = (options: LoggerOptions): Record<string, string> => {
  const bindings: Record<string, string> = {
    [ResourceAttributes.serviceName]: options.serviceName,
  };

  if (options.environment)
    bindings[ResourceAttributes.deploymentEnvironment] = options.environment;

  return bindings;
};

const getTraceBindings = (): Record<string, string> | undefined => {
  const span = trace.getSpan(context.active());

  if (!span) return undefined;

  const spanContext = span.spanContext();

  if (!isSpanContextValid(spanContext)) return undefined;

  return {
    [LogAttributes.traceId]: spanContext.traceId,
    [LogAttributes.spanId]: spanContext.spanId,
  };
};

export const createLogger = (options: LoggerOptions): Logger => {
  const baseBindings = buildBaseBindings(options);
  const prettyEnabled = shouldUsePretty();
  const transport = prettyEnabled
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined;

  const loggerOptions = {
    name: options.serviceName,
    level: options.logLevel ?? 'info',
    mixin: () => {
      const traceBindings = getTraceBindings();

      if (!traceBindings) return baseBindings;

      return { ...baseBindings, ...traceBindings };
    },
  };

  return transport ? pino(loggerOptions, transport) : pino(loggerOptions);
};
