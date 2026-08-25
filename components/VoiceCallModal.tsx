'use client';

import React, { useState, useEffect, useRef } from 'react';
import { generateVoiceScript, speakText, stopSpeech, VoiceTurn } from '../lib/voice';

export interface VoiceCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: string;
  customerName?: string;
  amount?: number;
  failureType?: string;
  paymentLinkUrl?: string;
}

export function VoiceCallModal({
  isOpen,
  onClose,
  orderId = 'ORD-001',
  customerName = 'Ravi Kumar',
  amount = 12500,
  failureType = 'upi_timeout',
  paymentLinkUrl = 'https://rzp.io/i/simulated_voice_link',
}: VoiceCallModalProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(-1);
  const [visibleTurns, setVisibleTurns] = useState<VoiceTurn[]>([]);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [createdLink, setCreatedLink] = useState<string>(paymentLinkUrl);
  const [isGeneratingLink, setIsGeneratingLink] = useState<boolean>(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const script = useRef<VoiceTurn[]>([]);

  useEffect(() => {
    script.current = generateVoiceScript(customerName, amount, orderId);
  }, [customerName, amount, orderId]);

  // Duration timer effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  // Cleanup on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopSpeech();
      setIsPlaying(false);
      setCurrentTurnIndex(-1);
      setVisibleTurns([]);
      setDurationSeconds(0);
      setIsCompleted(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const startSimulation = () => {
    stopSpeech();
    setIsPlaying(true);
    setIsCompleted(false);
    setCurrentTurnIndex(0);
    setVisibleTurns([]);
    setDurationSeconds(0);

    playTurn(0);
  };

  const playTurn = (index: number) => {
    const turnList = script.current;
    if (index >= turnList.length) {
      setIsPlaying(false);
      setIsCompleted(true);
      return;
    }

    const turn = turnList[index];
    setCurrentTurnIndex(index);
    setVisibleTurns((prev) => [...prev, turn]);

    // Speak agent text using browser speech synthesis
    if (turn.speaker === 'Agent') {
      speakText(turn.text, () => {
        setTimeout(() => playTurn(index + 1), 600);
      });
    } else {
      // Customer delay simulation
      setTimeout(() => {
        playTurn(index + 1);
      }, turn.delayMs);
    }
  };

  const stopSimulation = () => {
    stopSpeech();
    setIsPlaying(false);
  };

  const handleGeneratePaymentLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await fetch('/api/create-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, attemptNumber: 1 }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.shortUrl) {
          setCreatedLink(data.shortUrl);
        }
      }
    } catch (err) {
      console.warn('Failed to create payment link:', err);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const formatINR = (val: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-5 text-gray-100 relative">
        {/* Header & Subtitle */}
        <div className="flex items-start justify-between border-b border-[#2E2E2E] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-gray-100 tracking-tight">
                Voice Recovery Simulation
              </h2>
              <span className="bg-blue-950 text-blue-400 border border-blue-800 text-[10px] px-2 py-0.5 rounded font-mono uppercase font-semibold">
                Browser Demo
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 font-mono">
              Browser Demo Channel — not a real outbound call
            </p>
          </div>
          <button
            onClick={() => {
              stopSimulation();
              onClose();
            }}
            className="text-gray-400 hover:text-white p-1 text-lg font-mono leading-none rounded hover:bg-[#252525]"
            aria-label="Close Modal"
          >
            ✕
          </button>
        </div>

        {/* Customer Information Cards */}
        <div className="grid grid-cols-3 gap-3 bg-[#0F0F0F] p-3.5 rounded border border-[#2E2E2E] text-xs font-mono">
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Customer</span>
            <span className="font-semibold text-gray-200 truncate block mt-0.5">
              {customerName}
            </span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Amount</span>
            <span className="font-bold text-blue-400 block mt-0.5">
              {formatINR(amount)}
            </span>
            <span className="text-[9px] text-gray-500 block truncate">Test-mode</span>
          </div>
          <div>
            <span className="text-gray-500 text-[10px] uppercase block">Failure</span>
            <span className="font-semibold text-amber-400 block mt-0.5 truncate uppercase">
              {failureType.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Waveform & Duration Display */}
        <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-4 rounded flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-gray-400">Audio Stream:</span>
            {/* Animated Waveform Bars */}
            <div className="flex items-center gap-1 h-6">
              {[0.4, 0.9, 0.5, 0.8, 0.3, 1.0, 0.6, 0.4].map((scale, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-200 ${
                    isPlaying
                      ? 'bg-blue-500 animate-pulse'
                      : 'bg-gray-700'
                  }`}
                  style={{
                    height: isPlaying ? `${scale * 100}%` : '20%',
                    animationDelay: `${i * 120}ms`,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="text-xs font-mono text-gray-300 bg-[#1A1A1A] border border-[#2E2E2E] px-2.5 py-1 rounded">
            Duration: <span className="text-blue-400 font-bold">{formatTimer(durationSeconds)}</span>
          </div>
        </div>

        {/* Transcript Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-gray-400 font-semibold uppercase tracking-wider">
              Live Transcript
            </span>
            {isPlaying && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Active Speaking...
              </span>
            )}
          </div>

          <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-3.5 rounded h-44 overflow-y-auto space-y-2.5 font-mono text-xs">
            {visibleTurns.length === 0 ? (
              <div className="text-gray-500 text-center py-12 text-xs">
                Click &quot;Start Call Simulation&quot; to play browser speech synthesis demo.
              </div>
            ) : (
              visibleTurns.map((turn, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded text-xs transition-all ${
                    turn.speaker === 'Agent'
                      ? 'bg-blue-950/40 border border-blue-800/40 text-blue-200 ml-2'
                      : 'bg-[#1A1A1A] border border-[#2E2E2E] text-gray-300 mr-2'
                  }`}
                >
                  <span
                    className={`font-bold text-[10px] uppercase block mb-0.5 ${
                      turn.speaker === 'Agent' ? 'text-blue-400' : 'text-emerald-400'
                    }`}
                  >
                    {turn.speaker}
                  </span>
                  <span>{turn.text}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Link Banner */}
        <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-3.5 rounded text-xs font-mono space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Payment link generated:</span>
            <button
              onClick={handleGeneratePaymentLink}
              disabled={isGeneratingLink}
              className="text-[10px] text-blue-400 hover:underline cursor-pointer"
            >
              {isGeneratingLink ? 'Generating...' : 'Refresh Link'}
            </button>
          </div>
          <div className="bg-[#1A1A1A] border border-[#2E2E2E] p-2 rounded text-blue-400 truncate select-all">
            {createdLink}
          </div>
        </div>

        {/* Outcome Display */}
        {isCompleted && (
          <div className="bg-green-950/60 border border-green-800 text-green-300 p-3 rounded text-xs font-mono flex items-center justify-between">
            <span>Simulated: Customer confirmed payment</span>
            <span className="text-emerald-400 font-bold">✓ SUCCESS</span>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-[#2E2E2E]">
          {isPlaying ? (
            <button
              onClick={stopSimulation}
              className="bg-red-950 text-red-400 border border-red-800 hover:bg-red-900 px-4 py-2 rounded text-xs font-mono font-semibold cursor-pointer"
            >
              Stop Simulation
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded text-xs font-mono font-semibold cursor-pointer"
            >
              Start Call Simulation
            </button>
          )}

          <button
            onClick={() => {
              stopSimulation();
              onClose();
            }}
            className="bg-[#0F0F0F] hover:bg-[#252525] text-gray-300 border border-[#2E2E2E] px-4 py-2 rounded text-xs font-mono cursor-pointer"
          >
            Close Modal
          </button>
        </div>

        {/* Production Architecture Footer Note */}
        <div className="text-[10px] text-gray-500 font-mono text-center pt-1 border-t border-[#2E2E2E]/60">
          In production, this would trigger an outbound IVR call via Twilio/VAPI
        </div>
      </div>
    </div>
  );
}

export default VoiceCallModal;
