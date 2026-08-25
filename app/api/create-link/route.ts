import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';

async function handleCreateLink(req: Request) {
  // Rate limiting check: 10 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'create-link', 10, 60000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  return NextResponse.json({ message: 'VoiceBack create link API' });
}

export async function GET(req: Request) {
  return handleCreateLink(req);
}

export async function POST(req: Request) {
  return handleCreateLink(req);
}
