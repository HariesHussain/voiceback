export type FailureType =
  | 'upi_timeout'
  | 'card_declined'
  | 'card_expired'
  | 'insufficient_funds'
  | 'user_abandoned'
  | 'bank_server_error'
  | 'mandate_failed';

export type RecoveryStrategy =
  | 'instant_retry'
  | 'payment_link_sms'
  | 'hinglish_voice_simulation'
  | 'human_escalation'
  | 'stop_unrecoverable'
  | 'mandate_retry_sequencer';

export type OrderStatus =
  | 'pending'
  | 'processing'
  | 'recovered'
  | 'failed'
  | 'escalated';

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  amount: number;
  failure_type: FailureType;
  failure_time: string;
  previous_attempts: number;
  preferred_channel: 'sms' | 'whatsapp' | 'call';
  language: 'hindi' | 'english' | 'telugu';
  status: OrderStatus;
}

export interface PolicyDecision {
  approved: boolean;
  final_strategy: RecoveryStrategy;
  reason: string;
  policy_applied?: string;
  override?: boolean;
}

export interface AuditEvent {
  id: string;
  order_id: string;
  event_type: string;
  event_time: string;
  payload: any;
  gemini_recommendation?: RecoveryStrategy | string;
  policy_decision?: PolicyDecision | string;
  policy_reason?: string;
  action_taken?: RecoveryStrategy | string;
  outcome?: string;
  idempotency_key?: string;
}

export interface GeminiDiagnosis {
  order_id?: string;
  root_cause: string;
  recommended_strategy: RecoveryStrategy;
  confidence: number;
  fraud_signal: boolean;
  reasoning: string;
}
