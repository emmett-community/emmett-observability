export type LogCapture = {
  logs: string[];
  restore: () => void;
};

export const captureStdout = (): LogCapture => {
  const logs: string[] = [];
  const originalWrite = process.stdout.write;

  const write = ((chunk: unknown, encoding?: unknown, callback?: unknown) => {
    const text = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);
    logs.push(text);

    if (typeof encoding === 'function') {
      encoding(null);
      return true;
    }

    if (typeof callback === 'function') {
      callback(null);
    }

    return true;
  }) as typeof process.stdout.write;

  process.stdout.write = write;

  return {
    logs,
    restore: () => {
      process.stdout.write = originalWrite;
    },
  };
};

export const parseJsonLogs = (logs: string[]): Array<Record<string, unknown>> => {
  const payload = logs.join('');

  return payload
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .flatMap((line) => {
      try {
        return [JSON.parse(line) as Record<string, unknown>];
      } catch {
        return [];
      }
    });
};
