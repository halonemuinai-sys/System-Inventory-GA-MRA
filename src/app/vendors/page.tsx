'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit2, X, Save, AlertCircle,
  Star, Phone, Mail, Building2, ChevronLeft, ChevronRight,
  RefreshCw, Loader2, Users, BadgeCheck, FileText, Landmark, Trash2,
} from 'lucide-react';

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

// ── Star rating display ───────────────────────────────────────
function Stars({ rating, size = 13, onClick }: { rating: number; size?: number; onClick?: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(n => (
        <Star
          key={n} size={size}
          fill={n <= rating ? '#f59e0b' : 'transparent'}
          color={n <= rating ? '#f59e0b' : '#cbd5e1'}
          className={onClick ? 'cursor-pointer' : 'cursor-default'}
          onClick={() => onClick?.(n)}
        />
      ))}
    </div>
  );
}

import { Badge, ModalShell, FF, SLabel, PaginationBar, TableShell, InfoRow, SBox, FormError } from '@/components/PageShared';

const parseNum = (s: string) => parseFloat(s.replace(/\./g, '')) || 0;
const fmtCurrency = (s: string) => {
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

  // ────────────────────────────────────────────────────────────
  return (
    <div className="container animate-fade-in pb-12">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="header-title">Vendor Partnerships</h1>
          <p className="header-subtitle">Kelola mitra vendor, kategori layanan, dan penilaian performa.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Vendor Baru">
          <Plus size={16} /> Tambah Vendor
        </button>
      </div>

      {/* FILTERS */}
      <div className="filter-bar">
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
        <div className="summary-item">
          <span className="text-text-3">Total: </span>
          <span className="font-800 text-text">{fmt(total)} vendor</span>
        </div>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => fetchVendors(page)} title="Coba Memuat Ulang">
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <TableShell headers={[{label:'Kode'}, {label:'Nama Vendor'}, {label:'Kategori'}, {label:'PIC'}, {label:'Kontak'}, {label:'Rating'}, {label:'Status', right:true}, {label:'Aksi', right:true}]} loading={loading} colSpan={8}>
          {vendors.length === 0 ? (
            <tr><td colSpan={8} className="py-14 text-center">
                <Users size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada vendor ditemukan</p>
                <p className="text-xs-muted mt-1">Coba ubah filter atau tambahkan vendor baru</p>
              </td></tr>
          ) : vendors.map((v, i) => (
            <tr key={v.id} className="hover-row">
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
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          DETAIL MODAL
      ══════════════════════════════════════════════════════ */}
      {(detailVendor || detailLoading) && (
        <ModalShell
          title={detailVendor ? `Detail Vendor — ${detailVendor.vendor_code || detailVendor.vendor_name}` : 'Memuat…'}
          onClose={() => setDetailVendor(null)}
          size="lg"
        >
          {detailLoading || !detailVendor ? (
            <div className="flex-center py-14">
              <Loader2 size={28} className="animate-spin text-blue" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg-black mb-2">
                    {detailVendor.vendor_name}
                  </h2>
                  <div className="flex gap-2 flex-wrap items-center">
                    <Badge label={detailVendor.status || '—'} colorClass={STAT_CLS[detailVendor.status] || 'badge-slate'} />
                    {detailVendor.category && <Badge label={detailVendor.category} colorClass="badge-indigo" />}
                    {detailVendor.review_status && <Badge label={detailVendor.review_status} colorClass="badge-amber" />}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Stars rating={detailVendor.rating || 0} size={18} />
                  <p className="text-xxs text-text-3 mt-1">Performance Rating</p>
                </div>
              </div>

              <div className="detail-grid gap-3">
                <SBox icon={<BadgeCheck size={14} />} title="Identitas">
                  <InfoRow label="Kode"           value={detailVendor.vendor_code} />
                  <InfoRow label="Kategori"        value={detailVendor.category} />
                  <InfoRow label="Exp. Kategori"   value={detailVendor.expense_category} />
                  <InfoRow label="Divisi"          value={detailVendor.division} />
                  <InfoRow label="Perusahaan Mitra" value={detailVendor.partnership_company} />
                  <InfoRow label="Deskripsi"       value={detailVendor.detail} />
                </SBox>

                <SBox icon={<Phone size={14} />} title="Kontak">
                  <InfoRow label="PIC"      value={detailVendor.pic_name} />
                  <InfoRow label="Jabatan"  value={detailVendor.pic_position} />
                  <InfoRow label="Telepon"  value={detailVendor.phone} />
                  <InfoRow label="Email"    value={detailVendor.email} />
                  <InfoRow label="NPWP"     value={detailVendor.npwp} />
                  {detailVendor.address && (
                    <div className="mt-1">
                      <p className="text-xs-bold mb-1">Alamat</p>
                      <p className="text-sm-muted lh-1-6">{detailVendor.address}</p>
                    </div>
                  )}
                </SBox>
              </div>

              <div className="detail-grid gap-3">
                <SBox icon={<FileText size={14} />} title="Kontrak">
                  <InfoRow label="Mulai"          value={detailVendor.contract_start ? new Date(detailVendor.contract_start).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—'} />
                  <InfoRow label="Berakhir"        value={detailVendor.contract_end   ? new Date(detailVendor.contract_end).toLocaleDateString('id-ID',   { day:'2-digit', month:'short', year:'numeric' }) : '—'} />
                  <InfoRow label="Nilai Kontrak"   value={detailVendor.contract_value ? `Rp ${fmt(detailVendor.contract_value)}` : '—'} />
                  <InfoRow label="TOP (hari)"      value={detailVendor.top_days} />
                </SBox>

                <SBox icon={<Landmark size={14} />} title="Rekening Bank">
                  <InfoRow label="Bank"           value={detailVendor.bank_name} />
                  <InfoRow label="Nama Rekening"  value={detailVendor.account_name} />
                  <InfoRow label="No. Rekening"   value={
                    detailVendor.account_number
                      ? <span className="font-mono">{detailVendor.account_number}</span>
                      : '—'
                  } />
                </SBox>
              </div>

              <div className="modal-footer-info">
                {[['Dibuat', detailVendor.created_at], ['Diperbarui', detailVendor.updated_at]].map(([k, v]) => (
                  <div key={k} className="text-xxs">
                    <span className="text-text-3">{k}: </span>
                    <span className="text-text-2 font-500">{v ? new Date(v as string).toLocaleString('id-ID') : '—'}</span>
                  </div>
                ))}
              </div>

              <div className="modal-footer-actions">
                <button className="btn" onClick={() => { setDetailVendor(null); openEdit(detailVendor.id); }} title="Edit Vendor">
                  <Edit2 size={14} /> Edit
                </button>
                <button className="btn btn-primary" onClick={() => setDetailVendor(null)} title="Tutup Modal">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* ══════════════════════════════════════════════════════
          ADD / EDIT FORM MODAL
      ══════════════════════════════════════════════════════ */}
      {(showAdd || editVendor) && (
        <ModalShell
          title={editVendor ? `Edit Vendor — ${editVendor.vendor_name}` : 'Tambah Vendor Baru'}
          onClose={closeForm}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <FormError msg={formError} />

            <SLabel>Identitas Vendor</SLabel>
            <div className="detail-grid gap-2">
              <FF label="Nama Vendor" id="vnd_name" required>
                <input id="vnd_name" type="text" placeholder="PT / CV / nama usaha" value={form.vendor_name}
                  onChange={e => setField('vendor_name', e.target.value)} className="input-premium" title="Nama Vendor" />
              </FF>
              <FF label="Kode Vendor" id="vnd_code">
                <input id="vnd_code" type="text" placeholder="Auto-generate jika kosong" value={form.vendor_code}
                  onChange={e => setField('vendor_code', e.target.value)} className="input-premium" title="Kode Vendor" />
              </FF>
              <FF label="Kategori Vendor" id="vnd_cat">
                <select id="vnd_cat" value={form.vendor_category_id} onChange={e => setField('vendor_category_id', e.target.value)}
                  className="input-premium" title="Pilih Kategori Vendor">
                  <option value="">— Pilih Kategori —</option>
                  {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FF>
              <FF label="Kategori Expense" id="vnd_exp">
                <select id="vnd_exp" value={form.expense_category_id} onChange={e => setField('expense_category_id', e.target.value)}
                  className="input-premium" title="Pilih Kategori Expense">
                  <option value="">— Pilih Kategori —</option>
                  {meta.expenseCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FF>
              <FF label="Divisi" id="vnd_div">
                <select id="vnd_div" value={form.division_id} onChange={e => setField('division_id', e.target.value)}
                  className="input-premium" title="Pilih Divisi">
                  <option value="">— Pilih Divisi —</option>
                  {meta.divisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </FF>
              <FF label="Perusahaan Mitra" id="vnd_co">
                <select id="vnd_co" value={form.partnership_company_id} onChange={e => setField('partnership_company_id', e.target.value)}
                  className="input-premium" title="Pilih Perusahaan Mitra">
                  <option value="">— Pilih Perusahaan —</option>
                  {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FF>
            </div>
            <FF label="Deskripsi / Detail" id="vnd_detail">
              <input id="vnd_detail" type="text" placeholder="Layanan utama yang disediakan..." value={form.detail}
                onChange={e => setField('detail', e.target.value)} className="input-premium" title="Deskripsi" />
            </FF>

            <SLabel>Kontak</SLabel>
            <div className="detail-grid gap-2">
              <FF label="Nama PIC" id="vnd_pic">
                <input id="vnd_pic" type="text" placeholder="Nama penanggung jawab" value={form.pic_name}
                  onChange={e => setField('pic_name', e.target.value)} className="input-premium" title="PIC" />
              </FF>
              <FF label="Jabatan PIC" id="vnd_pos">
                <input id="vnd_pos" type="text" placeholder="Direktur / Sales Manager" value={form.pic_position}
                  onChange={e => setField('pic_position', e.target.value)} className="input-premium" title="Jabatan PIC" />
              </FF>
              <FF label="Telepon" id="vnd_phone">
                <input id="vnd_phone" type="tel" placeholder="08xx-xxxx-xxxx" value={form.phone}
                  onChange={e => setField('phone', e.target.value)} className="input-premium" title="Telepon" />
              </FF>
              <FF label="Email" id="vnd_email">
                <input id="vnd_email" type="email" placeholder="vendor@email.com" value={form.email}
                  onChange={e => setField('email', e.target.value)} className="input-premium" title="Email" />
              </FF>
              <FF label="NPWP" id="vnd_npwp">
                <input id="vnd_npwp" type="text" placeholder="xx.xxx.xxx.x-xxx.xxx" value={form.npwp}
                  onChange={e => setField('npwp', e.target.value)} className="input-premium" title="NPWP" />
              </FF>
            </div>
            <FF label="Alamat" id="vnd_addr">
              <textarea id="vnd_addr" rows={2} placeholder="Alamat lengkap vendor..." value={form.address}
                onChange={e => setField('address', e.target.value)}
                className="input-premium resize-y" title="Alamat Vendor" />
            </FF>

            <SLabel>Kontrak</SLabel>
            <div className="detail-grid gap-2 grid-cols-4">
              <FF label="Tgl. Mulai" id="vnd_start">
                <input id="vnd_start" type="date" value={form.contract_start} onChange={e => setField('contract_start', e.target.value)}
                  className="input-premium" title="Tanggal Mulai Kontrak" />
              </FF>
              <FF label="Tgl. Berakhir" id="vnd_end">
                <input id="vnd_end" type="date" value={form.contract_end} onChange={e => setField('contract_end', e.target.value)}
                  className="input-premium" title="Tanggal Berakhir Kontrak" />
              </FF>
              <FF label="Nilai Kontrak (Rp)" id="vnd_val">
                <input id="vnd_val" type="text" placeholder="0" value={fmtCurrency(form.contract_value)}
                  onChange={e => setField('contract_value', e.target.value.replace(/\D/g,''))} className="input-premium" title="Nilai Kontrak" />
              </FF>
              <FF label="TOP (hari)" id="vnd_top">
                <input id="vnd_top" type="number" placeholder="30" min={0} value={form.top_days}
                  onChange={e => setField('top_days', e.target.value)} className="input-premium" title="TOP (hari)" />
              </FF>
            </div>

            <SLabel>Rekening Bank</SLabel>
            <div className="detail-grid gap-2 grid-cols-3">
              <FF label="Bank" id="vnd_bank">
                <select id="vnd_bank" value={form.bank_id} onChange={e => setField('bank_id', e.target.value)}
                  className="input-premium" title="Pilih Bank">
                  <option value="">— Pilih Bank —</option>
                  {meta.banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FF>
              <FF label="Nama Pemilik Rekening" id="vnd_acc_name">
                <input id="vnd_acc_name" type="text" placeholder="Sesuai rekening" value={form.account_name}
                  onChange={e => setField('account_name', e.target.value)} className="input-premium" title="Pemilik Rekening" />
              </FF>
              <FF label="Nomor Rekening" id="vnd_acc_no">
                <input id="vnd_acc_no" type="text" placeholder="xxxx-xxxx-xxxx" value={form.account_number}
                  onChange={e => setField('account_number', e.target.value)} className="input-premium" title="No. Rekening" />
              </FF>
            </div>

            <SLabel>Status & Penilaian</SLabel>
            <div className="detail-grid gap-2 grid-cols-3 items-start">
              <FF label="Status" id="vnd_status">
                <select id="vnd_status" value={form.status} onChange={e => setField('status', e.target.value)}
                  className="input-premium" title="Status Vendor">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Pending Evaluation">Pending Evaluation</option>
                </select>
              </FF>
              <FF label="Review Status" id="vnd_rev">
                <input id="vnd_rev" type="text" placeholder="In Progress / Done / dll" value={form.review_status}
                  onChange={e => setField('review_status', e.target.value)} className="input-premium" title="Review Status" />
              </FF>
              <FF label="Rating Performa">
                <div className="mt-1">
                  <Stars
                    rating={parseInt(form.rating) || 0}
                    size={22}
                    onClick={n => setField('rating', String(n))}
                  />
                  <p className="text-xxs text-text-3 mt-1">
                    {form.rating ? `${form.rating} / 5` : 'Klik untuk memberi rating'}
                  </p>
                </div>
              </FF>
            </div>

            <div className="modal-footer-border">
              <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
              <button className="btn btn-primary min-w-130" onClick={handleSave} disabled={saving} title={editVendor ? 'Simpan Perubahan' : 'Tambah Vendor'}>
                {saving
                  ? <><Loader2 size={14} className="animate-spin" /> Menyimpan…</>
                  : <><Save size={14} /> {editVendor ? 'Simpan' : 'Tambah'}</>}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
