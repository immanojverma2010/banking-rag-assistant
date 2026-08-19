import { NextResponse } from 'next/server';

import pdfParse from 'pdf-parse';

import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { ingestTextDocuments, ingestBankingData } from '@/lib/rag/ingest';

export const maxDuration = Math.ceil(config.apiRouteTimeoutMs / 1000);

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') ?? '';

    // If JSON request without file, keep previous behavior (ingest sample docs)
    if (contentType.includes('application/json')) {
      const body = await req.json();
      // Support explicit { useSample: true } or default behavior
      if (body?.useSample === true) {
        const result = await ingestBankingData();
        logger.info('Ingestion API completed (sample docs)', { upserted: result.upserted });
        return NextResponse.json({ success: true, upserted: result.upserted });
      }

      return NextResponse.json({ success: false, error: 'No file provided. Send multipart/form-data with field "file".' }, { status: 400 });
    }

    // Expect multipart/form-data with a file field named 'file'
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ success: false, error: 'Unsupported content type. Use multipart/form-data.' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file field named "file" was found in the form data.' }, { status: 400 });
    }

    const policyId = (formData.get('policyId') as string) ?? `uploaded-${Date.now()}`;
    const category = (formData.get('category') as string) ?? 'uploaded';

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let text = '';

    if ((file.type && file.type === 'application/pdf') || (file.name && file.name.toLowerCase().endsWith('.pdf'))) {
      // parse PDF to text
      type PDFParseResult = { text?: string };
      const pdfRes = await logger.time('PDF parse', async () => (await pdfParse(buffer)) as PDFParseResult, { route: 'ingest', policyId });
      text = (pdfRes && pdfRes.text) ?? '';
    } else if (file.type && file.type.startsWith('text/')) {
      text = buffer.toString('utf-8');
    } else {
      // unknown file type: try to treat as text
      text = buffer.toString('utf-8');
    }

    if (!text.trim()) {
      return NextResponse.json({ success: false, error: 'Uploaded file contained no extractable text.' }, { status: 400 });
    }

    const docs = [{ policyId, category, text }];

    const result = await ingestTextDocuments(docs);
    logger.info('Ingestion API completed (uploaded file)', { upserted: result.upserted, policyId });
    return NextResponse.json({ success: true, upserted: result.upserted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown ingestion error';
    logger.error('Ingestion API failed', { message });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to ingest provided file.',
      },
      { status: 500 },
    );
  }
}
