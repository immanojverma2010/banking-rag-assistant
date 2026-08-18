import { NextResponse } from 'next/server';

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { ingestBankingData } from '@/lib/rag/ingest';

export const maxDuration = Math.ceil(config.apiRouteTimeoutMs / 1000);

export async function POST() {
  try {
    const result = await ingestBankingData();
    logger.info('Ingestion API completed successfully', { upserted: result.upserted });
    return NextResponse.json({ success: true, upserted: result.upserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error';
    logger.error('Ingestion API failed', { message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to ingest banking policies.',
      },
      { status: 500 },
    );
  }
}
