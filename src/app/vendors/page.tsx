'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit2, Phone, Mail,
  RefreshCw, Trash2, AlertCircle, Users, Handshake, Coins, Play
} from 'lucide-react';
import { Badge, PaginationBar, TableShell } from '@/components/PageShared';
import {
  Stars, VendorDetailModal, VendorFormModal,
  Vendor, VendorDetail, Meta, FormData, STAT_CLS
} from '@/components/VendorComponents';

// ── Helpers ───────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);

const EMPTY_FORM: FormData = {
  vendor_code: '', vendor_name: '',
  vendor_category_id: '', expense_category_id: '',
  detail: '', division_id: '', partnership_company_id: '',
  pic_name: '', pic_position: '', phone: '', email: '',
  address: '', npwp: '',
  bank_id: '', account_name: '', account_number: '',
  contract_start: '', contract_end: '',
  top_days: '', contract_value: '',
  review_status: '', rating: '', status: 'Active',
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

// ═════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function VendorsPage() {
  const [vendors, setVendors]       = useState<Vendor[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [statFilter, setStat]   = useState('');

  const [tempSearch, setTempSearch] = useState('');
  const [tempCat, setTempCat]       = useState('');
  const [tempStat, setTempStat]     = useState('');
  const [hasProcessed, setHasProcessed] = useState(false);

  const [meta, setMeta] = useState<Meta>({
    categories: [], expenseCategories: [], divisions: [], companies: [], banks: [],
  });

  const [detailVendor, setDetailVendor] = useState<VendorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAdd, setShowAdd]           = useState(false);
  const [editVendor, setEditVendor]     = useState<VendorDetail | null>(null);

  const [form, setForm]       = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [formError, setFormError] = useState('');

  const LIMIT = 20;

  // Load meta
  useEffect(() => {
    fetch('/api/vendors/meta').then(r => r.json()).then(setMeta).catch(() => {});
  }, []);

  // Fetch vendors
  const fetchVendors = useCallback(async (
    p: number,
    currentSearch?: string,
    currentCat?: string,
    currentStat?: string
  ) => {
    setLoading(true); setError(null);
    const activeSearch = currentSearch !== undefined ? currentSearch : search;
    const activeCat    = currentCat    !== undefined ? currentCat    : catFilter;
    const activeStat   = currentStat   !== undefined ? currentStat   : statFilter;

    try {
      const qs = new URLSearchParams({
        page: String(p), limit: String(LIMIT),
        ...(activeSearch && { search: activeSearch }),
        ...(activeCat    && { category: activeCat }),
        ...(activeStat   && { status: activeStat }),
      });
      const res  = await fetch(`/api/vendors?${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data vendor');
      const json = await res.json();
      setVendors(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPage(json.page);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [search, catFilter, statFilter]);

  const handlePageChange = (p: number) => {
    setPage(p);
    if (hasProcessed) {
      fetchVendors(p);
    }
  };

  const handleProcess = () => {
    const isSearchChanged = tempSearch !== search;
    const isCatChanged = tempCat !== catFilter;
    const isStatChanged = tempStat !== statFilter;

    if (!isSearchChanged && !isCatChanged && !isStatChanged && hasProcessed) {
      fetchVendors(1);
    } else {
      setSearch(tempSearch);
      setCat(tempCat);
      setStat(tempStat);
      setPage(1);
      setHasProcessed(true);
      fetchVendors(1, tempSearch, tempCat, tempStat);
    }
  };

  // Open detail
  const openDetail = async (id: number) => {
    setDetailLoading(true); setDetailVendor(null);
    try {
      const res = await fetch(`/api/vendors/${id}`);
      setDetailVendor(await res.json());
    } finally { setDetailLoading(false); }
  };

  // Open edit
  const openEdit = async (id: number) => {
    const res = await fetch(`/api/vendors/${id}`);
    const d: VendorDetail = await res.json();
    setEditVendor(d);
    setForm({
      vendor_code:             d.vendor_code            || '',
      vendor_name:             d.vendor_name            || '',
      vendor_category_id:      String(d.vendor_category_id    || ''),
      expense_category_id:     String(d.expense_category_id   || ''),
      detail:                  d.detail                  || '',
      division_id:             String(d.division_id           || ''),
      partnership_company_id:  String(d.partnership_company_id || ''),
      pic_name:                d.pic_name               || '',
      pic_position:            d.pic_position           || '',
      phone:                   d.phone                  || '',
      email:                   d.email                  || '',
      address:                 d.address                || '',
      npwp:                    d.npwp                   || '',
      bank_id:                 String(d.bank_id          || ''),
      account_name:            d.account_name           || '',
      account_number:          d.account_number         || '',
      contract_start:          d.contract_start ? d.contract_start.split('T')[0] : '',
      contract_end:            d.contract_end   ? d.contract_end.split('T')[0]   : '',
      top_days:                String(d.top_days         || ''),
      contract_value:          String(d.contract_value  || ''),
      review_status:           d.review_status          || '',
      rating:                  String(d.rating           || ''),
      status:                  d.status                  || 'Active',
    });
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.vendor_name.trim()) { setFormError('Nama vendor wajib diisi'); return; }
    setSaving(true);
    try {
      const isEdit = !!editVendor;
      const url    = isEdit ? `/api/vendors/${editVendor!.id}` : '/api/vendors';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          vendor_category_id:     parseInt(form.vendor_category_id)    || null,
          expense_category_id:    parseInt(form.expense_category_id)   || null,
          division_id:            parseInt(form.division_id)           || null,
          partnership_company_id: parseInt(form.partnership_company_id)|| null,
          bank_id:                parseInt(form.bank_id)               || null,
          top_days:               parseInt(form.top_days)              || null,
          contract_value:         parseNum(form.contract_value),
          rating:                 parseInt(form.rating)                || null,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal menyimpan'); }
      setShowAdd(false); setEditVendor(null); setForm(EMPTY_FORM);
      if (!hasProcessed) {
        setHasProcessed(true);
      }
      fetchVendors(page);
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus vendor "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/vendors/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setVendors(prev => prev.filter(v => v.id !== id));
    } catch { alert('Gagal menghapus vendor'); }
  };

  const openAdd  = () => { setEditVendor(null); setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditVendor(null); setForm(EMPTY_FORM); setFormError(''); };

  const setField = (k: keyof FormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const totalContractValue = vendors.reduce((s, v) => s + parseFloat(String(v.contract_value || 0)), 0);

  // ────────────────────────────────────────────────────────────
  return (
    <div className="container animate-fade-in pb-12">

      {/* HEADER */}
      <div className="page-header animate-slide-up" style={{ '--delay': '0ms' } as React.CSSProperties}>
        <div>
          <h1 className="header-title">Vendor Partnerships</h1>
          <p className="header-subtitle">Kelola mitra vendor, kategori layanan, dan penilaian performa.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Vendor Baru">
          <Plus size={16} /> Tambah Vendor
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div 
          className="card-metric animate-slide-up border-l-4 border-l-blue flex items-center justify-between glow-blue"
          style={{ '--delay': '100ms' } as React.CSSProperties}
        >
          <div>
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Mitra Vendor</p>
            <p className="text-2xl font-900 text-text">{fmt(total)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center text-blue shadow-sm">
            <Handshake size={20} />
          </div>
        </div>
        <div 
          className="card-metric animate-slide-up border-l-4 border-l-indigo flex items-center justify-between glow-indigo"
          style={{ '--delay': '200ms' } as React.CSSProperties}
        >
          <div>
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Nilai Kontrak (Halaman Ini)</p>
            <p className="text-2xl font-900 text-indigo">Rp {fmt(totalContractValue)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-light flex items-center justify-center text-indigo shadow-sm">
            <Coins size={20} />
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-bar animate-slide-up" style={{ '--delay': '300ms' } as React.CSSProperties}>
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input
            id="ven_search"
            type="text" placeholder="Cari nama, kode, kategori, PIC, telepon..."
            value={tempSearch} onChange={e => setTempSearch(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleProcess(); }}
            className="input-premium w-full pl-9"
            title="Cari Vendor"
            aria-label="Cari data mitra vendor"
          />
        </div>
        <select 
          id="ven_cat_filter"
          value={tempCat} onChange={e => setTempCat(e.target.value)}
          className="input-premium w-auto" title="Filter Kategori" aria-label="Filter berdasarkan kategori vendor">
          <option value="">Semua Kategori</option>
          {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          id="ven_stat_filter"
          value={tempStat} onChange={e => setTempStat(e.target.value)}
          className="input-premium w-auto" title="Filter Status" aria-label="Filter berdasarkan status vendor">
          <option value="">Semua Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending Evaluation">Pending Evaluation</option>
        </select>
        <button 
          className="btn btn-primary flex items-center gap-1.5 shrink-0" 
          onClick={handleProcess} 
          title="Proses Pencarian"
        >
          <Play size={14} fill="currentColor" /> Proses
        </button>
      </div>

      {/* TABLE / INITIAL STATE */}
      {error ? (
        <div className="error-alert-container animate-slide-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => fetchVendors(page)} title="Coba Memuat Ulang">
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      ) : !hasProcessed ? (
        <div 
          className="animate-slide-up py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/40 glow-slate flex flex-col items-center justify-center"
          style={{ '--delay': '400ms' } as React.CSSProperties}
        >
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3 shadow-sm">
            <Search size={22} />
          </div>
          <p className="text-sm-bold text-text mb-1">Pencarian Vendor Partnerships</p>
          <p className="text-xs-muted max-w-sm px-4">
            Silakan atur kriteria filter di atas, lalu klik tombol <strong>Proses</strong> untuk memuat data.
          </p>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
          <TableShell headers={[{label:'Kode'}, {label:'Nama Vendor'}, {label:'Kategori'}, {label:'PIC'}, {label:'Kontak'}, {label:'Rating'}, {label:'Status', right:true}, {label:'Aksi', right:true}]} loading={loading} colSpan={8}>
          {vendors.length === 0 ? (
            <tr><td colSpan={8} className="py-14 text-center">
                <Users size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada vendor ditemukan</p>
                <p className="text-xs-muted mt-1">Coba ubah filter atau tambahkan vendor baru</p>
              </td></tr>
          ) : vendors.map((v, i) => (
            <tr 
              key={v.id} 
              className="hover-row transition-all duration-200 animate-slide-up"
              style={{ '--delay': `${Math.min(i * 35, 300)}ms` } as React.CSSProperties}
            >
               <td className="td-p font-mono text-blue text-xs font-700">
                {v.vendor_code || '—'}
              </td>
              <td className="td-p">
                <div className="text-sm-bold text-text">{v.vendor_name}</div>
                {v.review_status && (
                  <div className="text-xs-muted mt-1">{v.review_status}</div>
                )}
              </td>
              <td className="td-p">
                {v.category
                  ? <Badge label={v.category} colorClass="badge-indigo" />
                  : <span className="text-text-3">—</span>}
              </td>
              <td className="td-p">
                {v.pic_name ? (
                  <div>
                    <div className="text-sm-bold text-text">{v.pic_name}</div>
                    {v.pic_position && <div className="text-xs-muted">{v.pic_position}</div>}
                  </div>
                ) : <span className="text-text-3">—</span>}
              </td>
              <td className="td-p">
                {v.phone && (
                  <div className="flex-start gap-1 text-sm-muted">
                    <Phone size={11} className="shrink-0" />{v.phone}
                  </div>
                )}
                {v.email && (
                  <div className="flex-start gap-1 text-xs-muted mt-1">
                    <Mail size={11} className="shrink-0" />{v.email}
                  </div>
                )}
                {!v.phone && !v.email && <span className="text-text-3">—</span>}
              </td>
              <td className="td-p">
                <Stars rating={v.rating || 0} size={12} />
              </td>
              <td className="td-p text-right">
                <Badge label={v.status || '—'} colorClass={STAT_CLS[v.status] || 'badge-slate'} />
              </td>
              <td className="td-p text-right">
                <div className="flex-end gap-2">
                  <button title="Lihat Detail" aria-label="Lihat detail vendor" onClick={() => openDetail(v.id)} className="btn-icon">
                    <Eye size={14} />
                  </button>
                  <button title="Edit" aria-label="Edit vendor" onClick={() => openEdit(v.id)} className="btn-icon-blue">
                    <Edit2 size={14} />
                  </button>
                  <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label={`Hapus ${v.vendor_name}`} onClick={() => handleDelete(v.id, v.vendor_name)}><Trash2 size={14}/></button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
          {!loading && vendors.length > 0 && <PaginationBar page={page} limit={LIMIT} total={total} totalPages={totalPages} onChange={handlePageChange} />}
        </div>
      )}

      {/* Detail Modal */}
      <VendorDetailModal
        detailVendor={detailVendor}
        detailLoading={detailLoading}
        onClose={() => setDetailVendor(null)}
        openEdit={openEdit}
        fmt={fmt}
        STAT_CLS={STAT_CLS}
      />

      {/* Add/Edit Form Modal */}
      <VendorFormModal
        showAdd={showAdd}
        editVendor={editVendor}
        form={form}
        formError={formError}
        saving={saving}
        meta={meta}
        closeForm={closeForm}
        setField={setField}
        handleSave={handleSave}
        fmtCurrency={fmtCurrency}
      />
    </div>
  );
}
