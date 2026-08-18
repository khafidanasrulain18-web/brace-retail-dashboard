"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import { Shield, ShieldAlert, ShieldCheck, Users } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return router.replace('/login');

        // Validasi Admin (Proteksi UI)
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile?.role !== 'admin') {
          return router.replace('/dashboard'); // Tendang non-admin
        }

        // Ambil daftar user
        const { data: usersData, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (usersData) setUsers(usersData);

      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full"><ShieldAlert className="w-3 h-3"/> Admin</span>;
      case 'staff_gudang':
        return <span className="flex items-center gap-1 text-xs font-bold text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full"><Shield className="w-3 h-3"/> Staff Gudang</span>;
      case 'kasir':
        return <span className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-3 py-1 rounded-full"><ShieldCheck className="w-3 h-3"/> Kasir</span>;
      default:
        return role;
    }
  };

  if (isLoading) return <div className="text-[#F59E0B] animate-pulse">Memuat daftar pengguna...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Manajemen Pengguna</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Daftar staf dan hak akses (RBAC)</p>
      </header>

      <div className="bg-white dark:bg-[#1A1D26] border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider transition-colors">
                <th className="px-6 py-4 font-medium">Pengguna</th>
                <th className="px-6 py-4 font-medium">Role Akses</th>
                <th className="px-6 py-4 font-medium">Terdaftar Sejak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800/50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white transition-colors">{user.nama}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{user.id.substring(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getRoleBadge(user.role)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 transition-colors">
                    {new Date(user.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}