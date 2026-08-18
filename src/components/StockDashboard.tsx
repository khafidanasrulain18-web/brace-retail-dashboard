"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, StockMovement } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp, PackageSearch } from 'lucide-react';

export default function StockDashboard({ role }: { role: string }) {
  const [chartData, setChartData] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const { data: products } = await supabase.from('products').select('*');
      if (products) setLowStockProducts(products.filter(p => p.stok <= p.stok_minimum));

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: movements } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      if (movements) {
        const grouped = movements.reduce((acc: any, curr: StockMovement) => {
          const date = new Date(curr.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          if (!acc[date]) acc[date] = { date, Masuk: 0, Keluar: 0 };
          if (curr.tipe === 'masuk') acc[date].Masuk += curr.jumlah;
          if (curr.tipe === 'keluar') acc[date].Keluar += curr.jumlah;
          return acc;
        }, {});
        setChartData(Object.values(grouped));
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const channelProducts = supabase.channel('realtime_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData).subscribe();
    const channelMovements = supabase.channel('realtime_movements')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'stock_movements' }, fetchData).subscribe();

    return () => {
      supabase.removeChannel(channelProducts);
      supabase.removeChannel(channelMovements);
    };
  }, []);

  if (isLoading) return <div className="animate-pulse text-[#F59E0B]">Memuat data analytics...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="mb-8">
        {/* Teks hitam di Light Mode, putih di Dark Mode */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Ringkasan Inventori</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors">Real-time update pergerakan stok</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* CHART WIDGET */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A1D26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm transition-colors">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 transition-colors">Pergerakan Stok (30 Hari)</h3>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} className="dark:stroke-[#2D3748]" />
                  <XAxis dataKey="date" stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#A0AEC0" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1D26', borderColor: '#2D3748', color: '#fff', borderRadius: '8px' }}
                    itemStyle={{ color: '#E2A85C' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Masuk" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="Keluar" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-3">
                <TrendingUp className="w-8 h-8 opacity-50" />
                <p>Belum ada pergerakan stok</p>
              </div>
            )}
          </div>
        </div>

        {/* LOW STOCK ALERT WIDGET */}
        <div className="bg-white dark:bg-[#1A1D26] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col transition-colors">
          <div className="flex items-center gap-2 mb-6">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white transition-colors">Stok Kritis</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {lowStockProducts.length > 0 ? (
              lowStockProducts.map(product => (
                <div key={product.id} className="bg-gray-50 dark:bg-[#0F1117] border border-red-500/20 p-4 rounded-xl flex items-center justify-between transition-colors">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm transition-colors">{product.nama}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-red-500">{product.stok}</p>
                    <p className="text-[10px] text-gray-500">Min: {product.stok_minimum}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-3 py-10">
                <PackageSearch className="w-8 h-8 opacity-50 text-green-500" />
                <p className="text-sm">Semua stok produk aman</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}