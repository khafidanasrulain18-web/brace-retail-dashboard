"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function DashboardController() {
  const router = useRouter();

  useEffect(() => {
    const checkRoleAndRedirect = async () => {
      // 1. Ambil sesi saat ini
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return router.replace('/login');
      }

      // 2. Ambil role user dari tabel profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile) {
        console.error("Gagal mengambil profil:", error);
        return router.replace('/login');
      }

      // 3. Redirect ke dashboard spesifik berdasarkan role
      switch (profile.role) {
        case 'admin':
          router.replace('/dashboard/admin');
          break;
        case 'staff_gudang':
          router.replace('/dashboard/gudang');
          break;
        case 'kasir':
          router.replace('/dashboard/kasir');
          break;
        default:
          router.replace('/login');
      }
    };

    checkRoleAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0F1117] flex items-center justify-center text-[#F59E0B]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-[#F59E0B] border-t-transparent rounded-full animate-spin"></div>
        <p className="font-medium tracking-wider">Memuat workspace Anda...</p>
      </div>
    </div>
  );
}