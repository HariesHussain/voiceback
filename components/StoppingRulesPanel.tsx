'use client';

import React from 'react';

const GUARDRAIL_RULES = [
  'Max 3 attempts per order',
  'No voice calls 9 PM – 9 AM IST',
  'Hard declines → immediate stop',
  'Fraud signals → all actions halted',
  'Amount < ₹5,000 → no voice call',
];

export function StoppingRulesPanel() {
  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 w-full shadow-sm">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#2E2E2E]">
        <h3 className="text-base font-semibold text-gray-200 tracking-tight">
          Active Guardrails
        </h3>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
          Deterministic Policy Engine
        </span>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {GUARDRAIL_RULES.map((rule, idx) => (
          <li
            key={idx}
            className="flex items-start text-xs text-gray-300 bg-[#0F0F0F] border border-[#2E2E2E] rounded p-2.5"
          >
            <span className="text-emerald-500 font-bold mr-2 select-none">
              ✓
            </span>
            <span className="font-medium leading-tight">{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default StoppingRulesPanel;
