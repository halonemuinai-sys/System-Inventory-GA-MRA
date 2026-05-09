'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Save, FileText, AlertCircle } from 'lucide-react';
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

function docStatus(validUntil: string) {
  if (!validUntil) return { label:'Active', colorClass:'badge-emerald', cls:'text-emerald' };
  const d = new Date(validUntil); const now = new Date();
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  if (diff < 0)  return { label:'Expired', colorClass:'badge-rose', cls:'text-rose' };
  if (diff <= 30) return { label:'Renewal', colorClass:'badge-amber', cls:'text-amber' };
  return { label:'Active', colorClass:'badge-emerald', cls:'text-emerald' };
}

const EMPTY = { 
  doc_number:'', doc_title:'', doc_type_id:'', doc_subtype:'agreement', 
  division_id:'', mra_party_id:'', counter_party:'', vendor_id:'', 
  pic_internal:'', valid_from:'', valid_until:'', physical_location:'', 
  auto_renewal:'false', digital_doc_url:'', amount:'', notes:'', 
  status:'Active', sto_status:'' 
};

export default function DocumentsPage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
  const [meta, setMeta]             = useState<{companies:any[];docTypes:any[];divisions:any[];vendors:any[]}>({companies:[],docTypes:[],divisions:[],vendors:[]});
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
      fetch('/api/vendors/meta').then(r=>r.json()),
    ]).then(([am, vm]) => setMeta(prev => ({
      ...prev,
      companies: am.companies||[],
      divisions: vm.divisions||[],
    }))).catch(()=>{});
    
    fetch('/api/documents/meta')
      .then(r=>r.json())
      .then(d => setMeta(m=>({...m, docTypes:d.docTypes||[], vendors:d.vendors||[]})))
      .catch(()=>{});
  }, []);

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ page:String(p), limit:String(LIMIT), ...(search&&{search}) });
      const res = await fetch(`/api/documents?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

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

  const openAdd   = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf        = (k:string,v:string) => setForm((f:any) => ({...f,[k]:v}));

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

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input 
            id="doc_search"
            type="text" 
            placeholder="Cari nomor dokumen, judul, vendor..." 
            value={search} 
            onChange={e=>{setSearch(e.target.value);setPage(1);}} 
            className="input-premium w-full pl-9" 
            title="Cari Dokumen"
            aria-label="Cari dokumen legal"
          />
        </div>
        <div className="summary-item">
          <span className="text-text-3">Total: </span><span className="font-800 text-text">{fmt(total)} dokumen</span>
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
        <ModalShell title={detail?`Dokumen — ${detail.doc_number}`:'Memuat…'} onClose={()=>setDetail(null)} size="md">
          {dlLoading||!detail ? <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div> : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg-black">{detail.doc_title||'Untitled Document'}</h2>
                  <p className="text-xs-muted mt-1">{detail.doc_type||''} {detail.doc_subtype?`· ${detail.doc_subtype}`:''}</p>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge label={docStatus(detail.valid_until).label} colorClass={docStatus(detail.valid_until).colorClass}/>
                  {detail.auto_renewal&&<Badge label="Auto Renewal" colorClass="badge-emerald"/>}
                </div>
              </div>
              <div className="detail-grid">
                <SBox icon={<FileText size={14}/>} title="Identitas Dokumen">
                  <InfoRow label="No. Dokumen"   value={detail.doc_number}/>
                  <InfoRow label="Tipe"           value={detail.doc_type}/>
                  <InfoRow label="Pihak MRA"     value={detail.company}/>
                  <InfoRow label="Divisi"         value={detail.division}/>
                  <InfoRow label="PIC Internal"  value={detail.pic_internal}/>
                  <InfoRow label="Lokasi Fisik"  value={detail.physical_location}/>
                </SBox>
                <SBox title="Pihak Lawan & Kontrak">
                  <InfoRow label="Counter Party" value={detail.counter_party}/>
                  <InfoRow label="Vendor"        value={detail.vendor_name}/>
                  <InfoRow label="Berlaku Mulai" value={fmtDate(detail.valid_from)}/>
                  <InfoRow label="Berakhir"      value={fmtDate(detail.valid_until)}/>
                  <InfoRow label="Nilai"         value={detail.amount?`Rp ${fmt(parseFloat(String(detail.amount)))}`:null}/>
                  <InfoRow label="STO Status"    value={detail.sto_status}/>
                </SBox>
              </div>
              {detail.notes&&<div className="info-card"><p className="text-xs-bold mb-1">Catatan</p><p className="text-sm-muted lh-1-6">{detail.notes}</p></div>}
              {detail.digital_doc_url&&<div className="summary-item-blue w-full"><p className="text-xs-bold text-blue mb-1">Link Dokumen Digital</p><a href={detail.digital_doc_url} target="_blank" rel="noreferrer" className="text-blue text-sm font-semibold truncate block" title="Buka Dokumen Digital">{detail.digital_doc_url}</a></div>}
              <div className="modal-footer-actions">
                <button className="btn" onClick={()=>{setDetail(null);openEdit(detail.id);}} title="Edit Dokumen"><Edit2 size={14}/> Edit</button>
                <button className="btn btn-primary" onClick={()=>setDetail(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* Add/Edit */}
      {(showAdd||editRow)&&(
        <ModalShell title={editRow?`Edit Dokumen`:'Tambah Dokumen'} onClose={closeForm} size="lg">
          <div className="flex flex-col gap-4">
            <FormError msg={formErr}/>
            <SLabel>Identitas Dokumen</SLabel>
            <div className="detail-grid">
              <FF label="Nomor Dokumen" id="doc_number" required><input id="doc_number" type="text" value={form.doc_number} onChange={e=>sf('doc_number',e.target.value)} placeholder="PKS/2026/001" className="input-premium" title="Nomor Dokumen"/></FF>
              <FF label="Judul Dokumen" id="doc_title"><input id="doc_title" type="text" value={form.doc_title} onChange={e=>sf('doc_title',e.target.value)} placeholder="Judul Dokumen" className="input-premium" title="Judul Dokumen"/></FF>
              <FF label="Tipe Dokumen" id="doc_type"><select id="doc_type" value={form.doc_type_id} onChange={e=>sf('doc_type_id',e.target.value)} className="input-premium" title="Pilih Tipe"><option value="">— Pilih —</option>{meta.docTypes.map((t:any)=><option key={t.id} value={t.id}>{t.name}</option>)}</select></FF>
              <FF label="Sub-tipe" id="doc_subtype"><select id="doc_subtype" value={form.doc_subtype} onChange={e=>sf('doc_subtype',e.target.value)} className="input-premium" title="Pilih Sub-tipe"><option value="agreement">Agreement</option><option value="ba_sale">BA Penjualan</option></select></FF>
              <FF label="Pihak MRA" id="mra_party"><select id="mra_party" value={form.mra_party_id} onChange={e=>sf('mra_party_id',e.target.value)} className="input-premium" title="Pilih Perusahaan"><option value="">— Pilih —</option>{meta.companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FF>
              <FF label="Divisi" id="division"><select id="division" value={form.division_id} onChange={e=>sf('division_id',e.target.value)} className="input-premium" title="Pilih Divisi"><option value="">— Pilih —</option>{meta.divisions.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></FF>
              <FF label="Counter Party / Pihak Lawan" id="counter_party"><input id="counter_party" type="text" value={form.counter_party} onChange={e=>sf('counter_party',e.target.value)} placeholder="Nama Pihak Lawan" className="input-premium" title="Pihak Lawan"/></FF>
              <FF label="Vendor Terkait" id="vendor"><select id="vendor" value={form.vendor_id} onChange={e=>sf('vendor_id',e.target.value)} className="input-premium" title="Pilih Vendor"><option value="">— Tidak ada —</option>{meta.vendors.map((v:any)=><option key={v.id} value={v.id}>{v.name}</option>)}</select></FF>
              <FF label="PIC Internal" id="pic_internal"><input id="pic_internal" type="text" value={form.pic_internal} onChange={e=>sf('pic_internal',e.target.value)} placeholder="Nama PIC" className="input-premium" title="PIC Internal"/></FF>
              <FF label="Lokasi Fisik Arsip" id="phys_loc"><input id="phys_loc" type="text" value={form.physical_location} onChange={e=>sf('physical_location',e.target.value)} placeholder="Gedung / Lantai / Box" className="input-premium" title="Lokasi Fisik"/></FF>
              <FF label="Berlaku Mulai" id="v_from"><input id="v_from" type="date" value={form.valid_from} onChange={e=>sf('valid_from',e.target.value)} className="input-premium" title="Mulai Berlaku" /></FF>
              <FF label="Berakhir" id="v_until"><input id="v_until" type="date" value={form.valid_until} onChange={e=>sf('valid_until',e.target.value)} className="input-premium" title="Berakhir" /></FF>
              <FF label="Nilai Kontrak (Rp)" id="amount"><input id="amount" type="text" value={fmtCurrency(form.amount)} onChange={e=>sf('amount',e.target.value.replace(/\D/g,''))} placeholder="0" className="input-premium" title="Nilai Kontrak"/></FF>
              <FF label="Auto Renewal" id="auto_r"><select id="auto_r" value={form.auto_renewal} onChange={e=>sf('auto_renewal',e.target.value)} className="input-premium" title="Auto Renewal"><option value="false">Tidak</option><option value="true">Ya</option></select></FF>
              <FF label="Status" id="status"><select id="status" value={form.status} onChange={e=>sf('status',e.target.value)} className="input-premium" title="Status"><option value="Active">Active</option><option value="Expired">Expired</option><option value="Terminated">Terminated</option></select></FF>
              <FF label="STO Status" id="sto"><input id="sto" type="text" value={form.sto_status} onChange={e=>sf('sto_status',e.target.value)} placeholder="STO Status" className="input-premium" title="STO Status"/></FF>
            </div>
            <FF label="Link Dokumen Digital (URL)" id="dig_url"><input id="dig_url" type="url" value={form.digital_doc_url} onChange={e=>sf('digital_doc_url',e.target.value)} placeholder="https://..." className="input-premium" title="Link Dokumen Digital"/></FF>
            <FF label="Catatan" id="notes"><textarea id="notes" rows={2} value={form.notes} onChange={e=>sf('notes',e.target.value)} placeholder="Catatan tambahan..." className="input-premium resize-y" title="Catatan"/></FF>
            <div className="modal-footer-border">
              <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
              <button className="btn btn-primary min-w-130" onClick={save} disabled={saving} title={editRow?'Simpan Perubahan':'Tambah Dokumen'}>
                {saving?<><Loader2 size={14} className="animate-spin"/> Menyimpan…</>:<><Save size={14}/> {editRow?'Simpan':'Tambah'}</>}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
