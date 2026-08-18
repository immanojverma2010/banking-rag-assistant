const getStringEnv = (key: string, fallback?: string): string => {
  const value = process.env[key]?.trim();

  if (value) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${key}`);
};

const getNumberEnv = (key: string, fallback: number): number => {
  const rawValue = process.env[key]?.trim();

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue)) {
    throw new Error(`Environment variable ${key} must be a valid number. Received: ${rawValue}`);
  }

  return parsedValue;
};

export const config = {
  appName: getStringEnv('APP_NAME', 'banking-rag-assistant'),
  googleApiKey: getStringEnv('GOOGLE_GENERATIVE_AI_API_KEY'),
  pineconeApiKey: getStringEnv('PINECONE_API_KEY'),
  pineconeIndexName: getStringEnv('PINECONE_INDEX_NAME', 'banking-guidelines'),
  pineconeIndexDimension: getNumberEnv('PINECONE_INDEX_DIMENSION', 768),
  googleEmbeddingModel: getStringEnv('GOOGLE_EMBEDDING_MODEL', 'gemini-embedding-001'),
  googleChatModel: getStringEnv('GOOGLE_CHAT_MODEL', 'gemini-2.5-flash'),
  pineconeTopK: getNumberEnv('PINECONE_TOP_K', 3),
  ragChunkSize: getNumberEnv('RAG_CHUNK_SIZE', 700),
  ragChunkOverlap: getNumberEnv('RAG_CHUNK_OVERLAP', 100),
  ragUpsertBatchSize: getNumberEnv('RAG_UPSERT_BATCH_SIZE', 100),
  apiRouteTimeoutMs: getNumberEnv('API_ROUTE_TIMEOUT_MS', 60_000),
} as const;
