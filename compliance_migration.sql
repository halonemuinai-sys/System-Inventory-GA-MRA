-- ============================================================
-- LEGAL & COMPLIANCE — DB MIGRATION
-- Jalankan di Supabase SQL Editor (schema: ga)
-- ============================================================

-- 1. Tabel utama (semua modul Legal & Compliance)
CREATE TABLE IF NOT EXISTS ga.legal_documents (
  id           SERIAL PRIMARY KEY,
  module       VARCHAR(50)  NOT NULL,
    -- 'contract'   → Contract Management
    -- 'corporate'  → Corporate Legal Administration
    -- 'license'    → License & Permit
    -- 'monitoring' → Compliance Monitoring
    -- 'sop'        → SOP & Policy Management
  doc_name     VARCHAR(255) NOT NULL,
  category     VARCHAR(100) NOT NULL,
  id_number    VARCHAR(100),          -- optional (nomor kontrak / izin / kode SOP)
  issue_date   DATE,                  -- tanggal terbit / efektif
  expiry_date  DATE,                  -- nullable; hanya wajib untuk contract, license, sop
  pic          VARCHAR(100) NOT NULL,
  company_id   INTEGER REFERENCES ga.m_company(id) ON DELETE SET NULL,
  doc_status       VARCHAR(50)  NOT NULL DEFAULT 'Draft',
    -- 'Draft' | 'Under Review' | 'Approved' | 'Active' | 'Expiring Soon' | 'Expired' | 'Archived'
  confidentiality  VARCHAR(60)  NOT NULL DEFAULT 'Public/Internal',
    -- 'Public/Internal' | 'Restricted' | 'Confidential' | 'Strictly Confidential / Privileged'
  file_url     TEXT,
  file_name    VARCHAR(255),
  notes        TEXT,
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- 2. Audit trail
CREATE TABLE IF NOT EXISTS ga.legal_audit_logs (
  id            SERIAL PRIMARY KEY,
  document_id   INTEGER REFERENCES ga.legal_documents(id) ON DELETE SET NULL,
  doc_name      VARCHAR(255),
  module        VARCHAR(50),
  action        VARCHAR(50)  NOT NULL,   -- 'upload' | 'view' | 'edit' | 'delete'
  performed_by  VARCHAR(100) DEFAULT 'system',
  performed_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- 3. Index
CREATE INDEX IF NOT EXISTS idx_legal_module   ON ga.legal_documents (module);
CREATE INDEX IF NOT EXISTS idx_legal_expiry   ON ga.legal_documents (expiry_date);
CREATE INDEX IF NOT EXISTS idx_legal_audit_id ON ga.legal_audit_logs (document_id);

-- 4. Add doc_status to existing table (run if table already exists)
ALTER TABLE ga.legal_documents
  ADD COLUMN IF NOT EXISTS doc_status      VARCHAR(50) NOT NULL DEFAULT 'Draft';
ALTER TABLE ga.legal_documents
  ADD COLUMN IF NOT EXISTS confidentiality VARCHAR(60) NOT NULL DEFAULT 'Public/Internal';

-- ============================================================
-- Catatan: tabel ga.compliance_documents (versi lama) sudah
-- tidak digunakan. Bisa di-drop setelah migrasi data jika ada:
--   DROP TABLE IF EXISTS ga.compliance_documents;
--   DROP TABLE IF EXISTS ga.compliance_audit_logs;
-- ============================================================
