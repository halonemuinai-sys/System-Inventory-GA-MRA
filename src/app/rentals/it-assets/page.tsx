'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Save, HardDrive, AlertCircle, Trash2, Download, RefreshCw } from 'lucide-react';
import { Badge, ModalShell, FF, PaginationBar, TableShell, InfoRow, SBox, FormError, SearchableSelect } from '@/components/PageShared';

const fmt = (v: number) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);
const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const STAT_C: Record<string,any> = { 
  Active:  { colorClass:'badge-emerald', cls:'text-emerald' }, 
  Expired: { colorClass:'badge-rose', cls:'text-rose' }, 
  default: { colorClass:'badge-amber', cls:'text-amber' } 
};

const EMPTY = { 
  company_id:'', 
  vendor_id:'', 
  device_type:'Laptop', 
  order_id:'', 
  brand: '',
  model: '',
  processor: '',
  os: '',
  ram: '',
  storage: '',
  price:'', 
  unit_code:'', 
  duration_months:'', 
  start_rent:'', 
  end_rent:'', 
  department:'', 
  status:'Active' 
};

const parseNum = (s: string) => parseFloat(s.replace(/\./g, '')) || 0;
const fmtCurrency = (s: string) => {
  if (typeof s === 'string' && s.includes('.')) {
    s = s.split('.')[0];
  }
  const num = String(s).replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num));
};

// Merger function to combine IT specs into a single string
const mergeSpecs = (brand: string, model: string, processor: string, os: string, ram: string, storage: string) => {
  const specs = [];
  if (processor && processor.trim()) specs.push(processor.trim());
  specs.push(`RAM ${ram && ram.trim() ? ram.trim() : '—'}`);
  specs.push(`Storage ${storage && storage.trim() ? storage.trim() : '—'}`);
  if (os && os.trim()) specs.push(`OS ${os.trim()}`);
  return `${brand ? brand.trim() : ''} ${model ? model.trim() : ''} (${specs.join(', ')})`.trim();
};

// Parser function to split combined item_name back into separate fields for editing
const parseSpecs = (fullName: string) => {
  const defaultResult = { brand: fullName || '', model: '', processor: '', os: '', ram: '', storage: '' };
  if (!fullName) return defaultResult;
  
  const match = fullName.match(/^(.*?)\s+([^\(]+?)\s*\((.*?)\)$/);
  if (!match) return defaultResult;
  
  const brand = match[1].trim();
  const model = match[2].trim();
  const specStr = match[3];
  const specs = specStr.split(',').map(s => s.trim());
  
  let processor = '';
  let ram = '';
  let storage = '';
  let os = '';
  
  specs.forEach(spec => {
    if (spec.startsWith('RAM ')) {
      ram = spec.replace('RAM ', '').trim();
    } else if (spec.startsWith('Storage ')) {
      storage = spec.replace('Storage ', '').trim();
    } else if (spec.startsWith('OS ')) {
      os = spec.replace('OS ', '').trim();
    } else {
      processor = spec.trim();
    }
  });
  
  return { brand, model, processor, os, ram, storage };
};

export default function ITRentalsPage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [syncing, setSyncing]       = useState(false);
  const [syncMessage, setSyncMsg]   = useState<string|null>(null);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [compFilter, setComp]       = useState('');
  const [appliedFilters, setApplied] = useState({ search: '', comp: '' });
  const [hasSearched, setHasSearched] = useState(false);
  const [kpi, setKpi]               = useState({ total_items: 0, total_price: 0 });
  const [meta, setMeta]             = useState<{companies:any[];gaCompanies:any[];vendors:any[]}>({companies:[],gaCompanies:[],vendors:[]});
  const [detail, setDetail]         = useState<any>(null);
  const [dlLoading, setDlLoading]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [editRow, setEditRow]       = useState<any>(null);
  const [form, setForm]             = useState<any>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');
  
  const [deleteItem, setDeleteItem] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting]     = useState(false);
  const [exporting, setExporting]   = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    Promise.all([
      fetch('/api/assets/meta').then(r=>r.json()),
      fetch('/api/rentals/companies').then(r=>r.json()),
      fetch('/api/vendors?all=true').then(r=>r.json()),
    ]).then(([am, hcos, vm]) => setMeta({ 
      companies: hcos||[], 
      gaCompanies: am.companies||[], 
      vendors: vm.data||[] 
    })).catch(()=>{});
  }, []);

  const load = useCallback(async (p: number, filters = appliedFilters) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ 
        page:String(p), limit:String(LIMIT),
        category: 'IT', 
        ...(filters.search && { search: filters.search }),
        ...(filters.comp && { company: filters.comp })
      });
      const res = await fetch(`/api/rentals?${qs}`);
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data');
      setRows(j.data || []); 
      setTotal(j.total || 0); 
      setTotalPages(j.totalPages || 1); 
      setPage(j.page || 1);
      setHasSearched(true);
    } catch(e:any) { 
      setError(e.message); 
      setRows([]);
    } finally { setLoading(false); }
  }, [appliedFilters]);

  const fetchKpi = useCallback(async (filters = appliedFilters) => {
    try {
      const qs = new URLSearchParams({
        category: 'IT',
        ...(filters.comp && { company: filters.comp })
      });
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

  const handleReset = () => {
    setSearch('');
    setComp('');
    setRows([]);
    setTotal(0);
    setTotalPages(1);
    setPage(1);
    setHasSearched(false);
    const filters = { search: '', comp: '' };
    setApplied(filters);
    setKpi({ total_items: 0, total_price: 0 });
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/rentals/sync', { method: 'POST' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal menjalankan sinkronisasi');
      setSyncMsg(`Sinkronisasi sukses! Berhasil memproses ${j.rentalCount} data rental IT.`);
      load(1);
      fetchKpi();
    } catch (e: any) {
      alert('Error sinkronisasi: ' + e.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Do not load data automatically on mount, wait for filter and search submit
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
    
    const parsed = parseSpecs(d.item_name);
    
    setForm({ 
      company_id:String(d.company_id||''), 
      vendor_id:String(d.vendor_id||''), 
      device_type:d.device_type||'Laptop', 
      order_id:d.order_id||'', 
      brand: parsed.brand,
      model: parsed.model,
      processor: parsed.processor,
      os: parsed.os,
      ram: parsed.ram,
      storage: parsed.storage,
      price:d.price ? String(Math.round(parseFloat(String(d.price)))) : '', 
      unit_code:d.unit_code||'', 
      duration_months:String(d.duration_months||''), 
      start_rent:d.start_rent?d.start_rent.split('T')[0]:'', 
      end_rent:d.end_rent?d.end_rent.split('T')[0]:'', 
      department:d.department||'', 
      status:d.status||'Active' 
    });
    setFormErr('');
  };
  const openAdd   = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf        = (k:string,v:string) => setForm((f:any) => ({...f,[k]:v}));

  const save = async () => {
    if (!form.brand.trim())     { setFormErr('Brand wajib diisi'); return; }
    if (!form.model.trim())     { setFormErr('Model Unit wajib diisi'); return; }
    if (!form.company_id)       { setFormErr('Perusahaan wajib dipilih'); return; }
    setSaving(true);
    try {
      const item_name = mergeSpecs(form.brand, form.model, form.processor, form.os, form.ram, form.storage);
      
      const url = editRow ? `/api/rentals/${editRow.id}` : '/api/rentals';
      const res = await fetch(url, { 
        method:editRow?'PUT':'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          ...form, 
          item_name,
          company_id:parseInt(form.company_id)||null, 
          vendor_id:parseInt(form.vendor_id)||null, 
          price:parseNum(form.price), 
          duration_months:parseInt(form.duration_months)||null 
        }) 
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Gagal menyimpan'); }
      closeForm(); 
      load(page, appliedFilters);
      fetchKpi(appliedFilters);
    } catch(e:any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  const totalVal = rows.reduce((s,r) => s + parseFloat(String(r.price||0)), 0);

  const downloadCSV = async () => {
    setExporting(true);
    try {
      const res  = await fetch('/api/rentals?category=IT&limit=100000');
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal ekspor');

      const cols = [
        'No', 'Vendor Billing Ref', 'Nama Item', 'Tipe Device', 'Unit Code',
        'Perusahaan', 'Vendor', 'Harga/Bulan (Rp)', 'Durasi (Bln)',
        'Mulai Sewa', 'Akhir Sewa', 'Departemen', 'Status',
      ];

      const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;

      const dataRows = (json.data as any[]).map((r, i) => [
        i + 1,
        r.order_id        ?? '',
        r.item_name       ?? '',
        r.device_type     ?? '',
        r.unit_code       ?? '',
        r.company         ?? '',
        r.vendor_name     ?? '',
        r.price           ?? 0,
        r.duration_months ?? '',
        r.start_rent ? new Date(r.start_rent).toLocaleDateString('id-ID') : '',
        r.end_rent   ? new Date(r.end_rent).toLocaleDateString('id-ID')   : '',
        r.department  ?? '',
        r.status      ?? '',
      ].map(escape).join(','));

      const csv  = [cols.map(escape).join(','), ...dataRows].join('\r\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `it-rentals-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert('Gagal download: ' + e.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div><h1 className="header-title">IT Asset Rentals</h1><p className="header-subtitle">Kelola perangkat IT sewa, masa kontrak, dan vendor billing reference.</p></div>
        <div className="flex gap-2">
          <button type="button" className="btn" onClick={downloadCSV} disabled={exporting} title="Download semua data sebagai CSV">
            {exporting ? <Loader2 size={15} className="animate-spin"/> : <Download size={15}/>}
            {exporting ? 'Mengekspor...' : 'Download Excel'}
          </button>
        </div>
      </div>

      {/* Sync Success Message */}
      {syncMessage && (
        <div className="card border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 py-3 px-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge label="Sukses" colorClass="badge-emerald" />
            <p className="text-sm font-600 text-emerald-800 dark:text-emerald-300">{syncMessage}</p>
          </div>
          <button type="button" className="text-xs font-700 text-emerald-600 hover:text-emerald-800 dark:text-emerald-400" onClick={() => setSyncMsg(null)}>Tutup</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="card">
          <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Keseluruhan Rental IT</p>
          <p className="text-2xl font-900 text-text">{fmt(kpi.total_items)} item</p>
        </div>
        <div className="card">
          <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Biaya Rental IT</p>
          <p className="text-2xl font-900 text-blue">Rp {fmt(kpi.total_price)} / bulan</p>
        </div>
      </div>

      <div className="filter-bar animate-slide-up" style={{ position: 'relative', zIndex: 10 }}>
        <div className="search-box flex-1 min-w-[240px]">
          <Search size={15} className="search-icon" />
          <input 
            id="rent_search"
            type="text" 
            placeholder="Cari item, serial, billing ref, karyawan..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-premium w-full pl-9" 
            title="Cari Rental IT" 
            aria-label="Cari data penyewaan perangkat IT"
          />
        </div>
        
        <div className="w-[200px]">
          <SearchableSelect
            id="rnt_comp_filter"
            value={compFilter}
            onChange={v => setComp(String(v))}
            options={meta.companies.map((c: any) => ({ id: String(c.id), name: c.name }))}
            placeholder="— Semua Perusahaan —"
          />
        </div>

        <div className="flex gap-2">
          <button className="btn btn-primary flex items-center gap-1.5" onClick={handleSearch} title="Terapkan Filter dan Cari">
            <Search size={14} /> Cari
          </button>
          <button className="btn btn-outline" onClick={handleReset} title="Reset Filter">
            Reset
          </button>
        </div>

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
          <p className="text-xs text-text-3 mt-1 mb-4">Pastikan server database terhubung dan server Next.js telah dimuat ulang.</p>
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={()=>load(page)} title="Coba Memuat Ulang">Coba Lagi</button>
          </div>
        </div>
      ) : !hasSearched ? (
        <div className="animate-slide-up flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl shadow-sm text-center max-w-2xl mx-auto my-6 relative overflow-hidden" style={{ padding: '5rem 2rem' }}>
          {/* Decorative gradients */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-indigo-500/5 blur-3xl pointer-events-none"></div>

          {/* Modern Scanning HardDrive Animation */}
          <div className="relative w-28 h-36 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-center items-center shadow-inner mb-8 overflow-hidden">
            {/* Background scanner line */}
            <div className="scanner-line absolute left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-500/80"></div>
            
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <HardDrive size={32} className="animate-pulse" />
              </div>
              <span className="text-[9px] font-800 text-slate-400 uppercase tracking-widest">IT Rentals</span>
            </div>
          </div>

          <h2 className="text-lg font-950 text-slate-800 tracking-tight mb-2">Kontrak & Alokasi Sewa IT</h2>
          <p className="text-slate-400 text-xs font-600 max-w-sm mx-auto leading-relaxed">
            Konfigurasikan penyaringan di atas untuk menelusuri kontrak sewa dan rincian alokasi perangkat IT.
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
          <TableShell headers={[{label:'Vendor Billing Ref'},{label:'Item / Spesifikasi'},{label:'Karyawan / Pengguna'},{label:'Serial / Unit'},{label:'Masa Sewa'},{label:'Biaya (Rp)',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={8}>
            {rows.length===0 ? (
              <tr><td colSpan={8} className="py-14 text-center">
                <HardDrive size={36} className="text-text-3 mx-auto mb-3 block" />
                <div className="flex flex-col items-center">
                  <p className="text-sm-bold text-text-2">Tidak ada data rental IT ditemukan</p>
                  <p className="text-xs-muted mt-1 mb-4">Coba ubah filter dan klik Cari Data</p>
                </div>
              </td></tr>
            ) : rows.map((r) => {
              const expired = r.end_rent && new Date(r.end_rent) < new Date();
              const st = STAT_C[expired ? 'Expired' : (r.status || 'Active')] || STAT_C.default;
              return (
                <tr key={r.id} className="hover-row">
                  <td className="td-p font-mono text-blue text-xs font-700">{r.order_id||'—'}</td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{r.item_name}</div>
                    {r.device_type&&<div className="text-xs-muted mt-1">{r.device_type}</div>}
                  </td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{r.user_name||'—'}</div>
                    {r.user_email&&<div className="text-xs-muted mt-1">{r.user_email}</div>}
                  </td>
                  <td className="td-p text-sm text-text-2">{r.unit_code||'—'}</td>
                  <td className="td-p">
                    <div className="text-xs-muted">Mulai: {fmtDate(r.start_rent)}</div>
                    <div className={`text-xs-bold ${st.cls}`}>Akhir: {fmtDate(r.end_rent)}</div>
                  </td>
                  <td className="td-p text-right font-700 text-text">{fmt(parseFloat(String(r.price||0)))}</td>
                  <td className="td-p text-right"><Badge label={expired?'Expired':r.status||'—'} colorClass={st.colorClass}/></td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button type="button" title="Lihat detail rental" aria-label={`Lihat detail ${r.item_name}`} onClick={()=>openDetail(r.id)} className="btn-icon"><Eye size={14}/></button>
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
        <ModalShell title={detail?`IT Rental — ${detail.item_name}`:'Memuat…'} onClose={()=>setDetail(null)} size="md">
          {dlLoading||!detail ? <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div> : (
            <div className="flex flex-col gap-4">
              <div className="flex-between items-start">
                <div><h2 className="text-lg-black">{detail.item_name}</h2><p className="text-xs-muted mt-1">{detail.device_type||''} {detail.unit_code?`· ${detail.unit_code}`:''}</p></div>
                <Badge label={detail.status||'—'} colorClass={STAT_C[detail.status]?.colorClass||STAT_C.default.colorClass}/>
              </div>
              <div className="detail-grid">
                <SBox icon={<HardDrive size={14}/>} title="Detail Item IT">
                  <InfoRow label="Vendor Billing Ref" value={detail.order_id}/>
                  <InfoRow label="Tipe Perangkat"     value={detail.device_type}/>
                  <InfoRow label="Kode Unit"          value={detail.unit_code}/>
                  <InfoRow label="Perusahaan"         value={detail.company}/>
                  <InfoRow label="Departemen"         value={detail.department}/>
                  <InfoRow label="Karyawan"           value={detail.user_name}/>
                  <InfoRow label="Email"              value={detail.user_email}/>
                </SBox>
                <SBox title="Kontrak & Biaya">
                  <InfoRow label="Mulai Sewa"   value={fmtDate(detail.start_rent)}/>
                  <InfoRow label="Akhir Sewa"   value={fmtDate(detail.end_rent)}/>
                  <InfoRow label="Durasi"        value={detail.duration_months?`${detail.duration_months} bulan`:null}/>
                  <InfoRow label="Harga/bulan"  value={`Rp ${fmt(parseFloat(String(detail.price||0)))}`}/>
                </SBox>
              </div>
              <div className="modal-footer-actions">
                <button type="button" className="btn btn-primary" onClick={()=>setDetail(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}
    </div>
  );
}
