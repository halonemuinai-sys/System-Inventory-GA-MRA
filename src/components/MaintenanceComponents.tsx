import React from 'react';
import {
  Wrench, Loader2, Save, Trash2, Edit2, Phone, Calendar, Coins, CheckCircle, AlertTriangle
} from 'lucide-react';
import { Badge, ModalShell, FF, SLabel, FormError, SearchableSelect } from '@/components/PageShared';

// ── Types ─────────────────────────────────────────────────────
export interface Maintenance {
  id: number;
  company_id: number;
  company: string;
  asset_name: string;
  service_type: string;
  room_area: string;
  pic: string;
  vendor_id: number;
  vendor_name: string;
  qty: number;
  est_cost: number;
  total_cost: number;
  expiry_date: string;
  information: string;
  status: string;
}

export interface MaintenanceDetail {
  id: number;
  company_id: number;
  company: string;
  asset_id: number | null;
  asset_name: string;
  service_type: string;
  room_area: string;
  pic: string;
  vendor_id: number;
  vendor_name: string;
  qty: number;
  est_cost: number;
  total_cost: number;
  expired_date: string;
  information: string;
  status: string;
}

export interface Meta {
  companies: { id: number; name: string }[];
  vendors: { id: number; vendor_name: string; name?: string }[];
}

export interface FormData {
  company_id: string;
  asset_name: string;
  service_type: string;
  room_area: string;
  pic: string;
  vendor_id: string;
  qty: number | string;
  est_cost: string;
  total_cost: string;
  expiry_date: string;
  information: string;
  status: string;
}

// ── Helper ────────────────────────────────────────────────────
export function mtnStatus(expiry: string, status?: string) {
  if (status === 'Completed') return { label: 'Completed', colorClass: 'badge-emerald', cls: 'text-emerald' };
  if (!expiry) return { label: 'Active', colorClass: 'badge-emerald', cls: 'text-emerald' };
  const d = new Date(expiry);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: 'Expired', colorClass: 'badge-rose', cls: 'text-rose' };
  if (diff <= 30) return { label: 'Renewal', colorClass: 'badge-amber', cls: 'text-amber' };
  return { label: 'Active', colorClass: 'badge-emerald', cls: 'text-emerald' };
}

// ── Detail Modal ──────────────────────────────────────────────
interface MaintenanceDetailModalProps {
  detail: MaintenanceDetail | null;
  dlLoading: boolean;
  onClose: () => void;
  openEdit: (id: number) => void;
  fmtDate: (d: string) => string;
  fmt: (v: number) => string;
}

export function MaintenanceDetailModal({
  detail,
  dlLoading,
  onClose,
  openEdit,
  fmtDate,
  fmt,
}: MaintenanceDetailModalProps) {
  if (!detail && !dlLoading) return null;

  // Custom detail row helper
  const CustomRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0 text-sm">
      <span className="text-[10px] font-700 text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="font-600 text-slate-700 text-right">{value || '—'}</span>
    </div>
  );

  const statusInfo = detail ? mtnStatus(detail.expired_date, detail.status) : null;

  return (
    <ModalShell
      title={detail ? `Maintenance — ${detail.asset_name || detail.room_area || '#' + detail.id}` : 'Memuat…'}
      onClose={onClose}
      size="lg"
    >
      {dlLoading || !detail ? (
        <div className="flex-center py-14">
          <Loader2 size={28} className="animate-spin text-blue" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Hero Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-amber-50/15 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white text-lg font-900 shadow-md shadow-amber-500/10 shrink-0">
                {detail.asset_name ? detail.asset_name.substring(0, 2).toUpperCase() : 'MT'}
              </div>
              <div>
                <h2 className="text-xl font-900 text-slate-800 leading-tight mb-1.5">{detail.asset_name || 'General Maintenance'}</h2>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {statusInfo && <Badge label={statusInfo.label} colorClass={statusInfo.colorClass} />}
                  {detail.service_type && <Badge label={detail.service_type} colorClass="badge-indigo" />}
                  {detail.company && <Badge label={detail.company} colorClass="badge-slate" />}
                </div>
              </div>
            </div>

            {/* Quick Actions at the top */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="btn flex items-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all duration-200 px-3.5 py-2 text-xs font-600 shadow-xs cursor-pointer"
                onClick={() => {
                  onClose();
                  openEdit(detail.id);
                }}
                title="Edit Layanan"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                className="btn btn-primary flex items-center gap-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xs transition-all duration-300 transform hover:scale-[1.01] px-4 py-2 text-xs font-600 cursor-pointer"
                onClick={onClose}
                title="Tutup Modal"
              >
                Tutup
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Detail Pekerjaan Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Wrench size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Detail Pekerjaan</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="Tipe Servis" value={detail.service_type} />
                <CustomRow label="Area / Ruangan" value={detail.room_area} />
                <CustomRow label="PIC Pelaksana" value={detail.pic} />
                <CustomRow label="Vendor / Bengkel" value={detail.vendor_name} />
                <CustomRow label="Perusahaan MRA" value={detail.company} />
              </div>
            </div>

            {/* Biaya & Jadwal Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Calendar size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Biaya & Jadwal</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="Kuantitas Unit" value={<span className="font-700 text-slate-800">{detail.qty || 1} unit</span>} />
                <CustomRow label="Estimasi Biaya" value={`Rp ${fmt(parseFloat(String(detail.est_cost || 0)))}`} />
                <CustomRow 
                  label="Total Biaya" 
                  value={<span className="text-sm font-800 text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md">Rp {fmt(parseFloat(String(detail.total_cost || 0)))}</span>} 
                />
                <CustomRow 
                  label="Jatuh Tempo" 
                  value={
                    statusInfo ? (
                      <span className={`font-700 ${statusInfo.cls}`}>
                        {fmtDate(detail.expired_date)}
                      </span>
                    ) : '—'
                  } 
                />
              </div>
            </div>
          </div>

          {/* Informasi Tambahan */}
          {detail.information && (
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-800 uppercase tracking-wider mb-1.5">Informasi Tambahan / Catatan Servis</p>
              <p className="text-xs text-slate-600 leading-relaxed font-500 italic">{detail.information}</p>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

// ── Form Modal ────────────────────────────────────────────────
interface MaintenanceFormModalProps {
  showAdd: boolean;
  editRow: MaintenanceDetail | null;
  form: FormData;
  formErr: string;
  saving: boolean;
  meta: Meta;
  closeForm: () => void;
  sf: (k: keyof FormData, v: string | number) => void;
  save: () => void;
  fmtCurrency: (s: string) => string;
}

export function MaintenanceFormModal({
  showAdd,
  editRow,
  form,
  formErr,
  saving,
  meta,
  closeForm,
  sf,
  save,
  fmtCurrency,
}: MaintenanceFormModalProps) {
  if (!showAdd && !editRow) return null;

  return (
    <ModalShell
      title={editRow ? 'Edit Maintenance & Service' : 'Tambah Layanan Baru'}
      onClose={closeForm}
      size="md"
      closeOnClickOutside={false}
    >
      <div className="flex flex-col gap-4">
        <FormError msg={formErr} />
        <SLabel>Detail Perbaikan / Servis</SLabel>
        <div className="detail-grid gap-2">
          <FF label="Perusahaan" id="mtn_co" required>
            <select
              id="mtn_co"
              value={form.company_id}
              onChange={(e) => sf('company_id', e.target.value)}
              className="input-premium"
              title="Pilih Perusahaan"
            >
              <option value="">— Pilih —</option>
              {meta.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Nama Aset / Unit" id="mtn_asset" required>
            <input
              id="mtn_asset"
              type="text"
              value={form.asset_name}
              onChange={(e) => sf('asset_name', e.target.value)}
              placeholder="Mis: AC Split 2PK, Lift, dll"
              className="input-premium"
              title="Nama Aset"
            />
          </FF>
          <FF label="Area / Ruangan" id="mtn_area">
            <input
              id="mtn_area"
              type="text"
              value={form.room_area}
              onChange={(e) => sf('room_area', e.target.value)}
              placeholder="Lantai 3, Ruang Rapat"
              className="input-premium"
              title="Area / Ruangan"
            />
          </FF>
          <FF label="Tipe Servis" id="mtn_type">
            <input
              id="mtn_type"
              type="text"
              value={form.service_type}
              onChange={(e) => sf('service_type', e.target.value)}
              placeholder="Routine / Repair / Cleaning"
              className="input-premium"
              title="Tipe Servis"
            />
          </FF>
          <FF label="PIC Pelaksana" id="mtn_pic">
            <input
              id="mtn_pic"
              type="text"
              value={form.pic}
              onChange={(e) => sf('pic', e.target.value)}
              placeholder="Nama PIC"
              className="input-premium"
              title="PIC Pelaksana"
            />
          </FF>
          <FF label="Vendor / Bengkel" id="mtn_vendor">
            <SearchableSelect
              id="mtn_vendor"
              value={form.vendor_id}
              onChange={(v) => sf('vendor_id', v)}
              options={meta.vendors.map((v) => ({ id: v.id, name: v.vendor_name || v.name || '' }))}
              placeholder="— Pilih Vendor —"
            />
          </FF>
          <FF label="Kuantitas Unit" id="mtn_qty">
            <input
              id="mtn_qty"
              type="number"
              value={form.qty}
              onChange={(e) => sf('qty', e.target.value)}
              min={1}
              className="input-premium"
              title="Kuantitas Unit"
            />
          </FF>
          <FF label="Jatuh Tempo / Expiry" id="mtn_expiry">
            <input
              id="mtn_expiry"
              type="date"
              value={form.expiry_date}
              onChange={(e) => sf('expiry_date', e.target.value)}
              className="input-premium"
              title="Tanggal Jatuh Tempo"
            />
          </FF>
          <FF label="Estimasi Biaya (Rp)" id="mtn_est">
            <input
              id="mtn_est"
              type="text"
              value={fmtCurrency(form.est_cost)}
              onChange={(e) => sf('est_cost', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="input-premium"
              title="Estimasi Biaya"
            />
          </FF>
          <FF label="Total Biaya (Rp)" id="mtn_total">
            <input
              id="mtn_total"
              type="text"
              value={fmtCurrency(form.total_cost)}
              onChange={(e) => sf('total_cost', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="input-premium"
              title="Total Biaya"
            />
          </FF>
          <FF label="Status" id="mtn_status">
            <select
              id="mtn_status"
              value={form.status}
              onChange={(e) => sf('status', e.target.value)}
              className="input-premium"
              title="Status"
            >
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </FF>
        </div>
        <FF label="Informasi Tambahan" id="mtn_info">
          <textarea
            id="mtn_info"
            rows={2}
            value={form.information}
            onChange={(e) => sf('information', e.target.value)}
            placeholder="Catatan servis..."
            className="input-premium resize-y"
            title="Informasi Tambahan"
          />
        </FF>
        <div className="modal-footer-border">
          <button className="btn" onClick={closeForm} disabled={saving} title="Batal">
            Batal
          </button>
          <button
            className="btn btn-primary min-w-130"
            onClick={save}
            disabled={saving}
            title={editRow ? 'Simpan Perubahan' : 'Tambah Layanan'}
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Menyimpan…
              </>
            ) : (
              <>
                <Save size={14} /> {editRow ? 'Simpan' : 'Tambah'}
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────
interface MaintenanceDeleteModalProps {
  deleteItem: { id: number; name: string } | null;
  deleting: boolean;
  onClose: () => void;
  executeDelete: () => void;
}

export function MaintenanceDeleteModal({
  deleteItem,
  deleting,
  onClose,
  executeDelete,
}: MaintenanceDeleteModalProps) {
  if (!deleteItem) return null;

  return (
    <ModalShell
      title=""
      onClose={() => !deleting && onClose()}
      size="sm"
      overlayClassName="modal-top-align"
      containerClassName="modal-top-content"
    >
      <div className="flex flex-col gap-3 text-center items-center py-2">
        <div className="w-12 h-12 bg-rose-light text-rose rounded-full flex items-center justify-center mb-1">
          <Trash2 size={24} />
        </div>
        <h3 className="text-md font-800 text-text">Hapus Data?</h3>
        <p className="text-sm text-text-2">
          Anda yakin ingin menghapus <b>{deleteItem.name}</b>?
        </p>
        <div className="flex gap-3 w-full mt-2">
          <button
            type="button"
            className="btn flex-1 justify-center py-2 cursor-pointer"
            onClick={onClose}
            disabled={deleting}
          >
            Batal
          </button>
          <button
            type="button"
            className="btn bg-rose text-white border-none flex-1 justify-center py-2 hover:opacity-90 cursor-pointer"
            onClick={executeDelete}
            disabled={deleting}
          >
            {deleting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> ...
              </>
            ) : (
              'Ya, Hapus'
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
