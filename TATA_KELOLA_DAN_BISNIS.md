# Dokumentasi Business Case & Tata Kelola IT (IT Governance)
## Proyek: Sistem Stock Opname Digital & Identifikasi Aset

---

## 1. Business Case & Proposisi Nilai (Value Proposition)

### 1.1 Pernyataan Masalah (Problem Statement)
Pengelolaan inventaris aset secara manual (Stock Opname) sebelumnya memakan waktu lama, rentan terhadap kesalahan manusia (*human error*), dan kurang memiliki visibilitas waktu-nyata (*real-time*). Absennya sistem identifikasi fisik yang terstandarisasi (Barcode) menyebabkan kesulitan dalam melacak pergerakan dan verifikasi aset.

### 1.2 Tujuan Bisnis (Business Objectives)
- **Efisiensi Operasional**: Mengurangi waktu yang dibutuhkan untuk audit fisik hingga 60% melalui otomatisasi barcode.
- **Integritas Data**: Menghilangkan kesalahan input data manual dengan menerapkan pembaruan database langsung melalui pemindaian.
- **Akuntabilitas**: Membuat jejak audit (*audit trail*) yang jelas mengenai siapa yang melakukan pemeriksaan dan kapan aset terakhir kali diverifikasi.
- **Pengurangan Biaya**: Meminimalkan kehilangan aset dan pembelian ganda dengan menjaga inventaris yang akurat dan waktu-nyata.

### 1.3 Indikator Kinerja Utama (KPIs)
- **Waktu Penyelesaian Audit**: Total durasi sesi Stock Opname.
- **Tingkat Akurasi**: Persentase perbedaan antara item fisik yang ditemukan vs. catatan sistem.
- **Cakupan Identifikasi Aset**: Persentase aset yang telah diberi label barcode aktif.

---

## 2. Tata Kelola IT (IT Governance) & Manajemen Risiko

### 2.1 Kontrol Akses & Keamanan
- **Akses Berbasis Peran (RBAC)**: Akses untuk membuat dan menghapus sesi Stock Opname dibatasi hanya untuk peran administrator General Affairs (GA).
- **Isolasi Lingkungan**: Kredensial database dikelola melalui variabel lingkungan yang aman (`.env.local`), memastikan tidak ada data sensitif yang masuk ke Kontrol Versi (Git).
- **Keamanan Jaringan**: Koneksi database menggunakan SSL dan dibatasi melalui daftar putih IP (*IP whitelisting*) pada Supabase.

### 2.2 Integritas Data & Arsitektur
- **Integritas Relasional**: Batasan *Foreign Key* memastikan bahwa setiap pemeriksaan inventaris terhubung ke aset dan sesi yang valid.
- **Manajemen Skema**: Semua data terkait GA diisolasi dalam skema `ga`, mencegah akses yang tidak sah atau modifikasi yang tidak disengaja dari modul sistem lainnya.
- **Keamanan Transaksi**: Sistem menggunakan transaksi PostgreSQL untuk operasi kritis (contoh: pembuatan sesi) guna memastikan konsistensi data jika terjadi kegagalan perangkat keras atau jaringan.

### 2.3 Ketersediaan & Skalabilitas Sistem
- **Connection Pooling**: Implementasi **Transaction Pooler** (Port 6543) memastikan sistem tetap responsif bahkan selama periode penggunaan puncak (contoh: sesi audit serentak secara nasional).
- **Skalabilitas**: Arsitektur mendukung penyaringan multi-perusahaan dan multi-kategori, memungkinkan sistem untuk berkembang seiring pertumbuhan organisasi.

### 2.4 Kepatuhan (Compliance) & Jejak Audit (Audit Trail)
- **Kemampuan Telusur (Traceability)**: Setiap pemindaian aset dicatat waktu pemindaiannya (`last_scanned_at`), memberikan catatan historis bagi auditor internal maupun eksternal.
- **Retensi Data**: Penghapusan sesi memerlukan konfirmasi manual, mencegah kehilangan data historis audit yang tidak disengaja.
- **Kontrol Versi**: Semua perubahan kode dilacak melalui Git, memberikan riwayat lengkap mengenai evolusi aplikasi dan perubahan tata kelola.

---

## 3. Pemeliharaan & Dukungan (Support)

- **Cadangan Database (Backups)**: Pencadangan otomatis ditangani melalui Supabase (*Point-in-Time Recovery*).
- **Pemantauan (Monitoring)**: Pencatatan kesalahan (*error logging*) diterapkan pada rute API untuk menangkap dan menyelesaikan potensi masalah koneksi database atau kesalahan logika.
- **Dokumentasi**: Dokumentasi Teknis dan Bisnis dipelihara di root repositori untuk transfer pengetahuan yang berkelanjutan.
