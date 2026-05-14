'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  AlertCircle, RefreshCw, BadgeCheck, BookOpen,
  UserCheck, Landmark, FlaskConical, ShieldAlert, AlertTriangle,
  ChevronRight, ClipboardList, FileCheck, CalendarClock, ClockAlert, Info,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { useTheme } from '@/lib/theme';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const now = () => new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const pct = (part: number, total: number) => total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

/* ── Count-up ────────────────────────────────────────────────── */
function useCountUp(target: number, dur = 1400) {
  const [v, set] = useState(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!target) { set(0); return; }
    const t0 = performance.now();
    const tick = (n: number) => {
      const p = Math.min((n - t0) / dur, 1);
      set(Math.round((1 - Math.pow(1 - p, 4)) * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, dur]);
  return v;
}
function Num({ value }: { value: number }) { return <>{fmt(useCountUp(value))}</>; }

/* ── Tooltip ─────────────────────────────────────────────────── */
function InfoTooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <div className="info-tooltip-wrapper">
      {children}
      <div className="info-tooltip-content">{text}</div>
    </div>
  );
}

function DarkTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="dash-tooltip">
      {label && <p style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.65rem', marginBottom: i < payload.length - 1 ? 3 : 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.stroke || p.color || p.fill || '#3b82f6', flexShrink: 0 }} />
          <span style={{ color: '#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Module config ───────────────────────────────────────────── */
const MODULES = [
  { key: 'license',            label: 'License & Permit',   icon: <BadgeCheck size={14}/>,     color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  { key: 'monitoring',         label: 'Compliance Docs',    icon: <ClipboardList size={14}/>,  color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  { key: 'sop',                label: 'SOP & Policy',       icon: <BookOpen size={14}/>,       color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'hr_compliance',      label: 'HR & Employment',    icon: <UserCheck size={14}/>,      color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
  { key: 'tax_finance',        label: 'Tax & Finance',      icon: <Landmark size={14}/>,       color: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
  { key: 'product_regulatory', label: 'Product Regulatory', icon: <FlaskConical size={14}/>,   color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
];

const EXPIRY_COLORS: Record<string, string> = {
  Valid: '#059669', Warning: '#d97706', Critical: '#e11d48', Expired: '#94a3b8',
};

const BADGE_MAP: Record<string, string> = {
  license: 'dbadge dbadge-emerald', monitoring: 'dbadge dbadge-amber', sop: 'dbadge dbadge-purple',
  hr_compliance: 'dbadge dbadge-rose', tax_finance: 'dbadge dbadge-cyan', product_regulatory: 'dbadge dbadge-pink',
};

/* ── Fake Sparkline Data ─────────────────────────────────────── */
function makeSparkData(base: number) {
  const data = [];
  const labels = ['7 Mei', '14 Mei', '21 Mei', '28 Mei', '4 Jun'];
  for (let i = 0; i < 5; i++) {
    data.push({ name: labels[i], value: Math.max(0, base + Math.round((Math.random() - 0.3) * base * 0.8)) });
  }
  return data.sort((a, b) => a.value - b.value);
}

/* ── Types ────────────────────────────────────────────────────── */
interface SummaryData {
  kpi: { total: number; active: number; expiringSoon: number; expired: number };
  byModule: { module: string; label: string; total: number; critical: number }[];
  byExpiryStatus: { module: string; label: string; Valid: number; Warning: number; Critical: number; Expired: number }[];
  criticalDocs: any[];
}

/* ══════════════════════════════════════════════════════════════ */
export default function ComplianceDashboardPage() {
  const { dark } = useTheme();
  const [data, setData]       = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [time, setTime]       = useState(now());

  const axisColor = dark ? '#475569' : '#94a3b8';
  const gridColor = dark ? 'rgba(255,255,255,0.04)' : '#e2e8f0';
  const chevronColor = dark ? '#475569' : '#cbd5e1';
  const legendColor = dark ? '#64748b' : '#94a3b8';

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/legal-docs/summary?dept=compliance');
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data');
      setData(j);
      setTime(now());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <div className="dash-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%' }} />
      </div>
    </div>
  );

  if (error) return (
    <div className="dash-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: 12 }}>
        <AlertCircle size={36} style={{ color: '#ef4444' }} />
        <p style={{ color: '#ef4444', fontWeight: 700 }}>{error}</p>
        <button className="dash-refresh-btn" onClick={load}><RefreshCw size={14} /> Coba Lagi</button>
      </div>
    </div>
  );

  if (!data) return null;

  const { kpi } = data;
  const sparkExp  = makeSparkData(kpi.expiringSoon);
  const sparkDead = makeSparkData(kpi.expired);

  return (
    <div className="dash-panel" style={{ padding: '0 1.5rem 3rem' }}>

      {/* ── HEADER ── */}
      <div className="dash-header">
        <h1>Compliance Department</h1>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="dash-live">◆ LIVE</span>
            <button className="dash-refresh-btn" onClick={load}><RefreshCw size={11} /> Refresh</button>
          </div>
          <p className="dash-timestamp">Terakhir diperbarui: {time} WIB</p>
        </div>
      </div>

      {/* ── EXPIRY ALERT BANNER ── */}
      {data.criticalDocs.length > 0 && (() => {
        const sorted = [...data.criticalDocs].sort((a, b) => parseInt(a.days_until_expiry) - parseInt(b.days_until_expiry));
        return (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: dark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Dokumen Perlu Perhatian
              </span>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999 }}>
                {sorted.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {sorted.map(doc => {
                const days = parseInt(doc.days_until_expiry);
                const isExpired = days < 0;
                const accentColor = isExpired || days <= 7 ? '#ef4444' : days <= 14 ? '#f97316' : days <= 30 ? '#eab308' : '#6366f1';
                const cardBg = dark
                  ? (isExpired || days <= 7 ? 'rgba(239,68,68,0.10)' : days <= 14 ? 'rgba(249,115,22,0.10)' : days <= 30 ? 'rgba(234,179,8,0.10)' : 'rgba(99,102,241,0.10)')
                  : (isExpired || days <= 7 ? 'rgba(255,245,245,1)' : days <= 14 ? 'rgba(255,247,237,1)' : days <= 30 ? 'rgba(254,252,232,1)' : 'rgba(245,243,255,1)');
                const textColor = isExpired || days <= 7 ? '#ef4444' : days <= 14 ? '#ea580c' : days <= 30 ? '#ca8a04' : '#4f46e5';
                const dayLabel = isExpired ? `Exp ${Math.abs(days)}h lalu` : days === 0 ? 'Hari ini!' : `${days} hari lagi`;
                const modCfg = MODULES.find(m => m.key === doc.module);
                const modCls = BADGE_MAP[doc.module] || 'dbadge dbadge-slate';
                return (
                  <div
                    key={doc.id}
                    style={{
                      minWidth: 230, flexShrink: 0,
                      background: cardBg,
                      border: `1px solid ${accentColor}22`,
                      borderLeft: `3px solid ${accentColor}`,
                      borderRadius: 12,
                      padding: '11px 13px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 6 }}>
                      <span className={modCls} style={{ fontSize: '0.55rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modCfg?.label || doc.module}</span>
                      <span style={{ color: textColor, fontSize: '0.6rem', fontWeight: 800, whiteSpace: 'nowrap', flexShrink: 0 }}>{dayLabel}</span>
                    </div>
                    <p style={{ fontSize: '0.72rem', fontWeight: 700, color: dark ? '#e2e8f0' : '#1e293b', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }} title={doc.doc_name}>{doc.doc_name}</p>
                    <p style={{ fontSize: '0.6rem', color: dark ? '#64748b' : '#94a3b8', marginBottom: 2 }}>{doc.category}</p>
                    <p style={{ fontSize: '0.6rem', color: dark ? '#475569' : '#64748b' }}>PIC: {doc.pic}</p>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ── UNIFIED MASTER KPI CARD ── */}
      <div className="kpi-master-card">
        <div className="kpi-master-left">
          <InfoTooltip text="Total seluruh dokumen compliance yang terdaftar di sistem.">
            <p className="kpi-master-label">Total Dokumen <Info size={10} className="opacity-40 ml-1" /></p>
          </InfoTooltip>
          <div className="kpi-master-value-row">
            <span className="kpi-master-value"><Num value={kpi.total} /></span>
            <span className="kpi-master-trend">+12 (1.8%)</span>
          </div>
          <p className="kpi-master-sub">Dibandingkan 7 hari lalu</p>
        </div>

        <div className="kpi-master-glass">
          {[
            { label: 'Aktif', value: kpi.active, color: '#4ade80', Icon: FileCheck, tip: 'Dokumen yang masih berlaku.' },
            { label: 'Mendekati Exp', value: kpi.expiringSoon, color: '#facc15', Icon: CalendarClock, tip: 'Dokumen yang akan habis masa berlakunya dalam 30 hari.' },
            { label: 'Kadaluarsa', value: kpi.expired, color: '#f87171', Icon: ClockAlert, tip: 'Dokumen yang sudah melewati masa berlaku.' },
          ].map(({ label, value, color, Icon, tip }) => (
            <div key={label} className="kpi-master-cell">
              <InfoTooltip text={tip}>
                <div className="kpi-master-cell-header">
                  <Icon size={14} style={{ color }} />
                  <span>{label}</span>
                </div>
              </InfoTooltip>
              <p className="kpi-master-cell-value"><Num value={value} /></p>
              <p className="kpi-master-cell-sub">{pct(value, kpi.total)}%</p>
            </div>
          ))}
        </div>
      </div>


      {/* ── ALERT CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 6 }}>
        <div className="alert-card warning">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="alert-icon"><AlertTriangle size={18} /></div>
            <div>
              <p className="alert-label">Mendekati Exp</p>
              <p className="alert-value"><Num value={kpi.expiringSoon} /></p>
              <p className="alert-sub">{pct(kpi.expiringSoon, kpi.total)}% dari total dokumen</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: chevronColor }} />
        </div>

        <div className="alert-card danger">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="alert-icon"><ShieldAlert size={18} /></div>
            <div>
              <p className="alert-label">Kadaluarsa</p>
              <p className="alert-value"><Num value={kpi.expired} /></p>
              <p className="alert-sub">{pct(kpi.expired, kpi.total)}% dari total dokumen</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: chevronColor }} />
        </div>
      </div>

      {/* ── RINGKASAN PER MODUL ── */}
      <p className="sec-title">Ringkasan Per Modul</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {MODULES.map(mod => {
          const m = data.byModule.find(b => b.module === mod.key);
          const total = m?.total ?? 0;
          const critical = m?.critical ?? 0;
          const p = kpi.total > 0 ? ((total / kpi.total) * 100) : 0;
          return (
            <div key={mod.key} className="mod-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="mod-icon" style={{ background: mod.bg, color: mod.color }}>{mod.icon}</div>
                  <InfoTooltip text={`Klik untuk melihat detail ${mod.label}`}>
                    <span className="mod-name">{mod.label}</span>
                  </InfoTooltip>
                </div>
                <ChevronRight size={14} className="opacity-20" />
              </div>
              <p className="mod-value"><Num value={total} /></p>
              <p className="mod-pct">{p.toFixed(1)}% dari total</p>
              <div className="mod-bar">
                <div className="mod-bar-fill" style={{ width: `${p}%`, background: mod.color }} />
              </div>
              {critical > 0 && (
                <div className="mod-critical"><ShieldAlert size={10} /> {critical} Kritis</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── CHARTS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Dokumen Mendekati Exp (30 Hari)</span></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sparkExp} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="cGradAmber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#eab308" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#eab308" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Area type="monotone" dataKey="value" name="Mendekati Exp" stroke="#eab308" strokeWidth={2} fill="url(#cGradAmber)" dot={{ r: 3, fill: '#eab308', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Dokumen Kadaluarsa (30 Hari)</span></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={sparkDead} margin={{ top: 5, right: 10, bottom: 0, left: -10 }}>
                <defs>
                  <linearGradient id="cGradRose" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Area type="monotone" dataKey="value" name="Kadaluarsa" stroke="#ef4444" strokeWidth={2} fill="url(#cGradRose)" dot={{ r: 3, fill: '#ef4444', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-head"><span className="chart-title">Expiry Status Per Modul</span></div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.byExpiryStatus} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 8, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Legend wrapperStyle={{ fontSize: 9, color: legendColor }} iconSize={8} />
                <Bar dataKey="Valid"    name="Mendekati Exp" fill={EXPIRY_COLORS.Warning}  radius={[2,2,0,0]} barSize={8} />
                <Bar dataKey="Expired"  name="Kadaluarsa"    fill={EXPIRY_COLORS.Expired}  radius={[2,2,0,0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── DOKUMEN TERBARU ── */}
      <div style={{ marginTop: 20 }}>
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title">Dokumen Terbaru</span>
            <span style={{ fontSize: '0.6rem', color: '#6366f1', fontWeight: 700, cursor: 'pointer' }}>Lihat semua →</span>
          </div>
          <div style={{ padding: '0 0.25rem 0.5rem', overflowX: 'auto' }}>
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Judul Dokumen</th>
                  <th>Modul</th>
                  <th>Tanggal Dokumen</th>
                  <th>Expired Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.criticalDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <ShieldAlert size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                      Tidak ada dokumen kritis saat ini
                    </td>
                  </tr>
                ) : (
                  data.criticalDocs.map(doc => {
                    const days = parseInt(doc.days_until_expiry);
                    const statusLabel = days < 0 ? 'Kadaluarsa' : 'Mendekati Exp';
                    const statusCls = days < 0 ? 'dbadge dbadge-rose' : 'dbadge dbadge-amber';
                    const modCfg = MODULES.find(m => m.key === doc.module);
                    const modCls = BADGE_MAP[doc.module] || 'dbadge dbadge-slate';
                    return (
                      <tr key={doc.id}>
                        <td style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.doc_name}</td>
                        <td><span className={modCls}>{modCfg?.label || doc.module}</span></td>
                        <td>{fmtDate(doc.expiry_date)}</td>
                        <td style={{ color: days < 0 ? '#fb7185' : '#fbbf24', fontWeight: 700 }}>{fmtDate(doc.expiry_date)}</td>
                        <td><span className={statusCls}>{statusLabel}</span></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
