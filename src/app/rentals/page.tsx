'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Save, HardDrive, AlertCircle, Trash2 } from 'lucide-react';
import { Badge, ModalShell, FF, SLabel, PaginationBar, TableShell, InfoRow, SBox, FormError } from '@/components/PageShared';

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const STAT_C: Record<string,any> = { 
  Active:  { colorClass:'badge-emerald', cls:'text-emerald' }, 
  Expired: { colorClass:'badge-rose', cls:'text-rose' }, 
  default: { colorClass:'badge-amber', cls:'text-amber' } 
};
const EMPTY = { company_id:'', vendor_id:'', device_type:'', order_id:'', item_name:'', price:'', unit_code:'', duration_months:'', start_rent:'', end_rent:'', department:'', status:'Active' };

const parseNum = (s: string) => parseFloat(s.replace(/\./g, '')) || 0;
const fmtCurrency = (s: string) => {
  const num = String(s).replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num));
};

export default function RentalsPage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [compFilter, setComp]       = useState('');
  const [appliedFilters, setApplied] = useState({ search: '', comp: '' });
  const [hasSearched, setHasSearched] = useState(false);
  const [kpi, setKpi]               = useState({ total_items: 0, total_price: 0 });
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
      fetch('/api/vendors?limit=200').then(r=>r.json()),
    ]).then(([am, vm]) => setMeta({ companies: am.companies||[], vendors: vm.data||[] })).catch(()=>{});
  }, []);

  const load = useCallback(async (p: number, filters = appliedFilters) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ 
        page:String(p), limit:String(LIMIT), 
        ...(filters.search && { search: filters.search }),
        ...(filters.comp && { company: filters.comp })
      });
      const res = await fetch(`/api/rentals?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
      setHasSearched(true);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [appliedFilters]);

  const fetchKpi = useCallback(async (filters = appliedFilters) => {
    try {
      const qs = new URLSearchParams(filters.comp ? { company: filters.comp } : {});
      const res = await fetch(`/api/rentals/summary?${qs}`);
      const data = await res.json();
      setKpi(data);
    } catch (e) {
      console.error(e);
    }
  }, [appliedFilters]);

  const handleSearch = () => {
    const filters = { search, comp: compFilter };
    setApplied(filters);
    load(1, filters);
    fetchKpi(filters);
  };

  useEffect(() => {
    fetchKpi({ search: '', comp: '' });
  }, []);

  useEffect(() => {
    if (hasSearched) load(page, appliedFilters);
  }, [page]);

  const confirmDelete = (item: { id: number; name: string }) => {
    setDeleteItem(item);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/rentals/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== deleteItem.id));
      setDeleteItem(null);
    } catch { 
      alert('Gagal menghapus rental'); 
    } finally {
      setDeleting(false);
    }
  };
  const openDetail = async (id:number) => { setDlLoading(true); setDetail(null); const r = await fetch(`/api/rentals/${id}`); setDetail(await r.json()); setDlLoading(false); };
  const openEdit   = async (id:number) => {
    const r = await fetch(`/api/rentals/${id}`); const d = await r.json();
    setEditRow(d);
    setForm({ company_id:String(d.company_id||''), vendor_id:String(d.vendor_id||''), device_type:d.device_type||'', order_id:d.order_id||'', item_name:d.item_name||'', price:String(d.price||''), unit_code:d.unit_code||'', duration_months:String(d.duration_months||''), start_rent:d.start_rent?d.start_rent.split('T')[0]:'', end_rent:d.end_rent?d.end_rent.split('T')[0]:'', department:d.department||'', status:d.status||'Active' });
    setFormErr('');
  };
  const openAdd   = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf        = (k:string,v:string) => setForm((f:any) => ({...f,[k]:v}));

  const save = async () => {
    if (!form.item_name.trim()) { setFormErr('Nama item wajib diisi'); return; }
    if (!form.company_id)       { setFormErr('Perusahaan wajib dipilih'); return; }
    setSaving(true);
    try {
      const url = editRow ? `/api/rentals/${editRow.id}` : '/api/rentals';
      const res = await fetch(url, { method:editRow?'PUT':'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ ...form, company_id:parseInt(form.company_id)||null, vendor_id:parseInt(form.vendor_id)||null, price:parseNum(form.price), duration_months:parseInt(form.duration_months)||null }) });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Gagal menyimpan'); }
      closeForm(); 
      if (hasSearched) load(page, appliedFilters);
    } catch(e:any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  const totalVal = rows.reduce((s,r) => s + parseFloat(String(r.price||0)), 0);

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div><h1 className="header-title">Device Rentals</h1><p className="header-subtitle">Kelola perangkat sewa, masa kontrak, dan vendor penyedia.</p></div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Rental Baru"><Plus size={16}/> Tambah Rental</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Keseluruhan Rental</p>
          <p className="text-2xl font-900 text-text">{fmt(kpi.total_items)} item</p>
        </div>
        <div className="card">
          <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Biaya Rental</p>
          <p className="text-2xl font-900 text-blue">Rp {fmt(kpi.total_price)} / bulan</p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input 
            id="rent_search"
            type="text" 
            placeholder="Cari item, order ID, vendor..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-premium w-full pl-9" 
            title="Cari Rental" 
            aria-label="Cari data penyewaan perangkat"
          />
        </div>
        
        <select 
          id="rnt_comp_filter"
          value={compFilter} 
          onChange={e => setComp(e.target.value)}
          className="input-premium w-auto max-w-[150px]" 
          title="Filter Perusahaan"
        >
          <option value="">Semua Perusahaan</option>
          {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <button className="btn btn-primary" onClick={handleSearch} title="Terapkan Filter">
          Cari Data
        </button>

        <div className="summary-box">
          <div className="summary-item">
            <span className="text-text-3">Total: </span><span className="font-800 text-text">{fmt(total)} item</span>
          </div>
          <div className="summary-item-blue">
            <span className="text-blue font-600">Halaman ini: </span><span className="font-800 text-blue">Rp {fmt(totalVal)}</span>
          </div>
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
          <TableShell headers={[{label:'Order ID'},{label:'Item / Deskripsi'},{label:'Vendor'},{label:'Serial / Unit'},{label:'Masa Sewa'},{label:'Biaya (Rp)',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={8}>
            {rows.length===0 ? (
              <tr><td colSpan={8} className="py-14 text-center">
                <HardDrive size={36} className="text-text-3 mx-auto mb-3 block" />
                {hasSearched ? (
                  <>
                    <p className="text-sm-bold text-text-2">Tidak ada data rental ditemukan</p>
                    <p className="text-xs-muted mt-1">Coba ubah filter dan klik Cari Data</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm-bold text-text-2">Menunggu pencarian data</p>
                    <p className="text-xs-muted mt-1">Silakan gunakan filter di atas dan klik Cari Data</p>
                  </>
                )}
              </td></tr>
            ) : rows.map((r,i) => {
              const expired = r.end_rent && new Date(r.end_rent) < new Date();
              const st = STAT_C[expired ? 'Expired' : (r.status || 'Active')] || STAT_C.default;
              return (
                <tr key={r.id} className="hover-row">
                  <td className="td-p font-mono text-blue text-xs font-700">{r.order_id||'—'}</td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{r.item_name}</div>
                    {r.device_type&&<div className="text-xs-muted mt-1">{r.device_type}</div>}
                  </td>
                  <td className="td-p text-sm text-text-2">{r.vendor_name||'—'}</td>
                  <td className="td-p text-sm text-text-2">{r.unit_code||'—'}</td>
                  <td className="td-p">
                    <div className="text-xs-muted">Mulai: {fmtDate(r.start_rent)}</div>
                    <div className={`text-xs-bold ${st.cls}`}>Akhir: {fmtDate(r.end_rent)}</div>
                  </td>
                  <td className="td-p text-right font-700 text-text">{fmt(parseFloat(String(r.price||0)))}</td>
                  <td className="td-p text-right"><Badge label={expired?'Expired':r.status||'—'} colorClass={st.colorClass}/></td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button title="Lihat detail rental" aria-label={`Lihat detail ${r.item_name}`} onClick={()=>openDetail(r.id)} className="btn-icon"><Eye size={14}/></button>
                      <button title="Edit data rental" aria-label={`Edit ${r.item_name}`} onClick={()=>openEdit(r.id)} className="btn-icon-blue"><Edit2 size={14}/></button>
                      <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label={`Hapus ${r.item_name}`} onClick={() => confirmDelete({ id: r.id, name: r.item_name })}><Trash2 size={14}/></button>
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
        <ModalShell title={detail?`Rental — ${detail.item_name}`:'Memuat…'} onClose={()=>setDetail(null)} size="md">
          {dlLoading||!detail ? <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div> : (
            <div className="flex flex-col gap-4">
              <div className="flex-between items-start">
                <div><h2 className="text-lg-black">{detail.item_name}</h2><p className="text-xs-muted mt-1">{detail.device_type||''} {detail.unit_code?`· ${detail.unit_code}`:''}</p></div>
                <Badge label={detail.status||'—'} colorClass={STAT_C[detail.status]?.colorClass||STAT_C.default.colorClass}/>
              </div>
              <div className="detail-grid">
                <SBox icon={<HardDrive size={14}/>} title="Detail Item">
                  <InfoRow label="Order ID"     value={detail.order_id}/>
                  <InfoRow label="Tipe Perangkat" value={detail.device_type}/>
                  <InfoRow label="Kode Unit"    value={detail.unit_code}/>
                  <InfoRow label="Perusahaan"   value={detail.company}/>
                  <InfoRow label="Vendor"       value={detail.vendor_name}/>
                  <InfoRow label="Departemen"   value={detail.department}/>
                </SBox>
                <SBox title="Kontrak & Biaya">
                  <InfoRow label="Mulai Sewa"   value={fmtDate(detail.start_rent)}/>
                  <InfoRow label="Akhir Sewa"   value={fmtDate(detail.end_rent)}/>
                  <InfoRow label="Durasi"        value={detail.duration_months?`${detail.duration_months} bulan`:null}/>
                  <InfoRow label="Harga/bulan"  value={`Rp ${fmt(parseFloat(String(detail.price||0)))}`}/>
                </SBox>
              </div>
              <div className="modal-footer-actions">
                <button className="btn" onClick={()=>{setDetail(null);openEdit(detail.id);}} title="Edit Rental"><Edit2 size={14}/> Edit</button>
                <button className="btn btn-primary" onClick={()=>setDetail(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* Add/Edit */}
      {(showAdd||editRow)&&(
        <ModalShell title={editRow?`Edit Rental`:'Tambah Rental'} onClose={closeForm} size="md" closeOnClickOutside={false}>
          <div className="flex flex-col gap-4">
            <FormError msg={formErr}/>
            <div className="detail-grid">
              <FF label="Perusahaan" id="rnt_co" required>
                <select id="rnt_co" value={form.company_id} onChange={e=>sf('company_id',e.target.value)} className="input-premium" title="Pilih Perusahaan">
                  <option value="">— Pilih —</option>
                  {meta.companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FF>
              <FF label="Vendor" id="rnt_vnd">
                <select id="rnt_vnd" value={form.vendor_id} onChange={e=>sf('vendor_id',e.target.value)} className="input-premium" title="Pilih Vendor">
                  <option value="">— Pilih Vendor —</option>
                  {meta.vendors.map((v:any)=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select>
              </FF>
              <FF label="Nama Item" id="rnt_name" required><input id="rnt_name" type="text" value={form.item_name} onChange={e=>sf('item_name',e.target.value)} placeholder="Laptop Dell XPS 15" className="input-premium" title="Nama Item" /></FF>
              <FF label="Tipe Perangkat" id="rnt_type"><input id="rnt_type" type="text" value={form.device_type} onChange={e=>sf('device_type',e.target.value)} placeholder="Laptop / Printer / Tab" className="input-premium" title="Tipe Perangkat" /></FF>
              <FF label="Order ID" id="rnt_order"><input id="rnt_order" type="text" value={form.order_id} onChange={e=>sf('order_id',e.target.value)} className="input-premium" title="Order ID" /></FF>
              <FF label="Kode Unit" id="rnt_unit"><input id="rnt_unit" type="text" value={form.unit_code} onChange={e=>sf('unit_code',e.target.value)} className="input-premium" title="Kode Unit" /></FF>
              <FF label="Mulai Sewa" id="rnt_start"><input id="rnt_start" type="date" value={form.start_rent} onChange={e=>sf('start_rent',e.target.value)} className="input-premium" title="Mulai Sewa"/></FF>
              <FF label="Akhir Sewa" id="rnt_end"><input id="rnt_end" type="date" value={form.end_rent} onChange={e=>sf('end_rent',e.target.value)} className="input-premium" title="Akhir Sewa"/></FF>
              <FF label="Durasi (bulan)" id="rnt_dur"><input id="rnt_dur" type="number" value={form.duration_months} onChange={e=>sf('duration_months',e.target.value)} min={1} className="input-premium" title="Durasi" /></FF>
              <FF label="Harga/bulan (Rp)" id="rnt_price"><input id="rnt_price" type="text" value={fmtCurrency(form.price)} onChange={e=>sf('price',e.target.value.replace(/\D/g,''))} placeholder="0" className="input-premium" title="Harga per bulan" /></FF>
              <FF label="Departemen" id="rnt_dept"><input id="rnt_dept" type="text" value={form.department} onChange={e=>sf('department',e.target.value)} className="input-premium" title="Departemen" /></FF>
              <FF label="Status" id="rnt_stat">
                <select id="rnt_stat" value={form.status} onChange={e=>sf('status',e.target.value)} className="input-premium" title="Status Rental">
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </FF>
            </div>
            <div className="modal-footer-border">
              <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
              <button className="btn btn-primary min-w-130" onClick={save} disabled={saving} title={editRow?'Simpan Perubahan':'Tambah Rental'}>
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
            <h3 className="text-md font-800 text-text">Hapus Rental?</h3>
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
