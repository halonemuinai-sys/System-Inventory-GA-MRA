'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  AlertCircle, RefreshCw, Scale, FileSignature, Gavel, LayoutDashboard, ShieldAlert,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Badge } from '@/components/PageShared';

// ── Palettes ──────────────────────────────────────────────────
const PIE_COLORS   = ['#2563eb','#4f46e5','#059669','#d97706','#e11d48','#0ea5e9','#7c3aed','#0d9488'];
const EXPIRY_COLORS = { Valid:'#059669', Warning:'#d97706', Critical:'#e11d48', Expired:'#94a3b8' };

// ── Helpers ───────────────────────────────────────────────────
const fmt     = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// ── Count-up hook ─────────────────────────────────────────────
function useCountUp(target: number, duration = 1500) {
  const [val, setVal] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    if (!target) { setVal(0); return; }
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return val;
}

function AnimNum({ value }: { value: number }) {
  return <>{fmt(useCountUp(value))}</>;
}

// ── Adaptive tooltip ──────────────────────────────────────────
function LightTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-xl min-w-130">
      {label && <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className={`flex-start gap-1.5 text-xs ${i < payload.length - 1 ? 'mb-1' : ''}`}>
          <div className="w-2 h-2 rounded-xs shrink-0" style={{ background: p.color || p.fill || '#2563eb' }}/>
          <span className="text-text-2">{p.name}:</span>
          <span className="text-text font-700">{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section divider ───────────────────────────────────────────
function SecTitle({ children }: { children: string }) {
  return (
    <div className="flex-start gap-3 mt-8 mb-4">
      <div className="w-1 h-4 rounded-xs bg-blue shrink-0" />
      <span className="text-xxs-bold text-text-3 uppercase letter-wide">{children}</span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Section card ──────────────────────────────────────────────
function SCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden shadow-premium transition-all hover:shadow-hover ${className || ''}`}>
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-2/50 flex-between">
        <span className="text-xxs-bold text-text-3 uppercase letter-wide">{title}</span>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-border" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Expiry badge ──────────────────────────────────────────────
function ExpiryBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Valid:    'badge-emerald',
    Warning:  'badge-amber',
    Critical: 'badge-rose',
    Expired:  'badge-slate',
  };
  return <Badge label={status} colorClass={cls[status] || 'badge-slate'}/>;
}

// ── Module icon map ───────────────────────────────────────────
const MODULE_ICONS: Record<string, React.ReactNode> = {
  contract:  <FileSignature size={16}/>,
  corporate: <Scale size={16}/>,
  litigation: <Gavel size={16}/>,
};

const MODULE_FULL_LABELS: Record<string, string> = {
  contract:  'Contract Management',
  corporate: 'Corporate Legal',
  litigation: 'Litigation & Dispute',
};

// ── Types ─────────────────────────────────────────────────────
interface SummaryData {
  kpi:               { total: number; active: number; expiringSoon: number; expired: number };
  byModule:          { module: string; label: string; total: number; critical: number }[];
  byDocStatus:       { status: string; count: number }[];
  byConfidentiality: { level: string; count: number }[];
  byExpiryStatus:    { module: string; label: string; Valid: number; Warning: number; Critical: number; Expired: number }[];
  criticalDocs:      any[];
}

// ── Main Page ─────────────────────────────────────────────────
export default function LegalDashboardPage() {
  const [data, setData]     = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/legal-docs/summary?dept=legal');
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data');
      setData(j);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div>
          <h1 className="header-title">Legal Dashboard</h1>
          <p className="header-subtitle">Overview departemen Legal</p>
        </div>
      </div>
      <div className="flex-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue"/>
      </div>
    </div>
  );

  if (error) return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header">
        <div>
          <h1 className="header-title">Legal Dashboard</h1>
          <p className="header-subtitle">Overview departemen Legal</p>
        </div>
      </div>
      <div className="error-alert-container">
        <AlertCircle size={36} className="text-rose mb-3"/>
        <p className="text-rose-bold">{error}</p>
        <button className="btn btn-primary mt-4" onClick={load}><RefreshCw size={14}/> Coba Lagi</button>
      </div>
    </div>
  );

  if (!data) return null;

  const kpi = data.kpi;

  return (
    <div className="container animate-fade-in pb-12">

      {/* HEADER */}
      <div className="page-header">
        <div className="flex-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-light flex-center text-blue shrink-0">
            <LayoutDashboard size={18}/>
          </div>
          <div>
            <h1 className="header-title">Legal Dashboard</h1>
            <p className="header-subtitle">Overview & monitoring dokumen departemen Legal</p>
          </div>
        </div>
        <button className="btn" onClick={load} title="Refresh"><RefreshCw size={14}/> Refresh</button>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Dokumen', value: kpi.total,        border: 'border-t-blue',    glow: '' },
          { label: 'Aktif',         value: kpi.active,       border: 'border-t-emerald', glow: '' },
          { label: 'Mendekati Exp', value: kpi.expiringSoon, border: 'border-t-amber',   glow: '' },
          { label: 'Kadaluarsa',    value: kpi.expired,      border: 'border-t-rose',    glow: '' },
        ].map(({ label, value, border }) => (
          <div key={label} className={`card-metric border-t-4 ${border}`}>
            <p className="text-xs-muted mb-1">{label}</p>
            <p className="text-2xl font-900 text-text tabular-nums"><AnimNum value={value}/></p>
          </div>
        ))}
      </div>

      {/* ── PER MODULE ── */}
      <SecTitle>Per-Modul Legal</SecTitle>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {(['contract','corporate','litigation'] as const).map(mod => {
          const m = data.byModule.find(b => b.module === mod);
          const total    = m?.total    ?? 0;
          const critical = m?.critical ?? 0;
          return (
            <div key={mod} className="card-metric border-t-4 border-t-blue flex flex-col gap-2">
              <div className="flex-between">
                <div className="flex-start gap-2 text-blue">{MODULE_ICONS[mod]}</div>
                {critical > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose text-white text-xxs font-700">
                    <ShieldAlert size={10}/> {critical} kritis
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-700 text-text">{MODULE_FULL_LABELS[mod]}</p>
                <p className="text-2xl font-900 text-text tabular-nums mt-1"><AnimNum value={total}/></p>
                <p className="text-xs-muted mt-0.5">dokumen</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── DISTRIBUSI ── */}
      <SecTitle>Distribusi Dokumen</SecTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Doc Status — horizontal bar */}
        <SCard title="Status Dokumen">
          {data.byDocStatus.length === 0 ? (
            <div className="flex-center py-10 text-text-3 text-xs">Tidak ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.byDocStatus}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 10 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis type="number" tick={{ fontSize: 9 }} axisLine={false} tickLine={false}/>
                <YAxis
                  type="category" dataKey="status"
                  tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={90}
                />
                <Tooltip content={<LightTip/>}/>
                <Bar dataKey="count" name="Jumlah" fill="#2563eb" radius={[0, 4, 4, 0]} barSize={14}/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </SCard>

        {/* Confidentiality — donut */}
        <SCard title="Klasifikasi Kerahasiaan">
          {data.byConfidentiality.length === 0 ? (
            <div className="flex-center py-10 text-text-3 text-xs">Tidak ada data</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={data.byConfidentiality}
                  dataKey="count"
                  nameKey="level"
                  cx="50%" cy="50%"
                  innerRadius={52} outerRadius={80}
                  paddingAngle={3}
                >
                  {data.byConfidentiality.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip content={<LightTip/>}/>
                <Legend
                  iconType="circle" iconSize={8}
                  wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
                  formatter={(v) => <span className="text-text-2">{v}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </SCard>
      </div>

      {/* ── CRITICAL TABLE ── */}
      <SecTitle>Dokumen Kritis & Mendekati Kadaluarsa</SecTitle>
      <SCard title="Top 10 Dokumen Perlu Perhatian" className="w-full">
        {data.criticalDocs.length === 0 ? (
          <div className="flex-center flex-col gap-2 py-10">
            <div className="w-10 h-10 rounded-full bg-emerald-light flex-center text-emerald">
              <ShieldAlert size={18}/>
            </div>
            <p className="text-sm-bold text-text-2">Tidak ada dokumen kritis saat ini</p>
            <p className="text-xs-muted">Semua dokumen Legal dalam kondisi baik</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-surface-2">
                  {['Modul','Nama Dokumen','Kategori','PIC','Tgl Kadaluarsa','Sisa Hari','Status'].map((h, i) => (
                    <th key={h} className={`p-2 px-3 text-text-3 font-800 text-xxs letter-wide uppercase border-b border-border whitespace-nowrap ${i < 4 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.criticalDocs.map((doc, i) => {
                  const days = parseInt(doc.days_until_expiry);
                  const dayLabel = days < 0
                    ? `Exp ${Math.abs(days)}h lalu`
                    : days === 0 ? 'Hari ini!'
                    : `${days} hari`;
                  return (
                    <tr key={doc.id} className={`${i % 2 === 0 ? 'bg-surface' : 'bg-surface-2'} ${doc.status === 'Critical' || doc.status === 'Expired' ? 'bg-rose-50/30' : ''}`}>
                      <td className="p-2 px-3 border-b border-border-subtle">
                        <Badge label={MODULE_ICONS[doc.module] ? doc.module.charAt(0).toUpperCase() + doc.module.slice(1) : doc.module} colorClass="badge-indigo"/>
                      </td>
                      <td className="p-2 px-3 border-b border-border-subtle text-text font-600 max-w-200 truncate">{doc.doc_name}</td>
                      <td className="p-2 px-3 border-b border-border-subtle text-text-2">{doc.category}</td>
                      <td className="p-2 px-3 border-b border-border-subtle text-text-2">{doc.pic}</td>
                      <td className="p-2 px-3 border-b border-border-subtle text-right text-text-2">{fmtDate(doc.expiry_date)}</td>
                      <td className={`p-2 px-3 border-b border-border-subtle text-right font-700 ${days < 0 ? 'text-rose' : days < 30 ? 'text-rose' : 'text-amber'}`}>{dayLabel}</td>
                      <td className="p-2 px-3 border-b border-border-subtle text-right"><ExpiryBadge status={doc.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SCard>

    </div>
  );
}
