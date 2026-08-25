import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';

async function handleLogAction(req: Request) {
  // Rate limiting check: 60 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'log-action', 60, 60000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  return NextResponse.json({ message: 'VoiceBack log action API' });
}

export async function GET(req: Request) {
  return handleLogAction(req);
}

export async function POST(req: Request) {
  return handleLogAction(req);
}
