-- ============================================================
-- DATABASE: ga_mra_group
-- DBMS    : PostgreSQL 13+
-- Author  : GA System
-- Note    : Jalankan di Laragon -> psql / DBeaver / pgAdmin
-- ============================================================

-- DROP DATABASE IF EXISTS ga_mra_group;
-- CREATE DATABASE ga_mra_group;
-- \c ga_mra_group;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE SCHEMA IF NOT EXISTS ga;
SET search_path TO ga, public;

-- ============================================================
-- A. MASTER / LOOKUP TABLES
-- ============================================================

CREATE TABLE m_company (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(20) UNIQUE,
    name         VARCHAR(150) NOT NULL,
    npwp         VARCHAR(30),
    address      TEXT,
    is_active    BOOLEAN DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE m_division (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(80) UNIQUE NOT NULL
);

CREATE TABLE m_bank (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(50) UNIQUE NOT NULL
);

-- Goods, Service, Rental, Project
CREATE TABLE m_vendor_category (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(50) UNIQUE NOT NULL
);

-- 10 kategori utama + sub-category (Office & Facility, Security, dst)
CREATE TABLE m_expense_category (
    id          SERIAL PRIMARY KEY,
    parent_id   INT REFERENCES m_expense_category(id) ON DELETE SET NULL,
    name        VARCHAR(120) NOT NULL,
    level       SMALLINT DEFAULT 1,
    UNIQUE (parent_id, name)
);

-- Land, Building, Vehicle, Furniture, dll
CREATE TABLE m_asset_category (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(80) UNIQUE NOT NULL
);

-- Laptop, iMac, Printer, AC, dll
CREATE TABLE m_asset_type (
    id            SERIAL PRIMARY KEY,
    category_id   INT REFERENCES m_asset_category(id),
    name          VARCHAR(80) NOT NULL,
    UNIQUE (category_id, name)
);

CREATE TABLE m_condition (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(40) UNIQUE NOT NULL  -- Good, Needs Maintenance, Damaged
);

CREATE TABLE m_status (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(40) UNIQUE NOT NULL  -- Active, Idle, Lost, Disposed
);

CREATE TABLE m_document_type (
    id    SERIAL PRIMARY KEY,
    name  VARCHAR(80) UNIQUE NOT NULL  -- PKS, Kontrak Pengadaan, Sewa, Lisensi
);

CREATE TABLE m_location (
    id          SERIAL PRIMARY KEY,
    building    VARCHAR(100),
    floor       VARCHAR(20),
    room        VARCHAR(80),
    full_name   VARCHAR(200) GENERATED ALWAYS AS
                (COALESCE(building,'') || ' ' || COALESCE(floor,'') || ' ' || COALESCE(room,'')) STORED
);

CREATE TABLE m_coa (
    id     SERIAL PRIMARY KEY,
    code   VARCHAR(30) UNIQUE,
    name   VARCHAR(150) NOT NULL
);

CREATE TABLE m_user (
    id          SERIAL PRIMARY KEY,
    full_name   VARCHAR(120) NOT NULL,
    email       VARCHAR(120) UNIQUE,
    phone       VARCHAR(30),
    department  VARCHAR(80),
    position    VARCHAR(80),
    role        VARCHAR(30) DEFAULT 'staff',  -- admin, ga, finance, mgmt
    password    VARCHAR(255),
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- B. TRANSACTIONAL TABLES
-- ============================================================

-- 1. VENDORS
CREATE TABLE vendors (
    id                    SERIAL PRIMARY KEY,
    vendor_code           VARCHAR(30) UNIQUE,
    vendor_name           VARCHAR(200) NOT NULL,
    vendor_category_id    INT REFERENCES m_vendor_category(id),
    expense_category_id   INT REFERENCES m_expense_category(id),
    detail                VARCHAR(200),
    division_id           INT REFERENCES m_division(id),
    partnership_company_id INT REFERENCES m_company(id),
    pic_name              VARCHAR(120),
    pic_position          VARCHAR(80),
    phone                 VARCHAR(30),
    email                 VARCHAR(120),
    address               TEXT,
    npwp                  VARCHAR(40),
    account_name          VARCHAR(150),
    bank_id               INT REFERENCES m_bank(id),
    account_number        VARCHAR(50),
    contract_start        DATE,
    contract_end          DATE,
    top_days              INT,
    contract_value        NUMERIC(18,2),
    review_status         VARCHAR(30),
    rating                SMALLINT CHECK (rating BETWEEN 1 AND 5),
    status                VARCHAR(30) DEFAULT 'Active',
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_vendors_company ON vendors(partnership_company_id);
CREATE INDEX idx_vendors_status  ON vendors(status);

-- 2. ASSETS
CREATE TABLE assets (
    id                   SERIAL PRIMARY KEY,
    company_id           INT NOT NULL REFERENCES m_company(id),
    asset_code           VARCHAR(50) UNIQUE,
    asset_category_id    INT REFERENCES m_asset_category(id),
    asset_type_id        INT REFERENCES m_asset_type(id),
    asset_name           VARCHAR(200) NOT NULL,
    details              TEXT,
    location_id          INT REFERENCES m_location(id),
    room                 VARCHAR(100),
    pic_id               INT REFERENCES m_user(id),
    acquisition_date     DATE,
    acquisition_cost     NUMERIC(18,2) DEFAULT 0,
    useful_life_months   INT,
    condition_id         INT REFERENCES m_condition(id),
    status_id            INT REFERENCES m_status(id),
    information          TEXT,
    created_at           TIMESTAMP DEFAULT NOW(),
    updated_at           TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_assets_company  ON assets(company_id);
CREATE INDEX idx_assets_category ON assets(asset_category_id);
CREATE INDEX idx_assets_status   ON assets(status_id);

-- 3. DOCUMENTS (Perjanjian + BA Penjualan, dibedakan via doc_subtype)
CREATE TABLE documents (
    id                  SERIAL PRIMARY KEY,
    doc_number          VARCHAR(100) NOT NULL,
    doc_title           VARCHAR(200),
    doc_type_id         INT REFERENCES m_document_type(id),
    doc_subtype         VARCHAR(20) DEFAULT 'agreement',  -- agreement | ba_sale
    division_id         INT REFERENCES m_division(id),
    mra_party_id        INT REFERENCES m_company(id),
    counter_party       VARCHAR(200),
    vendor_id           INT REFERENCES vendors(id),
    pic_internal        VARCHAR(80),
    valid_from          DATE,
    valid_until         DATE,
    physical_location   VARCHAR(100),
    auto_renewal        BOOLEAN DEFAULT FALSE,
    digital_doc_url     TEXT,
    amount              NUMERIC(18,2),
    notes               TEXT,
    status              VARCHAR(30) DEFAULT 'Active',
    sto_status          VARCHAR(30),
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_doc_subtype ON documents(doc_subtype);
CREATE INDEX idx_doc_validuntil ON documents(valid_until);

-- 4. VEHICLES
CREATE TABLE vehicles (
    id                 SERIAL PRIMARY KEY,
    company_id         INT NOT NULL REFERENCES m_company(id),
    plate_number       VARCHAR(20) UNIQUE NOT NULL,
    chassis_number     VARCHAR(50),
    vehicle_type       VARCHAR(40),
    brand_model        VARCHAR(120),
    year               SMALLINT,
    color              VARCHAR(30),
    driver_name        VARCHAR(120),
    department         VARCHAR(80),
    tax_date           DATE,
    last_km            INT,
    last_service_date  DATE,
    status             VARCHAR(20) DEFAULT 'Aktif',
    information        TEXT,
    created_at         TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_vehicles_company ON vehicles(company_id);

-- 5. DEVICE RENTALS
CREATE TABLE device_rentals (
    id              SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES m_company(id),
    vendor_id       INT REFERENCES vendors(id),
    device_type     VARCHAR(50),
    order_id        VARCHAR(80),
    item_name       VARCHAR(200),
    price           NUMERIC(15,2),
    unit_code       VARCHAR(50),
    duration_months INT,
    start_rent      DATE,
    end_rent        DATE,
    user_id         INT REFERENCES m_user(id),
    department      VARCHAR(80),
    location_id     INT REFERENCES m_location(id),
    status          VARCHAR(30) DEFAULT 'Active',
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_rental_company ON device_rentals(company_id);
CREATE INDEX idx_rental_endrent ON device_rentals(end_rent);

-- 6. INSURANCES
CREATE TABLE insurances (
    id                 SERIAL PRIMARY KEY,
    company_id         INT NOT NULL REFERENCES m_company(id),
    insurance_company  VARCHAR(150),
    insurance_type     VARCHAR(50),     -- Vehicle, Building, dll
    category           VARCHAR(50),     -- Comprehensive, TLO
    policy_number      VARCHAR(50),
    start_date         DATE,
    end_date           DATE,
    vehicle_id         INT REFERENCES vehicles(id),
    vehicle_type       VARCHAR(80),
    premium_idr        NUMERIC(18,2),
    premium_usd        NUMERIC(15,2),
    coverage_idr       NUMERIC(18,2),
    coverage_usd       NUMERIC(15,2),
    tjh3               NUMERIC(15,2),
    broker             VARCHAR(100),
    pic                VARCHAR(100),
    contact_person     VARCHAR(50),
    information        TEXT,
    doc_url            TEXT,
    checklist_status   VARCHAR(20),
    status             VARCHAR(20) DEFAULT 'Active',
    created_at         TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_ins_enddate ON insurances(end_date);

-- 7. MAINTENANCES
CREATE TABLE maintenances (
    id              SERIAL PRIMARY KEY,
    company_id      INT NOT NULL REFERENCES m_company(id),
    location_id     INT REFERENCES m_location(id),
    room_area       VARCHAR(80),
    asset_id        INT REFERENCES assets(id),
    asset_name      VARCHAR(200),
    detail          TEXT,
    pic             VARCHAR(80),
    service_type    VARCHAR(80),
    expired_date    DATE,
    qty             INT DEFAULT 1,
    est_cost        NUMERIC(15,2) DEFAULT 0,
    total_cost      NUMERIC(15,2) DEFAULT 0,
    vendor_id       INT REFERENCES vendors(id),
    status          VARCHAR(30),
    information     TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX idx_mt_company ON maintenances(company_id);
CREATE INDEX idx_mt_expired ON maintenances(expired_date);

-- 8. EXPENSE BUDGET (long format: 1 row / bulan)
CREATE TABLE expense_budget (
    id            SERIAL PRIMARY KEY,
    fiscal_year   SMALLINT NOT NULL,
    period_month  SMALLINT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    coa_id        INT NOT NULL REFERENCES m_coa(id),
    company_id    INT REFERENCES m_company(id),
    budget_amount NUMERIC(18,2) DEFAULT 0,
    actual_amount NUMERIC(18,2) DEFAULT 0,
    variance      NUMERIC(18,2) GENERATED ALWAYS AS (budget_amount - actual_amount) STORED,
    UNIQUE (fiscal_year, period_month, coa_id, company_id)
);

-- ============================================================
-- C. AUDIT LOG (opsional tapi disarankan)
-- ============================================================
CREATE TABLE audit_log (
    id          BIGSERIAL PRIMARY KEY,
    table_name  VARCHAR(50),
    record_id   INT,
    action      VARCHAR(10),  -- INSERT/UPDATE/DELETE
    old_data    JSONB,
    new_data    JSONB,
    user_id     INT REFERENCES m_user(id),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- D. SEED DATA (dari Legend)
-- ============================================================
INSERT INTO m_condition(name) VALUES ('Good'),('Needs Maintenance'),('Damaged');
INSERT INTO m_status(name)    VALUES ('Active'),('Idle'),('Lost'),('Disposed');
INSERT INTO m_vendor_category(name) VALUES ('Goods'),('Service'),('Rental'),('Project');
INSERT INTO m_bank(name) VALUES ('BCA'),('Mandiri'),('BNI'),('BRI'),('OCBC'),('CIMB');

INSERT INTO m_document_type(name) VALUES
 ('PKS / MoU'),('Kontrak Pengadaan'),('Perjanjian Jasa'),
 ('Perjanjian Sewa'),('Lisensi'),('Berita Acara');

INSERT INTO m_asset_category(name) VALUES
 ('Land'),('Building'),('Leasehold Improvement'),('Furniture & Fixtures'),
 ('Office & IT Electronic Equip'),('Kitchen Equipment'),('Freezer'),('Vehicle');

INSERT INTO m_company(name) VALUES
 ('Mugi Rekso Abadi, PT'),
 ('Hourlogy Indah Perkasa, PT'),
 ('Hourlogy Inti Semesta, PT'),
 ('Mogems Putri International, PT'),
 ('Media Insan Abadi, PT'),
 ('Paramita Kreasi Abadi, PT');

INSERT INTO m_division(name) VALUES ('Retail'),('Media'),('Publisher'),('Operasional');

-- Expense category parent
INSERT INTO m_expense_category(name, level) VALUES
 ('Office & Facility Management',1),
 ('Security & Safety',1),
 ('Utilities',1),
 ('Office Supplies & Equipment',1),
 ('Transportation & Logistics',1),
 ('Event & Hospitality',1),
 ('Insurance & Legal',1),
 ('IT Support',1),
 ('Construction & Renovation',1),
 ('Promotion & Advertising',1),
 ('Miscellaneous / Others',1);

-- ============================================================
-- E. VIEW UNTUK DASHBOARD
-- ============================================================
CREATE OR REPLACE VIEW v_dashboard_summary AS
SELECT
  (SELECT COUNT(*) FROM assets)                         AS total_asset,
  (SELECT COALESCE(SUM(acquisition_cost),0) FROM assets) AS total_asset_value,
  (SELECT COUNT(*) FROM device_rentals WHERE status='Active') AS device_rental_active,
  (SELECT COUNT(*) FROM vehicles WHERE status='Aktif')  AS vehicle_active,
  (SELECT COUNT(*) FROM vendors  WHERE status='Active') AS vendor_active,
  (SELECT COUNT(*) FROM insurances WHERE status='Active') AS insurance_active,
  (SELECT COUNT(*) FROM documents  WHERE status='Active') AS document_active;

CREATE OR REPLACE VIEW v_asset_by_category AS
SELECT c.name AS category,
       COUNT(a.id)        AS qty,
       COALESCE(SUM(a.acquisition_cost),0) AS total_cost
FROM m_asset_category c
LEFT JOIN assets a ON a.asset_category_id = c.id
GROUP BY c.name
ORDER BY c.name;

CREATE OR REPLACE VIEW v_contract_expiring AS
SELECT 'document' AS source, doc_number AS ref, valid_until AS expire_date,
       (valid_until - CURRENT_DATE) AS days_left
FROM documents WHERE valid_until IS NOT NULL
UNION ALL
SELECT 'insurance', policy_number, end_date, (end_date - CURRENT_DATE)
FROM insurances WHERE end_date IS NOT NULL
UNION ALL
SELECT 'rental', order_id, end_rent, (end_rent - CURRENT_DATE)
FROM device_rentals WHERE end_rent IS NOT NULL
ORDER BY days_left;

-- DONE
