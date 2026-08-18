  import { google } from '@ai-sdk/google';
import { GoogleGenAI } from '@google/genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { convertToModelMessages, streamText, type UIMessage } from 'ai';

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';

async function embedText(text: string): Promise<number[]> {
  const ai = new GoogleGenAI({
    apiKey: config.googleApiKey,
  });

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
      throw new Error('Failed to generate embedding for query');
    }

    return values;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown embedding error';
    logger.error('Query embedding failed', {
      textLength: text.length,
      model: config.googleEmbeddingModel,
      message,
    });
    throw error;
  }
}

function getLastUserMessageText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
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

function formatRetrievedContext(matches: { metadata?: Record<string, unknown> }[]): string {
  return matches
    .map((match) => {
      const meta = match.metadata as { text?: string; policyId?: string; category?: string } | undefined;
      return `[${meta?.policyId ?? 'Unknown'}] (${meta?.category ?? 'General'}): ${meta?.text ?? ''}`;
    })
    .join('\n\n');
}

export async function POST(req: Request) {
  const startedAt = Date.now();
  const requestLogger = logger.child({ route: 'chat' });

  try {
    const body = await requestLogger.time(
      'Request body parse',
      async () => (await req.json()) as { messages?: UIMessage[] },
    );
    const { messages } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      requestLogger.warn('Chat request rejected because messages were missing or empty');
      return Response.json({ error: 'Messages are required.' }, { status: 400 });
    }

    const queryText = getLastUserMessageText(messages);
    if (!queryText.trim()) {
      requestLogger.warn('Chat request rejected because the latest user message was empty');
      return Response.json({ error: 'Please provide a question to continue.' }, { status: 400 });
    }

    requestLogger.info('Processing chat request', {
      messageCount: messages.length,
      queryLength: queryText.length,
      queryPreview: queryText.slice(0, 200),
    });

    const queryEmbedding = await requestLogger.time('Google embedding generation', () => embedText(queryText), {
      queryLength: queryText.length,
      model: config.googleEmbeddingModel,
    });

    const pinecone = new Pinecone({
      apiKey: config.pineconeApiKey,
    });
    const index = pinecone.index(config.pineconeIndexName);

    const queryResult = await requestLogger.time(
      'Pinecone similarity search',
      () =>
        index.query({
          vector: queryEmbedding,
          topK: config.pineconeTopK,
          includeMetadata: true,
        }),
      {
        topK: config.pineconeTopK,
        indexName: config.pineconeIndexName,
      },
    );

    const retrievedContext = formatRetrievedContext(queryResult.matches ?? []);
    const systemPrompt = `You are an official Banking Compliance Assistant. Answer using ONLY retrieved policies: ${retrievedContext}. Always cite Policy IDs like [Policy: POL-ACC-001]. Refuse transactions.`;

    const modelMessages = await requestLogger.time('Convert chat messages for LLM request', () =>
      convertToModelMessages(messages),
    );

    requestLogger.info('Sending LLM request', {
      model: config.googleChatModel,
      messageCount: modelMessages.length,
      contextLength: systemPrompt.length,
      retrievedMatches: queryResult.matches?.length ?? 0,
    });

    const llmStartedAt = Date.now();
    const result = streamText({
      model: google(config.googleChatModel),
      system: systemPrompt,
      messages: modelMessages,
    });
    requestLogger.info('LLM response stream started', {
      model: config.googleChatModel,
      durationMs: Date.now() - llmStartedAt,
      retrievedMatches: queryResult.matches?.length ?? 0,
    });

    requestLogger.info('Chat request completed successfully', {
      durationMs: Date.now() - startedAt,
      matchesReturned: queryResult.matches?.length ?? 0,
      model: config.googleChatModel,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown chat error';
    requestLogger.error('Chat request failed', {
      durationMs: Date.now() - startedAt,
      message,
    });

    return Response.json({ error: 'Unable to process your request right now.' }, { status: 500 });
  }
}
