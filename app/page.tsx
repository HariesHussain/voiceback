'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MetricCards from '../components/MetricCards';
import StoppingRulesPanel from '../components/StoppingRulesPanel';
import AgentRunner from '../components/AgentRunner';
import OrderTable from '../components/OrderTable';
import VoiceCallModal from '../components/VoiceCallModal';
import { SYNTHETIC_ORDERS } from '../lib/synthetic-orders';

export default function HomePage() {
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoiceOrder, setSelectedVoiceOrder] = useState({
    orderId: 'ORD-001',
    customerName: 'Ravi Kumar',
    amount: 12500,
    failureType: 'upi_timeout',
  });

  const handleOrderClick = (orderId: string) => {
    const order = SYNTHETIC_ORDERS.find((o) => o.id === orderId);
    if (order) {
      setSelectedVoiceOrder({
        orderId: order.id,
        customerName: order.customer_name,
        amount: order.amount,
        failureType: order.failure_type,
      });
      setIsVoiceModalOpen(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-gray-100 p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Application Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E2E2E] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
              VoiceBack
            </h1>
            <span className="bg-blue-950 text-blue-400 border border-blue-800 text-xs px-2.5 py-0.5 rounded font-mono font-semibold uppercase">
              Razorpay Buildathon
            </span>
          </div>
          <p className="text-xs text-gray-400 font-mono mt-1">
            AI-Assisted Payment Recovery & Revenue Recovery Agent • AI Recommends, Policy Decides
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsVoiceModalOpen(true)}
            className="bg-[#1A1A1A] hover:bg-[#252525] text-blue-400 border border-[#2E2E2E] px-3.5 py-2 rounded text-xs font-mono font-semibold transition-all cursor-pointer"
          >
            Voice Call Demo
          </button>
          <Link
            href="/results"
            className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded text-xs font-mono font-semibold transition-all shadow-sm flex items-center gap-1.5"
          >
            <span>Batch Report</span>
            <span className="font-mono">→</span>
          </Link>
        </div>
      </header>

      {/* 1. Metric Cards Row */}
      <section>
        <MetricCards />
      </section>

      {/* 2. Active Guardrails Stopping Rules Panel */}
      <section>
        <StoppingRulesPanel />
      </section>

      {/* 3. Agent Batch Controller & Decision Trace */}
      <section>
        <AgentRunner />
      </section>

      {/* 4. Orders Execution Table */}
      <section>
        <OrderTable onOrderClick={handleOrderClick} />
      </section>

      {/* 5. Voice Call Simulation Modal */}
      <VoiceCallModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        orderId={selectedVoiceOrder.orderId}
        customerName={selectedVoiceOrder.customerName}
        amount={selectedVoiceOrder.amount}
        failureType={selectedVoiceOrder.failureType}
      />
    </main>
  );
}
