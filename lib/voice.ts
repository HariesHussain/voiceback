/**
 * Voice Recovery Simulation Helper (Browser Web Speech API)
 *
 * Notice: This is a browser simulation for competition demo purposes.
 * In production, this layer triggers outbound IVR calls via Twilio / VAPI API integration.
 */

export interface VoiceTurn {
  speaker: 'Agent' | 'Customer';
  text: string;
  delayMs: number;
}

export function generateVoiceScript(
  customerName: string,
  amount: number,
  orderId: string
): VoiceTurn[] {
  const formattedAmount = `Rupees ${amount.toLocaleString('en-IN')}`;
  return [
    {
      speaker: 'Agent',
      text: `Hello ${customerName}, calling from VoiceBack regarding your payment of ${formattedAmount} for order ${orderId}. We noticed the payment was incomplete.`,
      delayMs: 800,
    },
    {
      speaker: 'Customer',
      text: `Yes, my UPI bank session timed out. Can you resend a payment link?`,
      delayMs: 2200,
    },
    {
      speaker: 'Agent',
      text: `I am generating a secure Razorpay payment link and sending it to your phone now.`,
      delayMs: 2200,
    },
    {
      speaker: 'Customer',
      text: `Got the link on SMS. Paying now.`,
      delayMs: 2500,
    },
    {
      speaker: 'Agent',
      text: `Payment confirmation received. Thank you for choosing Razorpay!`,
      delayMs: 2000,
    },
  ];
}

/**
 * Safely speaks a text line using browser Web Speech API (if available).
 */
export function speakText(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    if (onEnd) setTimeout(onEnd, 1000);
    return;
  }

  try {
    window.speechSynthesis.cancel(); // Stop ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Speech synthesis unavailable:', err);
    if (onEnd) setTimeout(onEnd, 1000);
  }
}

/**
 * Stops any ongoing browser speech synthesis.
 */
export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}
