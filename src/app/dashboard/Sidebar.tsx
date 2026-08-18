"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { LayoutDashboard, Package, ArrowRightLeft, Users, LogOut } from 'lucide-react';

export default function Sidebar({ role, nama }: { role: string, nama: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // RBAC di UI: Menentukan menu apa yang muncul berdasarkan role user
  const menus = [
    { 
      name: 'Dashboard', 
      path: `/dashboard/${role === 'staff_gudang' ? 'gudang' : role}`, 
      icon: LayoutDashboard, 
      roles: ['admin', 'staff_gudang', 'kasir'] 
    },
    { 
      name: 'Produk & Stok', 
      path: '/dashboard/produk', 
      icon: Package, 
      roles: ['admin', 'staff_gudang'] 
    },
    { 
      name: 'Transaksi Penjualan', 
      path: '/dashboard/transaksi', 
      icon: ArrowRightLeft, 
      roles: ['admin', 'kasir'] 
    },
    { 
      name: 'Manajemen User', 
      path: '/dashboard/users', 
      icon: Users, 
      roles: ['admin'] 
    },
  ];

  return (
    <div className="w-64 bg-[#1A1D26] border-r border-gray-800 flex flex-col justify-between shrink-0">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <h1 className="text-xl font-bold text-white tracking-wider">
            <span className="text-[#F59E0B]">RBAC</span> Retail
          </h1>
        </div>
        <div className="p-4">
          <div className="mb-6 px-2">
            <p className="text-sm text-gray-400">Selamat datang,</p>
            <p className="text-white font-medium truncate">{nama}</p>
            <span className="inline-block mt-1 px-2 py-1 bg-[#0F1117] border border-gray-700 text-xs rounded-md uppercase tracking-wider text-[#F59E0B]">
              {role.replace('_', ' ')}
            </span>
          </div>
          <nav className="space-y-1">
            {menus.filter(m => m.roles.includes(role)).map((menu) => {
              const isActive = pathname.startsWith(menu.path);
              const Icon = menu.icon;
              return (
                <Link
                  key={menu.name}
                  href={menu.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-[#F59E0B]/10 text-[#F59E0B] font-semibold' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{menu.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Keluar</span>
        </button>
      </div>
    </div>
  );
}