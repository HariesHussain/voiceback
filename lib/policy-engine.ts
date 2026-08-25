import { Order, GeminiDiagnosis, RecoveryStrategy, PolicyDecision as BasePolicyDecision } from '../types';
import { SYNTHETIC_ORDERS } from './synthetic-orders';

export interface PolicyDecision extends BasePolicyDecision {
  approved: boolean;
  final_strategy: RecoveryStrategy;
  policy_reason: string;
  reason: string; // compatibility with BasePolicyDecision
  modified: boolean; // true if policy changed the AI recommendation
  blocked: boolean; // true if all actions are blocked
}

const VALID_STRATEGIES: RecoveryStrategy[] = [
  'instant_retry',
  'payment_link_sms',
  'hinglish_voice_simulation',
  'human_escalation',
  'stop_unrecoverable',
  'mandate_retry_sequencer',
];

/**
 * Calculates the hour of the day in Indian Standard Time (IST, UTC+5:30)
 * from an ISO date string or Date object.
 */
function getISTHour(isoTime: string): number {
  const date = new Date(isoTime);
  if (isNaN(date.getTime())) {
    // Fallback to current time in IST if date string is invalid
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    return new Date(utc + 330 * 60000).getHours();
  }
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const istDate = new Date(utc + 330 * 60000);
  return istDate.getHours();
}

/**
 * Evaluates an AI recommendation against deterministic safety guardrails.
 * No AI model has final authority over payment recovery execution.
 * 
 * Rules are evaluated in strict priority order (1 to 7).
 * The first matching rule determines the outcome.
 *
 * @param order The failed payment order
 * @param diagnosis The Gemini AI diagnosis and recommendation
 * @returns PolicyDecision indicating if approved/modified/blocked and the final strategy
 */
export function applyPolicy(order: Order, diagnosis: GeminiDiagnosis): PolicyDecision {
  const anyDiag = diagnosis as any;
  const aiStrategy: RecoveryStrategy = diagnosis.recommended_strategy || anyDiag?.recommendation?.strategy;
  let currentStrategy: RecoveryStrategy = aiStrategy;
  let isModified = false;

  // ---------------------------------------------------------------------------
  // RULE 1 — Attempt limit
  // WHY: Defends against excessive customer contact and endless retry loops.
  // Maximum 3 attempts per order. If previous_attempts >= 3, halt all automated recovery.
  // ---------------------------------------------------------------------------
  if (order.previous_attempts >= 3) {
    const reason = 'Maximum recovery attempts (3) reached';
    return {
      approved: false,
      final_strategy: 'human_escalation',
      policy_reason: reason,
      reason,
      modified: true,
      blocked: true,
    };
  }

  // ---------------------------------------------------------------------------
  // RULE 2 — Hard decline stop
  // WHY: Hard declines (stolen card, closed account, expired card) cannot be recovered
  // via retry or messaging. Retrying hard declines wastes API calls and creates friction.
  // ---------------------------------------------------------------------------
  const isHardDecline =
    anyDiag?.diagnosis?.is_hard_decline === true ||
    order.failure_type === 'card_declined' ||
    order.failure_type === 'card_expired';

  if (isHardDecline) {
    const reason = 'Hard decline detected — no retry possible';
    return {
      approved: false,
      final_strategy: 'stop_unrecoverable',
      policy_reason: reason,
      reason,
      modified: currentStrategy !== 'stop_unrecoverable',
      blocked: true,
    };
  }

  // ---------------------------------------------------------------------------
  // RULE 3 — Fraud signal stop
  // WHY: Risk signals or potential fraud must immediately halt automated recovery
  // to protect merchant funds and prevent fraudulent retry exploitation.
  // ---------------------------------------------------------------------------
  const isFraudSignal =
    diagnosis.fraud_signal === true ||
    anyDiag?.diagnosis?.fraud_signal === true;

  if (isFraudSignal) {
    const reason = 'Fraud signal — all automated actions halted';
    return {
      approved: false,
      final_strategy: 'human_escalation',
      policy_reason: reason,
      reason,
      modified: true,
      blocked: true,
    };
  }

  // ---------------------------------------------------------------------------
  // RULE 4 — Validate AI strategy
  // WHY: AI output is untrusted input. If Gemini returns an unknown or malformed
  // strategy string, safely default to human escalation.
  // ---------------------------------------------------------------------------
  if (!VALID_STRATEGIES.includes(currentStrategy)) {
    currentStrategy = 'human_escalation';
    isModified = true;
    const reason = 'AI returned invalid strategy — defaulting to human escalation';
    return {
      approved: true,
      final_strategy: currentStrategy,
      policy_reason: reason,
      reason,
      modified: isModified,
      blocked: false,
    };
  }

  // ---------------------------------------------------------------------------
  // RULE 5 — Mandate retry first
  // WHY: Recurring payment (mandate) failures must always trigger the dedicated
  // mandate retry sequencer before trying direct communication or messaging.
  // ---------------------------------------------------------------------------
  if (order.failure_type === 'mandate_failed' && order.previous_attempts === 0) {
    if (currentStrategy !== 'mandate_retry_sequencer') {
      currentStrategy = 'mandate_retry_sequencer';
      isModified = true;
    }
    const reason = 'Mandate failures always retry sequencer first';
    return {
      approved: true,
      final_strategy: currentStrategy,
      policy_reason: reason,
      reason,
      modified: isModified,
      blocked: false,
    };
  }

  // ---------------------------------------------------------------------------
  // RULE 6 — Calling hours check
  // WHY: Outbound voice recovery calls must comply with TRAI calling hour
  // regulations and customer etiquette (9 AM to 9 PM IST only).
  // Outside these hours, fall back to non-intrusive SMS payment link.
  // ---------------------------------------------------------------------------
  if (currentStrategy === 'hinglish_voice_simulation') {
    const istHour = getISTHour(order.failure_time);
    if (istHour < 9 || istHour >= 21) {
      currentStrategy = 'payment_link_sms';
      isModified = true;
      const reason = 'Voice calls not permitted outside 9 AM - 9 PM IST';
      return {
        approved: true,
        final_strategy: currentStrategy,
        policy_reason: reason,
        reason,
        modified: isModified,
        blocked: false,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // RULE 7 — Voice amount threshold
  // WHY: Voice recovery (AI call simulation / IVR) is higher cost. It is only
  // cost-effective for ticket sizes >= ₹5,000. Lower amounts use SMS/WhatsApp links.
  // ---------------------------------------------------------------------------
  if (currentStrategy === 'hinglish_voice_simulation' && order.amount < 5000) {
    currentStrategy = 'payment_link_sms';
    isModified = true;
    const reason = 'Voice recovery not cost-effective for amounts below ₹5,000';
    return {
      approved: true,
      final_strategy: currentStrategy,
      policy_reason: reason,
      reason,
      modified: isModified,
      blocked: false,
    };
  }

  // ---------------------------------------------------------------------------
  // RULE 8 — All rules passed
  // WHY: AI recommendation satisfies all deterministic safety policy checks.
  // ---------------------------------------------------------------------------
  const reason = isModified
    ? 'Policy modified AI recommendation'
    : 'AI recommendation approved by policy engine';

  return {
    approved: true,
    final_strategy: currentStrategy,
    policy_reason: reason,
    reason,
    modified: isModified,
    blocked: false,
  };
}

/**
 * Test helper that runs `applyPolicy` across all 30 synthetic orders with mock AI diagnoses
 * and returns a summary of policy decisions and outcomes.
 */
export function EXPECTED_POLICY_OUTCOMES() {
  const decisions: Record<string, PolicyDecision> = {};
  let approvedCount = 0;
  let modifiedCount = 0;
  let blockedCount = 0;

  for (const order of SYNTHETIC_ORDERS) {
    // Generate a default mock diagnosis based on failure type and order parameters
    const mockDiagnosis: GeminiDiagnosis = {
      order_id: order.id,
      root_cause: `Payment failure due to ${order.failure_type}`,
      recommended_strategy:
        order.failure_type === 'bank_server_error'
          ? 'instant_retry'
          : order.failure_type === 'mandate_failed'
          ? 'mandate_retry_sequencer'
          : order.failure_type === 'card_declined' || order.failure_type === 'card_expired'
          ? 'stop_unrecoverable'
          : order.amount >= 5000 && order.language === 'hindi'
          ? 'hinglish_voice_simulation'
          : 'payment_link_sms',
      confidence: 0.9,
      fraud_signal: false,
      reasoning: 'Mock diagnosis for policy engine evaluation',
    };

    const decision = applyPolicy(order, mockDiagnosis);
    decisions[order.id] = decision;

    if (decision.blocked) {
      blockedCount++;
    } else if (decision.modified) {
      modifiedCount++;
    } else {
      approvedCount++;
    }
  }

  return {
    total_orders: SYNTHETIC_ORDERS.length,
    approved_count: approvedCount,
    modified_count: modifiedCount,
    blocked_count: blockedCount,
    decisions,
  };
}
