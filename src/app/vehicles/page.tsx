'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Save, Truck, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { 
  Badge, ModalShell, FF, SLabel, PaginationBar, 
  TableShell, InfoRow, SBox, FormError, iStyle 
} from '@/components/PageShared';

const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const STAT_C: Record<string,string> = { Aktif:'badge-emerald', Active:'badge-emerald', 'Tidak Aktif':'badge-slate', default:'badge-amber' };
const EMPTY = { 
  company_id:'', plate_number:'', chassis_number:'', vehicle_type:'', 
  brand_model:'', year:'', color:'', driver_name:'', department:'', 
  tax_date:'', last_km:'', last_service_date:'', status:'Aktif', information:'' 
};

export default function VehiclesPage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [companies, setCompanies]   = useState<any[]>([]);
  const [detail, setDetail]         = useState<any>(null);
  const [dlLoading, setDlLoading]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [editRow, setEditRow]       = useState<any>(null);
  const [form, setForm]             = useState<any>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');
  
  const [deleteItem, setDeleteItem] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    fetch('/api/assets/meta').then(r=>r.json()).then(d => setCompanies(d.companies||[])).catch(()=>{});
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ page:String(p), limit:String(LIMIT), ...(search&&{search}) });
      const res = await fetch(`/api/vehicles?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const openDetail = async (id:number) => { 
    setDlLoading(true); setDetail(null); 
    const r = await fetch(`/api/vehicles/${id}`); 
    setDetail(await r.json()); 
    setDlLoading(false); 
  };

  const openEdit = async (id:number) => { 
    const r = await fetch(`/api/vehicles/${id}`); 
    const d = await r.json(); 
    setEditRow(d); 
    setForm({ 
      company_id:String(d.company_id||''), 
      plate_number:d.plate_number||'', 
      chassis_number:d.chassis_number||'', 
      vehicle_type:d.vehicle_type||'', 
      brand_model:d.brand_model||'', 
      year:String(d.year||''), 
      color:d.color||'', 
      driver_name:d.driver_name||'', 
      department:d.department||'', 
      tax_date:d.tax_date?d.tax_date.split('T')[0]:'', 
      last_km:String(d.last_km||''), 
      last_service_date:d.last_service_date?d.last_service_date.split('T')[0]:'', 
      status:d.status||'Aktif', 
      information:d.information||'' 
    }); 
    setFormErr(''); 
  };

  const confirmDelete = (item: { id: number; name: string }) => {
    setDeleteItem(item);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/vehicles/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== deleteItem.id));
      setDeleteItem(null);
    } catch { 
      alert('Gagal menghapus kendaraan'); 
    } finally {
      setDeleting(false);
    }
  };

  const openAdd    = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm  = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf         = (k:string,v:string) => setForm((f:any) => ({...f,[k]:v}));

  const save = async () => {
    if (!form.plate_number.trim()) { setFormErr('Nomor plat wajib diisi'); return; }
    if (!form.company_id)          { setFormErr('Perusahaan wajib dipilih'); return; }
    setSaving(true);
    try {
      const url = editRow ? `/api/vehicles/${editRow.id}` : '/api/vehicles';
      const res = await fetch(url, { 
        method: editRow?'PUT':'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          ...form, 
          company_id:parseInt(form.company_id)||null, 
          year:parseInt(form.year)||null, 
          last_km:parseInt(form.last_km)||null 
        }) 
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Gagal menyimpan'); }
      closeForm(); load(page);
    } catch(e:any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div><h1 className="header-title">Vehicle Management</h1><p className="header-subtitle">Pantau armada, driver, dan status kendaraan MRA Group.</p></div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Kendaraan Baru"><Plus size={16}/> Tambah Kendaraan</button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input 
            id="veh_search"
            type="text" 
            placeholder="Cari plat, model, driver..." 
            value={search} 
            onChange={e=>{setSearch(e.target.value);setPage(1);}} 
            className="input-premium w-full pl-9" 
            title="Cari Kendaraan"
            aria-label="Cari kendaraan operasional"
          />
        </div>
        <div className="summary-item">
          <span className="text-text-3">Total: </span><span className="font-800 text-text">{fmt(total)} kendaraan</span>
        </div>
      </div>

      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={()=>load(page)} title="Coba Memuat Ulang">Coba Lagi</button>
        </div>
      ) : (
        <>
          <TableShell headers={[{label:'Plat Nomor'},{label:'Brand/Model'},{label:'Tipe'},{label:'Driver & Dept'},{label:'Tahun/Warna'},{label:'Pajak',right:true},{label:'KM',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={9}>
            {rows.length===0 ? (
              <tr><td colSpan={9} className="py-14 text-center">
                <Truck size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada kendaraan ditemukan</p>
              </td></tr>
            ) : rows.map((v,i) => {
              const taxExpired = v.tax_date && new Date(v.tax_date) < new Date();
              return (
                <tr key={v.id} className="hover-row">
                  <td className="td-p">
                    <div className="plate-badge">{v.plate_number}</div>
                  </td>
                  <td className="td-p font-600 text-text">{v.brand_model||'—'}</td>
                  <td className="td-p text-sm text-text-2">{v.vehicle_type||'—'}</td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{v.driver_name||'—'}</div>
                    {v.department&&<div className="text-xs-muted">{v.department}</div>}
                  </td>
                  <td className="td-p text-sm-muted">{v.year||'—'} {v.color?`/ ${v.color}`:''}</td>
                  <td className="td-p text-right">
                    <span className={`text-xs-bold ${taxExpired ? 'text-rose' : 'text-text-2'}`}>{fmtDate(v.tax_date)}</span>
                    {taxExpired&&<div className="text-xxs-bold text-rose">EXPIRED</div>}
                  </td>
                  <td className="td-p text-sm-muted text-right">{v.last_km?`${fmt(v.last_km)} km`:'—'}</td>
                  <td className="td-p text-right"><Badge label={v.status||'—'} colorClass={STAT_C[v.status]||STAT_C.default}/></td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button className="btn-icon" title="Lihat Detail" aria-label="Lihat detail kendaraan" onClick={() => openDetail(v.id)}><Eye size={14}/></button>
                      <button className="btn-icon-blue" title="Edit" aria-label="Edit kendaraan" onClick={() => openEdit(v.id)}><Edit2 size={14}/></button>
                      <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label={`Hapus ${v.plate_number}`} onClick={() => confirmDelete({ id: v.id, name: v.plate_number })}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </TableShell>
          {!loading&&rows.length>0&&<PaginationBar page={page} limit={LIMIT} total={total} totalPages={totalPages} onChange={p=>{setPage(p);load(p);}}/>}
        </>
      )}

      {/* Detail Modal */}
      {(detail||dlLoading)&&(
        <ModalShell title={detail?`Kendaraan — ${detail.plate_number}`:'Memuat…'} onClose={()=>setDetail(null)} size="md">
          {dlLoading||!detail ? <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div> : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 justify-between">
                <div>
                  <h2 className="text-lg-black">{detail.brand_model||'—'}</h2>
                  <p className="text-xs-muted mt-1">{detail.vehicle_type||''} · {detail.color||''} · {detail.year||''}</p>
                </div>
                <Badge label={detail.status||'—'} colorClass={STAT_C[detail.status]||STAT_C.default}/>
              </div>
              <div className="detail-grid">
                <SBox icon={<Truck size={14}/>} title="Identitas">
                  <InfoRow label="Plat Nomor"    value={<span className="plate-badge">{detail.plate_number}</span>}/>
                  <InfoRow label="Nomor Rangka"  value={detail.chassis_number}/>
                  <InfoRow label="Merek/Model"   value={detail.brand_model}/>
                  <InfoRow label="Perusahaan"    value={detail.company}/>
                </SBox>
                <SBox icon={<Calendar size={14}/>} title="Operasional">
                  <InfoRow label="Driver"        value={detail.driver_name}/>
                  <InfoRow label="Departemen"    value={detail.department}/>
                  <InfoRow label="Terakhir KM"   value={detail.last_km?`${fmt(detail.last_km)} km`:null}/>
                  <InfoRow label="Servis Terakhir" value={fmtDate(detail.last_service_date)}/>
                  <InfoRow label="Pajak s/d"     value={<span className={detail.tax_date && new Date(detail.tax_date) < new Date() ? 'text-rose font-700' : 'text-text'}>{fmtDate(detail.tax_date)}</span>}/>
                </SBox>
              </div>
              {detail.information&&<div className="info-card"><p className="text-xs-bold mb-1">Informasi</p><p className="text-sm-muted lh-1-6">{detail.information}</p></div>}
              <div className="modal-footer-actions">
                <button className="btn" onClick={()=>{setDetail(null);openEdit(detail.id);}} title="Edit Data Kendaraan"><Edit2 size={14}/> Edit</button>
                <button className="btn btn-primary" onClick={()=>setDetail(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* Add/Edit Modal */}
      {(showAdd||editRow)&&(
        <ModalShell title={editRow?`Edit — ${editRow.plate_number}`:'Tambah Kendaraan'} onClose={closeForm} size="md" closeOnClickOutside={false}>
          <div className="flex flex-col gap-4">
            <FormError msg={formErr}/>
            <SLabel>Identitas Kendaraan</SLabel>
            <div className="detail-grid">
              <FF label="Perusahaan" id="veh_co" required><select id="veh_co" value={form.company_id} onChange={e=>sf('company_id',e.target.value)} className="input-premium" title="Pilih Perusahaan"><option value="">— Pilih —</option>{companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FF>
              <FF label="Plat Nomor" id="veh_plate" required><input id="veh_plate" type="text" value={form.plate_number} onChange={e=>sf('plate_number',e.target.value)} placeholder="B 1234 ABC" className="input-premium" title="Plat Nomor"/></FF>
              <FF label="Nomor Rangka" id="veh_chassis"><input id="veh_chassis" type="text" value={form.chassis_number} onChange={e=>sf('chassis_number',e.target.value)} placeholder="Nomor Rangka" className="input-premium" title="Nomor Rangka"/></FF>
              <FF label="Tipe Kendaraan" id="veh_type"><input id="veh_type" type="text" value={form.vehicle_type} onChange={e=>sf('vehicle_type',e.target.value)} placeholder="Minibus / Motor / Box" className="input-premium" title="Tipe Kendaraan"/></FF>
              <FF label="Merek / Model" id="veh_model"><input id="veh_model" type="text" value={form.brand_model} onChange={e=>sf('brand_model',e.target.value)} placeholder="Toyota Innova 2023" className="input-premium" title="Merek / Model"/></FF>
              <FF label="Tahun" id="veh_year"><input id="veh_year" type="number" value={form.year} onChange={e=>sf('year',e.target.value)} min={1990} max={2030} placeholder="Tahun" className="input-premium" title="Tahun"/></FF>
              <FF label="Warna" id="veh_color"><input id="veh_color" type="text" value={form.color} onChange={e=>sf('color',e.target.value)} placeholder="Warna" className="input-premium" title="Warna"/></FF>
              <FF label="Driver" id="veh_driver"><input id="veh_driver" type="text" value={form.driver_name} onChange={e=>sf('driver_name',e.target.value)} placeholder="Nama Driver" className="input-premium" title="Driver"/></FF>
              <FF label="Departemen" id="veh_dept"><input id="veh_dept" type="text" value={form.department} onChange={e=>sf('department',e.target.value)} placeholder="Nama Departemen" className="input-premium" title="Departemen"/></FF>
              <FF label="Tanggal Pajak" id="veh_tax"><input id="veh_tax" type="date" value={form.tax_date} onChange={e=>sf('tax_date',e.target.value)} className="input-premium" title="Tanggal Pajak" /></FF>
              <FF label="KM Terakhir" id="veh_km"><input id="veh_km" type="number" value={form.last_km} onChange={e=>sf('last_km',e.target.value)} min={0} placeholder="0" className="input-premium" title="KM Terakhir"/></FF>
              <FF label="Tgl Servis Terakhir" id="veh_service"><input id="veh_service" type="date" value={form.last_service_date} onChange={e=>sf('last_service_date',e.target.value)} className="input-premium" title="Tgl Servis Terakhir" /></FF>
              <FF label="Status" id="veh_status"><select id="veh_status" value={form.status} onChange={e=>sf('status',e.target.value)} className="input-premium" title="Status"><option value="Aktif">Aktif</option><option value="Tidak Aktif">Tidak Aktif</option><option value="Rusak">Rusak</option></select></FF>
            </div>
            <FF label="Informasi Tambahan" id="veh_info"><textarea id="veh_info" rows={2} value={form.information} onChange={e=>sf('information',e.target.value)} placeholder="Catatan tambahan..." className="input-premium resize-y" title="Informasi Tambahan"/></FF>
            <div className="modal-footer-border">
              <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
              <button className="btn btn-primary min-w-130" onClick={save} disabled={saving} title={editRow ? 'Simpan Perubahan' : 'Tambah Kendaraan'}>
                {saving?<><Loader2 size={14} className="animate-spin"/> Menyimpan…</>:<><Save size={14}/> {editRow?'Simpan':'Tambah'}</>}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
      {deleteItem && (
        <ModalShell 
          title="" 
          onClose={() => !deleting && setDeleteItem(null)} 
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
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="btn bg-rose text-white border-none flex-1 justify-center py-2 hover:opacity-90" 
                onClick={executeDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> ...</> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
