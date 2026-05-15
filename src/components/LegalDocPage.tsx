'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Search, Plus, Eye, Edit2, Trash2, AlertCircle,
  Loader2, Save, FileCheck, RefreshCw, ExternalLink, Upload,
} from 'lucide-react';
import {
  Badge, ModalShell, FF, SLabel, PaginationBar,
  TableShell, InfoRow, SBox, FormError,
} from '@/components/PageShared';

// ── Config type ───────────────────────────────────────────────
export interface LegalModuleConfig {
  module:       string;
  title:        string;
  subtitle:     string;
  icon:         React.ReactNode;
  categories:   string[];
  idLabel:      string;
  expiryLabel:  string;
  requireExpiry: boolean;  // expiry_date is mandatory + status badges shown
}

// ── Constants ─────────────────────────────────────────────────
const EXPIRY_STATUS_CLS: Record<string, string> = {
  Valid:    'badge-emerald',
  Warning:  'badge-amber',
  Critical: 'badge-rose',
  Expired:  'badge-slate',
};

const EXPIRY_TEXT_CLS: Record<string, string> = {
  Critical: 'text-rose',
  Expired:  'text-rose',
  Warning:  'text-amber',
};

const DOC_STATUSES = [
  'Draft', 'Under Review', 'Approved', 'Active', 'Expiring Soon', 'Expired', 'Archived',
];

const DOC_STATUS_CLS: Record<string, string> = {
  'Draft':         'badge-slate',
  'Under Review':  'badge-amber',
  'Approved':      'badge-indigo',
  'Active':        'badge-emerald',
  'Expiring Soon': 'badge-amber',
  'Expired':       'badge-rose',
  'Archived':      'badge-slate',
};

const CONFIDENTIALITY_LEVELS = [
  'Public/Internal',
  'Restricted',
  'Confidential',
  'Strictly Confidential / Privileged',
];

const CONF_CLS: Record<string, string> = {
  'Public/Internal':                     'badge-emerald',
  'Restricted':                          'badge-amber',
  'Confidential':                        'badge-rose',
  'Strictly Confidential / Privileged':  'badge-rose',
};

const ACTION_LABEL: Record<string, string> = {
  upload: 'Upload', view: 'Dilihat', edit: 'Diubah', delete: 'Dihapus',
};

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const daysLabel = (days: number | null) => {
  if (days === null || days === undefined) return null;
  if (days < 0)   return `Expired ${Math.abs(days)} hari lalu`;
  if (days === 0) return 'Hari ini kadaluarsa!';
  return `${days} hari lagi`;
};

const EMPTY = {
  doc_name: '', category: '', id_number: '',
  issue_date: '', expiry_date: '',
  pic: '', company_id: '', doc_status: 'Draft', confidentiality: 'Public/Internal',
  file_url: '', file_name: '', notes: '',
};

// ── Main component ────────────────────────────────────────────
export default function LegalDocPage({ config }: { config: LegalModuleConfig }) {
  const { module, title, subtitle, icon, categories, idLabel, expiryLabel, requireExpiry } = config;

  const [rows, setRows]             = useState<any[]>([]);
  const [total, setTotal]           = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage]             = useState(1);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [catFilter, setCat]         = useState('');
  const [statFilter, setStat]       = useState('');
  const [docStatFilter, setDocStat] = useState('');
  const [confFilter, setConf]       = useState('');
  const [compFilter, setComp]       = useState('');
  const [companies, setCompanies]   = useState<any[]>([]);
  const [detail, setDetail]         = useState<any>(null);
  const [dlLoading, setDlLoading]   = useState(false);
  const [showAdd, setShowAdd]       = useState(false);
  const [editRow, setEditRow]       = useState<any>(null);
  const [form, setForm]             = useState<any>(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [formErr, setFormErr]       = useState('');
  const [importing, setImporting]   = useState(false);
  const LIMIT = 20;

  useEffect(() => {
    fetch('/api/assets/meta')
      .then(r => r.json())
      .then(d => setCompanies(d.companies || []))
      .catch(() => {});
  }, []);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (lines.length < 2) throw new Error('File kosong atau tidak valid');

      const headers = lines[0].split(',').map(h => h.trim());
      const dataRows = lines.slice(1);
      
      const MOD_MAP: Record<string, string> = {
        'Contract': 'contract', 'Corporate': 'corporate', 'Litigation': 'litigation',
        'License': 'license', 'Monitoring': 'monitoring', 'SOP': 'sop',
        'HR': 'hr_compliance', 'Tax': 'tax_finance', 'Product': 'product_regulatory'
      };

      let successCount = 0;
      let failCount = 0;

      for (const row of dataRows) {
        const values = row.split(',').map(v => v.trim());
        if (values.length < headers.length) continue;

        const rowData: any = {};
        headers.forEach((h, i) => { rowData[h] = values[i]; });

        const targetModule = MOD_MAP[rowData['Modul (Menu)']] || module;

        // Map CSV headers to internal keys
        const payload = {
          module:          targetModule,
          doc_name:        rowData['Nama Dokumen'] || '',
          category:        rowData['Kategori'] || '',
          id_number:       rowData['Nomor Dokumen/Kontrak'] || '',
          pic:             rowData['PIC'] || '',
          issue_date:      rowData['Tanggal Terbit (YYYY-MM-DD)'] || '',
          expiry_date:     rowData['Tanggal Kadaluarsa (YYYY-MM-DD)'] || '',
          doc_status:      rowData['Status Dokumen'] || 'Draft',
          confidentiality: rowData['Kerahasiaan'] || 'Public/Internal',
          file_url:        rowData['Link/URL Dokumen'] || '',
          file_name:       rowData['Nama File Lampiran'] || '',
          notes:           rowData['Catatan'] || '',
          company_id:      companies.find(c => c.name.toLowerCase() === (rowData['Perusahaan']||'').toLowerCase())?.id || null
        };

        if (!payload.doc_name || !payload.category) { failCount++; continue; }

        const res = await fetch('/api/legal-docs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) successCount++; else failCount++;
      }

      alert(`Import Selesai!\nBerhasil: ${successCount}\nGagal: ${failCount}`);
      load(1);
    } catch (err: any) {
      alert('Gagal mengimpor: ' + err.message);
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const load = useCallback(async (p: number) => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({
        module, page: String(p), limit: String(LIMIT),
        ...(search        && { search }),
        ...(catFilter     && { category: catFilter }),
        ...(compFilter    && { company_id: compFilter }),
        ...(statFilter    && { status: statFilter }),
        ...(docStatFilter && { doc_status: docStatFilter }),
        ...(confFilter    && { confidentiality: confFilter }),
      });
      const res = await fetch(`/api/legal-docs?${qs}`);
      const j   = await res.json();
      setRows(j.data ?? []); setTotal(j.total ?? 0);
      setTotalPages(j.totalPages ?? 1); setPage(j.page ?? p);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [module, search, catFilter, compFilter, statFilter, docStatFilter, confFilter]);

  useEffect(() => { load(1); }, [load]);

  const openDetail = async (id: number) => {
    setDlLoading(true); setDetail(null);
    const res = await fetch(`/api/legal-docs/${id}`);
    setDetail(await res.json());
    setDlLoading(false);
  };

  const openEdit = async (id: number) => {
    const res = await fetch(`/api/legal-docs/${id}`);
    const d   = await res.json();
    setEditRow(d);
    setForm({
      doc_name:    d.doc_name    || '',
      category:    d.category    || '',
      id_number:   d.id_number   || '',
      issue_date:  d.issue_date   ? d.issue_date.split('T')[0]   : '',
      expiry_date: d.expiry_date  ? d.expiry_date.split('T')[0]  : '',
      pic:         d.pic         || '',
      company_id:  d.company_id  ? String(d.company_id) : '',
      doc_status:      d.doc_status      || 'Draft',
      confidentiality: d.confidentiality || 'Public/Internal',
      file_url:    d.file_url    || '',
      file_name:   d.file_name   || '',
      notes:       d.notes       || '',
    });
    setFormErr('');
  };

  const openAdd  = () => { setEditRow(null); setForm(EMPTY); setFormErr(''); setShowAdd(true); };
  const closeForm = () => { setShowAdd(false); setEditRow(null); setForm(EMPTY); setFormErr(''); };
  const sf = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.doc_name.trim()) { setFormErr('Nama dokumen wajib diisi');  return; }
    if (!form.category)        { setFormErr('Kategori wajib dipilih');    return; }
    if (!form.pic.trim())      { setFormErr('PIC wajib diisi');           return; }
    if (requireExpiry && !form.expiry_date) { setFormErr(`${expiryLabel} wajib diisi`); return; }
    setSaving(true);
    try {
      const url = editRow ? `/api/legal-docs/${editRow.id}` : '/api/legal-docs';
      const res = await fetch(url, {
        method: editRow ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ module, ...form }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Gagal menyimpan'); }
      closeForm(); load(page);
    } catch (e: any) { setFormErr(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Hapus dokumen "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      const res = await fetch(`/api/legal-docs/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setRows(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
    } catch { alert('Gagal menghapus dokumen'); }
  };

  // ── Table headers ────────────────────────────────────────────
  const headers = [
    { label: idLabel },
    { label: 'Nama Dokumen' },
    { label: 'Kategori' },
    { label: 'Klasifikasi' },
    { label: 'Perusahaan' },
    { label: 'PIC' },
    { label: 'Tgl Terbit' },
    ...(requireExpiry ? [{ label: expiryLabel, right: true as const }] : []),
    ...(requireExpiry ? [{ label: 'Expiry Status', right: true as const }] : []),
    { label: 'Status Dok', right: true as const },
    { label: 'Aksi', right: true as const },
  ];

  return (
    <div className="container animate-fade-in pb-12">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="header-title">{title}</h1>
          <p className="header-subtitle">{subtitle}</p>
        </div>
        <div className="flex gap-2">
          <label className={`btn cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`} title="Import data dari file CSV">
            {importing ? <Loader2 size={16} className="animate-spin text-blue" /> : <Upload size={16} className="text-blue" />}
            <span className={importing ? 'text-blue' : ''}>{importing ? 'Memproses...' : 'Import CSV'}</span>
            <input type="file" accept=".csv" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
          <button className="btn btn-primary" onClick={openAdd} title="Tambah Dokumen Baru">
            <Plus size={16}/> Tambah Dokumen
          </button>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon"/>
          <input
            type="text"
            placeholder={`Cari nama dokumen, ${idLabel.toLowerCase()}, PIC...`}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-premium w-full pl-9"
            title="Cari Dokumen"
            aria-label={`Cari dokumen ${title}`}
          />
        </div>
        <select
          value={catFilter}
          onChange={e => { setCat(e.target.value); setPage(1); }}
          className="input-premium w-auto"
          title="Filter Kategori"
          aria-label="Filter kategori"
        >
          <option value="">Semua Kategori</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={compFilter}
          onChange={e => { setComp(e.target.value); setPage(1); }}
          className="input-premium w-auto"
          title="Filter Perusahaan"
          aria-label="Filter perusahaan"
        >
          <option value="">Semua Perusahaan</option>
          {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {requireExpiry && (
          <select
            value={statFilter}
            onChange={e => { setStat(e.target.value); setPage(1); }}
            className="input-premium w-auto"
            title="Filter Status Kadaluarsa"
            aria-label="Filter status kadaluarsa"
          >
            <option value="">Semua Expiry</option>
            <option value="Critical">Critical</option>
            <option value="Warning">Warning</option>
            <option value="Valid">Valid</option>
            <option value="Expired">Expired</option>
          </select>
        )}
        <select
          value={docStatFilter}
          onChange={e => { setDocStat(e.target.value); setPage(1); }}
          className="input-premium w-auto"
          title="Filter Status Dokumen"
          aria-label="Filter status dokumen"
        >
          <option value="">Semua Status</option>
          {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={confFilter}
          onChange={e => { setConf(e.target.value); setPage(1); }}
          className="input-premium w-auto"
          title="Filter Klasifikasi Kerahasiaan"
          aria-label="Filter klasifikasi kerahasiaan"
        >
          <option value="">Semua Klasifikasi</option>
          {CONFIDENTIALITY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <div className="summary-item">
          <span className="text-text-3">Total: </span>
          <span className="font-800 text-text">{total} dokumen</span>
        </div>
      </div>

      {/* TABLE */}
      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3"/>
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={() => load(page)} title="Coba Lagi">
            <RefreshCw size={14}/> Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <TableShell
            loading={loading}
            colSpan={10}
            headers={[
          { label: 'NO. REF',                    width: 100 },
          { label: 'NAMA DOKUMEN',                width: 210 },
          { label: 'KATEGORI',                    width: 100 },
          { label: 'PERUSAHAAN',                  width: 140 },
          { label: 'PIC',                         width: 100 },
          { label: 'TGL TERBIT',                  width: 88  },
          { label: expiryLabel.toUpperCase(),      width: 110 },
          { label: 'KLASIFIKASI',                 width: 100 },
          { label: 'STATUS',                      width: 96  },
          { label: 'AKSI', right: true, width: 96 },
        ]}
      >
        {rows.length === 0 ? (
          <tr><td colSpan={10} className="py-20 text-center text-sm-muted">Tidak ada data ditemukan</td></tr>
        ) : rows.map(r => {
          // Abbreviate long confidentiality labels for table display
          const confShort: Record<string, string> = {
            'Public/Internal': 'Public',
            'Restricted': 'Restricted',
            'Confidential': 'Confidential',
            'Strictly Confidential / Privileged': 'Strictly Conf.',
          };
          return (
          <tr key={r.id} className="hover:bg-surface-2 transition-colors border-b border-border-subtle">
            <td className="p-table font-mono text-[10px] font-700 text-blue whitespace-nowrap align-middle">{r.id_number || '—'}</td>
            <td className="p-table align-middle td-doc-name">
              <div className="font-600 text-[11px] text-text truncate" title={r.doc_name}>{r.doc_name}</div>
              {r.notes && <div className="text-[9px] text-text-3 truncate mt-0.5">{r.notes}</div>}
            </td>
            <td className="p-table align-middle td-category">
              <span className="inline-block truncate max-w-full text-[10px] font-600 text-text-2" title={r.category}>{r.category}</span>
            </td>
            <td className="p-table text-[11px] text-text-2 align-middle truncate td-company" title={r.company_name}>{r.company_name || '—'}</td>
            <td className="p-table whitespace-nowrap text-[11px] font-600 align-middle">{r.pic}</td>
            <td className="p-table whitespace-nowrap text-[10px] text-text-2 align-middle">{fmtDate(r.issue_date)}</td>
            <td className="p-table whitespace-nowrap align-middle">
              <div className={`text-[10px] font-700 ${EXPIRY_TEXT_CLS[r.status] || 'text-text'}`}>{fmtDate(r.expiry_date)}</div>
              {r.status && <div className={`text-[9px] font-600 uppercase tracking-tight mt-0.5 ${EXPIRY_TEXT_CLS[r.status] || 'text-text-3'}`}>{r.status}{r.days_until_expiry ? ` · ${r.days_until_expiry}h` : ''}</div>}
            </td>
            <td className="p-table align-middle">
              <Badge label={confShort[r.confidentiality] || r.confidentiality || 'Public'} colorClass={`${CONF_CLS[r.confidentiality] || 'badge-emerald'} !text-[9px]`}/>
            </td>
            <td className="p-table align-middle">
              <Badge label={r.doc_status || 'Draft'} colorClass={`${DOC_STATUS_CLS[r.doc_status] || 'badge-slate'} !text-[9px]`}/>
            </td>
            <td className="p-table text-right whitespace-nowrap align-middle td-action-sticky">
              <div className="flex justify-end gap-1.5 pr-3">
                <button className="btn-icon hover:bg-blue-light hover:text-blue border-transparent"
                  onClick={() => openDetail(r.id)} title="Detail Dokumen">
                  <Eye size={13}/>
                </button>
                <button className="btn-icon hover:bg-blue-light hover:text-blue border-transparent"
                  onClick={() => openEdit(r.id)} title="Ubah Data">
                  <Edit2 size={13}/>
                </button>
                <button className="btn-icon hover:bg-rose-light hover:text-rose border-transparent"
                  onClick={() => handleDelete(r.id, r.doc_name)} title="Hapus Dokumen">
                  <Trash2 size={13}/>
                </button>
              </div>
            </td>
          </tr>
          );
        })}
          </TableShell>
          {!loading && rows.length > 0 && (
            <PaginationBar page={page} limit={LIMIT} total={total} totalPages={totalPages}
              onChange={p => { setPage(p); load(p); }}/>
          )}
        </>
      )}

      {/* ── DETAIL MODAL ── */}
      {(detail || dlLoading) && (
        <ModalShell
          title={detail ? `Detail — ${detail.doc_name}` : 'Memuat…'}
          onClose={() => setDetail(null)}
          size="md"
        >
          {dlLoading || !detail ? (
            <div className="flex-center py-12"><Loader2 size={28} className="animate-spin text-blue"/></div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg-black">{detail.doc_name}</h2>
                  <p className="text-xs-muted mt-1">{detail.category}{detail.id_number ? ` · ${detail.id_number}` : ''}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge label={detail.doc_status || 'Draft'} colorClass={DOC_STATUS_CLS[detail.doc_status] || 'badge-slate'}/>
                  {detail.status && <Badge label={detail.status} colorClass={EXPIRY_STATUS_CLS[detail.status] || 'badge-slate'}/>}
                </div>
              </div>

              <div className="detail-grid">
                <SBox icon={<div className="text-blue">{icon}</div>} title="Informasi Dokumen">
                  <InfoRow label="Kategori"    value={detail.category}/>
                  {detail.id_number && <InfoRow label={idLabel} value={<span className="font-mono">{detail.id_number}</span>}/>}
                  <InfoRow label="Perusahaan"  value={detail.company_name}/>
                  <InfoRow label="PIC"         value={detail.pic}/>
                  <InfoRow label="Status Dokumen" value={
                    <Badge label={detail.doc_status || 'Draft'} colorClass={DOC_STATUS_CLS[detail.doc_status] || 'badge-slate'}/>
                  }/>
                  <InfoRow label="Klasifikasi Kerahasiaan" value={
                    <Badge label={detail.confidentiality || 'Public/Internal'} colorClass={CONF_CLS[detail.confidentiality] || 'badge-emerald'}/>
                  }/>
                  <InfoRow label="Tgl Terbit" value={fmtDate(detail.issue_date)}/>
                  {detail.expiry_date && (
                    <InfoRow label={expiryLabel} value={
                      <span className={EXPIRY_TEXT_CLS[detail.status] || 'text-text'}>
                        {fmtDate(detail.expiry_date)}
                        {detail.days_until_expiry !== null && (
                          <span className="ml-1 text-xs-muted">({daysLabel(parseInt(detail.days_until_expiry))})</span>
                        )}
                      </span>
                    }/>
                  )}
                </SBox>
                <SBox icon={<FileCheck size={14}/>} title="Lampiran & Catatan">
                  {detail.file_url ? (
                    <a href={detail.file_url} target="_blank" rel="noopener noreferrer"
                      className="flex-start gap-1.5 text-blue text-xs font-600 hover:underline mb-2">
                      <ExternalLink size={12}/>
                      {detail.file_name || 'Lihat Dokumen'}
                    </a>
                  ) : (
                    <p className="text-xs-muted">Tidak ada file terlampir</p>
                  )}
                  {detail.notes && (
                    <div className="mt-2">
                      <p className="text-xs-bold mb-1">Catatan</p>
                      <p className="text-sm-muted lh-1-6">{detail.notes}</p>
                    </div>
                  )}
                </SBox>
              </div>

              {detail.audit_logs?.length > 0 && (
                <div>
                  <p className="text-xs-bold mb-2">Riwayat Aktivitas</p>
                  <div className="flex flex-col max-h-36 overflow-y-auto border border-border rounded-xl">
                    {detail.audit_logs.map((log: any, i: number) => (
                      <div key={log.id} className={`flex-between text-xxs px-3 py-1.5 ${i < detail.audit_logs.length - 1 ? 'border-b border-border-subtle' : ''}`}>
                        <span className="text-text font-700 uppercase">{ACTION_LABEL[log.action] || log.action}</span>
                        <span className="text-text-3">{new Date(log.performed_at).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-footer-actions">
                <button className="btn" onClick={() => { setDetail(null); openEdit(detail.id); }} title="Edit">
                  <Edit2 size={14}/> Edit
                </button>
                <button className="btn btn-primary" onClick={() => setDetail(null)} title="Tutup">Tutup</button>
              </div>
            </div>
          )}
        </ModalShell>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      {(showAdd || editRow) && (
        <ModalShell
          title={editRow ? `Edit — ${editRow.doc_name}` : `Tambah ${title}`}
          onClose={closeForm}
          size="md"
          closeOnClickOutside={false}
          footer={
            <div className="flex-end gap-3">
              <button className="btn" onClick={closeForm} disabled={saving}>Batal</button>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minWidth: 120 }}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : (form.id ? <Save size={16} /> : <Plus size={16} />)}
                {form.id ? 'Simpan Perubahan' : 'Tambah Dokumen'}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-6">
            <FormError msg={formErr}/>
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <div className="w-1.5 h-4 bg-blue rounded-full"></div>
                <span className="text-xs-bold uppercase tracking-wider text-text-2">Informasi Utama</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <FF label="Nama Dokumen" id="ld_name" required>
                  <input id="ld_name" type="text" value={form.doc_name}
                    onChange={e => sf('doc_name', e.target.value)}
                    placeholder="Nama dokumen lengkap" className="input-premium" title="Nama Dokumen"/>
                </FF>
                <FF label="Kategori" id="ld_cat" required>
                  <select id="ld_cat" value={form.category}
                    onChange={e => sf('category', e.target.value)}
                    className="input-premium" title="Kategori">
                    <option value="">— Pilih Kategori —</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FF>
                <FF label={idLabel} id="ld_id">
                  <input id="ld_id" type="text" value={form.id_number}
                    onChange={e => sf('id_number', e.target.value)}
                    placeholder={`No. referensi / ${idLabel.toLowerCase()}`}
                    className="input-premium" title={idLabel}/>
                </FF>
                <FF label="Perusahaan" id="ld_co">
                  <select id="ld_co" value={form.company_id}
                    onChange={e => sf('company_id', e.target.value)}
                    className="input-premium" title="Perusahaan">
                    <option value="">— Pilih Perusahaan —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </FF>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <div className="w-1.5 h-4 bg-amber rounded-full"></div>
                <span className="text-xs-bold uppercase tracking-wider text-text-2">PIC & Masa Berlaku</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <FF label="PIC (Penanggung Jawab)" id="ld_pic" required>
                  <input id="ld_pic" type="text" value={form.pic}
                    onChange={e => sf('pic', e.target.value)}
                    placeholder="Nama PIC" className="input-premium" title="PIC"/>
                </FF>
                <FF label="Tgl Terbit / Efektif" id="ld_issue">
                  <input id="ld_issue" type="date" value={form.issue_date}
                    onChange={e => sf('issue_date', e.target.value)}
                    className="input-premium" title="Tgl Terbit"/>
                </FF>
                <FF label={expiryLabel} id="ld_exp" required>
                  <input id="ld_exp" type="date" value={form.expiry_date}
                    onChange={e => sf('expiry_date', e.target.value)}
                    className="input-premium" title={expiryLabel}/>
                </FF>
                <FF label="Status Dokumen" id="ld_st" required>
                  <select id="ld_st" value={form.doc_status}
                    onChange={e => sf('doc_status', e.target.value)}
                    className="input-premium" title="Status Dokumen">
                    {DOC_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FF>
                <FF label="Kerahasiaan" id="ld_conf" required>
                  <select id="ld_conf" value={form.confidentiality}
                    onChange={e => sf('confidentiality', e.target.value)}
                    className="input-premium" title="Kerahasiaan">
                    {CONF_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </FF>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-border">
                <div className="w-1.5 h-4 bg-emerald rounded-full"></div>
                <span className="text-xs-bold uppercase tracking-wider text-text-2">Lampiran & Catatan</span>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                <FF label="URL File / Link Dokumen" id="ld_url">
                  <input id="ld_url" type="text" value={form.file_url}
                    onChange={e => sf('file_url', e.target.value)}
                    placeholder="https://drive.google.com/..." className="input-premium" title="URL File"/>
                </FF>
                <FF label="Nama File" id="ld_fname">
                  <input id="ld_fname" type="text" value={form.file_name}
                    onChange={e => sf('file_name', e.target.value)}
                    placeholder="contoh: Kontrak_2025.pdf" className="input-premium" title="Nama File"/>
                </FF>
              </div>
              <FF label="Catatan Tambahan" id="ld_notes">
                <textarea id="ld_notes" value={form.notes}
                  onChange={e => sf('notes', e.target.value)}
                  placeholder="Catatan tambahan..." className="input-premium min-h-20" title="Catatan"/>
              </FF>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
