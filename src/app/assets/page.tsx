'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit2, Save, AlertCircle,
  Package, Tag, Building2, RefreshCw, Loader2, Trash2, Download,
} from 'lucide-react';
import { 
  Badge, ModalShell, SlideOverShell, SkeletonCard, SkeletonTable, FF, PaginationBar, TableShell, 
  InfoRow, SBox, FormError, iStyle 
} from '@/components/PageShared';

// ── Types ─────────────────────────────────────────────────────
interface Asset {
  id: number;
  asset_code: string;
  asset_name: string;
  category: string;
  asset_type: string;
  condition: string;
  status: string;
  acquisition_date: string;
  acquisition_cost: number;
  company: string;
  details: string;
  room: string;
  useful_life_months: number;
}

interface AssetDetail extends Asset {
  company_id: number;
  asset_category_id: number;
  asset_type_id: number;
  condition_id: number;
  status_id: number;
  location_name: string;
  pic_name: string;
  information: string;
  created_at: string;
  updated_at: string;
}

interface Meta {
  companies: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  types: { id: number; category_id: number; name: string }[];
  conditions: { id: number; name: string }[];
  statuses: { id: number; name: string }[];
}

interface FormData {
  company_id: string;
  asset_code: string;
  asset_name: string;
  asset_category_id: string;
  asset_type_id: string;
  acquisition_date: string;
  acquisition_cost: string;
  condition_id: string;
  status_id: string;
  useful_life_months: string;
  details: string;
  information: string;
}

// ── Helpers ───────────────────────────────────────────────────
const fmt = (v: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(v || 0);

const parseNum = (s: string) => parseFloat(s.replace(/\./g, '')) || 0;
const fmtCurrency = (s: string) => {
  if (typeof s === 'string' && s.includes('.')) {
    s = s.split('.')[0];
  }
  const num = String(s).replace(/\D/g, '');
  if (!num) return '';
  return new Intl.NumberFormat('id-ID').format(parseInt(num));
};

const EMPTY_FORM: FormData = {
  company_id: '', asset_code: '', asset_name: '',
  asset_category_id: '', asset_type_id: '',
  acquisition_date: '', acquisition_cost: '',
  condition_id: '', status_id: '',
  useful_life_months: '', details: '', information: '',
};

const COND_CLS: Record<string, string> = {
  Good: 'badge-emerald', 'Needs Maintenance': 'badge-amber', Damaged: 'badge-rose',
};
const STAT_CLS: Record<string, string> = {
  Active: 'badge-emerald', Idle: 'badge-amber', Lost: 'badge-rose', Disposed: 'badge-slate',
};

// ═════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════


export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [catFilter, setCat] = useState('');
  const [statFilter, setStat] = useState('');
  const [compFilter, setComp] = useState('');

  const [appliedFilters, setAppliedFilters] = useState({ search: '', cat: '', stat: '', comp: '' });
  const [hasSearched, setHasSearched] = useState(false);
  const [kpi, setKpi] = useState({ total_assets: 0, total_value: 0 });

  const [meta, setMeta] = useState<Meta>({ companies: [], categories: [], types: [], conditions: [], statuses: [] });

  const [detailAsset, setDetailAsset] = useState<AssetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [editAsset, setEditAsset] = useState<AssetDetail | null>(null);

  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [deleteItem, setDeleteItem] = useState<{ id: number; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Bulk selection and actions state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [exporting, setExporting] = useState(false);

  const LIMIT = 20;

  useEffect(() => {
    fetch('/api/assets/meta')
      .then(r => r.json())
      .then(setMeta)
      .catch(() => { });
  }, []);

  const fetchAssets = useCallback(async (p: number, filters = appliedFilters) => {
    setLoading(true); setError(null);
    setSelectedIds([]); // Clear selection when page or filter changes
    try {
      const qs = new URLSearchParams({
        page: String(p), limit: String(LIMIT),
        ...(filters.search && { search: filters.search }),
        ...(filters.cat && { category: filters.cat }),
        ...(filters.stat && { status: filters.stat }),
        ...(filters.comp && { company: filters.comp }),
      });
      const res = await fetch(`/api/assets?${qs}`);
      if (!res.ok) throw new Error('Gagal memuat data aset');
      const json = await res.json();
      setAssets(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPage(json.page);
      setHasSearched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const fetchKpi = useCallback(async (filters = appliedFilters) => {
    try {
      const qs = new URLSearchParams(filters.comp ? { company: filters.comp } : {});
      const res = await fetch(`/api/assets/summary?${qs}`);
      const data = await res.json();
      setKpi(data);
    } catch (e) {
      console.error(e);
    }
  }, [appliedFilters]);

  const handleSearch = () => {
    const filters = { search, cat: catFilter, stat: statFilter, comp: compFilter };
    setAppliedFilters(filters);
    fetchAssets(1, filters);
    fetchKpi(filters);
  };

  // Fetch KPI, Meta & initial Assets list on mount
  useEffect(() => {
    fetchKpi({ search: '', cat: '', stat: '', comp: '' });
    fetchAssets(1, { search: '', cat: '', stat: '', comp: '' });
  }, []);

  // Pagination change effect
  useEffect(() => {
    if (hasSearched) fetchAssets(page, appliedFilters);
  }, [page]); // only trigger when page changes

  const confirmDelete = (item: { id: number; name: string }) => {
    setDeleteItem(item);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/assets/${deleteItem.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setAssets(prev => prev.filter(a => a.id !== deleteItem.id));
      setSelectedIds(prev => prev.filter(id => id !== deleteItem.id));
      setDeleteItem(null);
      fetchKpi(appliedFilters); // Refresh KPIs after delete
    } catch { 
      alert('Gagal menghapus aset'); 
    } finally {
      setDeleting(false);
    }
  };

  // Bulk actions handlers
  const toggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const allPageIds = assets.map(a => a.id);
    const isAllSelected = allPageIds.every(id => selectedIds.includes(id));
    if (isAllSelected) {
      setSelectedIds(prev => prev.filter(id => !allPageIds.includes(id)));
    } else {
      setSelectedIds(prev => {
        const next = [...prev];
        allPageIds.forEach(id => {
          if (!next.includes(id)) next.push(id);
        });
        return next;
      });
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedIds.length} aset terpilih?`)) return;
    setDeletingBulk(true);
    try {
      await Promise.all(
        selectedIds.map(id => fetch(`/api/assets/${id}`, { method: 'DELETE' }))
      );
      setSelectedIds([]);
      fetchAssets(page, appliedFilters);
      fetchKpi(appliedFilters);
    } catch (err) {
      alert('Gagal menghapus beberapa aset');
    } finally {
      setDeletingBulk(false);
    }
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const qs = new URLSearchParams({
        export: 'true',
        ...(appliedFilters.search && { search: appliedFilters.search }),
        ...(appliedFilters.cat && { category: appliedFilters.cat }),
        ...(appliedFilters.stat && { status: appliedFilters.stat }),
        ...(appliedFilters.comp && { company: appliedFilters.comp }),
      });
      const res = await fetch(`/api/assets?${qs}`);
      if (!res.ok) throw new Error('Gagal mengekspor data');
      const json = await res.json();
      const data: Asset[] = json.data || [];
      
      // Build CSV content
      const csvHeaders = ['Kode Aset', 'Nama Aset', 'Kategori', 'Tipe', 'Kondisi', 'Perusahaan', 'Nilai Perolehan', 'Status', 'Tgl Perolehan', 'Masa Manfaat', 'Spesifikasi'];
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      
      const csvRows = [
        csvHeaders.join(','),
        ...data.map(a => [
          escapeCSV(a.asset_code),
          escapeCSV(a.asset_name),
          escapeCSV(a.category),
          escapeCSV(a.asset_type),
          escapeCSV(a.condition),
          escapeCSV(a.company),
          escapeCSV(a.acquisition_cost),
          escapeCSV(a.status),
          escapeCSV(a.acquisition_date ? a.acquisition_date.split('T')[0] : ''),
          escapeCSV(a.useful_life_months),
          escapeCSV(a.details),
        ].join(','))
      ];
      
      const csvContent = '\uFEFF' + csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `asset_inventory_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err.message || 'Gagal mengekspor data');
    } finally {
      setExporting(false);
    }
  };

  const openDetail = async (id: number) => {
    setDetailLoading(true); setDetailAsset(null);
    try {
      const res = await fetch(`/api/assets/${id}`);
      setDetailAsset(await res.json());
    } finally {
      setDetailLoading(false);
    }
  };

  const openEdit = async (id: number) => {
    const res = await fetch(`/api/assets/${id}`);
    const d: AssetDetail = await res.json();
    setEditAsset(d);
    setForm({
      company_id: String(d.company_id || ''),
      asset_code: d.asset_code || '',
      asset_name: d.asset_name || '',
      asset_category_id: String(d.asset_category_id || ''),
      asset_type_id: String(d.asset_type_id || ''),
      acquisition_date: d.acquisition_date ? d.acquisition_date.split('T')[0] : '',
      acquisition_cost: String(d.acquisition_cost || ''),
      condition_id: String(d.condition_id || ''),
      status_id: String(d.status_id || ''),
      useful_life_months: String(d.useful_life_months || ''),
      details: d.details || '',
      information: d.information || '',
    });
    setFormError('');
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.asset_name.trim()) { setFormError('Nama aset wajib diisi'); return; }
    if (!form.company_id) { setFormError('Perusahaan wajib dipilih'); return; }

    setSaving(true);
    try {
      const isEdit = !!editAsset;
      const url = isEdit ? `/api/assets/${editAsset!.id}` : '/api/assets';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          company_id: parseInt(form.company_id) || null,
          asset_category_id: parseInt(form.asset_category_id) || null,
          asset_type_id: parseInt(form.asset_type_id) || null,
          condition_id: parseInt(form.condition_id) || null,
          status_id: parseInt(form.status_id) || null,
          acquisition_cost: parseNum(form.acquisition_cost),
          useful_life_months: parseInt(form.useful_life_months) || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan');
      }

      setShowAdd(false);
      setEditAsset(null);
      setForm(EMPTY_FORM);
      if (hasSearched) {
        fetchAssets(page, appliedFilters);
        fetchKpi(appliedFilters);
      }
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openAdd = () => { setEditAsset(null); setForm(EMPTY_FORM); setFormError(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditAsset(null); setForm(EMPTY_FORM); setFormError(''); };

  const filteredTypes = form.asset_category_id
    ? meta.types.filter(t => String(t.category_id) === form.asset_category_id)
    : meta.types;

  const totalValue = assets.reduce((s, a) => s + parseFloat(String(a.acquisition_cost || 0)), 0);

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header animate-slide-up" style={{ '--delay': '0ms' } as React.CSSProperties}>
        <div>
          <h1 className="header-title">Asset Inventory</h1>
          <p className="header-subtitle">Kelola dan pantau semua aset fisik MRA Group.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} title="Tambah Aset Baru">
          <Plus size={16} /> Tambah Aset
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div 
          className="card-metric animate-slide-up border-l-4 border-l-blue flex items-center justify-between glow-blue"
          style={{ '--delay': '100ms' } as React.CSSProperties}
        >
          <div>
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Keseluruhan Aset</p>
            <p className="text-2xl font-900 text-text">{fmt(kpi.total_assets)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-light flex items-center justify-center text-blue shadow-sm">
            <Package size={20} />
          </div>
        </div>
        <div 
          className="card-metric animate-slide-up border-l-4 border-l-indigo flex items-center justify-between glow-indigo"
          style={{ '--delay': '200ms' } as React.CSSProperties}
        >
          <div>
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Nilai Perolehan</p>
            <p className="text-2xl font-900 text-indigo">Rp {fmt(kpi.total_value)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-indigo-light flex items-center justify-center text-indigo shadow-sm">
            <Tag size={20} />
          </div>
        </div>
      </div>

      <div className="filter-bar animate-slide-up" style={{ '--delay': '300ms' } as React.CSSProperties}>
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input 
            id="ast_search"
            type="text"
            className="input-premium w-full pl-9"
            placeholder="Cari nama, kode, perusahaan..."
            title="Cari Aset"
            aria-label="Cari aset inventory"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <select 
          id="ast_comp_filter"
          value={compFilter} 
          onChange={e => setComp(e.target.value)}
          className="input-premium w-auto max-w-[150px]" 
          title="Filter Perusahaan"
        >
          <option value="">Semua Perusahaan</option>
          {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          id="ast_cat_filter"
          value={catFilter} 
          onChange={e => setCat(e.target.value)}
          className="input-premium w-auto max-w-[150px]" 
          title="Filter Kategori"
        >
          <option value="">Semua Kategori</option>
          {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select 
          id="ast_stat_filter"
          value={statFilter} 
          onChange={e => setStat(e.target.value)}
          className="input-premium w-auto max-w-[150px]" 
          title="Filter Status"
        >
          <option value="">Semua Status</option>
          {meta.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div className="flex gap-2 shrink-0">
          <button className="btn btn-primary" onClick={handleSearch} title="Terapkan Filter">
            Cari Data
          </button>
          
          <button 
            className="btn flex items-center gap-1.5" 
            onClick={handleExportCSV} 
            disabled={exporting}
            title="Ekspor ke CSV"
          >
            {exporting ? <Loader2 size={14} className="animate-spin text-blue" /> : <Download size={14} className="text-blue" />}
            Ekspor CSV
          </button>
        </div>

        <div className="summary-box">
          <div className="summary-item">
            <span className="text-text-3">Total: </span>
            <span className="font-800 text-text">{fmt(total)} aset</span>
          </div>
          <div className="summary-item-blue">
            <span className="text-blue font-600">Halaman ini: </span>
            <span className="font-800 text-blue">Rp {fmt(totalValue)}</span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => fetchAssets(page)} title="Coba Memuat Ulang" aria-label="Coba memuat ulang data">
            <RefreshCw size={14} /> Coba Lagi
          </button>
        </div>
      ) : (
        <div className="animate-slide-up" style={{ '--delay': '400ms' } as React.CSSProperties}>
          <TableShell 
            headers={[
              {
                label: (
                  <input
                    type="checkbox"
                    className="checkbox-premium"
                    checked={assets.length > 0 && assets.every(a => selectedIds.includes(a.id))}
                    onChange={toggleSelectAll}
                    title="Pilih semua baris"
                  />
                ),
                width: 44,
                isCheckbox: true
              },
              {label:'Kode'}, {label:'Nama Aset'}, {label:'Kategori'}, 
              {label:'Kondisi'}, {label:'Perusahaan'}, 
              {label:'Acq. Cost', right:true}, {label:'Status', right:true}, 
              {label:'Aksi', right:true}
            ]} 
            loading={false} 
            colSpan={9}
          >
            {loading ? (
              <SkeletonTable colSpan={9} rowCount={10} />
            ) : assets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-14 text-center">
                  <Package size={36} className="text-text-3 mx-auto mb-3 block" />
                  {hasSearched ? (
                    <>
                      <p className="text-sm-bold text-text-2">Tidak ada aset ditemukan</p>
                      <p className="text-xs-muted mt-1">Coba ubah filter dan klik Cari Data</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm-bold text-text-2">Menunggu pencarian data</p>
                      <p className="text-xs-muted mt-1">Silakan gunakan filter di atas dan klik Cari Data</p>
                    </>
                  )}
                </td>
              </tr>
            ) : assets.map((a, i) => (
              <tr 
                key={a.id} 
                className={`hover-row transition-all duration-200 animate-slide-up ${selectedIds.includes(a.id) ? 'bg-blue-light/30' : ''}`}
                style={{ '--delay': `${Math.min(i * 35, 300)}ms` } as React.CSSProperties}
              >
                <td className="td-checkbox">
                  <input
                    type="checkbox"
                    className="checkbox-premium"
                    checked={selectedIds.includes(a.id)}
                    onChange={() => toggleSelect(a.id)}
                    title={`Pilih ${a.asset_name}`}
                  />
                </td>
                <td className="td-p font-mono text-blue text-xs font-700">
                  {a.asset_code || '—'}
                </td>
                <td className="td-p">
                  <div className="text-sm-bold text-text">{a.asset_name}</div>
                  {a.asset_type && <div className="text-xs-muted mt-1">{a.asset_type}</div>}
                </td>
                <td className="td-p">
                  <div className="flex-start gap-1">
                    <Tag size={12} className="text-text-3" />
                    <span className="text-sm-muted">{a.category || '—'}</span>
                  </div>
                </td>
                <td className="td-p">
                  <Badge label={a.condition || '—'} colorClass={COND_CLS[a.condition] || 'badge-slate'} />
                </td>
                <td className="td-p">
                  <div className="flex-start gap-1 text-sm-muted">
                    <Building2 size={12} className="shrink-0" />
                    <span className="truncate max-w-120">{a.company || '—'}</span>
                  </div>
                </td>
                <td className="td-p text-right font-700 text-text">
                  {fmt(parseFloat(String(a.acquisition_cost || 0)))}
                </td>
                <td className="td-p text-right">
                  <Badge label={a.status || '—'} colorClass={STAT_CLS[a.status] || 'badge-slate'} />
                </td>
                <td className="td-p text-right">
                  <div className="flex-end gap-2">
                    <button className="btn-icon" title="Lihat Detail" aria-label={`Lihat detail aset ${a.asset_name}`} onClick={() => openDetail(a.id)}><Eye size={14} /></button>
                    <button className="btn-icon-blue" title="Edit" aria-label={`Edit aset ${a.asset_name}`} onClick={() => openEdit(a.id)}><Edit2 size={14} /></button>
                    <button className="btn-icon text-rose hover:bg-rose-light" title="Hapus" aria-label={`Hapus aset ${a.asset_name}`} onClick={() => confirmDelete({ id: a.id, name: a.asset_name })}><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </TableShell>
          {!loading && assets.length > 0 && (
            <PaginationBar page={page} limit={LIMIT} total={total} totalPages={totalPages} onChange={setPage} />
          )}
        </div>
      )}

      {/* FLOATING BULK ACTIONS BAR */}
      {selectedIds.length > 0 && (
        <div className="bulk-actions-bar">
          <span className="bulk-actions-text">
            {selectedIds.length} item terpilih
          </span>
          <div className="bulk-actions-divider" />
          <div className="bulk-actions-buttons">
            <button
              type="button"
              className="btn py-1 px-3 text-xs bg-rose text-white border-none hover:opacity-90 flex items-center gap-1"
              onClick={handleBulkDelete}
              disabled={deletingBulk}
            >
              <Trash2 size={13} />
              {deletingBulk ? 'Menghapus...' : 'Hapus Terpilih'}
            </button>
            <button
              type="button"
              className="btn py-1 px-3 text-xs bg-slate-200 text-text border-none hover:bg-slate-300"
              onClick={() => setSelectedIds([])}
              disabled={deletingBulk}
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* DETAIL DRAWER */}
      <SlideOverShell 
        isOpen={!!detailAsset || detailLoading} 
        onClose={() => setDetailAsset(null)}
        title={detailAsset ? `Detail Aset — ${detailAsset.asset_code || ''}` : 'Memuat...'}
        size="md"
      >
        {detailLoading || !detailAsset ? (
          <div className="flex-center py-12">
            <Loader2 size={28} className="animate-spin text-blue" />
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-lg-black mb-2">{detailAsset.asset_name}</h2>
              <div className="flex gap-2 flex-wrap">
                <Badge label={detailAsset.status || '—'} colorClass={STAT_CLS[detailAsset.status] || 'badge-slate'} />
                <Badge label={detailAsset.condition || '—'} colorClass={COND_CLS[detailAsset.condition] || 'badge-slate'} />
                {detailAsset.category && <Badge label={detailAsset.category} colorClass="badge-indigo" />}
              </div>
            </div>

            <div className="detail-grid">
              <SBox title="Identifikasi">
                <InfoRow label="Kode Aset" value={detailAsset.asset_code || '—'} />
                <InfoRow label="Kategori"  value={detailAsset.category || '—'} />
                <InfoRow label="Tipe"      value={detailAsset.asset_type || '—'} />
                <InfoRow label="Perusahaan" value={detailAsset.company || '—'} />
              </SBox>
              <SBox title="Finansial">
                <InfoRow label="Tgl. Perolehan" value={detailAsset.acquisition_date ? new Date(detailAsset.acquisition_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'} />
                <InfoRow label="Nilai Perolehan" value={`Rp ${fmt(parseFloat(String(detailAsset.acquisition_cost || 0)))}`} />
                <InfoRow label="Masa Manfaat" value={detailAsset.useful_life_months ? `${detailAsset.useful_life_months} bulan` : '—'} />
                <InfoRow label="Dep./bulan" value={detailAsset.useful_life_months && detailAsset.acquisition_cost ? `Rp ${fmt(parseFloat(String(detailAsset.acquisition_cost)) / detailAsset.useful_life_months)}` : '—'} />
              </SBox>
            </div>

            {(detailAsset.location_name || detailAsset.room || detailAsset.pic_name) && (
              <SBox title="Lokasi & PIC">
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-xs-muted-bold">Lokasi</p>
                    <p className="text-sm-bold text-text">{detailAsset.location_name || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs-muted-bold">Ruangan</p>
                    <p className="text-sm-bold text-text">{detailAsset.room || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs-muted-bold">PIC</p>
                    <p className="text-sm-bold text-text">{detailAsset.pic_name || '—'}</p>
                  </div>
                </div>
              </SBox>
            )}

            {(detailAsset.details || detailAsset.information) && (
              <div className="flex flex-col gap-2">
                {detailAsset.details && (
                  <div className="info-card">
                    <p className="text-xs-bold mb-1">Detail</p>
                    <p className="text-sm-muted lh-1-6">{detailAsset.details}</p>
                  </div>
                )}
                {detailAsset.information && (
                  <div className="info-card">
                    <p className="text-xs-bold mb-1">Informasi</p>
                    <p className="text-sm-muted lh-1-6">{detailAsset.information}</p>
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer-info">
              <div className="text-xs-muted">
                Dibuat: <span className="font-medium text-text-2">{detailAsset.created_at ? new Date(detailAsset.created_at).toLocaleString('id-ID') : '—'}</span>
              </div>
              <div className="text-xs-muted">
                Diperbarui: <span className="font-medium text-text-2">{detailAsset.updated_at ? new Date(detailAsset.updated_at).toLocaleString('id-ID') : '—'}</span>
              </div>
            </div>

            <div className="modal-footer-actions">
              <button className="btn" onClick={() => { setDetailAsset(null); openEdit(detailAsset.id); }}>
                <Edit2 size={14} /> Edit
              </button>
              <button className="btn btn-primary" onClick={() => setDetailAsset(null)}>Tutup</button>
            </div>
          </div>
        )}
      </SlideOverShell>

      {/* FORM DRAWER */}
      <SlideOverShell 
        isOpen={showAdd || !!editAsset} 
        onClose={closeForm} 
        title={editAsset ? `Edit Aset — ${editAsset.asset_code || editAsset.asset_name}` : 'Tambah Aset Baru'} 
        size="md" 
        closeOnClickOutside={false}
        footer={
          <>
            <button className="btn" onClick={closeForm} disabled={saving} title="Batal">Batal</button>
            <button className="btn btn-primary min-w-130" onClick={handleSave} disabled={saving} title={editAsset ? 'Simpan Perubahan' : 'Tambah Aset'}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Menyimpan…</> : <><Save size={14} /> {editAsset ? 'Simpan' : 'Tambah'}</>}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <FormError msg={formError} />
          <div className="detail-grid">
            <FF label="Perusahaan" id="ast_co" required>
              <select id="ast_co" value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })} className="input-premium" title="Pilih Perusahaan">
                <option value="">— Pilih —</option>
                {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FF>
            <FF label="Nama Aset" id="ast_name" required>
              <input id="ast_name" type="text" placeholder="MacBook Pro 16" value={form.asset_name} onChange={e => setForm({ ...form, asset_name: e.target.value })} className="input-premium" title="Nama Aset" />
            </FF>
          </div>
          <div className="detail-grid">
            <FF label="Kode Aset" id="ast_code">
              <input id="ast_code" type="text" placeholder="Auto-generate jika kosong" value={form.asset_code} onChange={e => setForm({ ...form, asset_code: e.target.value })} className="input-premium" title="Kode Aset" />
            </FF>
            <FF label="Kategori Aset" id="ast_cat">
              <select id="ast_cat" value={form.asset_category_id} onChange={e => setForm({ ...form, asset_category_id: e.target.value, asset_type_id: '' })} className="input-premium" title="Pilih Kategori">
                <option value="">— Pilih —</option>
                {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FF>
          </div>
          <div className="detail-grid">
            <FF label="Tipe Aset" id="ast_type">
              <select id="ast_type" value={form.asset_type_id} onChange={e => setForm({ ...form, asset_type_id: e.target.value })} className="input-premium" title="Pilih Tipe">
                <option value="">— Pilih —</option>
                {filteredTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </FF>
            <FF label="Kondisi" id="ast_cond">
              <select id="ast_cond" value={form.condition_id} onChange={e => setForm({ ...form, condition_id: e.target.value })} className="input-premium" title="Pilih Kondisi">
                <option value="">— Pilih —</option>
                {meta.conditions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FF>
          </div>
          <div className="detail-grid">
            <FF label="Status Aset" id="ast_stat">
              <select id="ast_stat" value={form.status_id} onChange={e => setForm({ ...form, status_id: e.target.value })} className="input-premium" title="Pilih Status">
                <option value="">— Pilih —</option>
                {meta.statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </FF>
            <FF label="Tanggal Perolehan" id="ast_acq">
              <input id="ast_acq" type="date" value={form.acquisition_date} onChange={e => setForm({ ...form, acquisition_date: e.target.value })} className="input-premium" title="Tanggal Perolehan" />
            </FF>
          </div>
          <div className="detail-grid">
            <FF label="Nilai Perolehan (Rp)" id="ast_cost">
              <input id="ast_cost" type="text" placeholder="0" value={fmtCurrency(form.acquisition_cost)} onChange={e => setForm({ ...form, acquisition_cost: e.target.value.replace(/\D/g, '') })} className="input-premium" title="Nilai Perolehan" />
            </FF>
            <FF label="Masa Manfaat (bulan)" id="ast_life">
              <input id="ast_life" type="number" placeholder="60" min={1} value={form.useful_life_months} onChange={e => setForm({ ...form, useful_life_months: e.target.value })} className="input-premium" title="Masa Manfaat (bulan)" />
            </FF>
          </div>
          <FF label="Detail / Spesifikasi" id="ast_detail">
            <textarea id="ast_detail" placeholder="Spesifikasi teknis..." value={form.details} onChange={e => setForm({ ...form, details: e.target.value })} rows={2} className="input-premium resize-y" title="Detail / Spesifikasi" />
          </FF>
          <FF label="Informasi Tambahan" id="ast_info">
            <textarea id="ast_info" placeholder="Catatan lain..." value={form.information} onChange={e => setForm({ ...form, information: e.target.value })} rows={2} className="input-premium resize-y" title="Informasi Tambahan" />
          </FF>
        </div>
      </SlideOverShell>
      {deleteItem && (
        <ModalShell 
          title="" 
          onClose={() => !deleting && setDeleteItem(null)} 
          size="sm"
          overlayClassName="modal-top-align"
          containerClassName="modal-top-content"
        >
          <div className="flex flex-col gap-3 text-center items-center py-2">
            <div className="w-12 h-12 bg-rose-light text-rose rounded-full flex items-center justify-center mb-1">
              <Trash2 size={24} />
            </div>
            <h3 className="text-md font-800 text-text">Hapus Aset?</h3>
            <p className="text-sm text-text-2">
              Anda yakin ingin menghapus <b>{deleteItem.name}</b>?
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button 
                type="button" 
                className="btn flex-1 justify-center py-2" 
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="btn bg-rose text-white border-none flex-1 justify-center py-2 hover:opacity-90" 
                onClick={executeDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> ...</> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
