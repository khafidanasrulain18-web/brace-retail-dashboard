"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Product, Category, UserRole } from '@/types';
import { Plus, PackagePlus, FolderPlus, AlertCircle, History, Trash2, X } from 'lucide-react';

export default function ProdukPage() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Modals State
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Form States
  const [formData, setFormData] = useState({
    nama: '', kategori_id: '', harga: '', stok_minimum: '5', sku: ''
  });
  const [catName, setCatName] = useState('');
  const [stockForm, setStockForm] = useState({
    tipe: 'masuk', jumlah: '', keterangan: ''
  });

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.replace('/login');

      // 1. Dapatkan Role User
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      if (profile) {
        if (profile.role === 'kasir') {
          return router.replace('/dashboard/kasir'); // Tolak kasir
        }
        setRole(profile.role);
      }

      // 2. Ambil Kategori & Produk
      const [resCat, resProd] = await Promise.all([
        supabase.from('categories').select('*').order('nama_kategori'),
        supabase.from('products').select('*').order('created_at', { ascending: false })
      ]);

      if (resCat.data) setCategories(resCat.data);
      if (resProd.data) setProducts(resProd.data);

    } catch (error) {
      console.error("Error fetching:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Realtime listener untuk tabel products & categories
    const channel = supabase.channel('produk_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [router]);

  // --- HANDLERS ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert([{ nama_kategori: catName }]);
    if (error) alert("Gagal menambah kategori: " + error.message);
    else {
      setCatName('');
      setShowCategoryModal(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from('products').insert([{
      nama: formData.nama,
      kategori_id: formData.kategori_id || null,
      harga: Number(formData.harga),
      stok_minimum: Number(formData.stok_minimum),
      sku: formData.sku
    }]);

    if (error) alert("Gagal menambah produk: " + error.message);
    else {
      setShowProductModal(false);
      setFormData({ nama: '', kategori_id: '', harga: '', stok_minimum: '5', sku: '' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Hapus produk ini beserta histori stoknya?")) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert("Gagal menghapus: " + error.message);
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const { data: { session } } = await supabase.auth.getSession();
    
    // Insert ke stock_movements (Trigger SQL akan otomatis update jumlah stok di tabel products!)
    const { error } = await supabase.from('stock_movements').insert([{
      product_id: selectedProduct.id,
      tipe: stockForm.tipe,
      jumlah: Number(stockForm.jumlah),
      keterangan: stockForm.keterangan,
      user_id: session?.user.id
    }]);

    if (error) alert("Gagal catat pergerakan stok: " + error.message);
    else {
      setShowStockModal(false);
      setStockForm({ tipe: 'masuk', jumlah: '', keterangan: '' });
      setSelectedProduct(null);
    }
  };

  if (isLoading) return <div className="text-[#F59E0B] animate-pulse">Memuat Data Produk...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Manajemen Produk & Stok</h2>
          <p className="text-gray-400 text-sm">Kelola katalog dan pergerakan stok di gudang</p>
        </div>
        <div className="flex flex-wrap gap-3">
          {role === 'admin' && (
            <button onClick={() => setShowCategoryModal(true)} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl transition-colors text-sm font-medium border border-gray-700">
              <FolderPlus className="w-4 h-4" /> Tambah Kategori
            </button>
          )}
          <button onClick={() => setShowProductModal(true)} className="flex items-center gap-2 bg-[#F59E0B] hover:bg-[#E2A85C] text-[#0F1117] px-4 py-2 rounded-xl transition-colors text-sm font-semibold">
            <PackagePlus className="w-4 h-4" /> Tambah Produk
          </button>
        </div>
      </div>

      {/* PRODUCTS TABLE */}
      <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-800/30 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-medium">Info Produk</th>
                <th className="px-6 py-4 font-medium">SKU / Kategori</th>
                <th className="px-6 py-4 font-medium">Harga</th>
                <th className="px-6 py-4 font-medium">Stok</th>
                <th className="px-6 py-4 font-medium text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Belum ada produk. Silakan tambah produk baru.</td>
                </tr>
              ) : products.map(product => {
                const category = categories.find(c => c.id === product.kategori_id);
                const isLowStock = product.stok <= product.stok_minimum;

                return (
                  <tr key={product.id} className="hover:bg-gray-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{product.nama}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300 font-mono">{product.sku}</p>
                      <p className="text-xs text-gray-500">{category?.nama_kategori || 'Tanpa Kategori'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-300">Rp {product.harga.toLocaleString('id-ID')}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold ${isLowStock ? 'text-red-500' : 'text-green-500'}`}>
                          {product.stok}
                        </span>
                        {isLowStock && <AlertCircle className="w-4 h-4 text-red-500" title="Stok Kritis" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button 
                        onClick={() => { setSelectedProduct(product); setShowStockModal(true); }}
                        className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors inline-flex"
                        title="Input Stok Masuk/Keluar"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      {role === 'admin' && (
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors inline-flex"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: TAMBAH PRODUK --- */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Tambah Produk Baru</h3>
              <button onClick={() => setShowProductModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddProduct} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400">Nama Produk</label>
                <input required type="text" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">SKU (Unik)</label>
                  <input required type="text" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none uppercase" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Kategori</label>
                  <select required value={formData.kategori_id} onChange={e => setFormData({...formData, kategori_id: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none">
                    <option value="" disabled>Pilih...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.nama_kategori}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400">Harga (Rp)</label>
                  <input required type="number" min="0" value={formData.harga} onChange={e => setFormData({...formData, harga: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400">Batas Stok Minimum</label>
                  <input required type="number" min="0" value={formData.stok_minimum} onChange={e => setFormData({...formData, stok_minimum: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none" />
                </div>
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-[#F59E0B] text-[#0F1117] font-semibold py-2.5 rounded-xl hover:bg-[#E2A85C]">Simpan Produk</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: INPUT STOK --- */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Catat Stok: {selectedProduct.nama}</h3>
              <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddStock} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400">Tipe Pergerakan</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button type="button" onClick={() => setStockForm({...stockForm, tipe: 'masuk'})} className={`py-2 rounded-xl text-sm font-medium border ${stockForm.tipe === 'masuk' ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-[#0F1117] border-gray-700 text-gray-400 hover:border-gray-500'}`}>Masuk (Restok)</button>
                  <button type="button" onClick={() => setStockForm({...stockForm, tipe: 'keluar'})} className={`py-2 rounded-xl text-sm font-medium border ${stockForm.tipe === 'keluar' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-[#0F1117] border-gray-700 text-gray-400 hover:border-gray-500'}`}>Keluar (Rusak/Hilang)</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Jumlah Qty</label>
                <input required type="number" min="1" value={stockForm.jumlah} onChange={e => setStockForm({...stockForm, jumlah: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none" placeholder="Masukkan angka..." />
              </div>
              <div>
                <label className="text-xs text-gray-400">Keterangan (Opsional)</label>
                <input type="text" value={stockForm.keterangan} onChange={e => setStockForm({...stockForm, keterangan: e.target.value})} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none" placeholder="Catatan tambahan..." />
              </div>
              <div className="pt-4">
                <button type="submit" className="w-full bg-[#F59E0B] text-[#0F1117] font-semibold py-2.5 rounded-xl hover:bg-[#E2A85C]">Konfirmasi Pergerakan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: TAMBAH KATEGORI (Hanya Admin) --- */}
      {showCategoryModal && role === 'admin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1A1D26] border border-gray-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-gray-800">
              <h3 className="text-lg font-bold text-white">Tambah Kategori</h3>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleAddCategory} className="p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400">Nama Kategori</label>
                <input required type="text" value={catName} onChange={e => setCatName(e.target.value)} className="w-full bg-[#0F1117] border border-gray-700 rounded-xl px-4 py-2 mt-1 text-white focus:border-[#F59E0B] outline-none" placeholder="Misal: Elektronik, Pakaian..." />
              </div>
              <button type="submit" className="w-full bg-gray-700 text-white font-semibold py-2.5 rounded-xl hover:bg-gray-600">Simpan Kategori</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}