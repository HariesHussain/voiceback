import React from 'react';
import Link from 'next/link';
import { SYNTHETIC_ORDERS } from '../../../lib/synthetic-orders';
import { getAuditEventsForOrder } from '../../../lib/supabase';
import { applyPolicy } from '../../../lib/policy-engine';
import AuditTimeline from '../../../components/AuditTimeline';
import { AuditEvent, GeminiDiagnosis, OrderStatus } from '../../../types';

interface AuditPageProps {
  params: Promise<{ orderId: string }>;
}

export async function generateMetadata({ params }: AuditPageProps) {
  const { orderId } = await params;
  return {
    title: `Audit Trail ${orderId} — VoiceBack`,
    description: `Decision trace and audit trail for order ${orderId}`,
  };
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case 'pending':
      return (
        <span className="bg-yellow-950/80 text-yellow-400 border border-yellow-800/80 text-xs px-2.5 py-1 rounded font-mono font-medium uppercase">
          Pending
        </span>
      );
    case 'processing':
      return (
        <span className="bg-blue-950/80 text-blue-400 border border-blue-800/80 text-xs px-2.5 py-1 rounded font-mono font-medium uppercase">
          Processing
        </span>
      );
    case 'recovered':
      return (
        <span className="bg-green-950/80 text-green-400 border border-green-800/80 text-xs px-2.5 py-1 rounded font-mono font-medium uppercase">
          Recovered
        </span>
      );
    case 'failed':
      return (
        <span className="bg-red-950/80 text-red-400 border border-red-800/80 text-xs px-2.5 py-1 rounded font-mono font-medium uppercase">
          Failed
        </span>
      );
    case 'escalated':
      return (
        <span className="bg-orange-950/80 text-orange-400 border border-orange-800/80 text-xs px-2.5 py-1 rounded font-mono font-medium uppercase">
          Escalated
        </span>
      );
    default:
      return (
        <span className="bg-gray-800 text-gray-300 border border-gray-700 text-xs px-2.5 py-1 rounded font-mono font-medium uppercase">
          {status}
        </span>
      );
  }
}

export default async function AuditPage({ params }: AuditPageProps) {
  const { orderId } = await params;

  const order = SYNTHETIC_ORDERS.find((o) => o.id === orderId);

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  // Missing Order 404 View
  if (!order) {
    return (
      <main className="min-h-screen bg-[#0F0F0F] text-gray-100 p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-8 text-center space-y-4">
          <h1 className="text-xl font-bold text-red-400 font-mono">
            Order Not Found: {orderId}
          </h1>
          <p className="text-xs text-gray-400 font-mono">
            The requested order ID does not exist in the synthetic dataset.
          </p>
          <div>
            <Link
              href="/"
              className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-semibold px-4 py-2 rounded transition-colors"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Fetch recorded audit events or construct deterministic trace event for demonstration
  let auditEvents = await getAuditEventsForOrder(order.id);

  if (auditEvents.length === 0) {
    // Generate deterministic decision trace event for single-order audit view
    const isHardDecline =
      order.failure_type === 'card_declined' || order.failure_type === 'card_expired';
    const mockDiagnosis: GeminiDiagnosis = {
      order_id: order.id,
      root_cause: `Automated diagnostic analysis for ${order.failure_type}`,
      confidence: 0.94,
      fraud_signal: false,
      recommended_strategy:
        order.failure_type === 'upi_timeout'
          ? 'payment_link_sms'
          : order.failure_type === 'mandate_failed'
          ? 'mandate_retry_sequencer'
          : isHardDecline
          ? 'stop_unrecoverable'
          : 'hinglish_voice_simulation',
      reasoning: 'Evaluation diagnosis',
    };

    const policy = applyPolicy(order, mockDiagnosis);

    auditEvents = [
      {
        id: `evt_diag_${order.id}`,
        order_id: order.id,
        event_type: 'GEMINI_DIAGNOSIS',
        event_time: order.failure_time,
        payload: {
          failure_type: order.failure_type,
          amount: order.amount,
          attempts: order.previous_attempts,
        },
        gemini_recommendation: mockDiagnosis.recommended_strategy,
        outcome: 'classified',
      },
      {
        id: `evt_policy_${order.id}`,
        order_id: order.id,
        event_type: 'POLICY_EVALUATION',
        event_time: new Date(new Date(order.failure_time).getTime() + 1000).toISOString(),
        payload: {
          amount: order.amount,
          attempts: order.previous_attempts + 1,
        },
        policy_decision: policy,
        policy_reason: policy.policy_reason,
        action_taken: policy.final_strategy,
        outcome: policy.blocked ? 'blocked' : 'approved',
        idempotency_key: `${order.id}_${policy.final_strategy.toUpperCase()}_${order.previous_attempts + 1}`,
      },
    ];
  }

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-gray-100 p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
        >
          ← Back to Dashboard
        </Link>
        <span className="text-xs font-mono text-gray-500">
          Order Audit Trail / Decision Trace
        </span>
      </div>

      {/* Header Card */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-6 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2E2E] pb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-blue-400 font-mono">
                {order.id}
              </h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-1">
              Synthetic Failed Payment Order Audit Details
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-gray-400 block uppercase">Amount</span>
            <span className="text-2xl font-bold text-gray-100 font-mono">
              {formatINR(order.amount)}
            </span>
            <span className="text-[10px] text-gray-500 font-mono block">
              test-mode simulation value
            </span>
          </div>
        </div>

        {/* Customer Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono bg-[#0F0F0F] p-4 rounded border border-[#2E2E2E]">
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Customer Name</span>
            <span className="font-semibold text-gray-200 mt-0.5 block">{order.customer_name}</span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Phone / Channel</span>
            <span className="font-semibold text-gray-200 mt-0.5 block">
              {order.customer_phone} ({order.preferred_channel.toUpperCase()})
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Failure Type</span>
            <span className="font-semibold text-amber-400 mt-0.5 block uppercase">
              {order.failure_type.replace(/_/g, ' ')}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Previous Attempts</span>
            <span className="font-semibold text-gray-200 mt-0.5 block">{order.previous_attempts} / 3</span>
          </div>
        </div>
      </div>

      {/* Decision Trace Timeline Component */}
      <AuditTimeline events={auditEvents} orderId={order.id} />
    </main>
  );
}
