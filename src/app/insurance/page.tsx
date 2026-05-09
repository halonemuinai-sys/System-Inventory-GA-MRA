'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Save, ShieldCheck, AlertCircle } from 'lucide-react';
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
  pic:'', contact_person:'', information:'', status:'Active' 
};

export default function InsurancePage() {
  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string|null>(null);
  const [search, setSearch]         = useState('');
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
      const qs = new URLSearchParams({ page:String(p), limit:String(LIMIT), ...(search&&{search}) });
      const res = await fetch(`/api/insurance?${qs}`);
      const j = await res.json();
      setRows(j.data); setTotal(j.total); setTotalPages(j.totalPages); setPage(j.page);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(1); }, [load]);

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
      premium_idr:String(d.premium_idr||''), 
      coverage_idr:String(d.coverage_idr||''), 
      broker:d.broker||'', 
      pic:d.pic||'', 
      contact_person:d.contact_person||'', 
      information:d.information||'', 
      status:d.status||'Active' 
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
      <div className="page-header">
        <div><h1 className="header-title">Insurance Policies</h1><p className="header-subtitle">Kelola polis asuransi, masa berlaku, dan premi tahunan.</p></div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Polis Baru"><Plus size={16}/> Tambah Polis</button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input 
            id="ins_search"
            type="text" 
            placeholder="Cari nomor polis, perusahaan asuransi, plat..." 
            value={search} 
            onChange={e=>{setSearch(e.target.value);setPage(1);}} 
            className="input-premium w-full pl-9" 
            title="Cari Polis"
            aria-label="Cari data polis asuransi"
          />
        </div>
        <div className="summary-box">
          <div className="summary-item">
            <span className="text-text-3">Total: </span><span className="font-800 text-text">{fmt(total)} polis</span>
          </div>
          <div className="summary-item-blue">
            <span className="text-blue font-600">Premi: </span><span className="font-800 text-blue">Rp {fmt(totalPremium)}</span>
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
          <TableShell headers={[{label:'No. Polis'},{label:'Perusahaan Asuransi'},{label:'Tipe / Kategori'},{label:'Kendaraan'},{label:'Masa Berlaku'},{label:'Premi (Rp)',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={8}>
            {rows.length===0 ? (
              <tr><td colSpan={8} className="py-14 text-center">
                <ShieldCheck size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada polis ditemukan</p>
              </td></tr>
            ) : rows.map((ins,i) => {
              const st = insStatus(ins.end_date);
              return (
                <tr key={ins.id} className="hover-row">
                  <td className="td-p font-mono text-blue text-xs font-700">{ins.policy_number||'—'}</td>
                  <td className="td-p font-600 text-text">{ins.insurance_company||'—'}</td>
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
        <ModalShell title={detail?`Polis — ${detail.policy_number||detail.insurance_company}`:'Memuat…'} onClose={()=>setDetail(null)} size="md">
          {dlLoading||!detail ? <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div> : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg-black">{detail.insurance_company||'—'}</h2>
                  <p className="text-xs-muted mt-1">{detail.insurance_type||''} {detail.category?`· ${detail.category}`:''}</p>
                </div>
                <Badge label={insStatus(detail.end_date).label} colorClass={insStatus(detail.end_date).colorClass}/>
              </div>
              <div className="detail-grid">
                <SBox icon={<ShieldCheck size={14}/>} title="Polis">
                  <InfoRow label="No. Polis"    value={detail.policy_number}/>
                  <InfoRow label="Tipe"          value={detail.insurance_type}/>
                  <InfoRow label="Kategori"      value={detail.category}/>
                  <InfoRow label="Perusahaan"   value={detail.company}/>
                  <InfoRow label="Broker"        value={detail.broker}/>
                </SBox>
                <SBox title="Keuangan">
                  <InfoRow label="Mulai"         value={fmtDate(detail.start_date)}/>
                  <InfoRow label="Berakhir"      value={fmtDate(detail.end_date)}/>
                  <InfoRow label="Premi (IDR)"   value={`Rp ${fmt(parseFloat(String(detail.premium_idr||0)))}`}/>
                  <InfoRow label="Coverage (IDR)" value={detail.coverage_idr?`Rp ${fmt(parseFloat(String(detail.coverage_idr)))}`:null}/>
                </SBox>
              </div>
              <SBox title="Aset & Kontak">
                <div className="grid grid-cols-3 gap-2">
                  <div><p className="text-xs-muted-bold">Kendaraan</p><p className="text-sm-bold text-text">{detail.plate_number||'—'}</p></div>
                  <div><p className="text-xs-muted-bold">Tipe</p><p className="text-sm-bold text-text">{detail.vehicle_type||'—'}</p></div>
                  <div><p className="text-xs-muted-bold">PIC</p><p className="text-sm-bold text-text">{detail.pic||'—'}</p></div>
                </div>
              </SBox>
              {detail.information&&<div className="info-card"><p className="text-xs-bold mb-1">Informasi</p><p className="text-sm-muted lh-1-6">{detail.information}</p></div>}
              <div className="modal-footer-actions">
                <button className="btn" onClick={()=>{setDetail(null);openEdit(detail.id);}} title="Edit Polis"><Edit2 size={14}/> Edit</button>
                <button className="btn btn-primary" onClick={()=>setDetail(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* Add/Edit */}
      {(showAdd||editRow)&&(
        <ModalShell title={editRow?`Edit Polis`:'Tambah Polis Asuransi'} onClose={closeForm} size="md">
          <div className="flex flex-col gap-4">
            <FormError msg={formErr}/>
            <SLabel>Informasi Polis</SLabel>
            <div className="detail-grid">
              <FF label="Perusahaan MRA" id="ins_mra_co" required><select id="ins_mra_co" value={form.company_id} onChange={e=>sf('company_id',e.target.value)} className="input-premium" title="Pilih Perusahaan"><option value="">— Pilih —</option>{meta.companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></FF>
              <FF label="Perusahaan Asuransi" id="ins_ins_co"><input id="ins_ins_co" type="text" value={form.insurance_company} onChange={e=>sf('insurance_company',e.target.value)} placeholder="PT Asuransi..." className="input-premium" title="Perusahaan Asuransi"/></FF>
              <FF label="Tipe Asuransi" id="ins_type"><input id="ins_type" type="text" value={form.insurance_type} onChange={e=>sf('insurance_type',e.target.value)} placeholder="Vehicle / Building / dll" className="input-premium" title="Tipe Asuransi"/></FF>
              <FF label="Kategori" id="ins_cat"><input id="ins_cat" type="text" value={form.category} onChange={e=>sf('category',e.target.value)} placeholder="Comprehensive / TLO" className="input-premium" title="Kategori"/></FF>
              <FF label="Nomor Polis" id="ins_no"><input id="ins_no" type="text" value={form.policy_number} onChange={e=>sf('policy_number',e.target.value)} placeholder="Polis Number" className="input-premium" title="Nomor Polis"/></FF>
              <FF label="Kendaraan Terkait" id="ins_veh"><select id="ins_veh" value={form.vehicle_id} onChange={e=>sf('vehicle_id',e.target.value)} className="input-premium" title="Pilih Kendaraan"><option value="">— Tidak ada —</option>{meta.vehicles.map((v:any)=><option key={v.id} value={v.id}>{v.plate_number} {v.brand_model?`(${v.brand_model})`:''}</option>)}</select></FF>
              <FF label="Mulai Berlaku" id="ins_start"><input id="ins_start" type="date" value={form.start_date} onChange={e=>sf('start_date',e.target.value)} className="input-premium" title="Mulai Berlaku" /></FF>
              <FF label="Berakhir" id="ins_end"><input id="ins_end" type="date" value={form.end_date} onChange={e=>sf('end_date',e.target.value)} className="input-premium" title="Berakhir" /></FF>
              <FF label="Premi Tahunan (Rp)" id="ins_prem"><input id="ins_prem" type="text" value={fmtCurrency(form.premium_idr)} onChange={e=>sf('premium_idr',e.target.value.replace(/\D/g,''))} placeholder="0" className="input-premium" title="Premi Tahunan"/></FF>
              <FF label="Coverage IDR" id="ins_cov"><input id="ins_cov" type="text" value={fmtCurrency(form.coverage_idr)} onChange={e=>sf('coverage_idr',e.target.value.replace(/\D/g,''))} placeholder="0" className="input-premium" title="Coverage"/></FF>
              <FF label="Broker" id="ins_brok"><input id="ins_brok" type="text" value={form.broker} onChange={e=>sf('broker',e.target.value)} placeholder="Broker Name" className="input-premium" title="Broker"/></FF>
              <FF label="PIC / Agent" id="ins_pic"><input id="ins_pic" type="text" value={form.pic} onChange={e=>sf('pic',e.target.value)} placeholder="PIC / Agent" className="input-premium" title="PIC / Agent"/></FF>
            </div>
            <FF label="Informasi Tambahan" id="ins_info"><textarea id="ins_info" rows={2} value={form.information} onChange={e=>sf('information',e.target.value)} placeholder="Catatan tambahan..." className="input-premium resize-y" title="Informasi Tambahan"/></FF>
            <div className="modal-footer-border">
              <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
              <button className="btn btn-primary min-w-130" onClick={save} disabled={saving} title={editRow?'Simpan Perubahan':'Tambah Polis'}>
                {saving?<><Loader2 size={14} className="animate-spin"/> Menyimpan…</>:<><Save size={14}/> {editRow?'Simpan':'Tambah'}</>}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
