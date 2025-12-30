export type SpanNameOptions = {
  component: string;
  operation: string;
  target?: string;
};

export const createSpanName = ({
  component,
  operation,
  target,
}: SpanNameOptions): string => {
  const trimmedComponent = component.trim();
  const trimmedOperation = operation.trim();
  const scope = [trimmedComponent, trimmedOperation]
    .filter((value) => value.length > 0)
    .join('.');
  const trimmedTarget = target?.trim();

  if (trimmedTarget) return `${scope} ${trimmedTarget}`;

  return scope;
};
