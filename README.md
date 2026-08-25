# ⚡ VoiceBack — AI Revenue Recovery Agent
### Razorpay Buildathon 2026 — Track 03: AI Revenue Recovery

> Indian merchants lose revenue not because customers refuse to pay — but because payment failures go unresolved. VoiceBack diagnoses each failure, selects the right recovery strategy, and knows when NOT to act.

## Live Demo
🔗 [voiceback.vercel.app](https://voiceback.vercel.app)
📹 [5-minute demo video](https://loom.com/...)

## What It Does
- Processes 30 failed payment orders in a single batch
- Gemini AI diagnoses each failure (root cause, confidence, fraud signal)
- Deterministic policy engine approves or blocks every AI recommendation
- Executes recovery: retry → SMS link → WhatsApp → Hinglish voice simulation
- Measures recovery: strategy accuracy, guardrail violations, correct escalations
- Full audit trail: Diagnosis → Policy Check → Execution → Outcome per order

## Architecture
30 Failed Orders → Gemini Diagnosis → Policy Engine → Razorpay Test API → Audit Log

The AI recommends. The policy engine has final authority. This is what "bounded and gated" means.

## Policy Engine Rules (enforced in code, not prompts)
- Max 3 recovery attempts per order
- Hard declines → permanent stop (no retry)
- Fraud signals → all automated actions halted
- Voice calls only 9 AM – 9 PM IST
- Voice only for amounts ≥ ₹5,000
- mandate_failed → mandate retry sequencer first

## Evaluation Results (30 synthetic orders)
| Metric | Result |
|---|---|
| Strategy selection accuracy | 90% (27/30) |
| Guardrail violations | 0% |
| Correct escalations | 100% (5/5) |
| Recovery rate | 71% (21/30) |

## Tech Stack
- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **AI:** Google Gemini Flash (free tier)
- **Payments:** Razorpay test-mode APIs
- **Database:** Supabase (PostgreSQL)
- **Deploy:** Vercel

## Setup
```bash
git clone https://github.com/HariesHussain/voiceback
cd voiceback
npm install
cp .env.example .env.local
# Fill in your API keys (see .env.example for required vars)
npm run dev
```

## Important: Test Mode
All transactions use Razorpay test-mode APIs. No real money is moved.
Recovery values shown are test-mode simulation values, not real financial outcomes.
Voice recovery uses Web Speech API browser simulation — not real outbound calls.

## Production Roadmap
- Replace voice simulation with Twilio/VAPI IVR
- Add real merchant authentication
- Connect to live Razorpay payment APIs
- Add WhatsApp Business API integration
- Expand to 1000+ order batches with queue processing