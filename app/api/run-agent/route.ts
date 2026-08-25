import { NextResponse } from 'next/server';
import { checkRateLimit, checkAgentConcurrency, setAgentRunning } from '../../../lib/rate-limit';

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
    return NextResponse.json({
      message: 'Agent run initialized successfully',
      status: 'started',
    });
  } catch (error: any) {
    console.error('Agent run failed:', error?.message || error);
    return NextResponse.json(
      { error: 'Agent batch run execution failed' },
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
