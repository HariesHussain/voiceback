import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: '404 Page Not Found — VoiceBack',
  description: 'The requested page or route could not be found.',
};

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0F0F0F] text-gray-100 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] border border-[#2E2E2E] rounded-lg max-w-md w-full p-8 text-center space-y-6 shadow-xl">
        <div className="space-y-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-red-950/80 text-red-400 border border-red-800/80 inline-block font-semibold">
            HTTP 404 — NOT FOUND
          </span>
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight mt-2">
            Page Not Found
          </h1>
          <p className="text-xs text-gray-400 font-mono leading-relaxed">
            The resource or URL path you requested does not exist or has been moved within VoiceBack.
          </p>
        </div>

        <div className="pt-2 border-t border-[#2E2E2E] flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-mono font-semibold px-5 py-2.5 rounded transition-all shadow-sm text-center"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/results"
            className="w-full sm:w-auto bg-[#0F0F0F] hover:bg-[#252525] text-gray-300 border border-[#2E2E2E] text-xs font-mono px-4 py-2.5 rounded transition-all text-center"
          >
            View Recovery Report
          </Link>
        </div>
      </div>
    </main>
  );
}
