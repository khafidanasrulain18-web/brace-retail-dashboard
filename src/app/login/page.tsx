"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Shield } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');
  const [role, setRole] = useState('kasir'); // Default role untuk demo

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.refresh(); // Refresh untuk memicu redirect di DashboardController
        window.location.href = '/dashboard'; // Redirect ke dashboard
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { nama, role }, // Mengirim metadata untuk diolah oleh Trigger SQL
          },
        });
        if (error) throw error;
        alert('Registrasi berhasil! Silakan login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center p-4 font-sans text-gray-200">
      <div className="bg-[#1A1D26] w-full max-w-md rounded-2xl p-8 shadow-2xl border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {isLogin ? 'Selamat Datang' : 'Buat Akun'}
          </h1>
          <p className="text-sm text-gray-400">
            Sistem Manajemen Retail RBAC Dashboard
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Nama Lengkap</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                    placeholder="Masukkan nama"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pilih Role (Untuk Demo)</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#0F1117] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white appearance-none focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                  >
                    <option value="admin">Admin (Full Access)</option>
                    <option value="staff_gudang">Staff Gudang (Inventory)</option>
                    <option value="kasir">Kasir (Sales)</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                placeholder="email@domain.com"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0F1117] border border-gray-700 rounded-xl py-3 pl-11 pr-4 text-white focus:outline-none focus:border-[#F59E0B] focus:ring-1 focus:ring-[#F59E0B] transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#F59E0B] hover:bg-[#E2A85C] text-[#0F1117] font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? 'Memproses...' : (isLogin ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#F59E0B] hover:text-white font-medium transition-colors"
          >
            {isLogin ? 'Daftar di sini' : 'Masuk di sini'}
          </button>
        </div>
      </div>
    </div>
  );
}