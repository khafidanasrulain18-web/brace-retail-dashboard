"use client";

import { useEffect } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Bisa disambungkan ke Sentry atau service monitoring lainnya
    console.error("Dashboard Exception:", error);
  }, [error]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8">
      <div className="bg-red-500/10 p-4 rounded-full mb-4">
        <AlertOctagon className="w-12 h-12 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Terjadi Kesalahan Sistem</h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md mb-8">
        Sistem mendeteksi adanya error pada komponen atau pengambilan data. RLS Supabase mungkin menolak akses Anda.
      </p>
      
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
      >
        <RotateCcw className="w-5 h-5" /> Coba Muat Ulang
      </button>
      
      <pre className="mt-8 p-4 bg-gray-100 dark:bg-black/50 rounded-lg text-left text-xs text-red-500/80 max-w-lg overflow-auto border border-red-500/20">
        <code>{error.message}</code>
      </pre>
    </div>
  );
}