import { createClient } from '@supabase/supabase-js';
import { AuditEvent } from '../types';

if (typeof window !== 'undefined') {
  throw new Error('lib/supabase.ts is a server-side module and must never be loaded in the browser.');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key';

/**
 * Single server-side Supabase client instance using service role key for full database access.
 */
export const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * Logs an audit event to the persistent Supabase `audit_events` table.
 * Generates an idempotency_key if not provided.
 * Silently ignores duplicate key conflicts (code 23505).
 * Never throws — errors are logged to console.error without interrupting the main application flow.
 */
export async function logAuditEvent(event: Partial<AuditEvent>): Promise<void> {
  try {
    const orderId = event.order_id || 'UNKNOWN';
    const eventType = event.event_type || 'SYSTEM_EVENT';
    const eventTime = event.event_time || new Date().toISOString();
    const idempotencyKey =
      event.idempotency_key || `${orderId}_${eventType}_${Date.now()}`;

    const payloadToInsert = {
      order_id: orderId,
      event_type: eventType,
      event_time: eventTime,
      payload: event.payload ?? {},
      gemini_recommendation: event.gemini_recommendation,
      policy_decision: event.policy_decision,
      policy_reason: event.policy_reason,
      action_taken: event.action_taken,
      outcome: event.outcome,
      idempotency_key: idempotencyKey,
    };

    const { error } = await supabase.from('audit_events').insert(payloadToInsert);

    if (error) {
      // 23505 is PostgreSQL unique constraint violation (duplicate idempotency key)
      if (error.code === '23505' || error.message.includes('23505') || error.message.toLowerCase().includes('duplicate')) {
        // Silently ignore duplicate log entries
        return;
      }
      console.error(`Failed to log audit event [${eventType}] for order ${orderId}:`, error.message);
    }
  } catch (err: any) {
    console.error('Unhandled exception in logAuditEvent:', err?.message || err);
  }
}

/**
 * Fetches recorded audit events for a given orderId in chronological order.
 */
export async function getAuditEventsForOrder(orderId: string): Promise<AuditEvent[]> {
  try {
    const { data, error } = await supabase
      .from('audit_events')
      .select('*')
      .eq('order_id', orderId)
      .order('event_time', { ascending: true });

    if (error || !data) {
      return [];
    }
    return data as AuditEvent[];
  } catch (err) {
    console.warn(`Failed to fetch audit events for ${orderId}:`, err);
    return [];
  }
}

