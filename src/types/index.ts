export type UserRole = 'admin' | 'staff_gudang' | 'kasir';

export interface Profile {
  id: string;
  nama: string;
  role: UserRole;
  created_at: string;
}

export interface Category {
  id: string;
  nama_kategori: string;
  created_at: string;
}

export interface Product {
  id: string;
  nama: string;
  kategori_id: string | null;
  harga: number;
  stok: number;
  stok_minimum: number;
  sku: string;
  created_at: string;
}

export interface StockMovement {
  id: string;
  product_id: string;
  tipe: 'masuk' | 'keluar';
  jumlah: number;
  keterangan: string | null;
  user_id: string;
  created_at: string;
}