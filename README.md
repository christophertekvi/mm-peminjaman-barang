# Peminjaman Barang Multimedia

Next.js + Tailwind + Supabase (Postgres + Storage), dijalankan di Vercel, dipakai lewat iPad.

## 1. Coba di komputer (opsional)
1. `npm install`
2. Salin `.env.example` menjadi `.env.local`, isi nilainya (lihat langkah 4).
3. `npm run dev`, buka http://localhost:3000

## 2. Upload ke GitHub
```
git init && git add . && git commit -m "first commit"
```
Buat repo baru di GitHub, lalu `git remote add origin <url>` dan `git push -u origin main`.

## 3. Deploy ke Vercel
1. Buka vercel.com, tekan Add New, lalu Project, dan pilih repo tadi.
2. Framework otomatis terdeteksi Next.js. Tekan Deploy (build pertama boleh gagal karena database belum tersambung).

## 4. Buat database lewat Vercel
1. Di project Vercel, buka tab Storage, tekan Create Database (atau Marketplace), lalu pilih Supabase.
2. Buat database baru dan hubungkan ke project ini untuk semua environment.
3. Vercel otomatis mengisi environment variable. Buka Settings, Environment Variables, dan pastikan ada `NEXT_PUBLIC_SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Jika namanya berbeda, ubah `lib/supabase.ts` atau tambahkan variable dengan nama tersebut.
4. Tambahkan variable `APP_PASSWORD` berisi kata sandi login (dipakai sebagai password Basic Auth, username bebas).

## 5. Buat tabel
1. Di Vercel, buka Storage, pilih database Supabase, lalu Open in Supabase.
2. Buka SQL Editor, tempel isi `supabase/schema.sql`, lalu Run. Ini membuat 4 tabel, bucket `signatures`, dan 3 barang contoh.

## 6. Deploy ulang
Di Vercel, buka tab Deployments, pilih deployment terakhir, lalu Redeploy. Buka URL-nya; browser akan meminta password.

## 7. Siapkan iPad
1. Buka URL di Safari, login sekali (pilih simpan kata sandi).
2. Share, lalu Add to Home Screen.
3. Settings, Accessibility, Guided Access: aktifkan agar iPad terkunci di aplikasi ini.

## Mengelola barang
Tambah atau ubah barang di Supabase, menu Table Editor, tabel `items`. Kolom `code` harus unik (contoh `CAM-002`).

## Catatan
- Tanda tangan tersimpan sebagai PNG di bucket privat `signatures`; kolom `signature_out_url` berisi path file-nya.
- Semua akses database lewat server (service role key), tabel dikunci dengan RLS tanpa policy, sehingga tidak bisa diakses langsung dari browser.
- Belum ada: halaman kelola inventaris, tanda tangan saat pengembalian, foto kondisi, scan QR.
