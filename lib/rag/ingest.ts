import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { sampleBankingDocs } from './sample-documents';

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

export async function ingestBankingData(): Promise<{ upserted: number }> {
  const startedAt = Date.now();

  logger.info('Starting banking document ingestion', {
    documentCount: sampleBankingDocs.length,
    chunkSize: config.ragChunkSize,
    chunkOverlap: config.ragChunkOverlap,
    indexName: config.pineconeIndexName,
  });

  try {
    const ai = createEmbeddingClient();
    const index = createPineconeIndex();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.ragChunkSize,
      chunkOverlap: config.ragChunkOverlap,
    });

    const records: {
      id: string;
      values: number[];
      metadata: { text: string; category: string; policyId: string };
    }[] = [];

    for (const doc of sampleBankingDocs) {
      logger.info('Processing banking policy document', {
        policyId: doc.policyId,
        category: doc.category,
      });

      const chunks = await splitter.splitText(doc.text);

      for (let i = 0; i < chunks.length; i += 1) {
        const values = await embedChunk(ai, chunks[i], i, doc.policyId);

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
      await index.upsert({ records: batch });

      logger.info('Upserted embedding batch', {
        batchStart: i,
        batchSize: batch.length,
        totalRecords: records.length,
      });
    }

    const result = { upserted: records.length };

    logger.info('Banking document ingestion finished successfully', {
      upserted: result.upserted,
      durationMs: Date.now() - startedAt,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error';

    logger.error('Banking document ingestion failed', {
      durationMs: Date.now() - startedAt,
      message,
    });

    throw error;
  }
}
