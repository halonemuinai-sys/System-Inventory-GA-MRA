'use client';

import { useEffect, useState, useRef } from 'react';
import {
  Plus, QrCode, ClipboardCheck, ArrowLeft, Loader2, Trash2
} from 'lucide-react';
import { Badge, ModalShell, FF, FormError, TableShell } from '@/components/PageShared';

interface Session {
  id: number;
  session_name: string;
  description: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  total_assets: number;
  checked_count: number;
  found_count: number;
  missing_count: number;
}

interface CheckDetail {
  id: number;
  asset_code: string;
  asset_name: string;
  category: string;
  company: string;
  room: string;
  current_condition: string;
  check_status: string;
}

export default function StockOpnamePage() {
  const [sessions, setSessions]       = useState<Session[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState({ session_name: '', description: '', company_id: '', category_id: '' });
  const [saving, setSaving]           = useState(false);
  const [formErr, setFormErr]         = useState('');
  const [meta, setMeta]               = useState<{ companies: any[], categories: any[] }>({ companies: [], categories: [] });
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [checks, setChecks]           = useState<CheckDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scanMode, setScanMode]       = useState(false);
  const [scanInput, setScanInput]     = useState('');
  const [scanMsg, setScanMsg]         = useState({ text: '', type: '' });
  const scanInputRef                  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSessions();
    fetch('/api/assets/meta').then(r => r.json()).then(setMeta).catch(console.error);
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res  = await fetch('/api/stock-opname');
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setFormErr('');
    if (!form.session_name) { setFormErr('Nama sesi wajib diisi'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/stock-opname', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Gagal membuat sesi');
      setShowCreate(false);
      setForm({ session_name: '', description: '', company_id: '', category_id: '' });
      loadSessions();
    } catch (e: any) {
      setFormErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openSession = async (session: Session) => {
    setActiveSession(session);
    setDetailLoading(true);
    try {
      const res  = await fetch(`/api/stock-opname?id=${session.id}`);
      const data = await res.json();
      setChecks(data.checks || []);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini? Semua data pengecekan akan hilang.')) return;
    try {
      const res = await fetch(`/api/stock-opname?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      loadSessions();
    } catch {
      alert('Gagal menghapus sesi');
    }
  };

  const handleScanSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const code = scanInput.trim();
    if (!code || !activeSession) return;
    setScanInput('');
    setScanMsg({ text: 'Memproses...', type: 'info' });
    try {
      const res  = await fetch('/api/stock-opname/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSession.id, asset_code: code, check_status: 'Found' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses');
      const wasPending = checks.find(c => c.asset_code === code)?.check_status === 'Pending';
      setScanMsg({ text: `✓ Ditemukan: ${data.asset.asset_name}`, type: 'success' });
      setChecks(checks.map(c => c.asset_code === code ? { ...c, check_status: 'Found' } : c));
      if (wasPending) {
        setActiveSession({
          ...activeSession,
          checked_count: activeSession.checked_count + 1,
          found_count:   activeSession.found_count + 1,
        });
      }
    } catch (e: any) {
      setScanMsg({ text: e.message, type: 'error' });
    }
    scanInputRef.current?.focus();
  };

  useEffect(() => {
    if (scanMode && scanInputRef.current) scanInputRef.current.focus();
  }, [scanMode]);

  // ── DETAIL VIEW ───────────────────────────────────────────────
  if (activeSession) {
    const pending = activeSession.total_assets - activeSession.checked_count;
    return (
      <div className="container animate-fade-in pb-12">

        {/* Header */}
        <div className="flex-between mb-6">
          <div>
            <button type="button" onClick={() => setActiveSession(null)} className="flex-start gap-1.5 text-blue text-sm font-600 hover:underline mb-2">
              <ArrowLeft size={15} /> Kembali ke Daftar Sesi
            </button>
            <h1 className="header-title">{activeSession.session_name}</h1>
            <p className="header-subtitle">Total {activeSession.total_assets} aset dalam sesi ini.</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setScanMode(true)}>
            <QrCode size={16} /> Mulai Scan Barcode
          </button>
        </div>

        {/* Progress cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card">
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Total Aset</p>
            <p className="text-2xl font-900 text-text">{activeSession.total_assets}</p>
          </div>
          <div className="card">
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Sudah Dicek</p>
            <p className="text-2xl font-900 text-blue">{activeSession.checked_count}</p>
          </div>
          <div className="card">
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Ditemukan</p>
            <p className="text-2xl font-900 text-emerald">{activeSession.found_count}</p>
          </div>
          <div className="card">
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Sisa (Pending)</p>
            <p className="text-2xl font-900 text-amber">{pending}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card mb-6 py-3">
          <div className="flex-between mb-2">
            <span className="text-xxs-bold text-text-3 uppercase letter-wide">Progress Pengecekan</span>
            <span className="text-xxs-bold text-blue">
              {activeSession.total_assets ? Math.round((activeSession.checked_count / activeSession.total_assets) * 100) : 0}%
            </span>
          </div>
          <div className="w-full h-2 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-blue rounded-full transition-all"
              style={{ width: `${activeSession.total_assets ? (activeSession.checked_count / activeSession.total_assets) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Asset check table */}
        <div className="card p-0 overflow-hidden">
          <TableShell
            headers={[
              { label: 'Status' }, { label: 'Kode Aset' }, { label: 'Nama Aset' },
              { label: 'Kategori' }, { label: 'Perusahaan' }, { label: 'Lokasi' }, { label: 'Kondisi' },
            ]}
            loading={detailLoading}
            colSpan={7}
          >
            {checks.map(c => (
              <tr key={c.id} className="hover-row">
                <td className="td-p">
                  {c.check_status === 'Found'   ? <Badge label="Ditemukan" colorClass="badge-emerald" /> :
                   c.check_status === 'Missing' ? <Badge label="Hilang"    colorClass="badge-rose"    /> :
                                                  <Badge label="Pending"   colorClass="badge-slate"   />}
                </td>
                <td className="td-p font-mono text-xs">{c.asset_code}</td>
                <td className="td-p text-sm-bold">{c.asset_name}</td>
                <td className="td-p text-sm-muted">{c.category || '—'}</td>
                <td className="td-p text-sm-muted">{c.company}</td>
                <td className="td-p text-sm-muted">{c.room || '—'}</td>
                <td className="td-p text-sm-muted">{c.current_condition || '—'}</td>
              </tr>
            ))}
          </TableShell>
        </div>

        {/* Scan Modal */}
        {scanMode && (
          <ModalShell title="Mode Scan Barcode" onClose={() => setScanMode(false)} size="md">
            <div className="flex flex-col items-center gap-5 py-4">
              <QrCode size={56} className="text-blue opacity-40" />
              <p className="text-center text-sm text-text-2">
                Scan barcode aset atau <b>ketik kode aset</b> secara manual, lalu tekan <b>Enter</b>.<br />
                Aset otomatis tersimpan sebagai <b>Ditemukan</b>.
              </p>

              {scanMsg.text && (
                <div className={`w-full px-4 py-3 rounded-xl text-sm font-600 text-center border ${
                  scanMsg.type === 'success' ? 'bg-emerald-light text-emerald border-emerald-border' :
                  scanMsg.type === 'error'   ? 'bg-rose-light text-rose border-rose-border'           :
                                              'bg-blue-light text-blue border-blue-border'
                }`}>
                  {scanMsg.text}
                </div>
              )}

              <form onSubmit={handleScanSubmit} className="w-full">
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanInput}
                  onChange={e => setScanInput(e.target.value)}
                  className="w-full text-center text-xl font-mono font-800 tracking-widest"
                  placeholder="Scan atau ketik kode aset, tekan Enter..."
                  autoFocus
                />
                <button type="submit" className="hidden" aria-label="Submit scan" />
              </form>

              <button type="button" className="btn btn-primary w-full" onClick={() => setScanMode(false)}>
                Selesai Scan
              </button>
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  // ── SESSION LIST ──────────────────────────────────────────────
  return (
    <div className="container animate-fade-in pb-12">

      {/* Header */}
      <div className="flex-between mb-6">
        <div>
          <h1 className="header-title">Stock Opname</h1>
          <p className="header-subtitle">Verifikasi fisik aset menggunakan barcode scanner.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> Buat Sesi Baru
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <TableShell
            headers={[
              { label: 'Nama Sesi' }, { label: 'Deskripsi' }, { label: 'Tanggal Mulai' },
              { label: 'Status' }, { label: 'Progress', right: true }, { label: 'Aksi', right: true },
            ]}
            loading={loading}
            colSpan={6}
          >
            {sessions.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="py-20 text-center">
                  <div className="w-14 h-14 bg-surface-2 rounded-2xl flex-center mx-auto mb-4">
                    <ClipboardCheck size={28} className="text-text-3" />
                  </div>
                  <p className="text-base font-800 text-text mb-1">Belum ada sesi Stock Opname</p>
                  <p className="text-sm text-text-3 max-w-xs mx-auto">
                    Buat sesi baru untuk memulai verifikasi fisik aset.
                  </p>
                </td>
              </tr>
            )}
            {sessions.map(s => {
              const pct = s.total_assets ? Math.round((s.checked_count / s.total_assets) * 100) : 0;
              return (
                <tr key={s.id} className="hover-row">
                  <td className="td-p text-sm-bold">{s.session_name}</td>
                  <td className="td-p text-sm-muted max-w-xs truncate">{s.description || '—'}</td>
                  <td className="td-p text-sm-muted whitespace-nowrap">
                    {new Date(s.started_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="td-p">
                    <Badge label={s.status} colorClass={s.status === 'Completed' ? 'badge-emerald' : 'badge-amber'} />
                  </td>
                  <td className="td-p text-right">
                    <div className="flex-between gap-3 justify-end">
                      <span className="text-xs font-700 text-text whitespace-nowrap">{s.checked_count} / {s.total_assets}</span>
                      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full rounded-full ${s.status === 'Completed' ? 'bg-emerald' : 'bg-blue'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xxs font-800 text-text-3 w-7 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="td-p text-right">
                    <div className="flex justify-end gap-2">
                      <button className="btn-icon text-rose hover:bg-rose-light" onClick={() => handleDelete(s.id)} title="Hapus Sesi">
                        <Trash2 size={15} />
                      </button>
                      <button className="btn btn-primary py-1.5 px-4 text-xs" onClick={() => openSession(s)}>
                        Buka
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </TableShell>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <ModalShell title="Buat Sesi Stock Opname Baru" onClose={() => setShowCreate(false)}>
          <FormError msg={formErr} />
          <FF label="Nama Sesi" required>
            <input
              type="text"
              placeholder="Contoh: Audit Q2 2026 — MRA Group"
              value={form.session_name}
              onChange={e => setForm({ ...form, session_name: e.target.value })}
            />
          </FF>
          <FF label="Deskripsi">
            <textarea
              placeholder="Catatan tambahan tentang sesi ini..."
              rows={2}
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </FF>
          <div className="grid grid-cols-2 gap-4">
            <FF label="Filter Perusahaan">
              <select value={form.company_id} onChange={e => setForm({ ...form, company_id: e.target.value })} title="Filter Perusahaan">
                <option value="">— Semua Perusahaan —</option>
                {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FF>
            <FF label="Filter Kategori">
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} title="Filter Kategori">
                <option value="">— Semua Kategori —</option>
                {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FF>
          </div>
          <p className="text-xs text-blue-d bg-blue-light border border-blue-border rounded-xl px-3 py-2">
            Sistem akan mengambil <b>semua aset aktif</b> sesuai filter ke dalam daftar pengecekan.
          </p>
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <button type="button" className="btn" onClick={() => setShowCreate(false)} disabled={saving}>Batal</button>
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={saving}>
              {saving ? <><Loader2 size={14} className="animate-spin" /> Memproses...</> : 'Mulai Sesi'}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
