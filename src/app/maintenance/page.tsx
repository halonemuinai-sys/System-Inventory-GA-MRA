'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Save, Wrench, AlertCircle, Trash2 } from 'lucide-react';
import { 
  Badge, ModalShell, FF, SLabel, PaginationBar, 
  TableShell, InfoRow, SBox, FormError, iStyle 
} from '@/components/PageShared';

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const parseNum = (s: string) => parseFloat(String(s).replace(/\./g, '')) || 0;
const fmtCurrency = (s: string) => {
  const num = String(s).replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num));
};

function mtnStatus(expiry: string, status?: string) {
  if (status === 'Completed') return { label:'Completed', colorClass:'badge-emerald', cls:'text-emerald' };
  if (!expiry) return { label:'Active', colorClass:'badge-emerald', cls:'text-emerald' };
  const d = new Date(expiry); const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { label:'Expired', colorClass:'badge-rose', cls:'text-rose' };
  if (diff <= 30) return { label:'Renewal', colorClass:'badge-amber', cls:'text-amber' };
  return { label:'Active', colorClass:'badge-emerald', cls:'text-emerald' };
}

const EMPTY = { 
  company_id:'', asset_name:'', service_type:'', room_area:'', 
  pic:'', vendor_id:'', qty:1, est_cost:'', total_cost:'', 
  expiry_date:'', information:'', status:'Active' 
};

export default function MaintenancePage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [meta, setMeta]             = useState<{companies:any[];vendors:any[]}>({companies:[],vendors:[]});
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
    Promise.all([
      fetch('/api/assets/meta').then(r=>r.json()),
      fetch('/api/vendors/meta').then(r=>r.json()),
    ]).then(([am, vm]) => setMeta({ companies: am.companies||[], vendors: vm.vendors||vm.data||[] })).catch(()=>{});
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ page:String(p), limit:String(LIMIT), ...(search&&{search}) });
      const res = await fetch(`/api/maintenance?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const openDetail = async (id:number) => { 
    setDlLoading(true); setDetail(null); 
    const r = await fetch(`/api/maintenance/${id}`); 
    setDetail(await r.json()); 
    setDlLoading(false); 
  };

  const openEdit = async (id:number) => {
    const r = await fetch(`/api/maintenance/${id}`); const d = await r.json(); setEditRow(d);
    setForm({ 
      company_id:String(d.company_id||''), 
      asset_name:d.asset_name||'', 
      service_type:d.service_type||'', 
      room_area:d.room_area||'', 
      pic:d.pic||'', 
      vendor_id:String(d.vendor_id||''), 
      qty:d.qty||1, 
      est_cost:String(d.est_cost||''), 
      total_cost:String(d.total_cost||''), 
      expiry_date:d.expired_date?d.expired_date.split('T')[0]:'', 
      information:d.information||'', 
      status:d.status||'Active' 
    });
    setFormErr('');
  };

  const openAdd   = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf        = (k:string,v:string) => setForm((f:any) => ({...f,[k]:v}));

  const confirmDelete = (item: { id: number; name: string }) => {
    setDeleteItem(item);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/maintenance/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(m => m.id !== deleteItem.id));
      setDeleteItem(null);
    } catch { 
      alert('Gagal menghapus data maintenance'); 
    } finally {
      setDeleting(false);
    }
  };

  const save = async () => {
    if (!form.asset_name.trim()) { setFormErr('Nama aset wajib diisi'); return; }
    if (!form.company_id)         { setFormErr('Perusahaan wajib dipilih'); return; }
    setSaving(true);
    try {
      const url = editRow ? `/api/maintenance/${editRow.id}` : '/api/maintenance';
      const res = await fetch(url, { 
        method:editRow?'PUT':'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          ...form, 
          company_id:parseInt(form.company_id)||null, 
          vendor_id:parseInt(form.vendor_id)||null, 
          qty:parseInt(form.qty)||1, 
          est_cost:parseNum(form.est_cost), 
          total_cost:parseNum(form.total_cost),
          expired_date:form.expiry_date 
        }) 
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Gagal menyimpan'); }
      closeForm(); load(page);
    } catch(e:any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div><h1 className="header-title">Maintenance & Services</h1><p className="header-subtitle">Pantau jadwal pemeliharaan, servis berkala, dan biaya perbaikan.</p></div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Layanan Baru"><Plus size={16}/> Tambah Layanan</button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input 
            id="mtn_search"
            type="text" 
            placeholder="Cari aset, tipe servis, pic..." 
            value={search} 
            onChange={e=>{setSearch(e.target.value);setPage(1);}} 
            className="input-premium w-full pl-9" 
            title="Cari Layanan"
            aria-label="Cari layanan maintenance"
          />
        </div>
        <div className="summary-item">
          <span className="text-text-3">Total: </span><span className="font-800 text-text">{fmt(total)} layanan</span>
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
          <TableShell headers={[{label:'Aset / Deskripsi'},{label:'Ruangan/Area'},{label:'Tipe Servis'},{label:'PIC'},{label:'Vendor'},{label:'Qty',right:true},{label:'Jatuh Tempo'},{label:'Biaya (Rp)',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={10}>
            {rows.length===0 ? (
              <tr><td colSpan={10} className="py-14 text-center">
                <Wrench size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada data maintenance ditemukan</p>
              </td></tr>
            ) : rows.map((m,i) => {
              const st = mtnStatus(m.expiry_date, m.status);
              return (
                <tr key={m.id} className="hover-row">
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{m.asset_name||'General Maintenance'}</div>
                    <div className="text-xxs-bold text-blue">#{m.id}</div>
                  </td>
                  <td className="td-p">
                    <div className="text-sm-muted">{m.room_area||'—'}</div>
                  </td>
                  <td className="td-p text-sm-muted">{m.service_type||'—'}</td>
                  <td className="td-p text-sm-muted">{m.pic||'—'}</td>
                  <td className="td-p text-sm-muted">{m.vendor_name||'—'}</td>
                  <td className="td-p text-center text-sm-bold text-text">{m.qty||1}</td>
                  <td className="td-p">
                    <span className={`text-xs-bold ${st.cls}`}>{fmtDate(m.expiry_date)}</span>
                  </td>
                  <td className="td-p text-right font-700 text-text">{fmt(parseFloat(String(m.total_cost||0)))}</td>
                  <td className="td-p text-right"><Badge label={st.label} colorClass={st.colorClass}/></td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button className="btn-icon" title="Lihat Detail" aria-label="Lihat detail layanan" onClick={() => openDetail(m.id)}><Eye size={14}/></button>
                      <button className="btn-icon-blue" title="Edit" aria-label="Edit layanan" onClick={() => openEdit(m.id)}><Edit2 size={14}/></button>
                      <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label={`Hapus ${m.asset_name}`} onClick={() => confirmDelete({ id: m.id, name: m.asset_name || 'Layanan #' + m.id })}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </TableShell>
          {!loading&&rows.length>0&&<PaginationBar page={page} limit={LIMIT} total={total} totalPages={totalPages} onChange={p=>{setPage(p);load(p);}}/>}
        </>
      )}

      {/* Detail */}
      {(detail||dlLoading)&&(
        <ModalShell title={detail?`Maintenance — ${detail.asset_name||detail.room_area||'#'+detail.id}`:'Memuat…'} onClose={()=>setDetail(null)} size="md">
          {dlLoading||!detail ? <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div> : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg-black">{detail.asset_name||'General Maintenance'}</h2>
                  <p className="text-xs-muted mt-1">{detail.room_area||''} {detail.service_type?`· ${detail.service_type}`:''}</p>
                </div>
                <Badge label={mtnStatus(detail.expired_date, detail.status).label} colorClass={mtnStatus(detail.expired_date, detail.status).colorClass}/>
              </div>
              <div className="detail-grid">
                <SBox icon={<Wrench size={14}/>} title="Detail Pekerjaan">
                  <InfoRow label="Tipe Servis"   value={detail.service_type}/>
                  <InfoRow label="Area / Ruangan" value={detail.room_area}/>
                  <InfoRow label="PIC"           value={detail.pic}/>
                  <InfoRow label="Vendor"        value={detail.vendor_name}/>
                  <InfoRow label="Perusahaan"    value={detail.company}/>
                </SBox>
                <SBox title="Biaya & Jadwal">
                  <InfoRow label="Kuantitas"     value={detail.qty}/>
                  <InfoRow label="Est. Biaya"    value={`Rp ${fmt(parseFloat(String(detail.est_cost||0)))}`}/>
                  <InfoRow label="Total Biaya"   value={<span className="text-sm-bold text-amber">Rp {fmt(parseFloat(String(detail.total_cost||0)))}</span>}/>
                  <InfoRow label="Jatuh Tempo"   value={<span className={`text-sm-bold ${mtnStatus(detail.expired_date,detail.status).cls}`}>{fmtDate(detail.expired_date)}</span>}/>
                </SBox>
              </div>
              {detail.information&&<div className="info-card"><p className="text-xs-bold mb-1">Informasi</p><p className="text-sm-muted lh-1-6">{detail.information}</p></div>}
              <div className="modal-footer-actions">
                <button className="btn" onClick={()=>{setDetail(null);openEdit(detail.id);}} title="Edit Layanan"><Edit2 size={14}/> Edit</button>
                <button className="btn btn-primary" onClick={()=>setDetail(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* Add/Edit */}
      {(showAdd||editRow)&&(
        <ModalShell title={editRow?`Edit Maintenance`:'Tambah Layanan Baru'} onClose={closeForm} size="md" closeOnClickOutside={false}>
          <div className="flex flex-col gap-4">
            <FormError msg={formErr}/>
            <SLabel>Detail Perbaikan / Servis</SLabel>
            <div className="detail-grid">
              <FF label="Perusahaan" id="mtn_co" required><select id="mtn_co" value={form.company_id} onChange={e=>sf('company_id',e.target.value)} className="input-premium" title="Pilih Perusahaan"><option value="">— Pilih —</option>{meta.companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FF>
              <FF label="Nama Aset / Unit" id="mtn_asset" required><input id="mtn_asset" type="text" value={form.asset_name} onChange={e=>sf('asset_name',e.target.value)} placeholder="Mis: AC Split 2PK, Lift, dll" className="input-premium" title="Nama Aset"/></FF>
              <FF label="Area / Ruangan" id="mtn_area"><input id="mtn_area" type="text" value={form.room_area} onChange={e=>sf('room_area',e.target.value)} placeholder="Lantai 3, Ruang Rapat" className="input-premium" title="Area / Ruangan"/></FF>
              <FF label="Tipe Servis" id="mtn_type"><input id="mtn_type" type="text" value={form.service_type} onChange={e=>sf('service_type',e.target.value)} placeholder="Routine / Repair / Cleaning" className="input-premium" title="Tipe Servis"/></FF>
              <FF label="PIC Pelaksana" id="mtn_pic"><input id="mtn_pic" type="text" value={form.pic} onChange={e=>sf('pic',e.target.value)} placeholder="Nama PIC" className="input-premium" title="PIC Pelaksana"/></FF>
              <FF label="Vendor / Bengkel" id="mtn_vendor"><select id="mtn_vendor" value={form.vendor_id} onChange={e=>sf('vendor_id',e.target.value)} className="input-premium" title="Pilih Vendor"><option value="">— Pilih Vendor —</option>{meta.vendors.map((v:any)=><option key={v.id} value={v.id}>{v.name}</option>)}</select></FF>
              <FF label="Kuantitas Unit" id="mtn_qty"><input id="mtn_qty" type="number" value={form.qty} onChange={e=>sf('qty',e.target.value)} min={1} className="input-premium" title="Kuantitas Unit"/></FF>
              <FF label="Jatuh Tempo / Expiry" id="mtn_expiry"><input id="mtn_expiry" type="date" value={form.expiry_date} onChange={e=>sf('expiry_date',e.target.value)} className="input-premium" title="Tanggal Jatuh Tempo" /></FF>
              <FF label="Estimasi Biaya (Rp)" id="mtn_est"><input id="mtn_est" type="text" value={fmtCurrency(form.est_cost)} onChange={e=>sf('est_cost',e.target.value.replace(/\D/g,''))} placeholder="0" className="input-premium" title="Estimasi Biaya"/></FF>
              <FF label="Total Biaya (Rp)" id="mtn_total"><input id="mtn_total" type="text" value={fmtCurrency(form.total_cost)} onChange={e=>sf('total_cost',e.target.value.replace(/\D/g,''))} placeholder="0" className="input-premium" title="Total Biaya"/></FF>
              <FF label="Status" id="mtn_status"><select id="mtn_status" value={form.status} onChange={e=>sf('status',e.target.value)} className="input-premium" title="Status"><option value="Active">Active</option><option value="Completed">Completed</option><option value="Cancelled">Cancelled</option></select></FF>
            </div>
            <FF label="Informasi Tambahan" id="mtn_info"><textarea id="mtn_info" rows={2} value={form.information} onChange={e=>sf('information',e.target.value)} placeholder="Catatan servis..." className="input-premium resize-y" title="Informasi Tambahan"/></FF>
            <div className="modal-footer-border">
              <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
              <button className="btn btn-primary min-w-130" onClick={save} disabled={saving} title={editRow?'Simpan Perubahan':'Tambah Layanan'}>
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
            <h3 className="text-md font-800 text-text">Hapus Data?</h3>
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
