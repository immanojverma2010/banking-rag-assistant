type LogMeta = Record<string, unknown>;

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

export const logger = {
  info: (message: string, meta?: LogMeta) => {
    console.info(`[INFO] ${message}${serializeMeta(meta)}`);
  },
  warn: (message: string, meta?: LogMeta) => {
    console.warn(`[WARN] ${message}${serializeMeta(meta)}`);
  },
  error: (message: string, meta?: LogMeta) => {
    console.error(`[ERROR] ${message}${serializeMeta(meta)}`);
  },
};
