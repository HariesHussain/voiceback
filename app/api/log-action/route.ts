import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';
import { logAuditEvent } from '../../../lib/supabase';

async function handleLogAction(req: Request) {
  // 1. Rate limiting check: 60 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'log-action', 60, 60000);
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

  const order_id = String(body.order_id || body.orderId || '').trim();
  const event_type = String(body.event_type || body.eventType || '').trim();
  const payload = body.payload ?? {};

  // 3. Field validation & length capping
  if (!order_id || order_id.length > 100) {
    return NextResponse.json(
      { error: 'Invalid or missing order_id (max 100 chars)' },
      { status: 400 }
    );
  }

  if (!event_type || event_type.length > 100) {
    return NextResponse.json(
      { error: 'Invalid or missing event_type (max 100 chars)' },
      { status: 400 }
    );
  }

  // Cap payload size to prevent database overload/injection
  const payloadStr = JSON.stringify(payload);
  if (payloadStr.length > 10000) {
    return NextResponse.json(
      { error: 'Payload exceeds maximum size limit (10KB)' },
      { status: 400 }
    );
  }

  // 4. Log Audit Event safely
  try {
    await logAuditEvent({
      order_id,
      event_type,
      event_time: new Date().toISOString(),
      payload,
      gemini_recommendation: body.gemini_recommendation,
      policy_decision: body.policy_decision,
      policy_reason: body.policy_reason ? String(body.policy_reason).slice(0, 500) : undefined,
      action_taken: body.action_taken,
      outcome: body.outcome ? String(body.outcome).slice(0, 500) : undefined,
      idempotency_key: body.idempotency_key ? String(body.idempotency_key).slice(0, 150) : undefined,
    });

    return NextResponse.json({ success: true, logged: true });
  } catch (err: any) {
    console.error('Audit action logging failed:', err?.message || err);
    return NextResponse.json({ error: 'Failed to record audit event' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  return handleLogAction(req);
}

export async function POST(req: Request) {
  return handleLogAction(req);
}
