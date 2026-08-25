'use client';

import React from 'react';
import { AuditEvent } from '../types';

export interface AuditTimelineProps {
  events: AuditEvent[];
  orderId: string;
}

export function AuditTimeline({ events, orderId }: AuditTimelineProps) {
  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-6 w-full shadow-sm space-y-6">
      {/* Timeline Section Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-base font-semibold text-gray-100 uppercase tracking-wider">
            Decision Trace
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-0.5">
            Structured Application Evidence & Audit Log for {orderId}
          </p>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded bg-[#0F0F0F] text-blue-400 border border-[#2E2E2E]">
          {events.length} Events Recorded
        </span>
      </div>

      {/* Empty Audit State */}
      {events.length === 0 ? (
        <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-8 rounded text-center text-xs font-mono text-gray-500">
          No audit events recorded for order {orderId} yet. Run the recovery agent to generate decision trace events.
        </div>
      ) : (
        /* Chronological Timeline */
        <div className="relative border-l-2 border-[#2E2E2E] ml-4 pl-6 space-y-8">
          {events.map((evt, idx) => {
            const isPolicyBlocked =
              typeof evt.policy_decision === 'object' && !evt.policy_decision?.approved;

            return (
              <div key={evt.id || idx} className="relative group">
                {/* Timeline Dot Icon */}
                <div
                  className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 bg-[#1A1A1A] ${
                    isPolicyBlocked
                      ? 'border-red-500 bg-red-950'
                      : evt.outcome === 'recovered'
                      ? 'border-green-500 bg-green-950'
                      : 'border-blue-500 bg-blue-950'
                  }`}
                />

                {/* Audit Event Card */}
                <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded-lg space-y-3 shadow-sm">
                  {/* Event Top Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2E2E2E] pb-2 text-xs font-mono">
                    <span className="font-bold text-blue-400 uppercase tracking-wide">
                      {evt.event_type}
                    </span>
                    <span className="text-gray-500 text-[11px]">
                      {formatDate(evt.event_time)}
                    </span>
                  </div>

                  {/* Structured Event Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
                    {/* Diagnosis / Recommendation */}
                    {evt.gemini_recommendation && (
                      <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#2E2E2E]">
                        <span className="text-gray-500 text-[10px] uppercase block">
                          AI Recommendation
                        </span>
                        <span className="text-blue-300 font-semibold mt-0.5 block">
                          {typeof evt.gemini_recommendation === 'string'
                            ? evt.gemini_recommendation
                            : JSON.stringify(evt.gemini_recommendation)}
                        </span>
                      </div>
                    )}

                    {/* Policy Decision */}
                    {evt.policy_decision && (
                      <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#2E2E2E]">
                        <span className="text-gray-500 text-[10px] uppercase block">
                          Policy Decision
                        </span>
                        <span
                          className={`font-semibold mt-0.5 block ${
                            isPolicyBlocked ? 'text-red-400' : 'text-green-400'
                          }`}
                        >
                          {typeof evt.policy_decision === 'string'
                            ? evt.policy_decision
                            : evt.policy_decision.final_strategy}
                        </span>
                        {evt.policy_reason && (
                          <span className="text-[10px] text-gray-400 block mt-1">
                            {evt.policy_reason}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action & Outcome */}
                    {evt.action_taken && (
                      <div className="bg-[#1A1A1A] p-2.5 rounded border border-[#2E2E2E]">
                        <span className="text-gray-500 text-[10px] uppercase block">
                          Action & Outcome
                        </span>
                        <span className="text-amber-300 font-semibold mt-0.5 block">
                          {evt.action_taken}
                        </span>
                        {evt.outcome && (
                          <span className="text-[10px] text-gray-300 block uppercase mt-1">
                            Outcome: {evt.outcome}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Extended Payload Data */}
                  {evt.payload && Object.keys(evt.payload).length > 0 && (
                    <div className="bg-[#1A1A1A] p-3 rounded border border-[#2E2E2E] text-[11px] font-mono space-y-1">
                      <span className="text-gray-500 uppercase text-[10px] block">
                        Payload Diagnostics:
                      </span>
                      {evt.payload.amount && (
                        <div className="text-gray-300">
                          Amount: <span className="text-gray-100 font-bold">{formatINR(evt.payload.amount)}</span>{' '}
                          <span className="text-gray-500 text-[9px]">(test-mode simulation value)</span>
                        </div>
                      )}
                      {evt.payload.failure_type && (
                        <div className="text-gray-300">
                          Failure Type: <span className="text-gray-200">{evt.payload.failure_type}</span>
                        </div>
                      )}
                      {evt.payload.attempts !== undefined && (
                        <div className="text-gray-300">
                          Attempts: <span className="text-gray-200">{evt.payload.attempts}/3</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Idempotency Key Footer */}
                  {evt.idempotency_key && (
                    <div className="flex items-center justify-between text-[10px] font-mono text-gray-500 pt-1 border-t border-[#2E2E2E]">
                      <span>Idempotency Key:</span>
                      <span className="text-gray-400 bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#2E2E2E]">
                        {evt.idempotency_key}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AuditTimeline;
