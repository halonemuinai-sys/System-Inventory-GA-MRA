import { Edit2, Loader2, Save, ShieldCheck } from 'lucide-react';
import { Badge, ModalShell, FF, SLabel, SBox, InfoRow, FormError } from '@/components/PageShared';

interface InsuranceDetailModalProps {
  detail: any;
  dlLoading: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
  fmtDate: (d: string) => string;
  fmt: (v: number) => string;
  insStatus: (endDate: string) => { label: string; colorClass: string; cls: string };
}

export function InsuranceDetailModal({
  detail,
  dlLoading,
  onClose,
  onEdit,
  fmtDate,
  fmt,
  insStatus,
}: InsuranceDetailModalProps) {
  if (!detail && !dlLoading) return null;

  return (
    <ModalShell
      title={detail ? `Polis — ${detail.policy_number || detail.insurance_company}` : 'Memuat…'}
      onClose={onClose}
      size="md"
    >
      {dlLoading || !detail ? (
        <div className="flex-center py-12">
          <Loader2 size={28} className="animate-spin text-blue" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-lg-black">{detail.insurance_company || '—'}</h2>
              <p className="text-xs-muted mt-1">
                {detail.insurance_type || ''} {detail.category ? `· ${detail.category}` : ''}
              </p>
            </div>
            <Badge
              label={insStatus(detail.end_date).label}
              colorClass={insStatus(detail.end_date).colorClass}
            />
          </div>
          <div className="detail-grid">
            <SBox icon={<ShieldCheck size={14} />} title="Polis">
              <InfoRow label="No. Polis" value={detail.policy_number} />
              <InfoRow label="Tipe" value={detail.insurance_type} />
              <InfoRow label="Kategori" value={detail.category} />
              <InfoRow label="Perusahaan" value={detail.company} />
              <InfoRow label="Broker" value={detail.broker} />
            </SBox>
            <SBox title="Keuangan">
              <InfoRow label="Mulai" value={fmtDate(detail.start_date)} />
              <InfoRow label="Berakhir" value={fmtDate(detail.end_date)} />
              <InfoRow label="Premi (IDR)" value={`Rp ${fmt(parseFloat(String(detail.premium_idr || 0)))}`} />
              <InfoRow
                label="Coverage (IDR)"
                value={detail.coverage_idr ? `Rp ${fmt(parseFloat(String(detail.coverage_idr)))}` : null}
              />
            </SBox>
          </div>
          <SBox title="Aset & Kontak">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <p className="text-xs-muted-bold">Kendaraan</p>
                <p className="text-sm-bold text-text">{detail.plate_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs-muted-bold">Tipe</p>
                <p className="text-sm-bold text-text">{detail.vehicle_type || '—'}</p>
              </div>
              <div>
                <p className="text-xs-muted-bold">PIC</p>
                <p className="text-sm-bold text-text">{detail.pic || '—'}</p>
              </div>
            </div>
          </SBox>
          {detail.information && (
            <div className="info-card">
              <p className="text-xs-bold mb-1">Informasi</p>
              <p className="text-sm-muted lh-1-6">{detail.information}</p>
            </div>
          )}
          <div className="modal-footer-actions">
            <button
              className="btn"
              onClick={() => {
                onClose();
                onEdit(detail.id);
              }}
              title="Edit Polis"
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

interface InsuranceFormModalProps {
  showAdd: boolean;
  editRow: any;
  form: any;
  formErr: string;
  saving: boolean;
  meta: { companies: any[]; vehicles: any[] };
  closeForm: () => void;
  sf: (k: string, v: string) => void;
  save: () => void;
  fmtCurrency: (s: string) => string;
}

export function InsuranceFormModal({
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
}: InsuranceFormModalProps) {
  if (!showAdd && !editRow) return null;

  return (
    <ModalShell
      title={editRow ? `Edit Polis` : 'Tambah Polis Asuransi'}
      onClose={closeForm}
      size="md"
      closeOnClickOutside={false}
    >
      <div className="flex flex-col gap-4">
        <FormError msg={formErr} />
        <SLabel>Informasi Polis</SLabel>
        <div className="detail-grid">
          <FF label="Perusahaan MRA" id="ins_mra_co" required>
            <select
              id="ins_mra_co"
              value={form.company_id}
              onChange={(e) => sf('company_id', e.target.value)}
              className="input-premium"
              title="Pilih Perusahaan"
            >
              <option value="">— Pilih —</option>
              {meta.companies.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Perusahaan Asuransi" id="ins_ins_co">
            <input
              id="ins_ins_co"
              type="text"
              value={form.insurance_company}
              onChange={(e) => sf('insurance_company', e.target.value)}
              placeholder="PT Asuransi..."
              className="input-premium"
              title="Perusahaan Asuransi"
            />
          </FF>
          <FF label="Tipe Asuransi" id="ins_type">
            <input
              id="ins_type"
              type="text"
              value={form.insurance_type}
              onChange={(e) => sf('insurance_type', e.target.value)}
              placeholder="Vehicle / Building / dll"
              className="input-premium"
              title="Tipe Asuransi"
            />
          </FF>
          <FF label="Kategori" id="ins_cat">
            <input
              id="ins_cat"
              type="text"
              value={form.category}
              onChange={(e) => sf('category', e.target.value)}
              placeholder="Comprehensive / TLO"
              className="input-premium"
              title="Kategori"
            />
          </FF>
          <FF label="Nomor Polis" id="ins_no">
            <input
              id="ins_no"
              type="text"
              value={form.policy_number}
              onChange={(e) => sf('policy_number', e.target.value)}
              placeholder="Polis Number"
              className="input-premium"
              title="Nomor Polis"
            />
          </FF>
          <FF label="Kendaraan Terkait" id="ins_veh">
            <select
              id="ins_veh"
              value={form.vehicle_id}
              onChange={(e) => sf('vehicle_id', e.target.value)}
              className="input-premium"
              title="Pilih Kendaraan"
            >
              <option value="">— Tidak ada —</option>
              {meta.vehicles.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.plate_number} {v.brand_model ? `(${v.brand_model})` : ''}
                </option>
              ))}
            </select>
          </FF>
          <FF label="Mulai Berlaku" id="ins_start">
            <input
              id="ins_start"
              type="date"
              value={form.start_date}
              onChange={(e) => sf('start_date', e.target.value)}
              className="input-premium"
              title="Mulai Berlaku"
            />
          </FF>
          <FF label="Berakhir" id="ins_end">
            <input
              id="ins_end"
              type="date"
              value={form.end_date}
              onChange={(e) => sf('end_date', e.target.value)}
              className="input-premium"
              title="Berakhir"
            />
          </FF>
          <FF label="Premi Tahunan (Rp)" id="ins_prem">
            <input
              id="ins_prem"
              type="text"
              value={fmtCurrency(form.premium_idr)}
              onChange={(e) => sf('premium_idr', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="input-premium"
              title="Premi Tahunan"
            />
          </FF>
          <FF label="Coverage IDR" id="ins_cov">
            <input
              id="ins_cov"
              type="text"
              value={fmtCurrency(form.coverage_idr)}
              onChange={(e) => sf('coverage_idr', e.target.value.replace(/\D/g, ''))}
              placeholder="0"
              className="input-premium"
              title="Coverage"
            />
          </FF>
          <FF label="Broker" id="ins_brok">
            <input
              id="ins_brok"
              type="text"
              value={form.broker}
              onChange={(e) => sf('broker', e.target.value)}
              placeholder="Broker Name"
              className="input-premium"
              title="Broker"
            />
          </FF>
          <FF label="PIC / Agent" id="ins_pic">
            <input
              id="ins_pic"
              type="text"
              value={form.pic}
              onChange={(e) => sf('pic', e.target.value)}
              placeholder="PIC / Agent"
              className="input-premium"
              title="PIC / Agent"
            />
          </FF>
        </div>
        <FF label="Informasi Tambahan" id="ins_info">
          <textarea
            id="ins_info"
            rows={2}
            value={form.information}
            onChange={(e) => sf('information', e.target.value)}
            placeholder="Catatan tambahan..."
            className="input-premium resize-y"
            title="Informasi Tambahan"
          />
        </FF>
        <div className="modal-footer-border">
          <button className="btn" onClick={closeForm} disabled={saving} title="Batal">
            Batal
          </button>
          <button className="btn btn-primary min-w-130" onClick={save} disabled={saving} title={editRow ? 'Simpan Perubahan' : 'Tambah Polis'}>
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
