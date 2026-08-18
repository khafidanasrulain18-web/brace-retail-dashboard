import { createBrowserClient } from '@supabase/ssr';

// Menggunakan createBrowserClient agar auth state otomatis tersimpan di Cookies,
// sehingga bisa dibaca oleh Middleware Next.js di sisi server.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);