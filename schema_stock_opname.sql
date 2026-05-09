-- ============================================================
-- STOCK OPNAME TABLES
-- Schema: ga
-- ============================================================

SET search_path TO ga, public;

-- Session: satu sesi stock opname (misal: "Stock Opname Q2 2026")
CREATE TABLE IF NOT EXISTS stock_opname_sessions (
    id              SERIAL PRIMARY KEY,
    session_name    VARCHAR(200) NOT NULL,
    description     TEXT,
    started_at      TIMESTAMP DEFAULT NOW(),
    completed_at    TIMESTAMP,
    status          VARCHAR(20) DEFAULT 'In Progress',  -- In Progress, Completed, Cancelled
    total_assets    INT DEFAULT 0,
    checked_count   INT DEFAULT 0,
    found_count     INT DEFAULT 0,
    missing_count   INT DEFAULT 0,
    created_by      VARCHAR(120),
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Detail: setiap aset yang dicek dalam sesi
CREATE TABLE IF NOT EXISTS inventory_checks (
    id              SERIAL PRIMARY KEY,
    session_id      INT NOT NULL REFERENCES stock_opname_sessions(id) ON DELETE CASCADE,
    asset_id        INT NOT NULL REFERENCES assets(id),
    asset_code      VARCHAR(50),
    check_status    VARCHAR(20) DEFAULT 'Pending',  -- Pending, Found, Missing, Damaged
    condition_note  VARCHAR(40),                     -- Good, Needs Maintenance, Damaged
    location_found  VARCHAR(200),
    checked_by      VARCHAR(120),
    checked_at      TIMESTAMP,
    notes           TEXT,
    UNIQUE(session_id, asset_id)
);

CREATE INDEX IF NOT EXISTS idx_ic_session ON inventory_checks(session_id);
CREATE INDEX IF NOT EXISTS idx_ic_status  ON inventory_checks(check_status);
CREATE INDEX IF NOT EXISTS idx_ic_asset   ON inventory_checks(asset_id);
