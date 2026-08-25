import { NextResponse } from 'next/server';
import { TEST_POLICY_ENGINE, EXPECTED_POLICY_OUTCOMES } from '../../../lib/policy-engine';

export async function GET() {
  const testResults = TEST_POLICY_ENGINE();
  const policyOutcomesSummary = EXPECTED_POLICY_OUTCOMES();

  return NextResponse.json({
    status: 'ok',
    policy_engine_tests: testResults,
    policy_outcomes_summary: {
      total_orders: policyOutcomesSummary.total_orders,
      approved_count: policyOutcomesSummary.approved_count,
      modified_count: policyOutcomesSummary.modified_count,
      blocked_count: policyOutcomesSummary.blocked_count,
    },
  });
}
