import React from 'react';
import Link from 'next/link';
import { computeEvaluationMetrics } from '../../lib/evaluation';
import EvaluationTable from '../../components/EvaluationTable';

export const metadata = {
  title: 'Batch Recovery Report — VoiceBack',
  description: 'Batch execution results and agent self-evaluation metrics',
};

export default function ResultsPage() {
  const report = computeEvaluationMetrics();

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  const formattedDate = new Date(report.runTimestamp).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const featuredStrategies = [
    report.strategyBreakdown.instant_retry,
    report.strategyBreakdown.payment_link_sms,
    report.strategyBreakdown.mandate_retry_sequencer,
    report.strategyBreakdown.hinglish_voice_simulation,
  ];

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-gray-100 p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2E2E] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-xs font-mono text-blue-400 hover:underline flex items-center gap-1"
            >
              ← Back to Dashboard
            </Link>
            <span className="text-gray-600 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-gray-400">Results</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight mt-2">
            Batch Recovery Report
          </h1>
          <p className="text-xs text-gray-400 font-mono mt-1">
            Run completed: {formattedDate} | All values are test-mode simulation
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="px-3 py-1 bg-[#1A1A1A] border border-[#2E2E2E] rounded text-gray-300">
            Dataset: 30 Synthetic Orders
          </span>
        </div>
      </div>

      {/* Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Recovered Simulation Value */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recovered Value
          </span>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-2">
            {formatINR(report.recoveredAmount)}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">
            test-mode simulation value
          </span>
        </div>

        {/* Recovery Rate */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recovery Rate
          </span>
          <div className="text-2xl font-bold text-blue-400 font-mono mt-2">
            {report.recoveryRatePct}%
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">
            {report.recoveredCount} of {report.totalOrders} orders
          </span>
        </div>

        {/* Total Orders */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Total Orders
          </span>
          <div className="text-2xl font-bold text-gray-100 font-mono mt-2">
            {report.totalOrders}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">
            Batch size
          </span>
        </div>

        {/* Escalated */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Escalated
          </span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-2">
            {report.escalatedCount}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">
            Human review required
          </span>
        </div>

        {/* Failed / Stopped */}
        <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Failed / Halted
          </span>
          <div className="text-2xl font-bold text-red-400 font-mono mt-2">
            {report.failedCount}
          </div>
          <span className="text-[10px] text-gray-500 font-mono mt-2">
            Hard decline / unrecoverable
          </span>
        </div>
      </div>

      {/* Recovery by Strategy Section */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
          <h2 className="text-base font-semibold text-gray-100">
            Recovery by Strategy
          </h2>
          <span className="text-[11px] font-mono text-gray-400">
            Actual Strategy Execution Performance
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredStrategies.map((strat, i) => (
            <div
              key={i}
              className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-medium text-gray-300">
                  {strat.label}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#1A1A1A] text-gray-400 border border-[#2E2E2E]">
                  {strat.count} orders
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-emerald-400">
                {formatINR(strat.amount)}
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                test-mode simulation value
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Agent Self-Evaluation Component */}
      <EvaluationTable report={report} />

      {/* Escalated Orders Table */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#2E2E2E] pb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-100">
              Escalated Orders
            </h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">
              Orders requiring human operator review or halted by policy engine
            </p>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-orange-950/80 text-orange-400 border border-orange-800/80">
            {report.escalatedOrders.length} Orders Pending Review
          </span>
        </div>

        <div className="overflow-x-auto border border-[#2E2E2E] rounded">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#0F0F0F] text-gray-400 uppercase text-[11px] font-mono border-b border-[#2E2E2E]">
              <tr>
                <th scope="col" className="py-3 px-4 font-semibold">
                  Order ID
                </th>
                <th scope="col" className="py-3 px-4 font-semibold">
                  Customer
                </th>
                <th scope="col" className="py-3 px-4 font-semibold">
                  Reason
                </th>
                <th scope="col" className="py-3 px-4 font-semibold">
                  Amount
                </th>
                <th scope="col" className="py-3 px-4 font-semibold text-right">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2E2E2E] bg-[#0F0F0F]">
              {report.escalatedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-gray-500 font-mono">
                    No orders were escalated.
                  </td>
                </tr>
              ) : (
                report.escalatedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#1A1A1A] transition-colors">
                    <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                      <Link href={`/audit/${ord.id}`} className="hover:underline">
                        {ord.id}
                      </Link>
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-200">
                      {ord.customer_name}
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-[11px]">
                      {ord.reason}
                    </td>
                    <td className="py-3 px-4 font-mono text-gray-200">
                      {formatINR(ord.amount)}
                      <span className="block text-[9px] text-gray-500">
                        test-mode simulation value
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="bg-orange-950 text-orange-400 border border-orange-800 text-[11px] px-2 py-0.5 rounded font-mono font-medium">
                        Human review required
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
