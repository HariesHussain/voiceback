import { NextResponse } from 'next/server';
import { checkRateLimit, checkAgentConcurrency, setAgentRunning } from '../../../lib/rate-limit';

async function handleRunAgent(req: Request) {
  // 1. Rate limiting check: 1 request per 30 seconds per IP
  const rateLimit = checkRateLimit(req, 'run-agent', 1, 30000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  // 2. Concurrency check: prevent concurrent batch runs (409 Conflict)
  const concurrency = checkAgentConcurrency();
  if (concurrency.isRunning && concurrency.response) {
    return concurrency.response;
  }

  // 3. Mark agent as running and execute with try/finally guarantee
  setAgentRunning(true);
  try {
    // Agent batch execution logic
    return NextResponse.json({
      message: 'Agent run initialized successfully',
      status: 'started',
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: `Agent run failed: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    // ALWAYS reset running state regardless of success or error
    setAgentRunning(false);
  }
}

export async function GET(req: Request) {
  return handleRunAgent(req);
}

export async function POST(req: Request) {
  return handleRunAgent(req);
}
