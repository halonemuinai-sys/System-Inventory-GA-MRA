'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Plus, QrCode, ClipboardCheck, ArrowLeft, 
  Search, CheckCircle2, XCircle, AlertCircle, Loader2, Trash2
} from 'lucide-react';
import { Badge, ModalShell, FF, FormError, TableShell, PaginationBar } from '@/components/PageShared';

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
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Session
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ session_name: '', description: '', company_id: '', category_id: '' });
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState('');
  
  // Meta data for filters
  const [meta, setMeta] = useState<{ companies: any[], categories: any[] }>({ companies: [], categories: [] });

  // View Session Detail
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [checks, setChecks] = useState<CheckDetail[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Scan Mode
  const [scanMode, setScanMode] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanMsg, setScanMsg] = useState({ text: '', type: '' });
  const scanInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    loadSessions(); 
    fetch('/api/assets/meta').then(r => r.json()).then(setMeta).catch(console.error);
  }, []);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stock-opname');
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
        body: JSON.stringify(form)
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
      const res = await fetch(`/api/stock-opname?id=${session.id}`);
      const data = await res.json();
      setChecks(data.checks || []);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus sesi ini? Semua data pengecekan di dalamnya akan hilang.')) return;
    try {
      const res = await fetch(`/api/stock-opname?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      loadSessions();
    } catch (e) {
      alert('Gagal menghapus sesi');
    }
  };

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = scanInput.trim();
    if (!code || !activeSession) return;

    setScanInput('');
    setScanMsg({ text: 'Memproses...', type: 'info' });

    try {
      const res = await fetch('/api/stock-opname/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: activeSession.id,
          asset_code: code,
          check_status: 'Found', // Default action via barcode scan
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memproses');
      
      setScanMsg({ text: `Berhasil: ${data.asset.asset_name}`, type: 'success' });
      
      // Update local state smoothly
      setChecks(checks.map(c => c.asset_code === code ? { ...c, check_status: 'Found' } : c));
      setActiveSession({
        ...activeSession,
        checked_count: activeSession.checked_count + 1,
        found_count: activeSession.found_count + 1,
      });

    } catch (e: any) {
      setScanMsg({ text: e.message, type: 'error' });
    }
    scanInputRef.current?.focus();
  };

  // Keep focus on input while scanning
  useEffect(() => {
    if (scanMode && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [scanMode]);

  if (activeSession) {
    return (
      <div className="container animate-fade-in pb-12">
        <div className="page-header">
          <div>
            <button onClick={() => setActiveSession(null)} className="text-blue hover:underline mb-2 flex items-center gap-1 text-sm">
              <ArrowLeft size={14} /> Kembali ke Daftar Sesi
            </button>
            <h1 className="header-title">{activeSession.session_name}</h1>
            <p className="header-subtitle">Total {activeSession.total_assets} aset untuk di-cek.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setScanMode(true)}>
            <QrCode size={16} /> Mulai Scan Barcode
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <p className="text-xs-muted-bold">Total Aset</p>
            <p className="text-2xl font-800 text-text mt-1">{activeSession.total_assets}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs-muted-bold">Sudah Dicek</p>
            <p className="text-2xl font-800 text-blue mt-1">{activeSession.checked_count}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs-muted-bold">Ditemukan</p>
            <p className="text-2xl font-800 text-emerald mt-1">{activeSession.found_count}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs-muted-bold">Sisa (Pending)</p>
            <p className="text-2xl font-800 text-amber mt-1">{activeSession.total_assets - activeSession.checked_count}</p>
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <TableShell 
            headers={[
              {label: 'Status'}, {label: 'Kode Aset'}, {label: 'Nama Aset'}, 
              {label: 'Perusahaan'}, {label: 'Lokasi Asli'}, {label: 'Kondisi'}
            ]}
            loading={detailLoading}
            colSpan={6}
          >
            {checks.map(c => (
              <tr key={c.id}>
                <td className="td-p">
                  {c.check_status === 'Found' ? <Badge label="Ditemukan" colorClass="badge-emerald" /> :
                   c.check_status === 'Missing' ? <Badge label="Hilang" colorClass="badge-rose" /> :
                   <Badge label="Pending" colorClass="badge-slate" />}
                </td>
                <td className="td-p font-mono text-xs">{c.asset_code}</td>
                <td className="td-p text-sm-bold">{c.asset_name}</td>
                <td className="td-p text-sm-muted">{c.company}</td>
                <td className="td-p text-sm-muted">{c.room || '—'}</td>
                <td className="td-p text-sm-muted">{c.current_condition || '—'}</td>
              </tr>
            ))}
          </TableShell>
        </div>

        {/* SCAN MODAL */}
        {scanMode && (
          <ModalShell title="Mode Scan Barcode" onClose={() => setScanMode(false)} size="md">
            <div className="flex flex-col items-center gap-6 py-6">
              <QrCode size={80} className="text-blue opacity-50" />
              <p className="text-center text-sm-muted">
                Silakan gunakan <b>Barcode Scanner</b> atau ketik manual kode aset.<br/>
                Sistem akan otomatis menyimpan aset sebagai "Ditemukan".
              </p>

              {scanMsg.text && (
                <div className={`p-3 rounded-md w-full text-center text-sm-bold ${
                  scanMsg.type === 'success' ? 'bg-emerald-50 text-emerald' : 
                  scanMsg.type === 'error' ? 'bg-rose-50 text-rose' : 'bg-blue-50 text-blue'
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
                  className="input-premium w-full text-center text-lg tracking-widest font-mono"
                  placeholder="Scan barcode di sini..."
                  autoFocus
                  onBlur={() => {
                    // Keep focus to allow continuous scanning if a physical scanner is used
                    setTimeout(() => scanInputRef.current?.focus(), 100);
                  }}
                />
                <button type="submit" className="hidden">Submit</button>
              </form>

              <button className="btn btn-primary w-full" onClick={() => setScanMode(false)}>
                Selesai Scan
              </button>
            </div>
          </ModalShell>
        )}
      </div>
    );
  }

  // LIST SESSIONS
  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div>
          <h1 className="header-title">Stock Opname</h1>
          <p className="header-subtitle">Verifikasi fisik aset menggunakan barcode.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> Buat Sesi Baru
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        <TableShell 
          headers={[
            {label: 'Nama Sesi'}, {label: 'Tanggal Mulai'}, {label: 'Status'}, 
            {label: 'Progres', right: true}, {label: 'Aksi', right: true}
          ]}
          loading={loading}
          colSpan={5}
        >
          {sessions.length === 0 && !loading && (
            <tr>
              <td colSpan={5} className="py-14 text-center">
                <ClipboardCheck size={36} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Belum ada sesi Stock Opname</p>
                <p className="text-xs-muted mt-1">Buat sesi baru untuk memulai verifikasi aset.</p>
              </td>
            </tr>
          )}
          {sessions.map(s => (
            <tr key={s.id} className="hover-row">
              <td className="td-p text-sm-bold text-text">{s.session_name}</td>
              <td className="td-p text-sm-muted">{new Date(s.started_at).toLocaleDateString('id-ID')}</td>
              <td className="td-p">
                <Badge label={s.status} colorClass={s.status === 'Completed' ? 'badge-emerald' : 'badge-amber'} />
              </td>
              <td className="td-p text-right">
                <div className="flex items-center justify-end gap-2 text-sm-bold text-text">
                  <span>{s.checked_count} / {s.total_assets}</span>
                  <div className="w-16 h-2 bg-surface-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue" 
                      style={{ width: `${s.total_assets ? (s.checked_count / s.total_assets) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="td-p text-right">
                <div className="flex justify-end gap-2">
                  <button className="btn-icon text-rose hover:bg-rose-50" onClick={() => handleDelete(s.id)} title="Hapus Sesi">
                    <Trash2 size={14} />
                  </button>
                  <button className="btn-icon-blue" onClick={() => openSession(s)} title="Buka Sesi">
                    Buka
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </TableShell>
      </div>

      {showCreate && (
        <ModalShell title="Buat Sesi Stock Opname" onClose={() => setShowCreate(false)}>
          <div className="flex flex-col gap-4">
            <FormError msg={formErr} />
            <FF label="Nama Sesi" required>
              <input 
                type="text" 
                className="input-premium" 
                placeholder="Contoh: Audit Q2 2026 - MRA Group"
                value={form.session_name}
                onChange={e => setForm({...form, session_name: e.target.value})}
              />
            </FF>
            <FF label="Deskripsi">
              <textarea 
                className="input-premium" 
                placeholder="Catatan tambahan..."
                rows={3}
                value={form.description}
                onChange={e => setForm({...form, description: e.target.value})}
              />
            </FF>
            <div className="grid grid-cols-2 gap-4">
              <FF label="Filter Perusahaan">
                <select className="input-premium" value={form.company_id} onChange={e => setForm({...form, company_id: e.target.value})} title="Filter Perusahaan">
                  <option value="">-- Semua Perusahaan --</option>
                  {meta.companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FF>
              <FF label="Filter Kategori">
                <select className="input-premium" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})} title="Filter Kategori">
                  <option value="">-- Semua Kategori --</option>
                  {meta.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FF>
            </div>
            <div className="p-3 bg-blue-50 text-blue text-sm rounded-md border border-blue/20">
              Saat sesi dibuat, sistem akan mengambil data <b>semua aset aktif</b> (sesuai filter di atas) ke dalam daftar pengecekan.
            </div>
            <div className="modal-footer-border">
              <button className="btn" onClick={() => setShowCreate(false)} disabled={saving}>Batal</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <><Loader2 size={14} className="animate-spin"/> Memproses...</> : 'Mulai Sesi'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
