'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit2, Phone, Mail,
  RefreshCw, Trash2, AlertCircle, Users, Handshake, Coins
} from 'lucide-react';
import { Badge, PaginationBar, TableShell } from '@/components/PageShared';
import { Stars, VendorDetailModal, VendorFormModal } from '@/components/VendorComponents';

// ── Types ─────────────────────────────────────────────────────
interface Vendor {
  id: number;
  vendor_code: string;
  vendor_name: string;
  category: string;
  expense_category: string;
  pic_name: string;
  pic_position: string;
  phone: string;
  email: string;
  rating: number;
  status: string;
  contract_start: string;
  contract_end: string;
  contract_value: number;
  review_status: string;
}

interface VendorDetail extends Vendor {
  vendor_category_id: number;
  expense_category_id: number;
  detail: string;
  division_id: number;
  division: string;
  partnership_company_id: number;
  partnership_company: string;
  address: string;
  npwp: string;
  bank_id: number;
  bank_name: string;
  account_name: string;
  account_number: string;
  top_days: number;
  created_at: string;
  updated_at: string;
}

interface Meta {
  categories:        { id: number; name: string }[];
  expenseCategories: { id: number; name: string }[];
  divisions:         { id: number; name: string }[];
  companies:         { id: number; name: string }[];
  banks:             { id: number; name: string }[];
}

interface FormData {
  vendor_code: string; vendor_name: string;
  vendor_category_id: string; expense_category_id: string;
  detail: string; division_id: string; partnership_company_id: string;
  pic_name: string; pic_position: string; phone: string; email: string;
  address: string; npwp: string;
  bank_id: string; account_name: string; account_number: string;
  contract_start: string; contract_end: string;
  top_days: string; contract_value: string;
  review_status: string; rating: string; status: string;
}

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

const STAT_CLS: Record<string, string> = {
  Active: 'badge-emerald', Inactive: 'badge-slate', 'Pending Evaluation': 'badge-amber',
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
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const [search, setSearch]     = useState('');
  const [catFilter, setCat]     = useState('');
  const [statFilter, setStat]   = useState('');

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
  const fetchVendors = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({
        page: String(p), limit: String(LIMIT),
        ...(search    && { search }),
        ...(catFilter && { category: catFilter }),
        ...(statFilter && { status: statFilter }),
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

  useEffect(() => { fetchVendors(1); }, [fetchVendors]);

  const handlePageChange = (p: number) => { setPage(p); fetchVendors(p); };

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
            type="text" placeholder="Cari nama, kode, PIC, telepon..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-premium w-full pl-9"
            title="Cari Vendor"
            aria-label="Cari data mitra vendor"
          />
        </div>
        <select 
          id="ven_cat_filter"
          value={catFilter} onChange={e => { setCat(e.target.value); setPage(1); }}
          className="input-premium w-auto" title="Filter Kategori" aria-label="Filter berdasarkan kategori vendor">
          <option value="">Semua Kategori</option>
          {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select 
          id="ven_stat_filter"
          value={statFilter} onChange={e => { setStat(e.target.value); setPage(1); }}
          className="input-premium w-auto" title="Filter Status" aria-label="Filter berdasarkan status vendor">
          <option value="">Semua Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
          <option value="Pending Evaluation">Pending Evaluation</option>
        </select>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="error-alert-container animate-slide-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => fetchVendors(page)} title="Coba Memuat Ulang">
            <RefreshCw size={14} /> Coba Lagi
          </button>
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
