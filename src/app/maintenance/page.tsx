'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, RefreshCw, Trash2, AlertCircle, Wrench } from 'lucide-react';
import { Badge, PaginationBar, TableShell, SearchableSelect } from '@/components/PageShared';
import {
  MaintenanceDetailModal, MaintenanceFormModal, MaintenanceDeleteModal,
  mtnStatus, Maintenance, MaintenanceDetail, Meta, FormData
} from '@/components/MaintenanceComponents';

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';

const parseNum = (s: string) => parseFloat(String(s).replace(/\./g, '')) || 0;
const fmtCurrency = (s: string) => {
  if (typeof s === 'string' && s.includes('.')) {
    s = s.split('.')[0];
  }
  const num = String(s).replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num));
};

const EMPTY_FORM: FormData = { 
  company_id:'', asset_name:'', service_type:'', room_area:'', 
  pic:'', vendor_id:'', qty:1, est_cost:'', total_cost:'', 
  expiry_date:'', information:'', status:'Active' 
};

export default function MaintenancePage() {
  const [rows, setRows]             = useState<Maintenance[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [companyId, setCompanyId]   = useState('');
  const [status, setStatus]         = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [meta, setMeta]             = useState<Meta>({ companies: [], vendors: [] });
  const [detail, setDetail]         = useState<MaintenanceDetail | null>(null);
  const [dlLoading, setDlLoading]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [editRow, setEditRow]       = useState<MaintenanceDetail | null>(null);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');
  
  const [deleteItem, setDeleteItem] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    Promise.all([
      fetch('/api/assets/meta').then(r=>r.json()),
      fetch('/api/vendors?all=true').then(r=>r.json()),
    ]).then(([am, vm]) => setMeta({ companies: am.companies||[], vendors: vm.data||[] })).catch(()=>{});
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ 
        page: String(p), 
        limit: String(LIMIT), 
        ...(search && { search }),
        ...(companyId && { company_id: companyId }),
        ...(status && { status })
      });
      const res = await fetch(`/api/maintenance?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
      setIsSearched(true);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search, companyId, status]);

  const handleSearch = () => {
    load(1);
  };

  const handleReset = () => {
    setSearch('');
    setCompanyId('');
    setStatus('');
    setRows([]);
    setTotal(0);
    setTotalPages(1);
    setPage(1);
    setIsSearched(false);
  };

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

  const openAdd   = () => { setEditRow(null); setForm(EMPTY_FORM); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY_FORM); setFormErr(''); };
  const sf        = (k: keyof FormData, v: string | number) => setForm((f) => ({...f, [k]: v}));

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
          qty:parseInt(String(form.qty))||1, 
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

      <div className="filter-bar animate-slide-up flex flex-wrap gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs mb-6" style={{ position: 'relative', zIndex: 10 }}>
        <div className="search-box flex-1 min-w-[240px]">
          <Search size={15} className="search-icon text-slate-400"/>
          <input 
            id="mtn_search"
            type="text" 
            placeholder="Cari nama aset, tipe, PIC..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-premium w-full pl-9 text-slate-700 font-500" 
            title="Cari Layanan"
            aria-label="Cari layanan maintenance"
          />
        </div>

        {/* Company Filter */}
        <div className="w-[200px]">
          <SearchableSelect
            id="mtn_filter_company"
            value={companyId}
            onChange={v => setCompanyId(v)}
            options={meta.companies.map((c: any) => ({ id: c.id, name: c.name }))}
            placeholder="— Semua Perusahaan —"
          />
        </div>

        {/* Status Filter */}
        <div className="w-[160px]">
          <SearchableSelect
            id="mtn_filter_status"
            value={status}
            onChange={v => setStatus(v)}
            options={[
              { id: 'Active', name: 'Active' },
              { id: 'Completed', name: 'Completed' },
              { id: 'Cancelled', name: 'Cancelled' }
            ]}
            placeholder="— Semua Status —"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="btn btn-primary bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-xs transition-all duration-300 font-600 px-4 py-2 cursor-pointer flex items-center gap-1.5"
            title="Terapkan Filter dan Cari"
          >
            <Search size={14} /> Cari
          </button>

          <button
            onClick={handleReset}
            className="btn border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-600 px-3.5 py-2 cursor-pointer transition-all duration-200"
            title="Reset Filter"
          >
            Reset
          </button>
        </div>
      </div>

      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={()=>load(page)} title="Coba Memuat Ulang">Coba Lagi</button>
        </div>
      ) : !isSearched ? (
        <div className="animate-slide-up flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm text-center max-w-2xl mx-auto my-6 relative overflow-hidden" style={{ padding: '5rem 2rem' }}>
          {/* Decorative gradients */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

          {/* Modern Scanning Wrench Animation */}
          <div className="relative w-28 h-36 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center items-center shadow-inner mb-8 overflow-hidden">
            {/* Background scanner line */}
            <div className="scanner-line absolute left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-500/80"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Wrench size={32} className="animate-pulse" />
              </div>
              <span className="text-[9px] font-800 text-slate-400 uppercase tracking-widest">Pemeliharaan</span>
            </div>
          </div>

          <h2 className="text-lg font-950 text-slate-800 tracking-tight mb-2">Jadwal & Biaya Pemeliharaan</h2>
          <p className="text-slate-400 text-xs font-600 max-w-sm mx-auto leading-relaxed">
            Sesuaikan kriteria penyaringan di atas untuk menelusuri jadwal perawatan dan detail perbaikan aset.
          </p>

          <style dangerouslySetInnerHTML={{__html: `
            @keyframes scan {
              0%, 100% { top: 0%; opacity: 0.3; }
              50% { top: 100%; opacity: 1; }
            }
            .scanner-line {
              animation: scan 2.5s ease-in-out infinite;
            }
          `}} />
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

      {/* Detail Modal */}
      <MaintenanceDetailModal
        detail={detail}
        dlLoading={dlLoading}
        onClose={() => setDetail(null)}
        openEdit={openEdit}
        fmtDate={fmtDate}
        fmt={fmt}
      />

      {/* Add/Edit Modal */}
      <MaintenanceFormModal
        showAdd={showAdd}
        editRow={editRow}
        form={form}
        formErr={formErr}
        saving={saving}
        meta={meta}
        closeForm={closeForm}
        sf={sf}
        save={save}
        fmtCurrency={fmtCurrency}
      />

      {/* Delete Confirmation Modal */}
      <MaintenanceDeleteModal
        deleteItem={deleteItem}
        deleting={deleting}
        onClose={() => setDeleteItem(null)}
        executeDelete={executeDelete}
      />
    </div>
  );
}
