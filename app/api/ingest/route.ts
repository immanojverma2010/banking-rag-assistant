import { NextResponse } from 'next/server';
import { ingestBankingData } from '@/lib/rag/ingest';

export const maxDuration = 60;

export async function POST() {
  await ingestBankingData();
  return NextResponse.json({ success: true });
}
