# Dokumentasi Implementasi - Sistem Inventaris MRA

## Ikhtisar
"Sistem Inventaris MRA" telah diperbarui dengan sistem Stock Opname digital, Generator Barcode/QR, dan antarmuka yang responsif untuk perangkat seluler. Pembaruan ini mengotomatiskan proses audit aset dan memudahkan identifikasi aset fisik.

---

## 1. Stock Opname Digital
Sistem untuk melakukan audit inventaris fisik menggunakan pemindaian barcode.

### Skema Database (Skema: `ga`)
- **`stock_opname_sessions`**: Menyimpan metadata sesi audit.
  - `id`: Serial Primary Key
  - `session_name`: Nama audit (contoh: "Audit Q2 2026")
  - `description`: Catatan opsional
  - `status`: 'Ongoing' (Berjalan) atau 'Completed' (Selesai)
  - `total_assets`: Total item yang harus diperiksa
  - `checked_count`: Item yang ditemukan/dipindai
  - `created_at`: Stempel waktu pembuatan
- **`inventory_checks`**: Tabel penghubung untuk aset dalam suatu sesi.
  - `session_id`: FK ke tabel sesi
  - `asset_id`: FK ke tabel aset
  - `status`: 'Pending' (Menunggu), 'Found' (Ditemukan), 'Missing' (Hilang)
  - `last_scanned_at`: Stempel waktu terakhir dipindai

### Endpoint API
- `GET /api/stock-opname`: Daftar semua sesi atau detail sesi (dengan data pemeriksaan).
- `POST /api/stock-opname`: Membuat sesi baru. Mendukung filter berdasarkan `company_id` dan `category_id`.
- `DELETE /api/stock-opname?id=X`: Menghapus sesi.
- `POST /api/stock-opname/scan`: Memproses pemindaian barcode. Memperbarui status aset menjadi 'Found'.

### Fitur Antarmuka (UI)
- **Dashboard Sesi**: Bilah kemajuan (Progress Bar) yang menunjukkan jumlah Ditemukan vs Total.
- **Modal Pemindai Barcode**: Input pemindaian waktu-nyata (real-time) dengan umpan balik instan.
- **Penyaringan (Filtering)**: Kemampuan untuk membuat sesi yang ditargetkan pada perusahaan atau kategori tertentu.

---

## 2. Generator Barcode & QR
Alat untuk membuat dan mencetak label untuk aset.

### Fitur
- **Berbagai Format**: Mendukung Code 128, Code 39, EAN, UPC, dan QR Code.
- **Impor Massal (Bulk)**: Tempel daftar teks untuk membuat banyak barcode sekaligus.
- **Integrasi Aset**: Cari dan pilih aset langsung dari database untuk membuat labelnya.
- **Kustomisasi**: Atur lebar, tinggi, ukuran font, margin, dan warna.
- **Tata Letak Cetak**: Tata letak grid otomatis untuk pencetakan massal pada kertas label.

---

## 3. UI/UX & Responsivitas Seluler
Modernisasi tata letak dashboard untuk kemudahan penggunaan.

### Sidebar Responsif
- **Breakpoint**: 1024px (LG).
- **Perilaku**: Sidebar tetap di desktop. Di seluler, sidebar muncul dengan menggeser dari kiri.
- **Menu Hamburger**: Tombol toggle muncul di navbar untuk pengguna seluler.
- **Overlay**: Latar belakang yang dapat diklik untuk menutup menu di seluler.

### Performa & Stabilitas
- **Koneksi Database**: Beralih ke **Transaction Pooler** (Port `6543`) di Supabase untuk menangani konkurensi tinggi selama audit.
- **Isolasi Skema**: Semua kueri secara eksplisit menargetkan skema `ga` melalui `search_path`.

---

## 4. Konfigurasi
Pastikan variabel berikut diatur di `.env.local`:
```env
DATABASE_URL="postgresql://...:6543/postgres?options=-csearch_path%3Dga"
```

> [!IMPORTANT]
> Saat melakukan deployment ke Vercel, perbarui `DATABASE_URL` secara manual di pengaturan proyek untuk menggunakan Transaction Pooler (Port 6543) dan sertakan parameter `?options=-csearch_path%3Dga`.
