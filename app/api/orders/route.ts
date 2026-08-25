import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';

async function handleOrders(req: Request) {
  // Rate limiting check: 30 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'orders', 30, 60000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  return NextResponse.json({ message: 'VoiceBack orders API' });
}

export async function GET(req: Request) {
  return handleOrders(req);
}

export async function POST(req: Request) {
  return handleOrders(req);
}
