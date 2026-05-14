# Legal & Compliance Module

## Overview

Modul Legal & Compliance adalah sistem manajemen dokumen terpusat untuk dua departemen:

| Departemen | Sub-modul |
|---|---|
| **LEGAL** | Contract Management, Corporate Legal Administration, Litigation & Dispute |
| **COMPLIANCE** | License & Permit, Compliance Monitoring, SOP & Policy, HR & Employment, Tax & Finance, Product Regulatory |

Semua 9 sub-modul menggunakan satu shared component (`LegalDocPage`) yang dikonfigurasi via `LegalModuleConfig`.

---

## Struktur File

```
src/
├── app/
│   ├── legal/
│   │   ├── contracts/page.tsx        # Contract Management
│   │   ├── corporate/page.tsx        # Corporate Legal Administration
│   │   └── litigation/page.tsx       # Litigation & Dispute
│   ├── compliance/
│   │   ├── licenses/page.tsx         # License & Permit
│   │   ├── monitoring/page.tsx       # Compliance Monitoring
│   │   ├── sop/page.tsx              # SOP & Policy
│   │   ├── hr/page.tsx               # HR & Employment
│   │   ├── tax/page.tsx              # Tax & Finance
│   │   └── product/page.tsx          # Product Regulatory
│   └── api/
│       └── legal-docs/
│           ├── route.ts              # GET list + POST create
│           ├── [id]/route.ts         # GET detail + PUT update + DELETE
│           └── notifications/route.ts # Expiry alert counts per module
├── components/
│   └── LegalDocPage.tsx              # Shared page component (semua 9 modul)
└── ...

compliance_migration.sql              # SQL migration untuk Supabase
```

---

## Database

### Tabel: `ga.legal_documents`

| Kolom | Tipe | Default | Keterangan |
|---|---|---|---|
| `id` | SERIAL PK | — | Auto increment |
| `module` | VARCHAR(50) | — | Kode modul (lihat di bawah) |
| `doc_name` | VARCHAR(255) | — | Nama dokumen |
| `category` | VARCHAR(100) | — | Kategori sesuai modul |
| `id_number` | VARCHAR(100) | NULL | No. kontrak / izin / kode SOP |
| `issue_date` | DATE | NULL | Tanggal terbit / efektif |
| `expiry_date` | DATE | NULL | Tanggal kadaluarsa (wajib untuk modul tertentu) |
| `pic` | VARCHAR(100) | — | Penanggung jawab |
| `company_id` | INTEGER FK | NULL | Referensi ke `ga.m_company` |
| `doc_status` | VARCHAR(50) | `'Draft'` | Status siklus dokumen |
| `confidentiality` | VARCHAR(60) | `'Public/Internal'` | Klasifikasi kerahasiaan |
| `file_url` | TEXT | NULL | Link file / Google Drive |
| `file_name` | VARCHAR(255) | NULL | Nama file |
| `notes` | TEXT | NULL | Catatan |
| `created_at` | TIMESTAMPTZ | NOW() | — |
| `updated_at` | TIMESTAMPTZ | NOW() | — |

### Kode Modul

| Nilai `module` | Sub-modul |
|---|---|
| `contract` | Contract Management |
| `corporate` | Corporate Legal Administration |
| `litigation` | Litigation & Dispute |
| `license` | License & Permit |
| `monitoring` | Compliance Monitoring |
| `sop` | SOP & Policy |
| `hr_compliance` | HR & Employment |
| `tax_finance` | Tax & Finance |
| `product_regulatory` | Product Regulatory |

### Tabel: `ga.legal_audit_logs`

Setiap aksi (upload, view, edit, delete) tercatat otomatis dengan email user yang login (`performed_by`).

---

## Field: Status Dokumen (`doc_status`)

Status siklus hidup dokumen, diatur manual oleh pengguna.

| Status | Badge | Keterangan |
|---|---|---|
| Draft | Abu-abu | Dokumen baru, belum final |
| Under Review | Kuning | Sedang dalam proses review |
| Approved | Biru | Sudah disetujui |
| Active | Hijau | Aktif berlaku |
| Expiring Soon | Kuning | Segera kadaluarsa |
| Expired | Merah | Sudah kadaluarsa |
| Archived | Abu-abu | Diarsipkan |

> Berbeda dengan **Expiry Status** (Valid / Warning / Critical / Expired) yang dihitung otomatis dari `expiry_date`. `doc_status` adalah status lifecycle yang diatur manual.

---

## Field: Klasifikasi Kerahasiaan (`confidentiality`)

| Klasifikasi | Badge | Keterangan |
|---|---|---|
| Public/Internal | Hijau | Dokumen umum internal perusahaan |
| Restricted | Kuning | Dokumen terbatas pada unit tertentu |
| Confidential | Merah | Dokumen rahasia perusahaan |
| Strictly Confidential / Privileged | Merah | Dokumen sangat rahasia dan privileged |

---

## Konfigurasi Sub-modul (LegalModuleConfig)

```typescript
interface LegalModuleConfig {
  module:        string;        // kode modul (lihat tabel di atas)
  title:         string;        // judul halaman
  subtitle:      string;        // subtitle
  icon:          React.ReactNode;
  categories:    string[];      // pilihan dropdown kategori
  idLabel:       string;        // label kolom nomor referensi
  expiryLabel:   string;        // label kolom tanggal kadaluarsa
  requireExpiry: boolean;       // true → expiry_date wajib + kolom expiry status tampil
}
```

Modul dengan `requireExpiry: true`: Contract, License, HR & Employment, Tax & Finance, Product Regulatory.  
Modul dengan `requireExpiry: false`: Corporate Legal, Litigation, Compliance Monitoring, SOP & Policy.

---

## API Endpoints

### `GET /api/legal-docs`

Query params:

| Param | Keterangan |
|---|---|
| `module` | **Wajib** — kode modul |
| `page` | Nomor halaman (default: 1) |
| `limit` | Jumlah per halaman (default: 20) |
| `search` | Cari doc_name, id_number, pic |
| `category` | Filter kategori |
| `company_id` | Filter perusahaan |
| `status` | Filter expiry status (Valid/Warning/Critical/Expired) |
| `doc_status` | Filter status dokumen |
| `confidentiality` | Filter klasifikasi kerahasiaan |

### `POST /api/legal-docs`

Body: semua field di tabel (kecuali id, created_at, updated_at). `module` wajib.

### `GET /api/legal-docs/[id]`

Mengembalikan detail dokumen + `audit_logs` (20 entri terbaru) + `company_name`.  
Setiap fetch mencatat log `view` dengan email user yang login.

### `PUT /api/legal-docs/[id]`

Update semua field. Mencatat log `edit`.

### `DELETE /api/legal-docs/[id]`

Hapus dokumen. Mencatat log `delete`.

### `GET /api/legal-docs/notifications`

Mengembalikan dokumen yang kadaluarsa dalam 90 hari ke depan, beserta hitungan per modul.

```json
{
  "total": 5,
  "perModule": { "license": 3, "contract": 2 },
  "items": [...]
}
```

Digunakan oleh sidebar (badge merah per item menu) dan dashboard (alert card).

---

## Notifikasi

- **Sidebar**: setiap item menu Legal/Compliance menampilkan badge angka merah jika ada dokumen mendekati kadaluarsa di modul tersebut.
- **Bell icon** (header): merah + dot jika total notifikasi > 0.
- **Dashboard**: alert card di bagian bawah halaman menampilkan daftar dokumen yang perlu perhatian.

---

## Migration SQL

Jalankan file `compliance_migration.sql` di Supabase SQL Editor.

Untuk database yang sudah ada, cukup jalankan bagian `ALTER TABLE`:

```sql
ALTER TABLE ga.legal_documents
  ADD COLUMN IF NOT EXISTS doc_status      VARCHAR(50) NOT NULL DEFAULT 'Draft';
ALTER TABLE ga.legal_documents
  ADD COLUMN IF NOT EXISTS confidentiality VARCHAR(60) NOT NULL DEFAULT 'Public/Internal';
```
