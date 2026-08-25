'use client';

import React from 'react';

export interface MetricCardsProps {
  totalOrders?: number;
  totalAtRisk?: number;
  recoveredAmount?: number;
  escalatedCount?: number;
}

export function MetricCards({
  totalOrders = 30,
  totalAtRisk = 482400,
  recoveredAmount = 0,
  escalatedCount = 0,
}: MetricCardsProps) {
  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Total Orders */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between shadow-sm">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Total Orders
          </span>
          <div className="text-3xl font-bold text-gray-100 mt-2 font-mono">
            {totalOrders}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-gray-500 font-mono">
          Synthetic test batch
        </div>
      </div>

      {/* 2. At Risk */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between shadow-sm">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            At Risk
          </span>
          <div className="text-3xl font-bold text-blue-400 mt-2 font-mono">
            {formatINR(totalAtRisk)}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-gray-500 font-mono">
          Test-mode simulation value
        </div>
      </div>

      {/* 3. Recovered */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between shadow-sm">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Recovered
          </span>
          <div className="text-3xl font-bold text-emerald-400 mt-2 font-mono">
            {formatINR(recoveredAmount)}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-gray-500 font-mono">
          Test-mode simulation value
        </div>
      </div>

      {/* 4. Escalated */}
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 flex flex-col justify-between shadow-sm">
        <div>
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Escalated
          </span>
          <div className="text-3xl font-bold text-amber-400 mt-2 font-mono">
            {escalatedCount}
          </div>
        </div>
        <div className="mt-3 text-[11px] text-gray-500 font-mono">
          Human intervention required
        </div>
      </div>
    </div>
  );
}

export default MetricCards;
