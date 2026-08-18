"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, UserRole } from '@/types';
import { ShoppingCart, Plus, Minus, Search, Receipt, CheckCircle, Clock, Trash2 } from 'lucide-react';

interface CartItem extends Product {
  cartQty: number;
}

export default function TransaksiPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // POS States
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [successMsg, setSuccessMsg] = useState('');

  // History States
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login');

      // 1. Dapatkan Profile & Validasi Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        if (profile.role === 'staff_gudang') {
          return router.replace('/dashboard/gudang'); // Tolak Staff Gudang
        }
        setRole(profile.role);
        setUserId(session.user.id);
      }

      // 2. Ambil Produk (Hanya yang stoknya > 0 untuk POS)
      const { data: prodData } = await supabase
        .from('products')
        .select('*')
        .order('nama', { ascending: true });
      
      if (prodData) setProducts(prodData);

      // 3. Ambil Riwayat Transaksi (RLS akan otomatis memfilter sesuai role: Kasir hanya lihat miliknya, Admin lihat semua)
      const { data: trxData } = await supabase
        .from('sales_transactions')
        .select(`
          id, total, created_at,
          profiles (nama)
        `)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (trxData) setTransactions(trxData);

    } catch (error) {
      console.error("Error fetching POS data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe realtime agar Kasir tahu jika ada produk yang tiba-tiba habis/diupdate Gudang
    const channel = supabase.channel('pos_products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // --- LOGIC KERANJANG BELANJA ---
  const filteredProducts = products.filter(p => 
    p.nama.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    if (product.stok <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQty >= product.stok) return prev; // Cegah melebihi stok
        return prev.map(item => item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item);
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
    setSuccessMsg('');
  };

  const updateCartQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQty + delta;
        if (newQty > item.stok || newQty < 1) return item;
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));

  const totalBelanja = cart.reduce((sum, item) => sum + (item.harga * item.cartQty), 0);

  // --- LOGIC CHECKOUT ---
  const handleCheckout = async () => {
    if (cart.length === 0 || !userId) return;
    setIsSubmitting(true);

    try {
      // 1. Buat Transaksi Induk
      const { data: trx, error: trxErr } = await supabase
        .from('sales_transactions')
        .insert([{ kasir_id: userId, total: totalBelanja }])
        .select()
        .single();
      
      if (trxErr) throw trxErr;

      // 2. Siapkan data untuk bulk insert
      const salesItems = cart.map(item => ({
        transaction_id: trx.id,
        product_id: item.id,
        qty: item.cartQty,
        harga_saat_jual: item.harga
      }));

      const stockMovements = cart.map(item => ({
        product_id: item.id,
        tipe: 'keluar',
        jumlah: item.cartQty,
        keterangan: `Penjualan POS (Trx: ${trx.id.substring(0,8)})`,
        user_id: userId
      }));

      // 3. Eksekusi insert detail & potong stok
      const { error: itemErr } = await supabase.from('sales_items').insert(salesItems);
      if (itemErr) throw itemErr;

      // Catatan: Insert ke stock_movements akan memicu Trigger update_stok_produk dari Tahap 1
      const { error: stockErr } = await supabase.from('stock_movements').insert(stockMovements);
      if (stockErr) throw stockErr;

      // 4. Reset & Sukses
      setCart([]);
      setSuccessMsg(`Transaksi berhasil! Total: Rp ${totalBelanja.toLocaleString('id-ID')}`);
      fetchData(); // Refresh history & stock

    } catch (error: any) {
      alert("Gagal memproses transaksi: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-[#F59E0B] animate-pulse">Memuat Sistem POS...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-in fade-in duration-500">
      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-4 mb-6 border-b border-gray-800 pb-2">
        <button 
          onClick={() => setActiveTab('pos')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${activeTab === 'pos' ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]' : 'text-gray-400 hover:text-white'}`}
        >
          <ShoppingCart className="w-5 h-5" /> Mesin Kasir
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${activeTab === 'history' ? 'text-[#F59E0B] border-b-2 border-[#F59E0B]' : 'text-gray-400 hover:text-white'}`}
        >
          <Clock className="w-5 h-5" /> Riwayat Transaksi
        </button>
      </div>

      {activeTab === 'pos' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
          {/* BAGIAN KIRI: DAFTAR PRODUK */}
          <div className="lg:col-span-2 flex flex-col bg-[#1A1D26] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-800 bg-[#0F1117]/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Cari nama produk atau SKU..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#0F1117] border border-gray-700 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#F59E0B] transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredProducts.map(product => {
                  const isOutOfStock = product.stok <= 0;
                  return (
                    <button
                      key={product.id}
                      disabled={isOutOfStock}
                      onClick={() => addToCart(product)}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isOutOfStock 
                          ? 'bg-gray-800/30 border-gray-800 opacity-50 cursor-not-allowed' 
                          : 'bg-[#0F1117] border-gray-700 hover:border-[#F59E0B] hover:shadow-lg hover:shadow-[#F59E0B]/5'
                      }`}
                    >
                      <h4 className="font-semibold text-white line-clamp-2 mb-1">{product.nama}</h4>
                      <p className="text-xs text-gray-400 mb-3">{product.sku}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[#F59E0B] font-bold text-sm">Rp {product.harga.toLocaleString('id-ID')}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${isOutOfStock ? 'bg-red-500/20 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
                          Stok: {product.stok}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* BAGIAN KANAN: KERANJANG (CART) */}
          <div className="flex flex-col bg-[#1A1D26] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-800 bg-[#0F1117]/50 flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#F59E0B]" /> Detail Pesanan
              </h3>
              <span className="bg-[#F59E0B] text-[#0F1117] text-xs font-bold px-2 py-1 rounded-md">{cart.length} Item</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
              {successMsg && (
                <div className="bg-green-500/10 border border-green-500/30 text-green-400 p-3 rounded-xl flex items-center gap-2 text-sm">
                  <CheckCircle className="w-5 h-5 shrink-0" /> {successMsg}
                </div>
              )}

              {cart.length === 0 && !successMsg ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 gap-3">
                  <ShoppingCart className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Keranjang masih kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="bg-[#0F1117] p-3 rounded-xl border border-gray-800">
                    <div className="flex justify-between items-start mb-2">
                      <h5 className="text-sm font-semibold text-white">{item.nama}</h5>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Rp {(item.harga * item.cartQty).toLocaleString('id-ID')}</span>
                      <div className="flex items-center gap-3 bg-[#1A1D26] rounded-lg p-1 border border-gray-800">
                        <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:bg-gray-700 rounded-md text-gray-300"><Minus className="w-3 h-3"/></button>
                        <span className="text-xs font-bold text-white w-4 text-center">{item.cartQty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} disabled={item.cartQty >= item.stok} className="p-1 hover:bg-gray-700 rounded-md text-gray-300 disabled:opacity-30"><Plus className="w-3 h-3"/></button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* TOTAL & CHECKOUT */}
            <div className="p-4 border-t border-gray-800 bg-[#0F1117]">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400 font-medium">Total Tagihan</span>
                <span className="text-2xl font-bold text-[#F59E0B]">Rp {totalBelanja.toLocaleString('id-ID')}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full bg-[#F59E0B] hover:bg-[#E2A85C] text-[#0F1117] font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
              >
                {isSubmitting ? <span className="animate-pulse">Memproses...</span> : <>Bayar Sekarang</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB RIWAYAT TRANSAKSI */}
      {activeTab === 'history' && (
        <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/30 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">ID Transaksi</th>
                <th className="px-6 py-4 font-medium">Waktu</th>
                <th className="px-6 py-4 font-medium">Kasir</th>
                <th className="px-6 py-4 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {transactions.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada riwayat transaksi.</td></tr>
              ) : transactions.map(trx => (
                <tr key={trx.id} className="hover:bg-gray-800/20 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-mono text-sm text-gray-300">#{trx.id.substring(0, 8)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(trx.created_at).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-300">
                    {trx.profiles?.nama || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-[#F59E0B]">
                    Rp {trx.total.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}