import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenAI } from '@google/genai';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { sampleBankingDocs } from './sample-documents';

export async function ingestBankingData(): Promise<{ upserted: number }> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME ?? 'banking-guidelines');

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 700,
    chunkOverlap: 100,
  });

  const records: {
    id: string;
    values: number[];
    metadata: { text: string; category: string; policyId: string };
  }[] = [];

  for (const doc of sampleBankingDocs) {
    const chunks = await splitter.splitText(doc.text);

    for (let i = 0; i < chunks.length; i++) {
      const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: [chunks[i]],
      });

      const values = response.embeddings?.[0]?.values;
      if (!values) {
        throw new Error(`Embedding failed for ${doc.policyId} chunk ${i}`);
      }

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

  for (let i = 0; i < records.length; i += 100) {
    await index.upsert({ records: records.slice(i, i + 100) });
  }

  return { upserted: records.length };
}
