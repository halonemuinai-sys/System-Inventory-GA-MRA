'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Plus, Eye, Edit2, Loader2, Truck, AlertCircle, Trash2, Building2 } from 'lucide-react';
import { Badge, PaginationBar, TableShell } from '@/components/PageShared';
import { VehicleDetailModal, VehicleFormModal, VehicleDeleteModal } from '@/components/VehicleComponents';

const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
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
  const [compFilter, setCompFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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
      const qs = new URLSearchParams({ 
        page: String(p), 
        limit: String(LIMIT), 
        ...(search && { search }),
        ...(compFilter && { company: compFilter }),
        ...(statusFilter && { status: statusFilter })
      });
      const res = await fetch(`/api/vehicles?${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data kendaraan');
      const j = await res.json();
      setRows(j.data || []); setTotal(j.total || 0); setTotalPages(j.totalPages || 1); setPage(j.page || 1);
    } catch(e:any) { setError(e.message); } finally { setLoading(false); }
  }, [search, compFilter, statusFilter]);

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
          last_km:Math.round(parseNum(form.last_km))||null 
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

        <select 
          id="veh_comp_filter"
          value={compFilter} 
          onChange={e=>{setCompFilter(e.target.value); setPage(1);}}
          className="input-premium w-auto max-w-[150px]" 
          title="Filter Perusahaan"
        >
          <option value="">Semua Perusahaan</option>
          {companies.map((c:any)=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          id="veh_status_filter"
          value={statusFilter} 
          onChange={e=>{setStatusFilter(e.target.value); setPage(1);}}
          className="input-premium w-auto max-w-[150px]" 
          title="Filter Status"
        >
          <option value="">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Tidak Aktif">Tidak Aktif</option>
          <option value="Rusak">Rusak</option>
        </select>

        <div className="summary-item ml-auto">
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
          <TableShell headers={[{label:'Plat Nomor'},{label:'Brand/Model'},{label:'Tipe'},{label:'Perusahaan'},{label:'Tahun/Warna'},{label:'Pajak',right:true},{label:'Amount',right:true},{label:'Status',right:true},{label:'Aksi',right:true}]} loading={loading} colSpan={9}>
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
                    <div className="flex items-center gap-1 text-sm text-text-2">
                      <Building2 size={12} className="shrink-0 text-text-3" />
                      <span>{v.company||'—'}</span>
                    </div>
                  </td>
                  <td className="td-p text-sm-muted">{v.year||'—'} {v.color?`/ ${v.color}`:''}</td>
                  <td className="td-p text-right">
                    <span className={`text-xs-bold ${taxExpired ? 'text-rose' : 'text-text-2'}`}>{fmtDate(v.tax_date)}</span>
                    {taxExpired&&<div className="text-xxs-bold text-rose">EXPIRED</div>}
                  </td>
                  <td className="td-p text-sm-muted text-right">{v.last_km?`Rp ${fmt(v.last_km)}`:'—'}</td>
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
      <VehicleDetailModal 
        detail={detail} 
        dlLoading={dlLoading} 
        onClose={() => setDetail(null)} 
        onEdit={(id) => { setDetail(null); openEdit(id); }} 
        STAT_C={STAT_C} 
      />

      {/* Add/Edit Modal */}
      <VehicleFormModal 
        isOpen={showAdd || !!editRow} 
        editRow={editRow} 
        form={form} 
        formErr={formErr} 
        saving={saving} 
        companies={companies} 
        onClose={closeForm} 
        onSave={save} 
        onChange={sf} 
        fmtCurrency={fmtCurrency} 
      />

      {/* Delete Modal */}
      <VehicleDeleteModal 
        deleteItem={deleteItem} 
        deleting={deleting} 
        onClose={() => setDeleteItem(null)} 
        onConfirm={executeDelete} 
      />
    </div>
  );
}
