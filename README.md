# POS Store — Next.js + Supabase + Vercel

POS sederhana namun lengkap untuk:
- Frontend kasir/customer
- Login & register Supabase Auth
- Riwayat pesanan customer
- Dashboard admin
- CRUD/tambah produk
- Stok produk
- Checkout
- Metode pembayaran Cash / QRIS / Transfer / Kartu
- Struk siap print dengan `window.print()`
- Database PostgreSQL Supabase + RLS
- Siap di-deploy ke Vercel

## 1. Persiapan lokal

Pastikan Node.js terpasang.

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

Lalu:

```bash
npm run dev
```

Buka `http://localhost:3000`.

## 2. Setup Supabase

1. Buat project di Supabase.
2. Buka **SQL Editor**.
3. Jalankan seluruh isi `supabase/schema.sql`.
4. Buka **Authentication > Providers > Email** dan aktifkan Email/Password.
5. Daftar akun melalui `/login`.
6. Ambil UUID user tersebut dari Supabase Authentication.
7. Jadikan admin:

```sql
update public.profiles
set role = 'admin'
where id = 'UUID_USER_ANDA';
```

8. Login kembali, lalu buka `/admin`.

> Untuk produksi, jangan pernah menaruh `service_role` key di browser atau `.env` yang dikirim ke client. Aplikasi ini hanya memakai anon key + RLS.

## 3. Push ke GitHub

Buat repository kosong di GitHub, kemudian:

```bash
git init
git add .
git commit -m "Initial POS app"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```

## 4. Deploy ke Vercel

1. Masuk ke Vercel.
2. Import repository GitHub.
3. Framework akan terdeteksi sebagai Next.js.
4. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy.

Setelah deploy, setiap push ke branch utama akan dapat membuat deployment baru secara otomatis.

## 5. Catatan produksi

Versi starter ini sengaja dibuat sederhana dan aman untuk dikembangkan. Untuk POS produksi, disarankan:
- Membuat transaksi checkout menjadi satu database RPC/transaction agar order + item + pengurangan stok benar-benar atomic.
- Menambahkan barcode scanner.
- Menambahkan diskon, service charge, pajak yang bisa diatur.
- Menambahkan laporan harian/bulanan.
- Menambahkan upload gambar produk ke Supabase Storage.
- Menambahkan printer thermal ESC/POS jika diperlukan.
- Menambahkan nomor meja, outlet/cabang, kasir, shift, dan closing kas.
- Menambahkan audit log untuk perubahan harga/stok/status.
