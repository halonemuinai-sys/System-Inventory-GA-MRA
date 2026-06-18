import React from 'react';
import { Truck, Calendar, Loader2, Save, Trash2, Edit2 } from 'lucide-react';
import { ModalShell, Badge, SBox, InfoRow, FormError, SLabel, FF } from './PageShared';

const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';

interface VehicleDetailModalProps {
  detail: any;
  dlLoading: boolean;
  onClose: () => void;
  onEdit: (id: number) => void;
  STAT_C: Record<string, string>;
}

export function VehicleDetailModal({ detail, dlLoading, onClose, onEdit, STAT_C }: VehicleDetailModalProps) {
  if (!detail && !dlLoading) return null;
  return (
    <ModalShell title={detail ? `Kendaraan — ${detail.plate_number}` : 'Memuat…'} onClose={onClose} size="md">
      {dlLoading || !detail ? (
        <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4 justify-between">
            <div>
              <h2 className="text-lg-black">{detail.brand_model || '—'}</h2>
              <p className="text-xs-muted mt-1">{detail.vehicle_type || ''} · {detail.color || ''} · {detail.year || ''}</p>
            </div>
            <Badge label={detail.status || '—'} colorClass={STAT_C[detail.status] || STAT_C.default}/>
          </div>
          <div className="detail-grid">
            <SBox icon={<Truck size={14}/>} title="Identitas">
              <InfoRow label="Plat Nomor" value={<span className="plate-badge">{detail.plate_number}</span>}/>
              <InfoRow label="Nomor Rangka" value={detail.chassis_number}/>
              <InfoRow label="Merek/Model" value={detail.brand_model}/>
              <InfoRow label="Perusahaan" value={detail.company}/>
            </SBox>
            <SBox icon={<Calendar size={14}/>} title="Operasional">
              <InfoRow label="Driver" value={detail.driver_name}/>
              <InfoRow label="Departemen" value={detail.department}/>
              <InfoRow label="Amount" value={detail.last_km ? `Rp ${fmt(detail.last_km)}` : null}/>
              <InfoRow label="Servis Terakhir" value={fmtDate(detail.last_service_date)}/>
              <InfoRow label="Pajak s/d" value={
                <span className={detail.tax_date && new Date(detail.tax_date) < new Date() ? 'text-rose font-700' : 'text-text'}>
                  {fmtDate(detail.tax_date)}
                </span>
              }/>
            </SBox>
          </div>
          {detail.information && (
            <div className="info-card">
              <p className="text-xs-bold mb-1">Informasi</p>
              <p className="text-sm-muted lh-1-6">{detail.information}</p>
            </div>
          )}
          <div className="modal-footer-actions">
            <button className="btn" onClick={() => onEdit(detail.id)} title="Edit Data Kendaraan">
              <Edit2 size={14}/> Edit
            </button>
            <button className="btn btn-primary" onClick={onClose} title="Tutup Modal">Tutup</button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}

interface VehicleFormModalProps {
  isOpen: boolean;
  editRow: any;
  form: any;
  formErr: string;
  saving: boolean;
  companies: any[];
  onClose: () => void;
  onSave: () => void;
  onChange: (key: string, val: string) => void;
  fmtCurrency: (s: string) => string;
}

export function VehicleFormModal({
  isOpen, editRow, form, formErr, saving, companies, onClose, onSave, onChange, fmtCurrency
}: VehicleFormModalProps) {
  if (!isOpen) return null;
  return (
    <ModalShell title={editRow ? `Edit — ${editRow.plate_number}` : 'Tambah Kendaraan'} onClose={onClose} size="md" closeOnClickOutside={false}>
      <div className="flex flex-col gap-4">
        <FormError msg={formErr}/>
        <SLabel>Identitas Kendaraan</SLabel>
        <div className="detail-grid">
          <FF label="Perusahaan" id="veh_co" required>
            <select id="veh_co" value={form.company_id} onChange={e => onChange('company_id', e.target.value)} className="input-premium" title="Pilih Perusahaan">
              <option value="">— Pilih —</option>
              {companies.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FF>
          <FF label="Plat Nomor" id="veh_plate" required>
            <input id="veh_plate" type="text" value={form.plate_number} onChange={e => onChange('plate_number', e.target.value)} placeholder="B 1234 ABC" className="input-premium" title="Plat Nomor"/>
          </FF>
          <FF label="Nomor Rangka" id="veh_chassis">
            <input id="veh_chassis" type="text" value={form.chassis_number} onChange={e => onChange('chassis_number', e.target.value)} placeholder="Nomor Rangka" className="input-premium" title="Nomor Rangka"/>
          </FF>
          <FF label="Tipe Kendaraan" id="veh_type">
            <input id="veh_type" type="text" value={form.vehicle_type} onChange={e => onChange('vehicle_type', e.target.value)} placeholder="Minibus / Motor / Box" className="input-premium" title="Tipe Kendaraan"/>
          </FF>
          <FF label="Merek / Model" id="veh_model">
            <input id="veh_model" type="text" value={form.brand_model} onChange={e => onChange('brand_model', e.target.value)} placeholder="Toyota Innova 2023" className="input-premium" title="Merek / Model"/>
          </FF>
          <FF label="Tahun" id="veh_year">
            <input id="veh_year" type="number" value={form.year} onChange={e => onChange('year', e.target.value)} min={1990} max={2030} placeholder="Tahun" className="input-premium" title="Tahun"/>
          </FF>
          <FF label="Warna" id="veh_color">
            <input id="veh_color" type="text" value={form.color} onChange={e => onChange('color', e.target.value)} placeholder="Warna" className="input-premium" title="Warna"/>
          </FF>
          <FF label="Driver" id="veh_driver">
            <input id="veh_driver" type="text" value={form.driver_name} onChange={e => onChange('driver_name', e.target.value)} placeholder="Nama Driver" className="input-premium" title="Driver"/>
          </FF>
          <FF label="Departemen" id="veh_dept">
            <input id="veh_dept" type="text" value={form.department} onChange={e => onChange('department', e.target.value)} placeholder="Nama Departemen" className="input-premium" title="Departemen"/>
          </FF>
          <FF label="Tanggal Pajak" id="veh_tax">
            <input id="veh_tax" type="date" value={form.tax_date} onChange={e => onChange('tax_date', e.target.value)} className="input-premium" title="Tanggal Pajak"/>
          </FF>
          <FF label="Amount" id="veh_km">
            <input id="veh_km" type="text" value={fmtCurrency(form.last_km)} onChange={e => onChange('last_km', e.target.value.replace(/\D/g, ''))} placeholder="0" className="input-premium" title="Amount"/>
          </FF>
          <FF label="Tgl Servis Terakhir" id="veh_service">
            <input id="veh_service" type="date" value={form.last_service_date} onChange={e => onChange('last_service_date', e.target.value)} className="input-premium" title="Tgl Servis Terakhir"/>
          </FF>
          <FF label="Status" id="veh_status">
            <select id="veh_status" value={form.status} onChange={e => onChange('status', e.target.value)} className="input-premium" title="Status">
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
              <option value="Rusak">Rusak</option>
            </select>
          </FF>
        </div>
        <FF label="Informasi Tambahan" id="veh_info">
          <textarea id="veh_info" rows={2} value={form.information} onChange={e => onChange('information', e.target.value)} placeholder="Catatan tambahan..." className="input-premium resize-y" title="Informasi Tambahan"/>
        </FF>
        <div className="modal-footer-border">
          <button className="btn" onClick={onClose} disabled={saving} title="Batal">Batal</button>
          <button className="btn btn-primary min-w-130" onClick={onSave} disabled={saving} title={editRow ? 'Simpan Perubahan' : 'Tambah Kendaraan'}>
            {saving ? <><Loader2 size={14} className="animate-spin"/> Menyimpan…</> : <><Save size={14}/> {editRow ? 'Simpan' : 'Tambah'}</>}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

interface VehicleDeleteModalProps {
  deleteItem: { id: number; name: string } | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function VehicleDeleteModal({ deleteItem, deleting, onClose, onConfirm }: VehicleDeleteModalProps) {
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
        <h3 className="text-md font-800 text-text">Hapus Kendaraan?</h3>
        <p className="text-sm text-text-2">
          Anda yakin ingin menghapus <b>{deleteItem.name}</b>?
        </p>
        <div className="flex gap-3 w-full mt-2">
          <button 
            type="button" 
            className="btn flex-1 justify-center py-2" 
            onClick={onClose}
            disabled={deleting}
          >
            Batal
          </button>
          <button 
            type="button" 
            className="btn bg-rose text-white border-none flex-1 justify-center py-2 hover:opacity-90" 
            onClick={onConfirm}
            disabled={deleting}
          >
            {deleting ? <><Loader2 size={16} className="animate-spin" /> ...</> : 'Ya, Hapus'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}
