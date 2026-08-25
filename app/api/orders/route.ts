import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';
import { SYNTHETIC_ORDERS } from '../../../lib/synthetic-orders';
import { OrderStatus } from '../../../types';

const VALID_STATUSES: OrderStatus[] = [
  'pending',
  'processing',
  'recovered',
  'failed',
  'escalated',
];

async function handleOrders(req: Request) {
  // 1. Rate limiting check: 30 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'orders', 30, 60000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  // 2. Query Parameter Extraction & Validation
  const url = new URL(req.url);
  const limitParam = url.searchParams.get('limit');
  const idParam = url.searchParams.get('id');
  const statusParam = url.searchParams.get('status');

  let limit = 30;
  if (limitParam !== null) {
    const parsedLimit = Number(limitParam);
    if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return NextResponse.json(
        { error: 'Invalid limit query parameter: must be an integer between 1 and 100' },
        { status: 400 }
      );
    }
    limit = parsedLimit;
  }

  let filtered = [...SYNTHETIC_ORDERS];

  if (idParam) {
    const cleanId = String(idParam).trim();
    if (cleanId.length > 50) {
      return NextResponse.json(
        { error: 'Invalid id query parameter: max 50 chars' },
        { status: 400 }
      );
    }
    filtered = filtered.filter((o) => o.id === cleanId);
  }

  if (statusParam) {
    const cleanStatus = String(statusParam).trim() as OrderStatus;
    if (!VALID_STATUSES.includes(cleanStatus)) {
      return NextResponse.json(
        { error: 'Invalid status query parameter' },
        { status: 400 }
      );
    }
    filtered = filtered.filter((o) => o.status === cleanStatus);
  }

  const resultOrders = filtered.slice(0, limit);

  return NextResponse.json({
    total: filtered.length,
    count: resultOrders.length,
    orders: resultOrders,
  });
}

export async function GET(req: Request) {
  return handleOrders(req);
}

export async function POST(req: Request) {
  return handleOrders(req);
}
