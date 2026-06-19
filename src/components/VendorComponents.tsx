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
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg-black mb-2">{detailVendor.vendor_name}</h2>
              <div className="flex gap-2 flex-wrap items-center">
                <Badge label={detailVendor.status || '—'} colorClass={STAT_CLS[detailVendor.status] || 'badge-slate'} />
                {detailVendor.category && <Badge label={detailVendor.category} colorClass="badge-indigo" />}
                {detailVendor.review_status && <Badge label={detailVendor.review_status} colorClass="badge-amber" />}
              </div>
            </div>
            <div className="text-right shrink-0">
              <Stars rating={detailVendor.rating || 0} size={18} />
              <p className="text-xxs text-text-3 mt-1">Performance Rating</p>
            </div>
          </div>

          <div className="detail-grid gap-3">
            <SBox icon={<BadgeCheck size={14} />} title="Identitas">
              <InfoRow label="Kode" value={detailVendor.vendor_code} />
              <InfoRow label="Kategori" value={detailVendor.category} />
              <InfoRow label="Exp. Kategori" value={detailVendor.expense_category} />
              <InfoRow label="Divisi" value={detailVendor.division} />
              <InfoRow label="Perusahaan Mitra" value={detailVendor.partnership_company} />
              <InfoRow label="Deskripsi" value={detailVendor.detail} />
            </SBox>

            <SBox icon={<Phone size={14} />} title="Kontak">
              <InfoRow label="PIC" value={detailVendor.pic_name} />
              <InfoRow label="Jabatan" value={detailVendor.pic_position} />
              <InfoRow label="Telepon" value={detailVendor.phone} />
              <InfoRow label="Email" value={detailVendor.email} />
              <InfoRow label="NPWP" value={detailVendor.npwp} />
              {detailVendor.address && (
                <div className="mt-1">
                  <p className="text-xs-bold mb-1">Alamat</p>
                  <p className="text-sm-muted lh-1-6">{detailVendor.address}</p>
                </div>
              )}
            </SBox>
          </div>

          <div className="detail-grid gap-3">
            <SBox icon={<FileText size={14} />} title="Kontrak">
              <InfoRow
                label="Mulai"
                value={
                  detailVendor.contract_start
                    ? new Date(detailVendor.contract_start).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'
                }
              />
              <InfoRow
                label="Berakhir"
                value={
                  detailVendor.contract_end
                    ? new Date(detailVendor.contract_end).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'
                }
              />
              <InfoRow label="Nilai Kontrak" value={detailVendor.contract_value ? `Rp ${fmt(detailVendor.contract_value)}` : '—'} />
              <InfoRow label="TOP (hari)" value={detailVendor.top_days} />
            </SBox>

            <SBox icon={<Landmark size={14} />} title="Rekening Bank">
              <InfoRow label="Bank" value={detailVendor.bank_name} />
              <InfoRow label="Nama Rekening" value={detailVendor.account_name} />
              <InfoRow
                label="No. Rekening"
                value={detailVendor.account_number ? <span className="font-mono">{detailVendor.account_number}</span> : '—'}
              />
            </SBox>
          </div>

          <div className="modal-footer-info">
            {[
              ['Dibuat', detailVendor.created_at],
              ['Diperbarui', detailVendor.updated_at],
            ].map(([k, v]) => (
              <div key={k} className="text-xxs">
                <span className="text-text-3">{k}: </span>
                <span className="text-text-2 font-500">{v ? new Date(v as string).toLocaleString('id-ID') : '—'}</span>
              </div>
            ))}
          </div>

          <div className="modal-footer-actions">
            <button
              className="btn"
              onClick={() => {
                onClose();
                openEdit(detailVendor.id);
              }}
              title="Edit Vendor"
            >
              <Edit2 size={14} /> Edit
            </button>
            <button className="btn btn-primary" onClick={onClose} title="Tutup Modal">
              Tutup
            </button>
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
