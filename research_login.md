# Riset Implementasi Sistem Login - MRA Inventory

## 1. Analisis Kebutuhan
Saat ini aplikasi dapat diakses secara bebas tanpa autentikasi. Untuk memenuhi standar tata kelola IT (*IT Governance*), diperlukan sistem identitas untuk membatasi akses dan mencatat jejak audit (*audit trail*).

### Komponen Utama:
- **Tabel Pengguna**: Sudah tersedia di database (`ga.m_user`).
- **Mekanisme Login**: Email & Password.
- **Proteksi Halaman**: Middleware untuk memproteksi rute internal.
- **Session Management**: Cookie-based session menggunakan Supabase SSR.

---

## 2. Strategi Implementasi (Supabase SSR)

### A. Alur Autentikasi
1. Pengguna memasukkan Email & Password di halaman `/login`.
2. Server memvalidasi kredensial menggunakan library `@supabase/ssr`.
3. Jika valid, Supabase akan memberikan *Auth Token* yang disimpan secara otomatis di **Cookies** (bukan LocalStorage, demi keamanan dari serangan XSS).
4. Pengguna diarahkan ke Dashboard.

### B. Proteksi Rute (Middleware)
Membuat file `middleware.ts` di root project untuk memeriksa sesi pada setiap request:
- Jika pengguna mencoba akses `/assets`, `/barcode`, atau `/stock-opname` tanpa login -> Redirect ke `/login`.
- Jika sudah login dan mencoba akses `/login` -> Redirect ke Dashboard.

### C. Integrasi Tabel `m_user`
Untuk mendapatkan detail tambahan (seperti `department` atau `role`), kita akan melakukan kueri ke `ga.m_user` berdasarkan `email` yang didapat dari sesi Supabase.

---

## 3. Konsep Desain UI (Login Page)
Desain akan mengikuti estetika **"Premium Dashboard"** yang sudah ada:
- **Aestetik**: Dark mode/Light mode support, efek Glassmorphism (blur background), dan bayangan halus.
- **Elemen**:
  - Logo MRA Inventory yang elegan.
  - Input field dengan transisi halus dan validasi visual.
  - Pesan error yang informatif (misal: "Email tidak ditemukan").
  - Fitur "Remember Me" menggunakan persistensi cookie.

---

## 4. Rencana Kerja (Langkah Selanjutnya)
1. **Setup Library**: Instalasi `@supabase/ssr` dan `@supabase/supabase-js`.
2. **API Login**: Membuat endpoint `/api/auth/login` (atau menggunakan Server Actions).
3. **Login Page**: Membuat `src/app/login/page.tsx` dengan desain premium.
4. **Middleware**: Implementasi `src/middleware.ts`.
5. **Session Hook**: Membuat custom hook `useUser` untuk mendapatkan data user yang sedang login di seluruh aplikasi.

---

### Catatan Penting:
Karena database sudah memiliki tabel `ga.m_user`, kita memiliki dua opsi:
1. **Opsi A**: Sinkronisasi otomatis antara Supabase Auth (tabel sistem) dengan `ga.m_user` menggunakan Database Trigger. (Direkomendasikan)
2. **Opsi B**: Menggunakan tabel `ga.m_user` secara manual dengan JWT kustom. (Lebih rumit pengelolaannya).

**Rekomendasi**: Menggunakan **Opsi A** karena lebih aman dan memanfaatkan fitur keamanan bawaan Supabase (reset password, email verification, dll).
