import React from 'react';
import {
  FileText, Loader2, Save, Edit2, Link2, ExternalLink, Copy, Check, Calendar, Building2, MapPin, Clipboard
} from 'lucide-react';
import { Badge, ModalShell, FF, SLabel, FormError, SearchableSelect } from '@/components/PageShared';

// ── Types ─────────────────────────────────────────────────────
export interface LegalDocument {
  id: number;
  doc_number: string;
  doc_title: string;
  doc_type: string;
  doc_type_id: number;
  doc_subtype: string;
  counter_party: string;
  valid_from: string;
  valid_until: string;
  amount: number | string;
  status: string;
  auto_renewal: boolean;
  sto_status?: string;
}

export interface LegalDocumentDetail extends LegalDocument {
  division_id: number;
  division: string;
  mra_party_id: number;
  company: string;
  vendor_id: number;
  vendor_name: string;
  pic_internal: string;
  physical_location: string;
  digital_doc_url: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Meta {
  companies: { id: number; name: string }[];
  docTypes: { id: number; name: string }[];
  divisions: { id: number; name: string }[];
  vendors: { id: number; vendor_name: string; name?: string }[];
}

export interface FormData {
  doc_number: string;
  doc_title: string;
  doc_type_id: string;
  doc_subtype: string;
  division_id: string;
  mra_party_id: string;
  counter_party: string;
  vendor_id: string;
  pic_internal: string;
  valid_from: string;
  valid_until: string;
  physical_location: string;
  auto_renewal: string;
  digital_doc_url: string;
  amount: string;
  notes: string;
  status: string;
  sto_status: string;
}

// ── Helper ────────────────────────────────────────────────────
export function docStatus(validUntil: string) {
  if (!validUntil) return { label: 'Active', colorClass: 'badge-emerald', cls: 'text-emerald' };
  const d = new Date(validUntil);
  const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0) return { label: 'Expired', colorClass: 'badge-rose', cls: 'text-rose' };
  if (diff <= 30) return { label: 'Renewal', colorClass: 'badge-amber', cls: 'text-amber' };
  return { label: 'Active', colorClass: 'badge-emerald', cls: 'text-emerald' };
}

// ── Detail Modal ──────────────────────────────────────────────
interface DocumentDetailModalProps {
  detail: LegalDocumentDetail | null;
  dlLoading: boolean;
  onClose: () => void;
  openEdit: (id: number) => void;
  fmtDate: (d: string) => string;
  fmt: (v: number) => string;
}

export function DocumentDetailModal({
  detail,
  dlLoading,
  onClose,
  openEdit,
  fmtDate,
  fmt,
}: DocumentDetailModalProps) {
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    setCopied(false);
  }, [detail]);

  if (!detail && !dlLoading) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusInfo = detail ? docStatus(detail.valid_until) : null;

  // Custom detail row helper
  const CustomRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-100 last:border-b-0 text-sm">
      <span className="text-[10px] font-700 text-slate-400 uppercase tracking-wider">{label}</span>
      <span className="font-600 text-slate-700 text-right">{value || '—'}</span>
    </div>
  );

  return (
    <ModalShell
      title={detail ? `Dokumen — ${detail.doc_number}` : 'Memuat…'}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-50 to-blue-50/15 border border-slate-100 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-900 shadow-md shadow-blue-500/10 shrink-0">
                {detail.doc_title ? detail.doc_title.substring(0, 2).toUpperCase() : 'LD'}
              </div>
              <div>
                <h2 className="text-xl font-900 text-slate-800 leading-tight mb-1.5">{detail.doc_title || 'Untitled Document'}</h2>
                <div className="flex gap-1.5 flex-wrap items-center">
                  {statusInfo && <Badge label={statusInfo.label} colorClass={statusInfo.colorClass} />}
                  {detail.doc_type && <Badge label={detail.doc_type} colorClass="badge-indigo" />}
                  {detail.doc_subtype && <Badge label={detail.doc_subtype} colorClass="badge-violet" />}
                  {detail.auto_renewal && <Badge label="Auto Renewal" colorClass="badge-emerald" />}
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
                title="Edit Dokumen"
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
            {/* Identitas Dokumen Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <FileText size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Identitas Dokumen</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="No. Dokumen" value={<span className="font-mono text-xs-bold text-blue-600 bg-blue-50/60 px-2 py-0.5 rounded-md">{detail.doc_number}</span>} />
                <CustomRow label="Tipe Dokumen" value={detail.doc_type} />
                <CustomRow label="Pihak MRA" value={detail.company} />
                <CustomRow label="Divisi" value={detail.division} />
                <CustomRow label="PIC Internal" value={detail.pic_internal} />
                <CustomRow 
                  label="Lokasi Fisik Arsip" 
                  value={detail.physical_location ? <span className="flex items-center gap-1"><MapPin size={11} className="text-slate-400" /> {detail.physical_location}</span> : '—'} 
                />
              </div>
            </div>

            {/* Pihak Lawan & Kontrak Card */}
            <div className="bg-white border border-slate-200/50 rounded-2xl shadow-xs overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50/50 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                  <Building2 size={14} />
                </div>
                <span className="text-[11px] font-800 text-slate-700 uppercase tracking-wider">Pihak Lawan & Kontrak</span>
              </div>
              <div className="p-4 flex flex-col gap-0.5 flex-1">
                <CustomRow label="Counter Party" value={detail.counter_party} />
                <CustomRow label="Vendor Terkait" value={detail.vendor_name} />
                <CustomRow label="Mulai Berlaku" value={fmtDate(detail.valid_from)} />
                <CustomRow 
                  label="Masa Berakhir" 
                  value={
                    statusInfo ? (
                      <span className={`font-700 ${statusInfo.cls}`}>
                        {fmtDate(detail.valid_until)}
                      </span>
                    ) : '—'
                  } 
                />
                <CustomRow 
                  label="Nilai Kontrak" 
                  value={detail.amount ? <span className="text-sm font-800 text-blue-600">Rp {fmt(parseFloat(String(detail.amount)))}</span> : '—'} 
                />
                <CustomRow label="STO Status" value={detail.sto_status} />
              </div>
            </div>
          </div>

          {/* digital doc url / attachment */}
          {detail.digital_doc_url && (
            <div className="info-card flex items-center justify-between gap-4 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
              <div className="min-w-0 flex-1">
                <p className="text-xs-bold text-text-2 mb-1 flex items-center gap-1">
                  <Link2 size={12} className="text-text-3" /> Dokumen Digital / Lampiran
                </p>
                <a
                  href={detail.digital_doc_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue hover:underline break-all flex items-center gap-1 font-600"
                >
                  <ExternalLink size={13} className="shrink-0" />
                  {detail.digital_doc_url}
                </a>
              </div>
              <button
                onClick={() => handleCopy(detail.digital_doc_url)}
                className="btn py-1.5 px-3 text-xs shrink-0 flex items-center gap-1.5 border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Salin Link"
              >
                {copied ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          )}

          {/* Notes / Catatan */}
          {detail.notes && (
            <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
              <p className="text-[9px] text-slate-400 font-800 uppercase tracking-wider mb-1.5">Catatan / Keterangan Dokumen</p>
              <p className="text-xs text-slate-600 leading-relaxed font-500 italic">{detail.notes}</p>
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

// ── Form Modal ────────────────────────────────────────────────
interface DocumentFormModalProps {
  showAdd: boolean;
  editRow: LegalDocumentDetail | null;
  form: FormData;
  formErr: string;
  saving: boolean;
  meta: Meta;
  closeForm: () => void;
  sf: (k: keyof FormData, v: string) => void;
  save: () => void;
  fmtCurrency: (s: string) => string;
}

export function DocumentFormModal({
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
}: DocumentFormModalProps) {
  if (!showAdd && !editRow) return null;

  return (
    <ModalShell
      title={editRow ? 'Edit Dokumen Legal' : 'Tambah Dokumen'}
      onClose={closeForm}
      size="lg"
      closeOnClickOutside={false}
    >
      <div className="flex flex-col gap-4">
        <FormError msg={formErr} />
        <SLabel>Identitas Dokumen</SLabel>
        <div className="detail-grid gap-2">
          <FF label="Nomor Dokumen" id="doc_number" required>
            <input
              id="doc_number"
              type="text"
              value={form.doc_number}
              onChange={(e) => sf('doc_number', e.target.value)}
              placeholder="PKS/2026/001"
              className="input-premium"
              title="Nomor Dokumen"
            />
          </FF>
          <FF label="Judul Dokumen" id="doc_title">
            <input
              id="doc_title"
              type="text"
              value={form.doc_title}
              onChange={(e) => sf('doc_title', e.target.value)}
              placeholder="Judul Dokumen"
              className="input-premium"
              title="Judul Dokumen"
            />
          </FF>
          <FF label="Tipe Dokumen" id="doc_type">
            <select
              id="doc_type"
              value={form.doc_type_id}
              onChange={(e) => sf('doc_type_id', e.target.value)}
              className="input-premium"
              title="Pilih Tipe"
            >
              <option value="">— Pilih —</option>
              {meta.docTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Sub-tipe" id="doc_subtype">
            <select
              id="doc_subtype"
              value={form.doc_subtype}
              onChange={(e) => sf('doc_subtype', e.target.value)}
              className="input-premium"
              title="Pilih Sub-tipe"
            >
              <option value="agreement">Agreement</option>
              <option value="ba_sale">BA Penjualan</option>
            </select>
          </FF>
          <FF label="Pihak MRA" id="mra_party">
            <select
              id="mra_party"
              value={form.mra_party_id}
              onChange={(e) => sf('mra_party_id', e.target.value)}
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
          <FF label="Divisi" id="division">
            <select
              id="division"
              value={form.division_id}
              onChange={(e) => sf('division_id', e.target.value)}
              className="input-premium"
              title="Pilih Divisi"
            >
              <option value="">— Pilih —</option>
              {meta.divisions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Counter Party / Pihak Lawan" id="counter_party">
            <input
              id="counter_party"
              type="text"
              value={form.counter_party}
              onChange={(e) => sf('counter_party', e.target.value)}
              placeholder="Nama Pihak Lawan"
              className="input-premium"
              title="Pihak Lawan"
            />
          </FF>
          <FF label="Vendor Terkait" id="vendor">
            <SearchableSelect
              id="vendor"
              value={form.vendor_id}
              onChange={(v) => sf('vendor_id', v)}
              options={meta.vendors.map((v) => ({ id: v.id, name: v.vendor_name || v.name || '' }))}
              placeholder="— Tidak ada —"
            />
          </FF>
          <FF label="PIC Internal" id="pic_internal">
            <input
              id="pic_internal"
              type="text"
              value={form.pic_internal}
              onChange={(e) => sf('pic_internal', e.target.value)}
              placeholder="Nama PIC"
              className="input-premium"
              title="PIC Internal"
            />
          </FF>
          <FF label="Lokasi Fisik Arsip" id="phys_loc">
            <input
              id="phys_loc"
              type="text"
              value={form.physical_location}
              onChange={(e) => sf('physical_location', e.target.value)}
              placeholder="Gedung / Lantai / Box"
              className="input-premium"
              title="Lokasi Fisik"
            />
          </FF>
          <FF label="Berlaku Mulai" id="v_from">
            <input
              id="v_from"
              type="date"
              value={form.valid_from}
              onChange={(e) => sf('valid_from', e.target.value)}
              className="input-premium"
              title="Mulai Berlaku"
            />
          </FF>
          <FF label="Berakhir" id="v_until">
            <input
              id="v_until"
              type="date"
              value={form.valid_until}
              onChange={(e) => sf('valid_until', e.target.value)}
              className="input-premium"
              title="Berakhir"
            />
          </FF>
          <FF label="Nilai Kontrak (Rp)" id="amount">
            <input
              id="amount"
              type="text"
              value={fmtCurrency(form.amount)}
              onChange={(e) => sf('amount', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="input-premium"
              title="Nilai Kontrak"
            />
          </FF>
          <FF label="Auto Renewal" id="auto_r">
            <select
              id="auto_r"
              value={form.auto_renewal}
              onChange={(e) => sf('auto_renewal', e.target.value)}
              className="input-premium"
              title="Auto Renewal"
            >
              <option value="false">Tidak</option>
              <option value="true">Ya</option>
            </select>
          </FF>
          <FF label="Status" id="status">
            <select
              id="status"
              value={form.status}
              onChange={(e) => sf('status', e.target.value)}
              className="input-premium"
              title="Status"
            >
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
            </select>
          </FF>
          <FF label="STO Status" id="sto">
            <input
              id="sto"
              type="text"
              value={form.sto_status}
              onChange={(e) => sf('sto_status', e.target.value)}
              placeholder="STO Status"
              className="input-premium"
              title="STO Status"
            />
          </FF>
        </div>
        <FF label="Link Dokumen Digital (URL)" id="dig_url">
          <input
            id="dig_url"
            type="url"
            value={form.digital_doc_url}
            onChange={(e) => sf('digital_doc_url', e.target.value)}
            placeholder="https://..."
            className="input-premium"
            title="Link Dokumen Digital"
          />
        </FF>
        <FF label="Catatan" id="notes">
          <textarea
            id="notes"
            rows={2}
            value={form.notes}
            onChange={(e) => sf('notes', e.target.value)}
            placeholder="Catatan tambahan..."
            className="input-premium resize-y"
            title="Catatan"
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
            title={editRow ? 'Simpan Perubahan' : 'Tambah Dokumen'}
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
