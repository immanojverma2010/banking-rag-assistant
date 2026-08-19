import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { sampleBankingDocs } from './sample-documents';

const summarizeStepTimings = (timings: Record<string, number>) =>
  Object.entries(timings)
    .map(([step, durationMs]) => `${step}=${durationMs}ms`)
    .join(', ');

const createEmbeddingClient = (): GoogleGenAI =>
  new GoogleGenAI({
    apiKey: config.googleApiKey,
  });

const createPineconeIndex = () => {
  const pinecone = new Pinecone({
    apiKey: config.pineconeApiKey,
  });

  return pinecone.index(config.pineconeIndexName);
};

async function embedChunk(ai: GoogleGenAI, text: string, index: number, policyId: string): Promise<number[]> {
  try {
    const response = await ai.models.embedContent({
      model: config.googleEmbeddingModel,
      contents: [text],
      config: {
        outputDimensionality: config.pineconeIndexDimension,
      },
    });

    const values = response.embeddings?.[0]?.values;
    if (!values) {
      throw new Error(`Embedding response did not include values for ${policyId} chunk ${index}.`);
    }

    return values;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown embedding error';
    logger.error('Failed to generate embedding chunk', {
      policyId,
      chunkIndex: index,
      model: config.googleEmbeddingModel,
      message,
    });
    throw error;
  }
}

export async function ingestTextDocuments(
  docs: { policyId: string; category: string; text: string }[],
): Promise<{ upserted: number }> {
  const startedAt = Date.now();
  const stepTimings: Record<string, number> = {};

  logger.info('Starting ingestion of provided documents', {
    documentCount: docs.length,
    chunkSize: config.ragChunkSize,
    chunkOverlap: config.ragChunkOverlap,
    indexName: config.pineconeIndexName,
  });

  try {
    const ai = createEmbeddingClient();
    const index = createPineconeIndex();

    const setupStartedAt = Date.now();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.ragChunkSize,
      chunkOverlap: config.ragChunkOverlap,
    });
    stepTimings.setup = Date.now() - setupStartedAt;

    const records: {
      id: string;
      values: number[];
      metadata: { text: string; category: string; policyId: string };
    }[] = [];

    for (const doc of docs) {
      logger.info('Processing document for ingestion', {
        policyId: doc.policyId,
        category: doc.category,
      });

      const splitStartedAt = Date.now();
      const chunks = await splitter.splitText(doc.text);
      stepTimings[`split:${doc.policyId}`] = Date.now() - splitStartedAt;

      for (let i = 0; i < chunks.length; i += 1) {
        const embedStartedAt = Date.now();
        const values = await embedChunk(ai, chunks[i], i, doc.policyId);
        stepTimings[`embed:${doc.policyId}:${i}`] = Date.now() - embedStartedAt;

        records.push({
          id: `${doc.policyId}-chunk-${i}`,
          values,
          metadata: {
            text: chunks[i],
            category: doc.category,
            policyId: doc.policyId,
          },
        });
      }
    }

    for (let i = 0; i < records.length; i += config.ragUpsertBatchSize) {
      const batch = records.slice(i, i + config.ragUpsertBatchSize);
      const batchStartedAt = Date.now();
      await index.upsert({ records: batch });
      stepTimings[`upsert:${i}`] = Date.now() - batchStartedAt;

      logger.info('Upserted embedding batch', {
        batchStart: i,
        batchSize: batch.length,
        totalRecords: records.length,
      });
    }

    const result = { upserted: records.length };

    logger.info('Document ingestion finished successfully', {
      upserted: result.upserted,
      durationMs: Date.now() - startedAt,
      stepTimings: summarizeStepTimings(stepTimings),
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error';

    logger.error('Document ingestion failed', {
      durationMs: Date.now() - startedAt,
      stepTimings: summarizeStepTimings(stepTimings),
      message,
    });

    throw error;
  }
}

export async function ingestBankingData(): Promise<{ upserted: number }> {
  return ingestTextDocuments(sampleBankingDocs);
}
