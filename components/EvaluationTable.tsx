'use client';

import React from 'react';
import { EvaluationReport } from '../lib/evaluation';

export interface EvaluationTableProps {
  report?: EvaluationReport;
}

export function EvaluationTable({ report }: EvaluationTableProps) {
  if (!report) {
    return (
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-6 text-center text-xs font-mono text-gray-500">
        No evaluation data available. Run batch recovery agent to view evaluation.
      </div>
    );
  }

  const rows = [
    {
      metric: 'Strategy selection accuracy',
      value: `${report.accuracyPct}%`,
      description: 'Matches Gemini + Policy recommendation to ground truth outcome',
      statusColor: 'text-emerald-400',
    },
    {
      metric: 'Guardrail violations',
      value: `${report.guardrailViolations}`,
      description: 'Policy engine blocks unrecoverable or out-of-bounds execution',
      statusColor: 'text-emerald-400',
    },
    {
      metric: 'Correct escalations',
      value: `${report.correctEscalationRatePct}%`,
      description: 'Unrecoverable/max-attempt orders routed to human review',
      statusColor: 'text-emerald-400',
    },
    {
      metric: 'Incorrect retry rate',
      value: `${report.incorrectRetryRatePct}%`,
      description: 'Hard declines or max attempt orders incorrectly retried',
      statusColor: 'text-emerald-400',
    },
    {
      metric: 'Average attempts per order',
      value: `${report.avgAttempts}`,
      description: 'Average recovery attempts executed per order',
      statusColor: 'text-blue-400',
    },
    {
      metric: 'Expected outcomes matched',
      value: `${report.matchedCount} / ${report.totalOrders}`,
      description: 'Exact match count against predefined ground truth dataset',
      statusColor: 'text-blue-400',
    },
  ];

  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg w-full shadow-sm overflow-hidden space-y-4 p-5">
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-100">
            Agent Self-Evaluation
          </h3>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/80">
            Ground Truth Benchmark
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-1 font-mono">
          Measured against predefined expected outcomes
        </p>
      </div>

      <div className="overflow-x-auto border border-[#2E2E2E] rounded">
        <table className="w-full text-left text-xs text-gray-300">
          <thead className="bg-[#0F0F0F] text-gray-400 uppercase text-[11px] font-mono border-b border-[#2E2E2E]">
            <tr>
              <th scope="col" className="py-3 px-4 font-semibold">
                Evaluation Metric
              </th>
              <th scope="col" className="py-3 px-4 font-semibold text-right">
                Measured Value
              </th>
              <th scope="col" className="py-3 px-4 font-semibold">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2E2E2E] bg-[#0F0F0F]">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-[#1A1A1A] transition-colors">
                <td className="py-3 px-4 font-medium text-gray-200">
                  {row.metric}
                </td>
                <td className={`py-3 px-4 text-right font-mono font-bold text-sm ${row.statusColor}`}>
                  {row.value}
                </td>
                <td className="py-3 px-4 text-gray-400 font-mono text-[11px]">
                  {row.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default EvaluationTable;
