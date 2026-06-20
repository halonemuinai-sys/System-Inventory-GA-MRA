'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, ShieldCheck, AlertCircle, Trash2, Building2, Coins } from 'lucide-react';
import { Badge, PaginationBar, TableShell, SearchableSelect } from '@/components/PageShared';
import { InsuranceDetailModal, InsuranceFormModal } from '@/components/InsuranceComponents';

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

function insStatus(endDate: string) {
  if (!endDate) return { label:'Active', colorClass:'badge-emerald', cls:'text-emerald' };
  const d = new Date(endDate); const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { label:'Expired', colorClass:'badge-rose', cls:'text-rose' };
  if (diff <= 30) return { label:'Renewal', colorClass:'badge-amber', cls:'text-amber' };
  return { label:'Active', colorClass:'badge-emerald', cls:'text-emerald' };
}

const EMPTY = { 
  company_id:'', insurance_company:'', insurance_type:'', category:'', 
  policy_number:'', start_date:'', end_date:'', vehicle_id:'', 
  vehicle_type:'', premium_idr:'', coverage_idr:'', broker:'', 
  pic:'', contact_person:'', information:'', status:'Active',
  doc_url:'' 
};

export default function InsurancePage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [companyId, setCompanyId]   = useState('');
  const [status, setStatus]         = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [meta, setMeta]             = useState<{companies:any[];vehicles:any[]}>({companies:[],vehicles:[]});
  const [detail, setDetail]         = useState<any>(null);
  const [dlLoading, setDlLoading]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [editRow, setEditRow]       = useState<any>(null);
  const [form, setForm]             = useState<any>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');
  const LIMIT = 20;

  useEffect(() => {
    Promise.all([
      fetch('/api/assets/meta').then(r=>r.json()),
      fetch('/api/vehicles?limit=200').then(r=>r.json()),
    ]).then(([am, vm]) => setMeta({ companies: am.companies||[], vehicles: vm.data||[] })).catch(()=>{});
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ 
        page:String(p), 
        limit:String(LIMIT), 
        ...(search&&{search}),
        ...(companyId&&{company_id:companyId}),
        ...(status&&{status})
      });
      const res = await fetch(`/api/insurance?${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data polis');
      const j = await res.json();
      setRows(j.data || []); setTotal(j.total || 0); setTotalPages(j.totalPages || 1); setPage(j.page || 1);
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

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus polis "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/insurance/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== id));
    } catch { alert('Gagal menghapus polis'); }
  };

  const openDetail = async (id:number) => {
    setDlLoading(true); setDetail(null);
    const r = await fetch(`/api/insurance/${id}`);
    setDetail(await r.json()); 
    setDlLoading(false); 
  };

  const openEdit = async (id:number) => {
    const r = await fetch(`/api/insurance/${id}`); const d = await r.json(); setEditRow(d);
    setForm({ 
      company_id:String(d.company_id||''), 
      insurance_company:d.insurance_company||'', 
      insurance_type:d.insurance_type||'', 
      category:d.category||'', 
      policy_number:d.policy_number||'', 
      start_date:d.start_date?d.start_date.split('T')[0]:'', 
      end_date:d.end_date?d.end_date.split('T')[0]:'', 
      vehicle_id:String(d.vehicle_id||''), 
      vehicle_type:d.vehicle_type||'', 
      premium_idr:d.premium_idr ? String(Math.round(parseFloat(String(d.premium_idr)))) : '', 
      coverage_idr:d.coverage_idr ? String(Math.round(parseFloat(String(d.coverage_idr)))) : '', 
      broker:d.broker||'', 
      pic:d.pic||'', 
      contact_person:d.contact_person||'', 
      information:d.information||'', 
      status:d.status||'Active',
      doc_url:d.doc_url||''
    });
    setFormErr('');
  };

  const openAdd   = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf        = (k:string,v:string) => setForm((f:any) => ({...f,[k]:v}));

  const save = async () => {
    if (!form.company_id) { setFormErr('Perusahaan wajib dipilih'); return; }
    setSaving(true);
    try {
      const url = editRow ? `/api/insurance/${editRow.id}` : '/api/insurance';
      const res = await fetch(url, { 
        method:editRow?'PUT':'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          ...form, 
          company_id:parseInt(form.company_id)||null, 
          vehicle_id:parseInt(form.vehicle_id)||null, 
          premium_idr:parseNum(form.premium_idr), 
          coverage_idr:parseNum(form.coverage_idr) 
        }) 
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Gagal menyimpan'); }
      closeForm(); load(page);
    } catch(e:any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  const totalPremium = rows.reduce((s,r) => s + parseFloat(String(r.premium_idr||0)), 0);

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header animate-slide-up" style={{ '--delay': '0ms' } as React.CSSProperties}>
        <div><h1 className="header-title">Insurance Policies</h1><p className="header-subtitle">Kelola polis asuransi, masa berlaku, dan premi tahunan.</p></div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Polis Baru"><Plus size={16}/> Tambah Polis</button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div 
          className="card-metric animate-slide-up border-l-4 border-l-blue flex items-center justify-between glow-blue"
          style={{ '--delay': '100ms' } as React.CSSProperties}
        >
          <div>
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Polis</p>
            <p className="text-2xl font-900 text-text">{fmt(total)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center text-blue shadow-sm">
            <ShieldCheck size={20} />
          </div>
        </div>
        <div 
          className="card-metric animate-slide-up border-l-4 border-l-indigo flex items-center justify-between glow-indigo"
          style={{ '--delay': '200ms' } as React.CSSProperties}
        >
          <div>
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Premi (Halaman Ini)</p>
            <p className="text-2xl font-900 text-indigo">Rp {fmt(totalPremium)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-light flex items-center justify-center text-indigo shadow-sm">
            <Coins size={20} />
          </div>
        </div>
      </div>

      <div className="filter-bar animate-slide-up flex flex-wrap gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs mb-6" style={{ position: 'relative', zIndex: 10 }}>
        <div className="search-box flex-1 min-w-[240px]">
          <Search size={15} className="search-icon text-slate-400"/>
          <input 
            id="ins_search"
            type="text" 
            placeholder="Cari nomor polis, asuransi, plat..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-premium w-full pl-9 text-slate-700 font-500" 
            title="Cari Polis"
            aria-label="Cari data polis asuransi"
          />
        </div>

        {/* Company Filter */}
        <div className="w-[200px]">
          <SearchableSelect
            id="ins_filter_company"
            value={companyId}
            onChange={v => setCompanyId(v)}
            options={meta.companies.map((c: any) => ({ id: c.id, name: c.name }))}
            placeholder="— Semua Perusahaan —"
          />
        </div>

        {/* Status Filter */}
        <div className="w-[160px]">
          <SearchableSelect
            id="ins_filter_status"
            value={status}
            onChange={v => setStatus(v)}
            options={[
              { id: 'Active', name: 'Aktif' },
              { id: 'Renewal', name: 'Renewal (<= 30 Hari)' },
              { id: 'Expired', name: 'Expired' }
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
        <div className="error-alert-container animate-slide-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={()=>load(page)} title="Coba Memuat Ulang">Coba Lagi</button>
        </div>
      ) : !isSearched ? (
        <div className="animate-slide-up flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm text-center max-w-2xl mx-auto my-6 relative overflow-hidden" style={{ padding: '5rem 2rem' }}>
          {/* Decorative gradients */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

          {/* Modern Scanning Shield Animation */}
          <div className="relative w-28 h-36 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center items-center shadow-inner mb-8 overflow-hidden">
            {/* Background scanner line */}
            <div className="scanner-line absolute left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-500/80"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <ShieldCheck size={32} className="animate-pulse" />
              </div>
              <span className="text-[9px] font-800 text-slate-400 uppercase tracking-widest">Polis Aktif</span>
            </div>
          </div>

          <h2 className="text-lg font-950 text-slate-800 tracking-tight mb-2">Arsip Polis Asuransi</h2>
          <p className="text-slate-400 text-xs font-600 max-w-sm mx-auto leading-relaxed">
            Sesuaikan parameter penyaringan di atas untuk meninjau status aktif, masa berlaku, dan rincian premi asuransi.
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
        <div className="animate-slide-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
          <TableShell headers={[{label:'No. Polis'},{label:'Perusahaan Asuransi'},{label:'Perusahaan'},{label:'Tipe / Kategori'},{label:'Kendaraan'},{label:'Masa Berlaku'},{label:'Premi (Rp)',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={9}>
            {rows.length===0 ? (
              <tr><td colSpan={9} className="py-14 text-center">
                <ShieldCheck size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada polis ditemukan</p>
              </td></tr>
            ) : rows.map((ins,i) => {
              const st = insStatus(ins.end_date);
              return (
                <tr 
                  key={ins.id} 
                  className="hover-row transition-all duration-200 animate-slide-up"
                  style={{ '--delay': `${Math.min(i * 35, 300)}ms` } as React.CSSProperties}
                >
                  <td className="td-p font-mono text-blue text-xs font-700">{ins.policy_number||'—'}</td>
                  <td className="td-p font-600 text-text">{ins.insurance_company||'—'}</td>
                  <td className="td-p">
                    <div className="flex items-center gap-1 text-sm text-text-2">
                      <Building2 size={12} className="shrink-0 text-text-3" />
                      <span>{ins.company||'—'}</span>
                    </div>
                  </td>
                  <td className="td-p">
                    <div className="text-sm text-text">{ins.insurance_type||'—'}</div>
                    <div className="text-xs-muted">{ins.category||''}</div>
                  </td>
                  <td className="td-p text-sm-muted">{ins.plate_number||'—'}</td>
                  <td className="td-p">
                    <div className="text-xs-muted">Mulai: {fmtDate(ins.start_date)}</div>
                    <div className={`text-xs-bold ${st.cls}`}>Akhir: {fmtDate(ins.end_date)}</div>
                  </td>
                  <td className="td-p text-right font-700 text-text">{fmt(parseFloat(String(ins.premium_idr||0)))}</td>
                  <td className="td-p text-right"><Badge label={st.label} colorClass={st.colorClass}/></td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button className="btn-icon" title="Lihat Detail" aria-label="Lihat detail polis" onClick={() => openDetail(ins.id)}><Eye size={14}/></button>
                      <button className="btn-icon-blue" title="Edit" aria-label="Edit polis" onClick={() => openEdit(ins.id)}><Edit2 size={14}/></button>
                      <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label="Hapus polis" onClick={() => handleDelete(ins.id, ins.policy_number)}><Trash2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </TableShell>
          {!loading&&rows.length>0&&<PaginationBar page={page} limit={LIMIT} total={total} totalPages={totalPages} onChange={p=>{setPage(p);load(p);}}/>}
        </div>
      )}

      {/* Detail Modal */}
      <InsuranceDetailModal
        detail={detail}
        dlLoading={dlLoading}
        onClose={() => setDetail(null)}
        onEdit={(id) => openEdit(id)}
        fmtDate={fmtDate}
        fmt={fmt}
        insStatus={insStatus}
      />

      {/* Add/Edit Modal */}
      <InsuranceFormModal
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
    </div>
  );
}
