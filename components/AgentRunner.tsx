'use client';

import React, { useState } from 'react';
import { DecisionTraceItem } from '../app/api/run-agent/route';

export interface AgentRunnerProps {
  onRunComplete?: (results: any) => void;
  initialTraces?: DecisionTraceItem[];
}

export function AgentRunner({ onRunComplete, initialTraces }: AgentRunnerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to run recovery batch');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [traces, setTraces] = useState<DecisionTraceItem[]>(initialTraces || []);
  const [selectedOrderIndex, setSelectedOrderIndex] = useState<number>(0);

  const handleRunAgent = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    setProgress(10);
    setStatusMessage('Initializing recovery agent execution...');

    try {
      // Simulate progress updates for batch processing UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 300);

      const response = await fetch('/api/run-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearInterval(progressInterval);

      if (response.status === 429) {
        const data = await response.json();
        const retryAfter = response.headers.get('Retry-After') || '30';
        throw new Error(`Rate limit exceeded. Please wait ${retryAfter} seconds before running again.`);
      }

      if (response.status === 409) {
        throw new Error('Agent batch execution is already running in another session.');
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Execution failed with HTTP status ${response.status}`);
      }

      const data = await response.json();
      setProgress(100);
      setStatusMessage(`Completed processing ${data.total_orders || 30} orders successfully.`);
      
      if (data.traces && data.traces.length > 0) {
        setTraces(data.traces);
        setSelectedOrderIndex(0);
      }

      if (onRunComplete) {
        onRunComplete(data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Agent batch execution failed.');
      setStatusMessage('Batch execution halted.');
    } finally {
      setIsRunning(false);
    }
  };

  const currentTrace = traces[selectedOrderIndex];

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  return (
    <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg p-5 w-full shadow-sm space-y-6">
      {/* Header & Run Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2E2E2E]">
        <div>
          <h2 className="text-base font-semibold text-gray-100">
            Agent Batch Controller
          </h2>
          <p className="text-xs text-gray-400 mt-0.5 font-mono">
            Deterministic Policy Engine • Gemini AI Strategy Recommender
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleRunAgent}
          disabled={isRunning}
          className={`px-5 py-2.5 rounded text-xs font-semibold font-mono tracking-wide transition-all shadow-sm flex items-center justify-center gap-2 ${
            isRunning
              ? 'bg-[#2563EB]/50 text-gray-300 cursor-not-allowed border border-blue-800/40'
              : 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white cursor-pointer active:scale-[0.98]'
          }`}
        >
          {isRunning ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Agent Running...</span>
            </>
          ) : (
            <span>Run Recovery Agent</span>
          )}
        </button>
      </div>

      {/* Progress & Error Displays */}
      {isRunning && (
        <div className="space-y-2 bg-[#0F0F0F] border border-[#2E2E2E] p-3.5 rounded">
          <div className="flex justify-between text-xs font-mono text-gray-300">
            <span>{statusMessage}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-[#1A1A1A] h-2 rounded-full overflow-hidden border border-[#2E2E2E]">
            <div
              className="bg-[#2563EB] h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="bg-red-950/80 border border-red-800 text-red-300 p-3.5 rounded text-xs font-mono">
          <span className="font-bold mr-2">ERROR:</span>
          {errorMessage}
        </div>
      )}

      {/* DECISION TRACE SECTION */}
      <div className="pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Decision Trace
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#0F0F0F] text-gray-400 border border-[#2E2E2E]">
              Structured Application Evidence
            </span>
          </div>

          {/* Trace Selector Dropdown */}
          {traces.length > 0 && (
            <div className="flex items-center gap-2">
              <label htmlFor="trace-selector" className="text-xs text-gray-400 font-mono">
                Inspect Order:
              </label>
              <select
                id="trace-selector"
                value={selectedOrderIndex}
                onChange={(e) => setSelectedOrderIndex(Number(e.target.value))}
                className="bg-[#0F0F0F] text-gray-200 border border-[#2E2E2E] text-xs font-mono rounded px-2.5 py-1 focus:outline-none focus:border-blue-500"
              >
                {traces.map((trace, idx) => (
                  <option key={trace.order_id} value={idx}>
                    {trace.order_id} — {trace.customer_name} ({formatINR(trace.amount)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {traces.length === 0 ? (
          <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-8 rounded text-center text-xs font-mono text-gray-500">
            Click &quot;Run Recovery Agent&quot; above to execute the diagnostic pipeline and generate structured decision traces.
          </div>
        ) : currentTrace ? (
          <div className="space-y-4">
            {/* Trace Top Summary Banner */}
            <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-400 text-sm">
                  {currentTrace.order_id}
                </span>
                <span className="text-gray-300 font-sans font-medium">
                  {currentTrace.customer_name}
                </span>
                <span className="text-gray-400">
                  {formatINR(currentTrace.amount)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Attempts:</span>
                <span className="text-gray-200 bg-[#1A1A1A] border border-[#2E2E2E] px-2 py-0.5 rounded">
                  {currentTrace.previous_attempts}/3
                </span>
                <span className="text-gray-400">Outcome:</span>
                <span
                  className={`px-2 py-0.5 rounded uppercase font-semibold ${
                    currentTrace.execution.outcome === 'recovered'
                      ? 'bg-green-950 text-green-400 border border-green-800'
                      : currentTrace.execution.outcome === 'stopped'
                      ? 'bg-red-950 text-red-400 border border-red-800'
                      : 'bg-orange-950 text-orange-400 border border-orange-800'
                  }`}
                >
                  {currentTrace.execution.outcome}
                </span>
              </div>
            </div>

            {/* Grid of Structured Trace Evidence */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. DIAGNOSIS */}
              <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded space-y-2 text-xs">
                <div className="text-[11px] font-mono font-semibold text-blue-400 uppercase tracking-wider pb-1 border-b border-[#2E2E2E]">
                  1. Diagnosis
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-gray-300 pt-1">
                  <div>
                    <span className="text-gray-500">Failure Type:</span>{' '}
                    <span className="text-gray-200">{currentTrace.failure_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Prev Attempts:</span>{' '}
                    <span className="text-gray-200">{currentTrace.previous_attempts}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence:</span>{' '}
                    <span className="text-gray-200">
                      {(currentTrace.diagnosis.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Root Cause:</span>{' '}
                    <span className="text-gray-300 font-sans block text-xs mt-0.5 bg-[#1A1A1A] p-1.5 rounded border border-[#2E2E2E]">
                      {currentTrace.diagnosis.root_cause}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">AI Rec:</span>{' '}
                    <span className="text-blue-300">{currentTrace.diagnosis.recommended_strategy}</span>
                  </div>
                </div>
              </div>

              {/* 2. POLICY CHECK */}
              <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded space-y-2 text-xs">
                <div className="text-[11px] font-mono font-semibold text-emerald-400 uppercase tracking-wider pb-1 border-b border-[#2E2E2E]">
                  2. Policy Check
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-gray-300 pt-1">
                  <div>
                    <span className="text-gray-500">Status:</span>{' '}
                    <span
                      className={`font-semibold ${
                        currentTrace.policy_check.approved ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {currentTrace.policy_check.approved ? 'APPROVED' : 'BLOCKED'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Modified:</span>{' '}
                    <span className="text-gray-200">
                      {currentTrace.policy_check.modified ? 'YES' : 'NO'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Final Strategy:</span>{' '}
                    <span className="text-emerald-300">
                      {currentTrace.policy_check.final_strategy}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Policy Reason:</span>{' '}
                    <span className="text-gray-300 font-sans block text-xs mt-0.5 bg-[#1A1A1A] p-1.5 rounded border border-[#2E2E2E]">
                      {currentTrace.policy_check.policy_reason}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. EXECUTE */}
              <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded space-y-2 text-xs">
                <div className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider pb-1 border-b border-[#2E2E2E]">
                  3. Execute
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-gray-300 pt-1">
                  <div>
                    <span className="text-gray-500">Action:</span>{' '}
                    <span className="text-amber-300">{currentTrace.execution.action}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">API Result:</span>{' '}
                    <span className="text-gray-300 font-sans block text-xs mt-0.5 bg-[#1A1A1A] p-1.5 rounded border border-[#2E2E2E]">
                      {currentTrace.execution.api_result}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Outcome:</span>{' '}
                    <span className="text-gray-200 uppercase">{currentTrace.execution.outcome}</span>
                  </div>
                </div>
              </div>

              {/* 4. RECOVERY / ESCALATION */}
              <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded space-y-2 text-xs">
                <div className="text-[11px] font-mono font-semibold text-purple-400 uppercase tracking-wider pb-1 border-b border-[#2E2E2E]">
                  4. Audit & Idempotency
                </div>
                <div className="space-y-1.5 font-mono text-[11px] text-gray-300 pt-1">
                  <div>
                    <span className="text-gray-500">Value:</span>{' '}
                    <span className="text-gray-200 font-bold">{formatINR(currentTrace.amount)}</span>
                    <span className="block text-[10px] text-gray-500 font-normal">
                      Test-mode simulation value
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Attempts:</span>{' '}
                    <span className="text-gray-200">{currentTrace.previous_attempts + 1}/3</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Idempotency Key:</span>{' '}
                    <span className="text-gray-400 block text-[10px] truncate bg-[#1A1A1A] p-1.5 rounded border border-[#2E2E2E] mt-0.5">
                      {currentTrace.execution.idempotency_key}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default AgentRunner;
