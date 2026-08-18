import Link from 'next/link';
import { MonitorPlay, Clock } from 'lucide-react';

export default function KasirDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-white">Area Kasir</h2>
        <p className="text-gray-400 text-sm">Sistem Point of Sales</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/transaksi" className="bg-gradient-to-br from-[#F59E0B] to-[#E2A85C] p-6 rounded-2xl shadow-lg hover:opacity-90 transition-opacity group">
          <div className="bg-black/20 w-12 h-12 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <MonitorPlay className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-[#0F1117] mb-1">Mulai Transaksi</h3>
          <p className="text-[#0F1117]/80 text-sm">Buka mesin POS untuk melayani pelanggan</p>
        </Link>

        <div className="bg-[#1A1D26] border border-gray-800 p-6 rounded-2xl">
          <div className="bg-[#0F1117] w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Riwayat Hari Ini</h3>
          <p className="text-gray-400 text-sm">Fitur riwayat transaksi akan tersedia di modul transaksi.</p>
        </div>
      </div>
    </div>
  );
}