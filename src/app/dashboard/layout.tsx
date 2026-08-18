import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Sidebar from './Sidebar';
import ThemeToggle from '@/components/ThemeToggle';
import { Menu } from 'lucide-react';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, nama')
    .eq('id', session.user.id)
    .single();

  if (!profile) redirect('/login');

  return (
    // Penambahan transisi global antara Light dan Dark
    <div className="flex h-screen bg-gray-50 dark:bg-[#0F1117] text-gray-900 dark:text-gray-200 font-sans overflow-hidden transition-colors duration-300">
      
      {/* Sidebar (Sembunyikan di layar kecil, tampilkan di layar md+) */}
      <div className="hidden md:flex">
        <Sidebar role={profile.role} nama={profile.nama} />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* TOPBAR / HEADER BARU */}
        <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1D26] flex items-center justify-between px-4 md:px-8 shrink-0 transition-colors duration-300">
          <div className="flex items-center gap-4 md:hidden">
            <button className="p-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              <span className="text-[#F59E0B]">RBAC</span> Retail
            </h1>
          </div>
          
          <div className="hidden md:block flex-1">
            {/* Ruang kosong / Search bar global bisa diletakkan di sini */}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                {profile.nama}
              </span>
              <span className="text-[10px] uppercase font-semibold text-[#F59E0B] tracking-wider">
                {profile.role.replace('_', ' ')}
              </span>
            </div>
            <div className="w-px h-8 bg-gray-300 dark:bg-gray-800 hidden sm:block"></div>
            <ThemeToggle />
          </div>
        </header>

        {/* AREA KONTEN */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}