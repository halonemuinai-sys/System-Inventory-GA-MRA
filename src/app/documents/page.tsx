'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Trash2, AlertCircle, FileText } from 'lucide-react';
import { Badge, PaginationBar, TableShell, SearchableSelect } from '@/components/PageShared';
import {
  DocumentDetailModal, DocumentFormModal, docStatus,
  LegalDocument, LegalDocumentDetail, Meta, FormData
} from '@/components/DocumentComponents';

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
  doc_number:'', doc_title:'', doc_type_id:'', doc_subtype:'agreement', 
  division_id:'', mra_party_id:'', counter_party:'', vendor_id:'', 
  pic_internal:'', valid_from:'', valid_until:'', physical_location:'', 
  auto_renewal:'false', digital_doc_url:'', amount:'', notes:'', 
  status:'Active', sto_status:'' 
};

export default function DocumentsPage() {
  const [rows, setRows]             = useState<LegalDocument[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [filterDocType, setFilterDocType]   = useState('');
  const [filterMraParty, setFilterMraParty] = useState('');
  const [filterStatus, setFilterStatus]     = useState('');
  const [isSearched, setIsSearched]         = useState(false);
  const [meta, setMeta]             = useState<Meta>({ companies:[], docTypes:[], divisions:[], vendors:[] });
  const [detail, setDetail]         = useState<LegalDocumentDetail|null>(null);
  const [dlLoading, setDlLoading]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [editRow, setEditRow]       = useState<LegalDocumentDetail|null>(null);
  const [form, setForm]             = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');
  const LIMIT = 20;

  useEffect(() => {
    Promise.all([
      fetch('/api/assets/meta').then(r=>r.json()),
      fetch('/api/vendors/meta').then(r=>r.json()),
      fetch('/api/vendors?all=true').then(r=>r.json()),
    ]).then(([am, vm, av]) => setMeta(prev => ({
      ...prev,
      companies: am.companies||[],
      divisions: vm.divisions||[],
      vendors: av.data||[],
    }))).catch(()=>{});
    
    fetch('/api/documents/meta')
      .then(r=>r.json())
      .then(d => setMeta(m=>({...m, docTypes:d.docTypes||[]})))
      .catch(()=>{});
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(p),
        limit: String(LIMIT),
        ...(search && { search }),
        ...(filterDocType && { doc_type_id: filterDocType }),
        ...(filterMraParty && { mra_party_id: filterMraParty }),
        ...(filterStatus && { status: filterStatus }),
      });
      const res = await fetch(`/api/documents?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
      setIsSearched(true);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search, filterDocType, filterMraParty, filterStatus]);

  const handleSearch = () => {
    load(1);
  };

  const handleReset = () => {
    setSearch('');
    setFilterDocType('');
    setFilterMraParty('');
    setFilterStatus('');
    setRows([]);
    setTotal(0);
    setTotalPages(1);
    setPage(1);
    setIsSearched(false);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus dokumen "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== id));
    } catch { alert('Gagal menghapus dokumen'); }
  };

  const openDetail = async (id:number) => {
    setDlLoading(true); setDetail(null);
    const r = await fetch(`/api/documents/${id}`);
    setDetail(await r.json());
    setDlLoading(false); 
  };

  const openEdit = async (id:number) => {
    const r = await fetch(`/api/documents/${id}`); const d = await r.json(); setEditRow(d);
    setForm({ 
      doc_number:d.doc_number||'', 
      doc_title:d.doc_title||'', 
      doc_type_id:String(d.doc_type_id||''), 
      doc_subtype:d.doc_subtype||'agreement', 
      division_id:String(d.division_id||''), 
      mra_party_id:String(d.mra_party_id||''), 
      counter_party:d.counter_party||'', 
      vendor_id:String(d.vendor_id||''), 
      pic_internal:d.pic_internal||'', 
      valid_from:d.valid_from?d.valid_from.split('T')[0]:'', 
      valid_until:d.valid_until?d.valid_until.split('T')[0]:'', 
      physical_location:d.physical_location||'', 
      auto_renewal:String(d.auto_renewal||false), 
      digital_doc_url:d.digital_doc_url||'', 
      amount:String(d.amount||''), 
      notes:d.notes||'', 
      status:d.status||'Active', 
      sto_status:d.sto_status||'' 
    });
    setFormErr('');
  };

  const openAdd   = () => { setEditRow(null); setForm(EMPTY_FORM); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY_FORM); setFormErr(''); };
  const sf        = (k: keyof FormData, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.doc_number.trim()) { setFormErr('Nomor dokumen wajib diisi'); return; }
    setSaving(true);
    try {
      const url = editRow ? `/api/documents/${editRow.id}` : '/api/documents';
      const res = await fetch(url, { 
        method:editRow?'PUT':'POST', 
        headers:{'Content-Type':'application/json'}, 
        body: JSON.stringify({ 
          ...form, 
          doc_type_id:parseInt(form.doc_type_id)||null, 
          division_id:parseInt(form.division_id)||null, 
          mra_party_id:parseInt(form.mra_party_id)||null, 
          vendor_id:parseInt(form.vendor_id)||null, 
          amount:parseNum(form.amount)||null, 
          auto_renewal:form.auto_renewal==='true' 
        }) 
      });
      if (!res.ok) { const e=await res.json(); throw new Error(e.error||'Gagal menyimpan'); }
      closeForm(); load(page);
    } catch(e:any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div><h1 className="header-title">Legal Documents</h1><p className="header-subtitle">Arsip dan pantau semua perjanjian, PKS, dan dokumen resmi MRA Group.</p></div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Dokumen Baru"><Plus size={16}/> Tambah Dokumen</button>
      </div>

      <div className="filter-bar animate-slide-up flex flex-wrap gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs mb-6" style={{ position: 'relative', zIndex: 10 }}>
        <div className="search-box flex-1 min-w-[240px]">
          <Search size={15} className="search-icon text-slate-400"/>
          <input 
            id="doc_search"
            type="text" 
            placeholder="Cari nomor dokumen, judul, lawan..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="input-premium w-full pl-9 text-slate-700 font-500" 
            title="Cari Dokumen"
            aria-label="Cari dokumen legal"
          />
        </div>

        <div className="w-[180px]">
          <SearchableSelect
            id="filter_doc_type"
            value={filterDocType}
            onChange={v => setFilterDocType(v)}
            options={meta.docTypes.map(t => ({ id: t.id, name: t.name }))}
            placeholder="— Semua Tipe —"
          />
        </div>

        <div className="w-[200px]">
          <SearchableSelect
            id="filter_mra_party"
            value={filterMraParty}
            onChange={v => setFilterMraParty(v)}
            options={meta.companies.map(c => ({ id: c.id, name: c.name }))}
            placeholder="— Semua Pihak MRA —"
          />
        </div>

        <div className="w-[160px]">
          <SearchableSelect
            id="filter_status"
            value={filterStatus}
            onChange={v => setFilterStatus(v)}
            options={[
              { id: 'Active', name: 'Active' },
              { id: 'Expired', name: 'Expired' },
              { id: 'Terminated', name: 'Terminated' }
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

          {/* Modern Scanning Document Animation */}
          <div className="relative w-28 h-36 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between p-5 shadow-inner mb-8 overflow-hidden">
            {/* Background scanner line */}
            <div className="scanner-line absolute left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-600 shadow-md shadow-blue-500/80"></div>
            
            {/* Fake document text lines */}
            <div className="w-1/2 h-1.5 bg-slate-200 rounded-full"></div>
            <div className="w-full h-1.5 bg-slate-200/70 rounded-full"></div>
            <div className="w-3/4 h-1.5 bg-slate-200/70 rounded-full"></div>
            <div className="w-full h-1.5 bg-slate-200/70 rounded-full"></div>
            <div className="w-5/6 h-1.5 bg-slate-200/70 rounded-full"></div>
            <div className="w-2/3 h-1.5 bg-slate-200/70 rounded-full"></div>
          </div>

          <h2 className="text-lg font-950 text-slate-800 tracking-tight mb-2">Arsip Dokumen Legal</h2>
          <p className="text-slate-400 text-xs font-600 max-w-sm mx-auto leading-relaxed">
            Tentukan kriteria filter atau masukkan kata kunci di atas untuk menelusuri arsip dokumen resmi secara instan.
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
          <TableShell headers={[{label:'No. Dokumen'},{label:'Judul'},{label:'Tipe'},{label:'Pihak Terkait'},{label:'Masa Berlaku'},{label:'Nilai (Rp)',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={8}>
            {rows.length===0 ? (
              <tr><td colSpan={8} className="py-14 text-center">
                <FileText size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada dokumen ditemukan</p>
              </td></tr>
            ) : rows.map((doc,i) => {
              const st = docStatus(doc.valid_until);
              return (
                <tr key={doc.id} className="hover-row">
                  <td className="td-p font-mono text-blue text-xs font-700">{doc.doc_number}</td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{doc.doc_title||'Untitled'}</div>
                    {doc.auto_renewal&&<div className="text-xs-bold text-emerald">AUTO RENEWAL</div>}
                  </td>
                  <td className="td-p">
                    <div className="text-sm text-text">{doc.doc_type||'—'}</div>
                    <div className="text-xs-muted capitalize">{doc.doc_subtype||''}</div>
                  </td>
                  <td className="td-p text-sm-muted">{doc.counter_party||'—'}</td>
                  <td className="td-p">
                    <div className="text-xs-muted">Mulai: {fmtDate(doc.valid_from)}</div>
                    <div className={`text-xs-bold ${st.cls}`}>Akhir: {fmtDate(doc.valid_until)}</div>
                  </td>
                  <td className="td-p text-right text-sm-bold text-text">{doc.amount?`Rp ${fmt(parseFloat(String(doc.amount)))}`:'-'}</td>
                  <td className="td-p text-right"><Badge label={st.label} colorClass={st.colorClass}/></td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button className="btn-icon" title="Lihat Detail" aria-label="Lihat detail dokumen" onClick={() => openDetail(doc.id)}><Eye size={14}/></button>
                      <button className="btn-icon-blue" title="Edit Dokumen" aria-label="Edit dokumen" onClick={() => openEdit(doc.id)}><Edit2 size={14}/></button>
                      <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label="Hapus dokumen" onClick={() => handleDelete(doc.id, doc.doc_number)}><Trash2 size={14}/></button>
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
      <DocumentDetailModal
        detail={detail}
        dlLoading={dlLoading}
        onClose={() => setDetail(null)}
        openEdit={openEdit}
        fmtDate={fmtDate}
        fmt={fmt}
      />

      {/* Form Modal (Add/Edit) */}
      <DocumentFormModal
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
