# ============================================================
# ETL: Excel "Dashboard GA MRA Group.xlsx" -> PostgreSQL
# Requirements: pip install pandas openpyxl psycopg2-binary sqlalchemy python-dateutil
# Usage      : python etl_ga_mra.py
# ============================================================
import pandas as pd
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta
import os
import urllib.parse

# ---------- CONFIG ----------
EXCEL_FILE = os.environ.get("EXCEL_FILE", "GA MRA Group.xlsx")
SCHEMA = "ga"

# Robust connection using separate parameters
def get_engine():
    db_url_raw = os.environ.get("DB_URL", "postgresql://postgres:password@localhost:5432/ga_mra")
    if "@" in db_url_raw:
        prefix, rest = db_url_raw.split("://", 1)
        auth, host_db = rest.rsplit("@", 1)
        host_port, db_name = host_db.split("/", 1)
        host = host_port.split(":")[0]
        port = host_port.split(":")[1] if ":" in host_port else "5432"
        user, pwd = auth.split(":", 1) if ":" in auth else (auth, "")
        
        # Unquote to get original characters
        user = urllib.parse.unquote(user)
        pwd = urllib.parse.unquote(pwd)
        
        from sqlalchemy import URL
        url_obj = URL.create(
            drivername="postgresql+psycopg2",
            username=user,
            password=pwd,
            host=host,
            port=int(port),
            database=db_name.split("?")[0]
        )
        return create_engine(url_obj, connect_args={"options": f"-csearch_path={SCHEMA}"})
    return create_engine(db_url_raw.replace("postgresql://", "postgresql+psycopg2://"), connect_args={"options": f"-csearch_path={SCHEMA}"})

engine = get_engine()
print(f"DEBUG: Engine initialized for host: {engine.url.host}")

# ---------- HELPERS ----------
EXCEL_EPOCH = datetime(1899, 12, 30)

def excel_to_date(v):
    """Convert Excel serial number to Python date."""
    if pd.isna(v) or v in ("", 0, "0", "-"):
        return None
    try:
        n = float(v)
        if n < 1: return None
        return (EXCEL_EPOCH + timedelta(days=n)).date()
    except (ValueError, TypeError):
        try:
            return pd.to_datetime(v).date()
        except Exception:
            return None

def clean_str(v):
    if pd.isna(v) or v in ("-", "0", 0): return None
    return str(v).strip()

def to_num(v):
    if pd.isna(v) or v in ("", "-"): return 0
    try:
        if isinstance(v, str):
            # Remove "Rp", dots (thousands separator in ID), and spaces
            v = v.replace('Rp', '').replace('.', '').replace(',', '.').replace(' ', '').strip()
        return float(v)
    except:
        return 0

def parse_rating(v):
    if pd.isna(v) or v == "": return None
    v_str = str(v).strip()
    # If it's a direct number (e.g. "4")
    if v_str.replace('.0', '').isdigit(): 
        return int(float(v_str))
    # If it's star symbols (e.g. "★★★★☆")
    count = v_str.count('★')
    if count > 0: return count
    return None

_CACHE = {}

def get_or_create(conn, table, name_col, value, extra=None):
    """Lookup id by name, insert if not exists. Cached locally."""
    if not value: return None
    value = str(value).strip()
    cache_key = f"{table}:{name_col}:{value}"
    if cache_key in _CACHE: return _CACHE[cache_key]

    row = conn.execute(text(f"SELECT id FROM {table} WHERE {name_col}=:v"), {"v": value}).fetchone()
    if row:
        _CACHE[cache_key] = row[0]
        return row[0]

    cols = [name_col]; vals = [":v"]; params = {"v": value}
    if extra:
        for k, val in extra.items():
            cols.append(k); vals.append(f":{k}"); params[k] = val
    sql = f"INSERT INTO {table} ({','.join(cols)}) VALUES ({','.join(vals)}) RETURNING id"
    new_id = conn.execute(text(sql), params).fetchone()[0]
    _CACHE[cache_key] = new_id
    return new_id

# ---------- MIGRATE: VENDORS ----------
def migrate_vendors():
    df = pd.read_excel(EXCEL_FILE, sheet_name="DB VENDOR", header=2)
    # Filter rows where vendor name is missing (strip spaces and check)
    df = df[df["Vendor / Company Name"].astype(str).str.strip().replace(['nan', 'None', ''], pd.NA).notna()]
    print(f"[VENDORS] {len(df)} rows after filtering")
    with engine.begin() as conn:
        count = 0
        for _, r in df.iterrows():
            vn = clean_str(r.get("Vendor / Company Name"))
            if not vn or vn.lower() in ["total", "total vendor", "done", "grand total"]: continue
            
            vcat = get_or_create(conn, "ga.m_vendor_category", "name", clean_str(r.get("Category")))
            ecat = get_or_create(conn, "ga.m_expense_category", "name", clean_str(r.get("Detail")))
            div  = get_or_create(conn, "ga.m_division", "name", clean_str(r.get("Division")))
            comp = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("In partnership with")))
            bank = get_or_create(conn, "ga.m_bank", "name", clean_str(r.get("Bank")))
            conn.execute(text("""
                INSERT INTO ga.vendors (vendor_code, vendor_name, vendor_category_id, expense_category_id,
                  detail, division_id, partnership_company_id, pic_name, pic_position, phone, email,
                  address, npwp, account_name, bank_id, account_number, contract_start, contract_end,
                  top_days, contract_value, review_status, rating, status)
                VALUES (:vc,:vn,:vcat,:ecat,:dt,:div,:comp,:pic,:pos,:ph,:em,:ad,:np,:an,:bk,:no,
                        :cs,:ce,:top,:cv,:rv,:rt,:st)
                ON CONFLICT (vendor_code) DO UPDATE SET
                  vendor_name = EXCLUDED.vendor_name,
                  status = EXCLUDED.status
            """), {
                "vc": clean_str(r.get("Vendor Code")),
                "vn": vn,
                "vcat": vcat, "ecat": ecat, "dt": clean_str(r.get("Detail")),
                "div": div, "comp": comp,
                "pic": clean_str(r.get("PIC Vendor")), "pos": clean_str(r.get("Jabatan PIC")),
                "ph": clean_str(r.get("No. Telp")), "em": clean_str(r.get("Email")),
                "ad": clean_str(r.get("Address")), "np": clean_str(r.get("NPWP")),
                "an": clean_str(r.get("Nama Rekening")), "bk": bank,
                "no": clean_str(r.get("No Rekening/VA")),
                "cs": excel_to_date(r.get("Contract Start Date")),
                "ce": excel_to_date(r.get("Contract End Date")),
                "top": to_num(r.get("TOP")), "cv": to_num(r.get("Nilai Kontrak (Rp)")),
                "rv": clean_str(r.get("Review")),
                "rt": parse_rating(r.get("Rating (1-5)")),
                "st": clean_str(r.get("Status")) or "Active",
            })
            count += 1
            if count % 20 == 0: print(f"  Processed {count} vendors...")
    print(f"  Done: {count} vendors migrated.")

# ---------- MIGRATE: ASSETS ----------
def migrate_assets():
    print("Migrating Assets...")
    df = pd.read_excel(EXCEL_FILE, sheet_name='ASET EDIT', header=3)
    # Filter rows where asset name is missing
    df = df[df["Asset Name"].astype(str).str.strip().replace(['nan', 'None', ''], pd.NA).notna()]
    print(f"[ASSETS] {len(df)} rows after filtering")
    
    with engine.begin() as conn:
        count = 0
        for i, r in df.iterrows():
            an = clean_str(r.get("Asset Name"))
            if not an: continue
            
            comp = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("Company Name")))
            cat  = get_or_create(conn, "ga.m_asset_category", "name", clean_str(r.get("Category")))
            cond = get_or_create(conn, "ga.m_condition", "name", clean_str(r.get("Condition")) or "Good")
            stat = get_or_create(conn, "ga.m_status", "name", clean_str(r.get("Status")) or "Active")
            
            code = clean_str(r.get("Asset Code"))
            if not code: code = f"AST-{i+1:06d}"
            
            conn.execute(text("""
                INSERT INTO ga.assets (company_id, asset_code, asset_category_id, asset_name, details,
                    room, acquisition_date, acquisition_cost, useful_life_months,
                    condition_id, status_id, information)
                VALUES (:c,:cd,:cat,:an,:dt,:rm,:ad,:ac,:ul,:cn,:st,:inf)
                ON CONFLICT (asset_code) DO UPDATE SET
                    company_id = EXCLUDED.company_id,
                    asset_category_id = EXCLUDED.asset_category_id,
                    asset_name = EXCLUDED.asset_name,
                    details = EXCLUDED.details,
                    room = EXCLUDED.room,
                    acquisition_date = EXCLUDED.acquisition_date,
                    acquisition_cost = EXCLUDED.acquisition_cost,
                    useful_life_months = EXCLUDED.useful_life_months,
                    condition_id = EXCLUDED.condition_id,
                    status_id = EXCLUDED.status_id,
                    information = EXCLUDED.information
            """), {
                "c": comp, "cd": code, "cat": cat,
                "an": an, "dt": clean_str(r.get("Details")),
                "rm": clean_str(r.get("Room")),
                "ad": excel_to_date(r.get("Acquisition Date")),
                "ac": to_num(r.get("Acquisition Cost")) or 0,
                "ul": to_num(r.get("Useful Life Months ")),
                "cn": cond, "st": stat,
                "inf": clean_str(r.get("Information")),
            })
            count += 1
            if count % 100 == 0: print(f"  Processed {count} assets...")
    print(f"  Done: {count} assets migrated.")

# ---------- MIGRATE: VEHICLES ----------
def migrate_vehicles():
    df = pd.read_excel(EXCEL_FILE, sheet_name="DB VEHICLE", header=2)
    df = df[df["Vehicle number"].astype(str).str.strip().replace(['nan', 'None', ''], pd.NA).notna()]
    print(f"[VEHICLES] {len(df)} rows after filtering")
    with engine.begin() as conn:
        count = 0
        for _, r in df.iterrows():
            pn = clean_str(r.get("Vehicle number"))
            if not pn: continue
            comp = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("Company Name")))
            if not comp: continue
            conn.execute(text("""
                INSERT INTO ga.vehicles (company_id, plate_number, chassis_number, vehicle_type,
                    brand_model, year, color, driver_name, department, tax_date, status, information)
                VALUES (:c,:pn,:ch,:vt,:bm,:yr,:cl,:dr,:dp,:td,:st,:inf)
                ON CONFLICT (plate_number) DO NOTHING
            """), {
                "c": comp, "pn": pn,
                "ch": clean_str(r.get("No Rangka")), "vt": clean_str(r.get("Type")),
                "bm": clean_str(r.get("Brand / Model")),
                "yr": int(r["Years"]) if pd.notna(r.get("Years")) else None,
                "cl": clean_str(r.get("Color")), "dr": clean_str(r.get("Driver")),
                "dp": clean_str(r.get("Departement")),
                "td": excel_to_date(r.get("Tax date")),
                "st": clean_str(r.get("Status")) or "Aktif",
                "inf": clean_str(r.get("Information")),
            })
            count += 1
        print(f"  Done: {count} vehicles migrated.")

# ---------- MIGRATE: DOCUMENTS ----------
def migrate_documents():
    df = pd.read_excel(EXCEL_FILE, sheet_name="DB DOKUMEN", header=2)
    df = df[df["No. Dokumen"].astype(str).str.strip().replace(['nan', 'None', ''], pd.NA).notna()]
    print(f"[DOCUMENTS-agreement] {len(df)} rows after filtering")
    with engine.begin() as conn:
        for _, r in df.iterrows():
            dn = clean_str(r.get("No. Dokumen"))
            if not dn: continue
            dt = get_or_create(conn, "ga.m_document_type", "name", clean_str(r.get("Jenis Dokumen")))
            div = get_or_create(conn, "ga.m_division", "name", clean_str(r.get("Division")))
            mra = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("Pihak MRA")))
            conn.execute(text("""
                INSERT INTO ga.documents (doc_number, doc_title, doc_type_id, doc_subtype, division_id,
                    mra_party_id, counter_party, pic_internal, valid_from, valid_until,
                    physical_location, status, notes, sto_status)
                VALUES (:dn,:dt2,:dty,'agreement',:div,:mra,:cp,:pic,:vf,:vu,:pl,:st,:nt,:sto)
            """), {
                "dn": dn, "dt2": clean_str(r.get("Judul Dokumen")),
                "dty": dt, "div": div, "mra": mra,
                "cp": clean_str(r.get("Pihak Terkait")), "pic": clean_str(r.get("PIC Internal")),
                "vf": excel_to_date(r.get("Tgl Berlaku")),
                "vu": excel_to_date(r.get("Tgl Berakhir")),
                "pl": clean_str(r.get("Lokasi Fisik")),
                "st": clean_str(r.get("Status")) or "Active",
                "nt": clean_str(r.get("Keterangan")), "sto": clean_str(r.get("STO")),
            })
    # BA Penjualan Aset
    df2 = pd.read_excel(EXCEL_FILE, sheet_name="BA Penjualan Aset", header=2)
    df2 = df2.dropna(subset=["No. Document"])
    print(f"[DOCUMENTS-ba_sale] {len(df2)} rows")
    with engine.begin() as conn:
        for _, r in df2.iterrows():
            dt = get_or_create(conn, "ga.m_document_type", "name", "Berita Acara")
            mra = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("Company Name")))
            conn.execute(text("""
                INSERT INTO ga.documents (doc_number, doc_title, doc_type_id, doc_subtype,
                    mra_party_id, counter_party, pic_internal, valid_from, amount, notes, sto_status)
                VALUES (:dn,:dt2,:dty,'ba_sale',:mra,:cp,:pic,:vf,:am,:nt,:sto)
            """), {
                "dn": clean_str(r.get("No. Document")), "dt2": clean_str(r.get("Document Title")),
                "dty": dt, "mra": mra,
                "cp": clean_str(r.get("Vendor")), "pic": clean_str(r.get("PIC")),
                "vf": excel_to_date(r.get("Date")),
                "am": to_num(r.get("Amount")),
                "nt": clean_str(r.get("Keterangan")), "sto": clean_str(r.get("STO")),
            })

# ---------- MIGRATE: DEVICE RENTAL ----------
def migrate_device_rental():
    df = pd.read_excel(EXCEL_FILE, sheet_name="DB DEVICE RENTAL", header=2)
    df = df[df["Item Name"].astype(str).str.strip().replace(['nan', 'None', ''], pd.NA).notna()]
    print(f"[DEVICE RENTAL] {len(df)} rows after filtering")
    with engine.begin() as conn:
        for _, r in df.iterrows():
            it = clean_str(r.get("Item Name"))
            if not it: continue
            comp = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("Company Name")))
            if not comp: continue
            vname = clean_str(r.get("Vendor Name"))
            vid = None
            if vname:
                row = conn.execute(text("SELECT id FROM ga.vendors WHERE vendor_name=:n"), {"n": vname}).fetchone()
                vid = row[0] if row else None
            conn.execute(text("""
                INSERT INTO ga.device_rentals (company_id, vendor_id, device_type, order_id, item_name,
                    price, unit_code, duration_months, start_rent, end_rent, department, status)
                VALUES (:c,:v,:dt,:oid,:it,:pr,:uc,:du,:sr,:er,:dp,'Active')
            """), {
                "c": comp, "v": vid, "dt": clean_str(r.get("Type Device")),
                "oid": clean_str(r.get("Order ID")), "it": it,
                "pr": to_num(r.get("Price")), "uc": clean_str(r.get("Code Unit")),
                "du": to_num(r.get("Duration")),
                "sr": excel_to_date(r.get("Start Rent")),
                "er": excel_to_date(r.get("End Rent")),
                "dp": clean_str(r.get("Dept")),
            })

# ---------- MIGRATE: INSURANCES ----------
def migrate_insurances():
    df = pd.read_excel(EXCEL_FILE, sheet_name="DB ASURANSI", header=2)
    df = df[df["No Polis"].astype(str).str.strip().replace(['nan', 'None', ''], pd.NA).notna()]
    print(f"[INSURANCES] {len(df)} rows after filtering")
    with engine.begin() as conn:
        for _, r in df.iterrows():
            pn = clean_str(r.get("No Polis"))
            if not pn: continue
            comp = get_or_create(conn, "ga.m_company", "name", clean_str(r.get("Company Name")))
            if not comp: continue
            plate = clean_str(r.get("Vehicle Number"))
            vid = None
            if plate:
                row = conn.execute(text("SELECT id FROM ga.vehicles WHERE plate_number=:p"), {"p": plate}).fetchone()
                vid = row[0] if row else None
            conn.execute(text("""
                INSERT INTO ga.insurances (company_id, insurance_company, insurance_type, category,
                    policy_number, start_date, end_date, vehicle_id, vehicle_type,
                    premium_idr, premium_usd, coverage_idr, coverage_usd, tjh3,
                    broker, pic, contact_person, status)
                VALUES (:c,:ic,:it,:ct,:pn,:sd,:ed,:vid,:vt,:pi,:pu,:ci,:cu,:tj,:br,:pic,:cp,'Active')
            """), {
                "c": comp, "ic": clean_str(r.get("Insurance Company")),
                "it": clean_str(r.get("Insurance Types")), "ct": clean_str(r.get("Categories")),
                "pn": pn,
                "sd": excel_to_date(r.get("Start Date")),
                "ed": excel_to_date(r.get("End Date")),
                "vid": vid, "vt": clean_str(r.get("Vehicle Types")),
                "pi": to_num(r.get("Premium Amount")),
                "pu": to_num(r.get("Premium Amount (USD)")),
                "ci": to_num(r.get("Coverage Amount (Rp)")),
                "cu": to_num(r.get("Coverage Amount (USD)")),
                "tj": to_num(r.get("TJH 3")),
                "br": clean_str(r.get("Broker")),
                "pic": clean_str(r.get("PIC")), "cp": clean_str(r.get("Contac Person")),
            })

# ---------- MIGRATE: MAINTENANCE ----------
def migrate_maintenance():
    print("Migrating Maintenance...")
    df = pd.read_excel(EXCEL_FILE, sheet_name='DB MAINTENANCE', header=2)
    df = df.dropna(subset=['Company Name', 'Asset Name'], how='all')
    
    with engine.begin() as conn:
        for _, r in df.iterrows():
            c_name = clean_str(r.get("Company Name"))
            if not c_name: continue
            
            cid = get_or_create(conn, "ga.m_company", "name", c_name)
            
            conn.execute(text("""
                INSERT INTO ga.maintenance (
                    company_id, location, room_area, asset_code, asset_name, 
                    detail, pic, service_type, expiry_date, qty, est_cost, 
                    total_cost, vendor_name, status, information
                ) VALUES (:cid, :loc, :room, :code, :name, :det, :pic, :type, :exp, :qty, :est, :tot, :ven, :st, :info)
            """), {
                "cid": cid, "loc": clean_str(r.get("Location")), "room": clean_str(r.get("Room / Area")),
                "code": clean_str(r.get("Asset Code")), "name": clean_str(r.get("Asset Name")),
                "det": clean_str(r.get("Detail")), "pic": clean_str(r.get("PIC")),
                "type": clean_str(r.get("Type Service")), "exp": excel_to_date(r.get("Expired / Time to Service")),
                "qty": to_num(r.get("Qty")), "est": to_num(r.get("Est Cost")),
                "tot": to_num(r.get("Total Cost")), "ven": clean_str(r.get("Vendor")),
                "st": clean_str(r.get("Status")), "info": clean_str(r.get("information"))
            })

# ---------- MIGRATE: EXPENSE REPORT ----------
def migrate_expense():
    print("Migrating Expense Reports...")
    df = pd.read_excel(EXCEL_FILE, sheet_name='EXPENSE REPORT', header=3)
    df = df.dropna(subset=['COA'])
    
    with engine.begin() as conn:
        for _, r in df.iterrows():
            coa = clean_str(r.get("COA"))
            if not coa or coa.lower() in ["total", "grand total"]: continue
            
            conn.execute(text("""
                INSERT INTO ga.expense_reports (
                    coa, fy_budget, budget_jan, actual_jan, budget_feb, actual_feb,
                    budget_mar, actual_mar, budget_apr, actual_apr,
                    total_budget, total_actual, difference
                ) VALUES (:coa, :fy, :b1, :a1, :b2, :a2, :b3, :a3, :b4, :a4, :tb, :ta, :diff)
            """), {
                "coa": coa, "fy": to_num(r.get("FY Budget")),
                "b1": to_num(r.get("Budget Jan")), "a1": to_num(r.get("Actual Jan")),
                "b2": to_num(r.get("Budget Feb")), "a2": to_num(r.get("Actual Feb")),
                "b3": to_num(r.get("Budget Mar")), "a3": to_num(r.get("Actual Mar")),
                "b4": to_num(r.get("Budget Apr")), "a4": to_num(r.get("Actual Apr")),
                "tb": to_num(r.get("Total Budget")), "ta": to_num(r.get("Total Actual")),
                "diff": to_num(r.get("Selisih"))
            })

# ---------- MAIN ----------
if __name__ == "__main__":
    print("=== ETL GA MRA START ===")
    migrate_vendors()
    migrate_assets()
    migrate_vehicles()
    migrate_documents()
    migrate_device_rental()
    migrate_insurances()
    migrate_maintenance()
    migrate_expense()
    print("=== ETL DONE ===")
