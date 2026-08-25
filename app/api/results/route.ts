import { NextResponse } from 'next/server';
import { checkRateLimit } from '../../../lib/rate-limit';
import { getLatestEvaluationRun } from '../../../lib/supabase';
import { computeEvaluationMetrics } from '../../../lib/evaluation';
import { SYNTHETIC_ORDERS } from '../../../lib/synthetic-orders';

export async function GET(req: Request) {
  // Rate limit: 30 requests per minute per IP
  const rateLimit = checkRateLimit(req, 'results', 30, 60000);
  if (!rateLimit.allowed && rateLimit.response) {
    return rateLimit.response;
  }

  try {
    const computedReport = computeEvaluationMetrics();
    const dbEvaluationRun = await getLatestEvaluationRun();

    const evaluationRun = dbEvaluationRun || {
      total_orders: computedReport.totalOrders,
      recovered_count: computedReport.recoveredCount,
      escalated_count: computedReport.escalatedCount,
      failed_count: computedReport.failedCount,
      recovery_value_paise: computedReport.recoveredAmount * 100,
      strategy_accuracy_pct: computedReport.accuracyPct,
      guardrail_violations: computedReport.guardrailViolations,
      correct_escalations: computedReport.correctEscalations,
      created_at: computedReport.runTimestamp,
    };

    const orders = SYNTHETIC_ORDERS.map((o) => ({
      id: o.id,
      customer_name: o.customer_name,
      amount: o.amount,
      failure_type: o.failure_type,
      status: o.status,
      recovery_value: o.status === 'recovered' ? o.amount : 0,
      recovery_value_paise: o.status === 'recovered' ? o.amount * 100 : 0,
    }));

    return NextResponse.json({
      success: true,
      latest_evaluation_run: evaluationRun,
      orders,
      strategy_breakdown: computedReport.strategyBreakdown,
    });
  } catch (error: any) {
    console.error('Error fetching results:', error?.message || error);
    return NextResponse.json(
      { error: 'Failed to fetch evaluation results' },
      { status: 500 }
    );
  }
}
