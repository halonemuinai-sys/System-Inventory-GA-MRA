import {
  Star, Phone, Mail, Loader2, BadgeCheck, FileText, Landmark, Edit2, Save
} from 'lucide-react';
import { Badge, ModalShell, FF, SLabel, SBox, InfoRow, FormError } from '@/components/PageShared';

// ── Types ─────────────────────────────────────────────────────
export interface Vendor {
  id: number;
  vendor_code: string;
  vendor_name: string;
  category: string;
  expense_category: string;
  pic_name: string;
  pic_position: string;
  phone: string;
  email: string;
  rating: number;
  status: string;
  contract_start: string;
  contract_end: string;
  contract_value: number;
  review_status: string;
}

export interface VendorDetail extends Vendor {
  vendor_category_id: number;
  expense_category_id: number;
  detail: string;
  division_id: number;
  division: string;
  partnership_company_id: number;
  partnership_company: string;
  address: string;
  npwp: string;
  bank_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  top_days: number;
  created_at: string;
  updated_at: string;
}

export interface Meta {
  categories:        { id: number; name: string }[];
  expenseCategories: { id: number; name: string }[];
  divisions:         { id: number; name: string }[];
  companies:         { id: number; name: string }[];
  banks:             { id: number; name: string }[];
}

export interface FormData {
  vendor_code: string; vendor_name: string;
  vendor_category_id: string; expense_category_id: string;
  detail: string; division_id: string; partnership_company_id: string;
  pic_name: string; pic_position: string; phone: string; email: string;
  address: string; npwp: string;
  bank_id: string; account_name: string; account_number: string;
  contract_start: string; contract_end: string;
  top_days: string; contract_value: string;
  review_status: string; rating: string; status: string;
}

export const STAT_CLS: Record<string, string> = {
  Active: 'badge-emerald', Inactive: 'badge-slate', 'Pending Evaluation': 'badge-amber',
};


// ── Star rating display ───────────────────────────────────────
export function Stars({ rating, size = 13, onClick }: { rating: number; size?: number; onClick?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n} size={size}
          fill={n <= rating ? '#f59e0b' : 'transparent'}
          color={n <= rating ? '#f59e0b' : '#cbd5e1'}
          className={onClick ? 'cursor-pointer' : 'cursor-default'}
          onClick={() => onClick?.(n)}
        />
      ))}
    </div>
  );
}

// ── Detail Modal ──────────────────────────────────────────────
interface VendorDetailModalProps {
  detailVendor: VendorDetail | null;
  detailLoading: boolean;
  onClose: () => void;
  openEdit: (id: number) => void;
  fmt: (v: number) => string;
  STAT_CLS: Record<string, string>;
}

export function VendorDetailModal({
  detailVendor,
  detailLoading,
  onClose,
  openEdit,
  fmt,
  STAT_CLS,
}: VendorDetailModalProps) {
  if (!detailVendor && !detailLoading) return null;

  // Custom detail row helper
  const CustomRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0 text-sm">
      <span className="text-[10px] font-700 text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="font-600 text-slate-700 text-right">{value || '—'}</span>
    </div>
  );

  return (
    <ModalShell
      title={detailVendor ? `Detail Vendor — ${detailVendor.vendor_code || detailVendor.vendor_name}` : 'Memuat…'}
      onClose={onClose}
      size="lg"
    >
      {detailLoading || !detailVendor ? (
        <div className="flex-center py-14">
          <Loader2 size={28} className="animate-spin text-blue" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Hero Header Card */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-blue-50/20 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-lg font-900 shadow-md shadow-blue-500/10 shrink-0">
                {detailVendor.vendor_name ? detailVendor.vendor_name.substring(0, 2).toUpperCase() : 'VN'}
              </div>
              <div>
                <h2 className="text-xl font-900 text-slate-800 leading-tight mb-1.5">{detailVendor.vendor_name}</h2>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <Badge label={detailVendor.status || '—'} colorClass={STAT_CLS[detailVendor.status] || 'badge-slate'} />
                  {detailVendor.category && <Badge label={detailVendor.category} colorClass="badge-indigo" />}
                  {detailVendor.review_status && <Badge label={detailVendor.review_status} colorClass="badge-amber" />}
                </div>
              </div>
            </div>
            
            {/* Quick Actions & Performance Rating */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {/* Rating Box */}
              <div className="flex flex-col items-start sm:items-end gap-1 p-2.5 bg-white border border-slate-100 rounded-xl shadow-xs min-w-110">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-700 text-slate-400 uppercase tracking-wider">Performance</span>
                  <Stars rating={detailVendor.rating || 0} size={11} />
                </div>
                <p className="text-[9px] text-slate-500 font-700">
                  Rating: {detailVendor.rating || 0} / 5
                </p>
              </div>

              {/* Action buttons at the top for easy access */}
              <div className="flex items-center gap-2">
                <button
                  className="btn flex items-center gap-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition-all duration-200 px-3.5 py-2 text-xs font-600 shadow-xs cursor-pointer"
                  onClick={() => {
                    onClose();
                    openEdit(detailVendor.id);
                  }}
                  title="Edit Vendor"
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
          </div>

          {/* Cards Grid Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Identitas Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <BadgeCheck size={15} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Identitas Vendor</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="Kode Vendor" value={<span className="font-mono text-xs-bold text-blue-600 bg-blue-50/60 px-2 py-0.5 rounded-md">{detailVendor.vendor_code || '—'}</span>} />
                <CustomRow label="Kategori" value={detailVendor.category} />
                <CustomRow label="Exp. Kategori" value={detailVendor.expense_category} />
                <CustomRow label="Divisi" value={detailVendor.division} />
                <CustomRow label="Perusahaan Mitra" value={detailVendor.partnership_company} />
                <CustomRow label="Deskripsi" value={<span className="text-slate-600 text-xs font-500 leading-normal italic">{detailVendor.detail || '—'}</span>} />
              </div>
            </div>

            {/* Kontak Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Phone size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Kontak & Alamat</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="PIC" value={detailVendor.pic_name} />
                <CustomRow label="Jabatan PIC" value={detailVendor.pic_position} />
                <CustomRow label="Telepon" value={detailVendor.phone ? <span className="font-semibold text-slate-800 flex items-center gap-1.5"><Phone size={12} className="text-slate-400" /> {detailVendor.phone}</span> : '—'} />
                <CustomRow label="Email" value={detailVendor.email ? <span className="font-semibold text-slate-800 flex items-center gap-1.5"><Mail size={12} className="text-slate-400" /> {detailVendor.email}</span> : '—'} />
                <CustomRow label="NPWP" value={detailVendor.npwp ? <span className="font-mono text-xs font-700 text-slate-600 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{detailVendor.npwp}</span> : '—'} />
                {detailVendor.address && (
                  <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-[9px] text-slate-400 font-800 uppercase tracking-wider mb-1">Alamat Kantor</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-500">{detailVendor.address}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cards Grid Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Kontrak Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <FileText size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Kontrak Kerjasama</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow 
                  label="Kontrak Mulai" 
                  value={detailVendor.contract_start ? new Date(detailVendor.contract_start).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} 
                />
                <CustomRow 
                  label="Kontrak Berakhir" 
                  value={detailVendor.contract_end ? new Date(detailVendor.contract_end).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} 
                />
                <CustomRow 
                  label="Nilai Kontrak" 
                  value={detailVendor.contract_value ? <span className="text-sm font-800 text-blue-600">Rp {fmt(detailVendor.contract_value)}</span> : '—'} 
                />
                <CustomRow 
                  label="TOP (hari)" 
                  value={detailVendor.top_days ? `${detailVendor.top_days} hari` : '—'} 
                />
              </div>
            </div>

            {/* Rekening Bank Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Landmark size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Rekening Bank</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="Bank" value={detailVendor.bank_name} />
                <CustomRow label="Nama Rekening" value={detailVendor.account_name} />
                <CustomRow 
                  label="No. Rekening" 
                  value={detailVendor.account_number ? <span className="font-mono text-xs font-700 text-slate-700 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">{detailVendor.account_number}</span> : '—'} 
                />
              </div>
            </div>
          </div>

          {/* Footer Timestamps */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-1 text-[10px] text-slate-400 font-600">
            <div>Dibuat: {detailVendor.created_at ? new Date(detailVendor.created_at).toLocaleString('id-ID') : '—'}</div>
            <div>Diperbarui: {detailVendor.updated_at ? new Date(detailVendor.updated_at).toLocaleString('id-ID') : '—'}</div>
          </div>

        </div>
      )}
    </ModalShell>
  );
}

// ── Form Modal ────────────────────────────────────────────────
interface VendorFormModalProps {
  showAdd: boolean;
  editVendor: VendorDetail | null;
  form: FormData;
  formError: string;
  saving: boolean;
  meta: Meta;
  closeForm: () => void;
  setField: (k: keyof FormData, v: string) => void;
  handleSave: () => void;
  fmtCurrency: (s: string) => string;
}

export function VendorFormModal({
  showAdd,
  editVendor,
  form,
  formError,
  saving,
  meta,
  closeForm,
  setField,
  handleSave,
  fmtCurrency,
}: VendorFormModalProps) {
  if (!showAdd && !editVendor) return null;

  return (
    <ModalShell
      title={editVendor ? `Edit Vendor — ${editVendor.vendor_name}` : 'Tambah Vendor Baru'}
      onClose={closeForm}
      size="lg"
      closeOnClickOutside={false}
    >
      <div className="flex flex-col gap-4">
        <FormError msg={formError} />

        <SLabel>Identitas Vendor</SLabel>
        <div className="detail-grid gap-2">
          <FF label="Nama Vendor" id="vnd_name" required>
            <input
              id="vnd_name"
              type="text"
              placeholder="PT / CV / nama usaha"
              value={form.vendor_name}
              onChange={(e) => setField('vendor_name', e.target.value)}
              className="input-premium"
              title="Nama Vendor"
            />
          </FF>
          <FF label="Kode Vendor" id="vnd_code">
            <input
              id="vnd_code"
              type="text"
              placeholder="Auto-generate jika kosong"
              value={form.vendor_code}
              onChange={(e) => setField('vendor_code', e.target.value)}
              className="input-premium"
              title="Kode Vendor"
            />
          </FF>
          <FF label="Kategori Vendor" id="vnd_cat">
            <select
              id="vnd_cat"
              value={form.vendor_category_id}
              onChange={(e) => setField('vendor_category_id', e.target.value)}
              className="input-premium"
              title="Pilih Kategori Vendor"
            >
              <option value="">— Pilih Kategori —</option>
              {meta.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Kategori Expense" id="vnd_exp">
            <select
              id="vnd_exp"
              value={form.expense_category_id}
              onChange={(e) => setField('expense_category_id', e.target.value)}
              className="input-premium"
              title="Pilih Kategori Expense"
            >
              <option value="">— Pilih Kategori —</option>
              {meta.expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Divisi" id="vnd_div">
            <select
              id="vnd_div"
              value={form.division_id}
              onChange={(e) => setField('division_id', e.target.value)}
              className="input-premium"
              title="Pilih Divisi"
            >
              <option value="">— Pilih Divisi —</option>
              {meta.divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Perusahaan Mitra" id="vnd_co">
            <select
              id="vnd_co"
              value={form.partnership_company_id}
              onChange={(e) => setField('partnership_company_id', e.target.value)}
              className="input-premium"
              title="Pilih Perusahaan Mitra"
            >
              <option value="">— Pilih Perusahaan —</option>
              {meta.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FF>
        </div>
        <FF label="Deskripsi / Detail" id="vnd_detail">
          <input
            id="vnd_detail"
            type="text"
            placeholder="Layanan utama yang disediakan..."
            value={form.detail}
            onChange={(e) => setField('detail', e.target.value)}
            className="input-premium"
            title="Deskripsi"
          />
        </FF>

        <SLabel>Kontak</SLabel>
        <div className="detail-grid gap-2">
          <FF label="Nama PIC" id="vnd_pic">
            <input
              id="vnd_pic"
              type="text"
              placeholder="Nama penanggung jawab"
              value={form.pic_name}
              onChange={(e) => setField('pic_name', e.target.value)}
              className="input-premium"
              title="PIC"
            />
          </FF>
          <FF label="Jabatan PIC" id="vnd_pos">
            <input
              id="vnd_pos"
              type="text"
              placeholder="Direktur / Sales Manager"
              value={form.pic_position}
              onChange={(e) => setField('pic_position', e.target.value)}
              className="input-premium"
              title="Jabatan PIC"
            />
          </FF>
          <FF label="Telepon" id="vnd_phone">
            <input
              id="vnd_phone"
              type="tel"
              placeholder="08xx-xxxx-xxxx"
              value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className="input-premium"
              title="Telepon"
            />
          </FF>
          <FF label="Email" id="vnd_email">
            <input
              id="vnd_email"
              type="email"
              placeholder="vendor@email.com"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
              className="input-premium"
              title="Email"
            />
          </FF>
          <FF label="NPWP" id="vnd_npwp">
            <input
              id="vnd_npwp"
              type="text"
              placeholder="xx.xxx.xxx.x-xxx.xxx"
              value={form.npwp}
              onChange={(e) => setField('npwp', e.target.value)}
              className="input-premium"
              title="NPWP"
            />
          </FF>
        </div>
        <FF label="Alamat" id="vnd_addr">
          <textarea
            id="vnd_addr"
            rows={2}
            placeholder="Alamat lengkap vendor..."
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            className="input-premium resize-y"
            title="Alamat Vendor"
          />
        </FF>

        <SLabel>Kontrak</SLabel>
        <div className="detail-grid gap-2 grid-cols-4">
          <FF label="Tgl. Mulai" id="vnd_start">
            <input
              id="vnd_start"
              type="date"
              value={form.contract_start}
              onChange={(e) => setField('contract_start', e.target.value)}
              className="input-premium"
              title="Tanggal Mulai Kontrak"
            />
          </FF>
          <FF label="Tgl. Berakhir" id="vnd_end">
            <input
              id="vnd_end"
              type="date"
              value={form.contract_end}
              onChange={(e) => setField('contract_end', e.target.value)}
              className="input-premium"
              title="Tanggal Berakhir Kontrak"
            />
          </FF>
          <FF label="Nilai Kontrak (Rp)" id="vnd_val">
            <input
              id="vnd_val"
              type="text"
              placeholder="0"
              value={fmtCurrency(form.contract_value)}
              onChange={(e) => setField('contract_value', e.target.value.replace(/\D/g, ''))}
              className="input-premium"
              title="Nilai Kontrak"
            />
          </FF>
          <FF label="TOP (hari)" id="vnd_top">
            <input
              id="vnd_top"
              type="number"
              placeholder="30"
              min={0}
              value={form.top_days}
              onChange={(e) => setField('top_days', e.target.value)}
              className="input-premium"
              title="TOP (hari)"
            />
          </FF>
        </div>

        <SLabel>Rekening Bank</SLabel>
        <div className="detail-grid gap-2 grid-cols-3">
          <FF label="Bank" id="vnd_bank">
            <select
              id="vnd_bank"
              value={form.bank_id}
              onChange={(e) => setField('bank_id', e.target.value)}
              className="input-premium"
              title="Pilih Bank"
            >
              <option value="">— Pilih Bank —</option>
              {meta.banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Nama Pemilik Rekening" id="vnd_acc_name">
            <input
              id="vnd_acc_name"
              type="text"
              placeholder="Sesuai rekening"
              value={form.account_name}
              onChange={(e) => setField('account_name', e.target.value)}
              className="input-premium"
              title="Pemilik Rekening"
            />
          </FF>
          <FF label="Nomor Rekening" id="vnd_acc_no">
            <input
              id="vnd_acc_no"
              type="text"
              placeholder="xxxx-xxxx-xxxx"
              value={form.account_number}
              onChange={(e) => setField('account_number', e.target.value)}
              className="input-premium"
              title="No. Rekening"
            />
          </FF>
        </div>

        <SLabel>Status & Penilaian</SLabel>
        <div className="detail-grid gap-2 grid-cols-3 items-start">
          <FF label="Status" id="vnd_status">
            <select
              id="vnd_status"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              className="input-premium"
              title="Status Vendor"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Pending Evaluation">Pending Evaluation</option>
            </select>
          </FF>
          <FF label="Review Status" id="vnd_rev">
            <input
              id="vnd_rev"
              type="text"
              placeholder="In Progress / Done / dll"
              value={form.review_status}
              onChange={(e) => setField('review_status', e.target.value)}
              className="input-premium"
              title="Review Status"
            />
          </FF>
          <FF label="Rating Performa">
            <div className="mt-1">
              <Stars rating={parseInt(form.rating) || 0} size={22} onClick={(n) => setField('rating', String(n))} />
              <p className="text-xxs text-text-3 mt-1">
                {form.rating ? `${form.rating} / 5` : 'Klik untuk memberi rating'}
              </p>
            </div>
          </FF>
        </div>

        <div className="modal-footer-border">
          <button className="btn" onClick={closeForm} disabled={saving} title="Batal">
            Batal
          </button>
          <button className="btn btn-primary min-w-130" onClick={handleSave} disabled={saving} title={editVendor ? 'Simpan Perubahan' : 'Tambah Vendor'}>
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Menyimpan…
              </>
            ) : (
              <>
                <Save size={14} /> {editVendor ? 'Simpan' : 'Tambah'}
              </>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
