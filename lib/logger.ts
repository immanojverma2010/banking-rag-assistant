type LogMeta = Record<string, unknown>;

type LoggerContext = LogMeta;

type Logger = {
  info: (message: string, meta?: LogMeta) => void;
  warn: (message: string, meta?: LogMeta) => void;
  error: (message: string, meta?: LogMeta) => void;
  time: <T>(name: string, action: () => Promise<T>, meta?: LogMeta) => Promise<T>;
  child: (context: LoggerContext) => Logger;
};

const serializeMeta = (meta?: LogMeta): string => {
  if (!meta || Object.keys(meta).length === 0) {
    return '';
  }

  return ` ${JSON.stringify(meta, (_key, value) => {
    if (typeof value === 'string' && value.length > 2000) {
      return `${value.slice(0, 2000)}...`;
    }

    return value;
  })}`;
};

const getErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : 'Unknown error';

const mergeMeta = (base: LogMeta = {}, extra: LogMeta = {}): LogMeta => ({
  ...base,
  ...extra,
});

const createLogger = (context: LoggerContext = {}): Logger => {
  const withContext = (meta: LogMeta = {}): LogMeta => mergeMeta(context, meta);

  const info = (message: string, meta?: LogMeta) => {
    console.info(`[INFO] ${message}${serializeMeta(withContext(meta))}`);
  };

  const warn = (message: string, meta?: LogMeta) => {
    console.warn(`[WARN] ${message}${serializeMeta(withContext(meta))}`);
  };

  const error = (message: string, meta?: LogMeta) => {
    console.error(`[ERROR] ${message}${serializeMeta(withContext(meta))}`);
  };

  const time = async <T>(name: string, action: () => Promise<T>, meta?: LogMeta): Promise<T> => {
    const startedAt = Date.now();
    info(`${name} started`, meta);

    try {
      const result = await action();
      info(`${name} completed`, {
        ...(meta ?? {}),
        durationMs: Date.now() - startedAt,
      });
      return result;
    } catch (caughtError) {
      reportFailure(caughtError, name, meta, startedAt);
      throw caughtError;
    }
  };

  const reportFailure = (
    caughtError: unknown,
    name: string,
    meta: LogMeta | undefined,
    startedAt: number,
  ) => {
    error(`${name} failed`, {
      ...(meta ?? {}),
      durationMs: Date.now() - startedAt,
      message: getErrorMessage(caughtError),
    });
  };

  return {
    info,
    warn,
    error,
    time,
    child: (extraContext: LoggerContext) => createLogger(mergeMeta(context, extraContext)),
  };
};

export const logger = createLogger();
