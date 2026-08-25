import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';
import { SYNTHETIC_ORDERS } from '../../../lib/synthetic-orders';
import { createPaymentLink } from '../../../lib/razorpay';

async function handleCreateLink(req: Request) {
  // 1. Rate limiting check: 10 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'create-link', 10, 60000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  // 2. Safe JSON body parsing
  let body: any;
  try {
    const text = await req.text();
    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Reject null, primitive, or array payloads
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { orderId, attemptNumber } = body;

  // 3. Strict Input Validation
  // Validate orderId format (ORD-###)
  if (typeof orderId !== 'string' || !/^ORD-\d{3}$/.test(orderId)) {
    return NextResponse.json(
      { error: 'Invalid input parameters: orderId must match format ORD-###' },
      { status: 400 }
    );
  }

  // Validate attemptNumber (integer between 1 and 3)
  if (
    typeof attemptNumber !== 'number' ||
    !Number.isInteger(attemptNumber) ||
    attemptNumber < 1 ||
    attemptNumber > 3
  ) {
    return NextResponse.json(
      { error: 'Invalid input parameters: attemptNumber must be an integer between 1 and 3' },
      { status: 400 }
    );
  }

  // 4. Server-Side Trusted Order Lookup
  // Never trust client-provided payment amounts (anti-price tampering)
  const order = SYNTHETIC_ORDERS.find((o) => o.id === orderId);
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 400 });
  }

  // 5. Execute Idempotent Payment Link Creation using Server-side Trusted Order
  try {
    const result = await createPaymentLink(order, attemptNumber);
    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      linkId: result.linkId,
      shortUrl: result.shortUrl,
    });
  } catch (err: any) {
    console.error(`Payment link creation failed for ${orderId}:`, err?.message || err);
    return NextResponse.json(
      { error: 'Payment link creation failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  return handleCreateLink(req);
}

export async function POST(req: Request) {
  return handleCreateLink(req);
}
