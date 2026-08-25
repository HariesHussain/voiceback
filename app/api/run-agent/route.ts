import { NextResponse } from 'next/server';
import { checkRateLimit, checkAgentConcurrency, setAgentRunning } from '../../../lib/rate-limit';
import { SYNTHETIC_ORDERS } from '../../../lib/synthetic-orders';
import { diagnoseOrder } from '../../../lib/gemini';
import { applyPolicy } from '../../../lib/policy-engine';
import { logAuditEvent } from '../../../lib/supabase';
import { makeIdempotencyKey } from '../../../lib/razorpay';

export interface DecisionTraceItem {
  order_id: string;
  customer_name: string;
  amount: number;
  failure_type: string;
  previous_attempts: number;
  failure_time: string;
  diagnosis: {
    root_cause: string;
    confidence: number;
    recommended_strategy: string;
    fraud_signal: boolean;
  };
  policy_check: {
    approved: boolean;
    final_strategy: string;
    policy_reason: string;
    modified: boolean;
    blocked: boolean;
  };
  execution: {
    action: string;
    api_result: string;
    outcome: string;
    idempotency_key: string;
  };
}

async function handleRunAgent(req: Request) {
  // 1. Rate limiting check: 1 request per 30 seconds per IP
  const rateLimit = checkRateLimit(req, 'run-agent', 1, 30000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  // 2. Safe JSON body validation if body is present
  if (req.method === 'POST') {
    try {
      const text = await req.text();
      if (text && text.trim().length > 0) {
        JSON.parse(text);
      }
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
  }

  // 3. Concurrency check: prevent concurrent batch runs (409 Conflict)
  const concurrency = checkAgentConcurrency();
  if (concurrency.isRunning && concurrency.response) {
    return concurrency.response;
  }

  // 4. Mark agent as running and execute with try/finally guarantee
  setAgentRunning(true);

  try {
    const traces: DecisionTraceItem[] = [];
    let recoveredCount = 0;
    let escalatedCount = 0;
    let stoppedCount = 0;

    // Process synthetic orders batch
    for (const order of SYNTHETIC_ORDERS) {
      // Step A: Gemini Diagnosis
      const diagnosis = await diagnoseOrder(order);

      // Step B: Policy Engine Enforcement
      const policyDecision = applyPolicy(order, diagnosis);

      // Step C: Execution Determination
      const attemptNum = order.previous_attempts + 1;
      const idempotencyKey = makeIdempotencyKey(order.id, policyDecision.final_strategy.toUpperCase(), attemptNum);

      let executionOutcome = 'completed';
      let apiResult = 'Action approved and executed';

      if (policyDecision.blocked) {
        if (policyDecision.final_strategy === 'stop_unrecoverable') {
          stoppedCount++;
          executionOutcome = 'stopped';
          apiResult = 'Halted by policy: Unrecoverable decline';
        } else {
          escalatedCount++;
          executionOutcome = 'escalated';
          apiResult = 'Escalated to human operator by policy engine';
        }
      } else if (policyDecision.final_strategy === 'instant_retry') {
        recoveredCount++;
        executionOutcome = 'recovered';
        apiResult = 'Instant payment retry succeeded (Simulated)';
      } else if (policyDecision.final_strategy === 'payment_link_sms' || policyDecision.final_strategy === 'hinglish_voice_simulation') {
        recoveredCount++;
        executionOutcome = 'recovered';
        apiResult = `Recovery payment link generated: ${idempotencyKey}`;
      } else if (policyDecision.final_strategy === 'mandate_retry_sequencer') {
        recoveredCount++;
        executionOutcome = 'recovered';
        apiResult = 'Mandate retry sequence scheduled';
      } else {
        escalatedCount++;
        executionOutcome = 'escalated';
        apiResult = 'Escalated for manual review';
      }

      // Step D: Log Audit Event
      await logAuditEvent({
        order_id: order.id,
        event_type: 'AGENT_DECISION',
        event_time: new Date().toISOString(),
        payload: {
          amount: order.amount,
          failure_type: order.failure_type,
          attempts: attemptNum,
        },
        gemini_recommendation: diagnosis.recommended_strategy,
        policy_decision: policyDecision,
        policy_reason: policyDecision.policy_reason,
        action_taken: policyDecision.final_strategy,
        outcome: executionOutcome,
        idempotency_key: idempotencyKey,
      });

      // Assemble Decision Trace
      traces.push({
        order_id: order.id,
        customer_name: order.customer_name,
        amount: order.amount,
        failure_type: order.failure_type,
        previous_attempts: order.previous_attempts,
        failure_time: order.failure_time,
        diagnosis: {
          root_cause: diagnosis.root_cause,
          confidence: diagnosis.confidence,
          recommended_strategy: diagnosis.recommended_strategy,
          fraud_signal: diagnosis.fraud_signal,
        },
        policy_check: {
          approved: policyDecision.approved,
          final_strategy: policyDecision.final_strategy,
          policy_reason: policyDecision.policy_reason,
          modified: policyDecision.modified,
          blocked: policyDecision.blocked,
        },
        execution: {
          action: policyDecision.final_strategy,
          api_result: apiResult,
          outcome: executionOutcome,
          idempotency_key: idempotencyKey,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Agent batch execution completed',
      total_orders: SYNTHETIC_ORDERS.length,
      recovered_count: recoveredCount,
      escalated_count: escalatedCount,
      stopped_count: stoppedCount,
      traces,
    });
  } catch (error: any) {
    console.error('Agent run batch failed:', error?.message || error);
    return NextResponse.json(
      { error: `Agent batch run failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    setAgentRunning(false);
  }
}

export async function GET(req: Request) {
  return handleRunAgent(req);
}

export async function POST(req: Request) {
  return handleRunAgent(req);
}
