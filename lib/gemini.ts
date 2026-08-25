import { GoogleGenerativeAI } from '@google/generative-ai';
import { Order, GeminiDiagnosis, RecoveryStrategy } from '../types';

// Ensure module is never imported or executed in browser environments
if (typeof window !== 'undefined') {
  throw new Error('lib/gemini.ts is a server-side module and must never be imported in client-side code.');
}

// Ensure API key is configured at startup
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY is not set in environment variables. Server startup failed.');
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
 * Creates a safe fallback GeminiDiagnosis object when API calls, parsing, or timeouts fail.
 */
function createFallbackDiagnosis(
  order: Order,
  reason: string,
  forcedStrategy?: RecoveryStrategy
): GeminiDiagnosis {
  const fallbackStrategy: RecoveryStrategy =
    forcedStrategy || (order.previous_attempts < 2 ? 'instant_retry' : 'human_escalation');

  return {
    order_id: order.id,
    root_cause: `Fallback diagnosis: ${order.failure_type}`,
    recommended_strategy: fallbackStrategy,
    confidence: 0,
    fraud_signal: false,
    reasoning: reason,
    diagnosis: {
      root_cause: `Fallback diagnosis: ${order.failure_type}`,
      confidence: 0,
      is_customer_intent_issue: false,
      is_bank_side_issue: false,
      is_hard_decline: order.failure_type === 'card_declined' || order.failure_type === 'card_expired',
      fraud_signal: false,
    },
    recommendation: {
      strategy: fallbackStrategy,
      reasoning: reason,
      urgency: 'medium',
      hinglish_script: '',
    },
  } as GeminiDiagnosis;
}

/**
 * Clean raw text output from Gemini to remove markdown code wrappers if present.
 */
function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  return cleaned.trim();
}

/**
 * Diagnoses a failed order using Gemini 1.5 Flash.
 * Never throws an error at runtime; always returns a valid GeminiDiagnosis fallback on failure.
 */
export async function diagnoseOrder(order: Order): Promise<GeminiDiagnosis> {
  const systemPrompt = `You are VoiceBack AI, an expert payment recovery agent for Razorpay merchants in India.
Analyze the following failed order and provide a structured JSON diagnosis and recovery strategy.

ORDER DETAILS:
- Order ID: ${order.id}
- Customer Name: ${order.customer_name}
- Customer Phone: ${order.customer_phone}
- Amount: ₹${order.amount}
- Failure Type: ${order.failure_type}
- Failure Time: ${order.failure_time}
- Previous Attempts: ${order.previous_attempts}
- Language Preference: ${order.language}
- Preferred Channel: ${order.preferred_channel}

RECOVERY STRATEGIES:
- instant_retry: For transient bank server glitches when previous_attempts < 2.
- payment_link_sms: For user_abandoned, insufficient_funds, lower amount orders (< ₹5000), or non-Hindi languages.
- hinglish_voice_simulation: ONLY for amount >= ₹5000 AND language === 'hindi' AND failure time between 9 AM and 9 PM IST AND previous_attempts < 2.
- mandate_retry_sequencer: ONLY for failure_type === 'mandate_failed'.
- stop_unrecoverable: For hard declines like card_declined or card_expired.
- human_escalation: For previous_attempts >= 2 or high risk signals.

Return ONLY valid JSON matching this schema exactly (no markdown formatting, no backticks, no preamble):
{
  "diagnosis": {
    "root_cause": "string",
    "confidence": 0.9,
    "is_customer_intent_issue": false,
    "is_bank_side_issue": true,
    "is_hard_decline": false,
    "fraud_signal": false
  },
  "recommendation": {
    "strategy": "instant_retry",
    "reasoning": "string",
    "urgency": "medium",
    "hinglish_script": "string"
  }
}

Note for hinglish_script: If strategy is hinglish_voice_simulation, generate 3-4 natural Hinglish sentences addressing ${order.customer_name}, stating the payment of ₹${order.amount} failed, and that a payment link is being sent. If strategy is NOT hinglish_voice_simulation, return "".`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // Helper to execute request with a 10-second timeout
    const fetchWithTimeout = async (promptText: string): Promise<string> => {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 10000);
      });
      const apiPromise = model.generateContent(promptText).then((res) => res.response.text());
      return Promise.race([apiPromise, timeoutPromise]);
    };

    let responseText = '';
    try {
      responseText = await fetchWithTimeout(systemPrompt);
    } catch (err: any) {
      if (err?.message === 'GEMINI_TIMEOUT') {
        console.error(`Gemini request timed out after 10 seconds for order ${order.id}.`);
        return createFallbackDiagnosis(order, 'Gemini request timed out after 10s.');
      }
      const errStr = String(err?.message || err);
      if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.toLowerCase().includes('quota')) {
        console.error(`Gemini API quota exceeded (429) for order ${order.id}.`);
        const fallbackStrat = order.previous_attempts < 2 ? 'instant_retry' : 'human_escalation';
        return createFallbackDiagnosis(order, 'API quota exceeded (429); returning safe fallback.', fallbackStrat);
      }
      throw err;
    }

    // First JSON parse attempt
    let parsed: any = null;
    try {
      parsed = JSON.parse(cleanJsonResponse(responseText));
    } catch (parseErr) {
      console.warn(`JSON parse failed on 1st attempt for order ${order.id}. Retrying with reminder...`);
      // Retry once with a note to return ONLY JSON
      const retryPrompt = `${systemPrompt}\n\nCRITICAL: Your previous response was invalid JSON. You must return ONLY raw valid JSON matching the schema with no extra text.`;
      try {
        const retryText = await fetchWithTimeout(retryPrompt);
        parsed = JSON.parse(cleanJsonResponse(retryText));
      } catch (retryErr) {
        console.error(`JSON parse failed on 2nd attempt for order ${order.id}:`, retryErr);
        return createFallbackDiagnosis(
          order,
          'JSON parse failed on AI response after retry; fallback to human escalation.',
          'human_escalation'
        );
      }
    }

    // Validate strategy
    const rawStrategy = parsed?.recommendation?.strategy;
    const strategy: RecoveryStrategy = VALID_STRATEGIES.includes(rawStrategy)
      ? rawStrategy
      : order.previous_attempts < 2
      ? 'instant_retry'
      : 'human_escalation';

    const rootCause = parsed?.diagnosis?.root_cause || `Payment failure: ${order.failure_type}`;
    const confidence = typeof parsed?.diagnosis?.confidence === 'number' ? parsed.diagnosis.confidence : 0.8;
    const fraudSignal = Boolean(parsed?.diagnosis?.fraud_signal);
    const reasoning = parsed?.recommendation?.reasoning || 'Automated Gemini AI diagnosis';

    return {
      order_id: order.id,
      root_cause: rootCause,
      recommended_strategy: strategy,
      confidence,
      fraud_signal: fraudSignal,
      reasoning,
      diagnosis: parsed?.diagnosis || {
        root_cause: rootCause,
        confidence,
        is_customer_intent_issue: false,
        is_bank_side_issue: false,
        is_hard_decline: false,
        fraud_signal: fraudSignal,
      },
      recommendation: parsed?.recommendation || {
        strategy,
        reasoning,
        urgency: 'medium',
        hinglish_script: '',
      },
    } as GeminiDiagnosis;
  } catch (globalErr: any) {
    console.error(`Unhandled error in diagnoseOrder for order ${order.id}:`, globalErr);
    const fallbackStrat = order.previous_attempts < 2 ? 'instant_retry' : 'human_escalation';
    return createFallbackDiagnosis(order, `Error during diagnosis: ${globalErr?.message || 'Unknown error'}`, fallbackStrat);
  }
}
