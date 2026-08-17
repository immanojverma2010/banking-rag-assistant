import { google } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

async function embedText(text: string): Promise<number[]> {
  const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: [text],
  });

  const values = response.embeddings?.[0]?.values;
  if (!values) {
    throw new Error('Failed to generate embedding for query');
  }

  return values;
}

function getLastUserMessageText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === 'user') {
      const textParts = message.parts
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text);
      return textParts.join('');
    }
  }
  return '';
}

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const queryText = getLastUserMessageText(messages);
  const queryEmbedding = await embedText(queryText);

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  const index = pinecone.index(process.env.PINECONE_INDEX_NAME ?? 'banking-guidelines');

  const queryResult = await index.query({
    vector: queryEmbedding,
    topK: 3,
    includeMetadata: true,
  });

  const retrievedContext = queryResult.matches
    .map((match) => {
      const meta = match.metadata as { text?: string; policyId?: string; category?: string };
      return `[${meta.policyId ?? 'Unknown'}] (${meta.category ?? 'General'}): ${meta.text ?? ''}`;
    })
    .join('\n\n');

  const systemPrompt = `You are an official Banking Compliance Assistant. Answer using ONLY retrieved policies: ${retrievedContext}. Always cite Policy IDs like [Policy: POL-ACC-001]. Refuse transactions.`;

  const result = streamText({
    model: google('gemini-2.5-flash'),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
