# System Inventory MRA - Implementation Documentation

## Overview
The "System Inventory MRA" has been updated with a digital Stock Opname system, a Barcode/QR Generator, and a mobile-responsive interface. These updates automate the asset audit process and allow for easier identification of physical assets.

---

## 1. Digital Stock Opname
A system to conduct physical inventory audits using barcode scanning.

### Database Schema (Schema: `ga`)
- **`stock_opname_sessions`**: Stores audit session metadata.
  - `id`: Serial Primary Key
  - `session_name`: Name of the audit (e.g., "Audit Q2 2026")
  - `description`: Optional notes
  - `status`: 'Ongoing' or 'Completed'
  - `total_assets`: Total items to be checked
  - `checked_count`: Items found/scanned
  - `created_at`: Timestamp
- **`inventory_checks`**: Junction table for assets within a session.
  - `session_id`: FK to sessions
  - `asset_id`: FK to assets
  - `status`: 'Pending', 'Found', 'Missing'
  - `last_scanned_at`: Timestamp

### API Endpoints
- `GET /api/stock-opname`: List all sessions or get session detail (with checks).
- `POST /api/stock-opname`: Create a new session. Supports filtering by `company_id` and `category_id`.
- `DELETE /api/stock-opname?id=X`: Remove a session.
- `POST /api/stock-opname/scan`: Processes a barcode scan. Updates the asset status to 'Found'.

### UI Features
- **Session Dashboard**: Progress bar showing Found vs Total.
- **Barcode Scanner Modal**: Real-time scanning input with instant feedback.
- **Filtering**: Ability to create sessions targeted at specific companies or categories.

---

## 2. Barcode & QR Generator
A tool to generate and print labels for assets.

### Features
- **Multiple Formats**: Support for Code 128, Code 39, EAN, UPC, and QR Codes.
- **Bulk Import**: Paste text lists to generate multiple barcodes at once.
- **Asset Integration**: Directly search and pick assets from the database to generate their labels.
- **Customization**: Adjust width, height, font size, margin, and colors.
- **Print Layout**: Automatic grid layout for bulk printing on label sheets.

---

## 3. UI/UX & Mobile Responsiveness
Modernized the dashboard layout for better usability.

### Responsive Sidebar
- **Breakpoint**: 1024px (LG).
- **Behavior**: Sidebar is fixed on desktop. On mobile, it slides in from the left.
- **Hamburger Menu**: Toggle button appears on the navbar for mobile users.
- **Overlay**: Clickable backdrop to close the menu on mobile.

### Performance & Stability
- **Database Connection**: Switched to **Transaction Pooler** (Port `6543`) on Supabase to handle high concurrency during audits.
- **Schema Isolation**: All queries explicitly target the `ga` schema via `search_path`.

---

## 4. Configuration
Ensure the following variables are set in `.env.local`:
```env
DATABASE_URL="postgresql://...:6543/postgres?options=-csearch_path%3Dga"
```

> [!IMPORTANT]
> When deploying to Vercel, manually update the `DATABASE_URL` in the project settings to use the Transaction Pooler (Port 6543) and include the `?options=-csearch_path%3Dga` parameter.
