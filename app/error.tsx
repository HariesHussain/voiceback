'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log diagnostics server/console side safely without leaking to UI
    console.error('Unhandled runtime application error:', error?.message || error);
  }, [error]);

  return (
    <main className="min-h-screen bg-[#0F0F0F] text-gray-100 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg max-w-md w-full p-8 text-center space-y-6 shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950/80 text-amber-400 border border-amber-800/80 inline-block font-semibold">
            APPLICATION BOUNDARY ERROR
          </span>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight mt-2">
            Something Went Wrong
          </h1>
          <p className="text-xs text-gray-400 font-mono leading-relaxed">
            An unexpected error occurred during execution. The system safely halted the action to prevent unverified payment operations.
          </p>
        </div>

        {error?.digest && (
          <div className="bg-[#0F0F0F] border border-[#2E2E2E] p-2.5 rounded text-[11px] font-mono text-gray-500">
            Error Reference ID: <span className="text-gray-300">{error.digest}</span>
          </div>
        )}

        <div className="pt-2 border-t border-[#2E2E2E] flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-semibold px-5 py-2.5 rounded transition-all shadow-sm cursor-pointer"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto bg-[#0F0F0F] hover:bg-[#252525] text-gray-300 border border-[#2E2E2E] text-xs font-mono px-4 py-2.5 rounded transition-all text-center"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
