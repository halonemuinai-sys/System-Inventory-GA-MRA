'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle, RefreshCw, Scale, FileSignature, Gavel,
  ShieldAlert, AlertTriangle, ChevronRight, Building2,
  FileCheck, CalendarClock, ClockAlert, Info, ExternalLink,
  History, Eye,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar,
} from 'recharts';
import { useTheme } from '@/lib/theme';
import {
  SlideOverShell, Badge, SBox, InfoRow,
} from '@/components/PageShared';

/* ── Helpers ─────────────────────────────────────────────────── */
const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const now = () => new Date().toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const pct = (part: number, total: number) => total > 0 ? ((part / total) * 100).toFixed(1) : '0.0';

const daysLabel = (days: number | null) => {
  if (days === null || days === undefined) return null;
  if (days < 0)   return `Expired ${Math.abs(days)} hari lalu`;
  if (days === 0) return 'Hari ini kadaluarsa!';
  return `${days} hari lagi`;
};

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
          <div style={{ width: 6, height: 6, borderRadius: 3, background: p.stroke || p.color || '#3b82f6', flexShrink: 0 }} />
          <span style={{ color: '#94a3b8' }}>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Config mapping ──────────────────────────────────────────── */
const MODULES = [
  { key: 'contract',   label: 'Contract & Agreement', icon: <FileSignature size={15}/>, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  { key: 'corporate',  label: 'Corporate Legal',      icon: <Building2 size={15}/>,     color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  { key: 'litigation', label: 'Litigation & Dispute', icon: <Gavel size={15}/>,         color: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
];

const BADGE_MAP: Record<string, string> = {
  contract: 'dbadge dbadge-blue', corporate: 'dbadge dbadge-purple', litigation: 'dbadge dbadge-rose',
};

const STATUS_COLORS: Record<string, string> = {
  'Draft':         '#64748b', // slate
  'Under Review':  '#f59e0b', // amber
  'Approved':      '#6366f1', // indigo
  'Active':        '#10b981', // emerald
  'Expiring Soon': '#f97316', // orange
  'Expired':       '#ef4444', // rose/red
  'Archived':      '#94a3b8', // slate-400
};

const EXPIRY_STATUS_CLS: Record<string, string> = {
  Valid:    'dbadge dbadge-green',
  Warning:  'dbadge dbadge-amber',
  Critical: 'dbadge dbadge-orange',
  Expired:  'dbadge dbadge-rose',
};

const DOC_STATUS_CLS: Record<string, string> = {
  'Draft':         'dbadge dbadge-slate',
  'Under Review':  'dbadge dbadge-amber',
  'Approved':      'dbadge dbadge-purple',
  'Active':        'dbadge dbadge-emerald',
  'Expiring Soon': 'dbadge dbadge-orange',
  'Expired':       'dbadge dbadge-rose',
  'Archived':      'dbadge dbadge-slate',
};

const CONF_CLS: Record<string, string> = {
  'Public/Internal':                     'dbadge dbadge-emerald',
  'Restricted':                          'dbadge dbadge-amber',
  'Confidential':                        'dbadge dbadge-orange',
  'Strictly Confidential / Privileged':  'dbadge dbadge-rose',
};

const ACTION_LABEL: Record<string, string> = {
  upload: 'Upload', view: 'Dilihat', edit: 'Diubah', delete: 'Dihapus',
};

/* ── Types ────────────────────────────────────────────────────── */
interface SummaryData {
  kpi: { total: number; active: number; expiringSoon: number; expired: number };
  byModule: { module: string; label: string; total: number; critical: number }[];
  byCompany: { name: string; total: number; expired: number; critical: number }[];
  byDocStatus: { status: string; count: number }[];
  byConfidentiality: { level: string; count: number }[];
  byExpiryStatus: { module: string; label: string; Valid: number; Warning: number; Critical: number; Expired: number }[];
  criticalDocs: any[];
}

/* ══════════════════════════════════════════════════════════════ */
export default function LegalDashboardPage() {
  const router = useRouter();
  const { dark } = useTheme();
  
  // Dashboard Core States
  const [data, setData]       = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [time, setTime]       = useState(now());
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Interactive Hover States
  const [hoveredMod, setHoveredMod] = useState<string | null>(null);
  const [hoveredCompany, setHoveredCompany] = useState<number | null>(null);
  const [hoveredAlert, setHoveredAlert] = useState<'warning' | 'danger' | null>(null);

  // Filter List State
  const [filterStatus, setFilterStatus] = useState<'all' | 'warning' | 'danger'>('all');

  // Detail SlideOver States
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [detailDoc, setDetailDoc] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Chart axis/grid colors adapt to theme
  const axisColor = dark ? '#475569' : '#94a3b8';
  const gridColor = dark ? 'rgba(255,255,255,0.04)' : '#e2e8f0';
  const chevronColor = dark ? '#475569' : '#cbd5e1';

  // Staggered Entry Animation Helper
  const slideUpStyle = (index: number) => ({
    animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
    animationDelay: `${index * 0.06}s`,
  });

  useEffect(() => {
    fetch('/api/assets/meta').then(r => r.json()).then(d => setCompanies(d.companies || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const qs = new URLSearchParams({ 
        dept: 'legal',
        ...(selectedCompany && { company_id: selectedCompany })
      });
      const res = await fetch(`/api/legal-docs/summary?${qs}`);
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data');
      setData(j);
      setTime(now());
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  }, [selectedCompany]);

  useEffect(() => { load(); }, [load]);

  // Fetch detailed info of a document for slide-over drawer
  const openDetail = async (id: number) => {
    setSelectedDocId(id);
    setDetailLoading(true);
    setDetailDoc(null);
    try {
      const res = await fetch(`/api/legal-docs/${id}`);
      const docData = await res.json();
      if (res.ok) {
        setDetailDoc(docData);
      } else {
        console.error(docData.error || 'Gagal memuat detail dokumen');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDetailLoading(false);
    }
  };

  if (loading && !data) return (
    <div className="dash-panel" style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="animate-spin" style={{ width: 32, height: 32, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
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

  // Click handler for Module cards
  const handleModuleClick = (moduleKey: string) => {
    const routeMap: Record<string, string> = {
      contract: '/legal/contracts',
      corporate: '/legal/corporate',
      litigation: '/legal/litigation',
    };
    if (routeMap[moduleKey]) {
      router.push(routeMap[moduleKey]);
    }
  };

  // Filter Document List based on filterStatus state
  const filteredDocs = data.criticalDocs.filter(doc => {
    const days = parseInt(doc.days_until_expiry);
    if (filterStatus === 'warning') return days >= 0;
    if (filterStatus === 'danger') return days < 0;
    return true;
  });

  return (
    <div className="dash-panel" style={{ padding: '0 1.5rem 3rem' }}>

      {/* ── HEADER ── */}
      <div className="dash-header" style={slideUpStyle(0)}>
        <div>
          <h1>Legal Department Dashboard</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dash-live">◆ LIVE</span>
            <p className="dash-timestamp">Terakhir Sinkron: {time} WIB</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <select 
            value={selectedCompany} 
            onChange={e => setSelectedCompany(e.target.value)}
            className="input-premium"
            style={{ fontSize: '0.7rem', padding: '6px 12px', height: 'auto', width: '200px' }}
            title="Filter Perusahaan"
          >
            <option value="">— Semua Perusahaan —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="dash-refresh-btn" onClick={load} title="Muat Ulang Data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ── EXPIRY ALERT BANNER ── */}
      {data.criticalDocs.length > 0 && (() => {
        const sorted = [...data.criticalDocs].sort((a, b) => parseInt(a.days_until_expiry) - parseInt(b.days_until_expiry));
        return (
          <div style={{ marginBottom: 20, ...slideUpStyle(1) }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <AlertTriangle size={13} style={{ color: '#f59e0b', flexShrink: 0 }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 800, color: dark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Perhatian Khusus Keaktifan Dokumen
              </span>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '1px 7px', borderRadius: 999 }}>
                {sorted.length}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {sorted.map(doc => {
                const days = parseInt(doc.days_until_expiry);
                const isExpired = days < 0;
                const accentColor = isExpired || days <= 7 ? '#ef4444' : days <= 14 ? '#f97316' : days <= 30 ? '#eab308' : '#3b82f6';
                const cardBg = dark
                  ? (isExpired || days <= 7 ? 'rgba(239,68,68,0.10)' : days <= 14 ? 'rgba(249,115,22,0.10)' : days <= 30 ? 'rgba(234,179,8,0.10)' : 'rgba(59,130,246,0.10)')
                  : (isExpired || days <= 7 ? 'rgba(255,245,245,1)' : days <= 14 ? 'rgba(255,247,237,1)' : days <= 30 ? 'rgba(254,252,232,1)' : 'rgba(239,246,255,1)');
                const textColor = isExpired || days <= 7 ? '#ef4444' : days <= 14 ? '#ea580c' : days <= 30 ? '#ca8a04' : '#2563eb';
                const dayLabel = isExpired ? `Expired ${Math.abs(days)}h lalu` : days === 0 ? 'Hari ini!' : `${days} hari lagi`;
                const modLabel = MODULES.find(m => m.key === doc.module)?.label || doc.module;
                const modCls = BADGE_MAP[doc.module] || 'dbadge dbadge-slate';
                return (
                  <div
                    key={doc.id}
                    onClick={() => openDetail(doc.id)}
                    style={{
                      minWidth: 230, flexShrink: 0,
                      background: cardBg,
                      borderTop: `1px solid ${accentColor}22`,
                      borderRight: `1px solid ${accentColor}22`,
                      borderBottom: `1px solid ${accentColor}22`,
                      borderLeft: `4px solid ${accentColor}`,
                      borderRadius: 12,
                      padding: '11px 13px',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    className="hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, gap: 6 }}>
                      <span className={modCls} style={{ fontSize: '0.55rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{modLabel}</span>
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
      <div className="kpi-master-card" style={slideUpStyle(2)}>
        <div className="kpi-master-left">
          <InfoTooltip text="Total seluruh dokumen legal yang terdaftar di sistem.">
            <p className="kpi-master-label" style={{ display: 'flex', alignItems: 'center' }}>Total Dokumen Terdaftar <Info size={10} className="opacity-40 ml-1" /></p>
          </InfoTooltip>
          <div className="kpi-master-value-row">
            <span className="kpi-master-value"><Num value={kpi.total} /></span>
            <span className="kpi-master-trend">+12 (1.8%)</span>
          </div>
          <p className="kpi-master-sub">Terintegrasi seluruh entitas perusahaan</p>
        </div>

        <div className="kpi-master-glass">
          {[
            { label: 'Aktif', value: kpi.active, color: '#4ade80', Icon: FileCheck, tip: 'Dokumen yang masih berlaku aktif.' },
            { label: 'Mendekati Exp', value: kpi.expiringSoon, color: '#facc15', Icon: CalendarClock, tip: 'Dokumen yang akan habis masa berlakunya dalam 30 hari.' },
            { label: 'Kadaluarsa', value: kpi.expired, color: '#f87171', Icon: ClockAlert, tip: 'Dokumen yang sudah melewati batas waktu masa berlaku.' },
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

      {/* ── INTERACTIVE ALERT CARDS (FILTERING CONTROLS) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20, ...slideUpStyle(3) }}>
        
        {/* WARNING ALERT CARD */}
        <div 
          className="alert-card warning"
          onMouseEnter={() => setHoveredAlert('warning')}
          onMouseLeave={() => setHoveredAlert(null)}
          onClick={() => setFilterStatus(filterStatus === 'warning' ? 'all' : 'warning')}
          style={{
            cursor: 'pointer',
            border: filterStatus === 'warning' 
              ? '1.5px solid #eab308' 
              : hoveredAlert === 'warning' 
                ? '1px solid rgba(234,179,8,0.5)' 
                : '1px solid transparent',
            boxShadow: filterStatus === 'warning' 
              ? '0 0 16px rgba(234,179,8,0.3)' 
              : hoveredAlert === 'warning' 
                ? '0 0 8px rgba(234,179,8,0.15)' 
                : undefined,
            transform: filterStatus === 'warning' || hoveredAlert === 'warning' ? 'translateY(-3px)' : undefined,
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="alert-icon"><AlertTriangle size={18} /></div>
            <div>
              <p className="alert-label">Mendekati Exp (Warning)</p>
              <p className="alert-value"><Num value={kpi.expiringSoon} /></p>
              <p className="alert-sub">{pct(kpi.expiringSoon, kpi.total)}% dari total dokumen · Klik untuk filter tabel</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: filterStatus === 'warning' ? '#eab308' : chevronColor }} />
        </div>

        {/* DANGER ALERT CARD */}
        <div 
          className="alert-card danger"
          onMouseEnter={() => setHoveredAlert('danger')}
          onMouseLeave={() => setHoveredAlert(null)}
          onClick={() => setFilterStatus(filterStatus === 'danger' ? 'all' : 'danger')}
          style={{
            cursor: 'pointer',
            border: filterStatus === 'danger' 
              ? '1.5px solid #ef4444' 
              : hoveredAlert === 'danger' 
                ? '1px solid rgba(239,68,68,0.5)' 
                : '1px solid transparent',
            boxShadow: filterStatus === 'danger' 
              ? '0 0 16px rgba(239,68,68,0.3)' 
              : hoveredAlert === 'danger' 
                ? '0 0 8px rgba(239,68,68,0.15)' 
                : undefined,
            transform: filterStatus === 'danger' || hoveredAlert === 'danger' ? 'translateY(-3px)' : undefined,
            transition: 'all 0.25s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="alert-icon"><ShieldAlert size={18} /></div>
            <div>
              <p className="alert-label">Kadaluarsa (Danger)</p>
              <p className="alert-value"><Num value={kpi.expired} /></p>
              <p className="alert-sub">{pct(kpi.expired, kpi.total)}% dari total dokumen · Klik untuk filter tabel</p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: filterStatus === 'danger' ? '#ef4444' : chevronColor }} />
        </div>
      </div>

      {/* ── RINGKASAN PER MODUL ── */}
      <p className="sec-title" style={slideUpStyle(4)}>Ringkasan Per Modul</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, ...slideUpStyle(5) }}>
        {MODULES.map((mod, idx) => {
          const m = data.byModule.find(b => b.module === mod.key);
          const total = m?.total ?? 0;
          const critical = m?.critical ?? 0;
          const p = kpi.total > 0 ? ((total / kpi.total) * 100) : 0;
          return (
            <div 
              key={mod.key} 
              className="mod-card"
              onMouseEnter={() => setHoveredMod(mod.key)}
              onMouseLeave={() => setHoveredMod(null)}
              onClick={() => handleModuleClick(mod.key)}
              style={{
                cursor: 'pointer',
                border: hoveredMod === mod.key ? `1px solid ${mod.color}` : undefined,
                boxShadow: hoveredMod === mod.key ? `0 0 12px ${mod.color}33` : undefined,
                transform: hoveredMod === mod.key ? 'translateY(-3px)' : undefined,
                transition: 'all 0.25s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="mod-icon" style={{ background: mod.bg, color: mod.color }}>{mod.icon}</div>
                    <span className="mod-name">{mod.label}</span>
                  </div>
                  <ChevronRight size={14} className="opacity-40" style={{ color: hoveredMod === mod.key ? mod.color : undefined }} />
                </div>
              </div>
              <p className="mod-value"><Num value={total} /></p>
              <p className="mod-pct">{p.toFixed(1)}% dari total dokumen</p>
              <div className="mod-bar">
                <div className="mod-bar-fill" style={{ width: `${p}%`, background: mod.color }} />
              </div>
              {critical > 0 && (
                <div className="mod-critical"><ShieldAlert size={10} /> {critical} Perlu Tindakan</div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── BREAKDOWN PER COMPANY ── */}
      <div style={{ marginTop: 24, ...slideUpStyle(6) }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p className="sec-title" style={{ marginBottom: 0 }}>Health Status Per Perusahaan</p>
          <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 600 }}>
            {selectedCompany ? 'Menampilkan Perusahaan Terfilter' : `Menampilkan ${data.byCompany.length} Entitas`}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {data.byCompany.map((co, idx) => {
            const hasAlert = co.expired > 0 || co.critical > 0;
            const statusColor = co.expired > 0 ? '#ef4444' : co.critical > 0 ? '#f59e0b' : '#10b981';
            
            // Match name to extract company_id
            const compObj = companies.find(c => c.name.toLowerCase() === co.name.toLowerCase());
            const compId = compObj ? String(compObj.id) : '';
            const isActive = selectedCompany === compId && compId !== '';
            const isHovered = hoveredCompany === idx;

            const nonLeftBorder = isActive 
              ? `1.5px solid ${statusColor}` 
              : isHovered 
                ? `1px solid ${statusColor}aa` 
                : hasAlert 
                  ? `1px solid ${statusColor}15` 
                  : undefined;

            const shadowStyle = isActive 
              ? `0 0 16px ${statusColor}44` 
              : isHovered 
                ? `0 0 8px ${statusColor}22` 
                : undefined;

            return (
              <div 
                key={idx} 
                className="mod-card"
                onMouseEnter={() => setHoveredCompany(idx)}
                onMouseLeave={() => setHoveredCompany(null)}
                onClick={() => {
                  if (compObj) {
                    setSelectedCompany(isActive ? '' : compId);
                  }
                }}
                style={{ 
                  padding: '12px 14px', 
                  borderTop: nonLeftBorder,
                  borderRight: nonLeftBorder,
                  borderBottom: nonLeftBorder,
                  borderLeft: `4px solid ${statusColor}`,
                  boxShadow: shadowStyle,
                  transform: isActive || isHovered ? 'translateY(-3px)' : undefined,
                  cursor: 'pointer',
                  transition: 'all 0.25s ease'
                }}
                title="Klik untuk menyaring dashboard berdasarkan perusahaan ini"
              >
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: dark ? '#e2e8f0' : '#1e293b', marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={co.name}>
                  {co.name}
                </p>
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontSize: '0.55rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Total Dok</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 900, color: dark ? '#f8fafc' : '#0f172a', lineHeight: 1 }}>{co.total}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                    {co.expired > 0 && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                        {co.expired} Expired
                      </span>
                    )}
                    {co.critical > 0 && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                        {co.critical} Kritis
                      </span>
                    )}
                    {!hasAlert && (
                      <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: 4 }}>
                        Healthy
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHARTS SECTIONS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 24, ...slideUpStyle(7) }} className="responsive-chart-grid">
        
        {/* CHART 1: Stacked Expiry Status per Module */}
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title">Status Kedaluwarsa Per Modul</span>
          </div>
          <div className="chart-body" style={{ display: 'flex', justifyContent: 'center' }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.byExpiryStatus} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <Tooltip content={<DarkTip />} />
                <Legend verticalAlign="top" height={36} iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '0.6rem', color: axisColor }} />
                <Bar dataKey="Valid" stackId="a" fill="#10b981" />
                <Bar dataKey="Warning" stackId="a" fill="#facc15" />
                <Bar dataKey="Critical" stackId="a" fill="#f97316" />
                <Bar dataKey="Expired" stackId="a" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 2: Donut Status Dokumen */}
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title">Distribusi Status Dokumen</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie 
                  data={data.byDocStatus} 
                  dataKey="count" 
                  nameKey="status" 
                  cx="50%" 
                  cy="50%" 
                  innerRadius={50} 
                  outerRadius={70} 
                  paddingAngle={3}
                >
                  {data.byDocStatus.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={STATUS_COLORS[entry.status] || '#3b82f6'} />
                  ))}
                </Pie>
                <Tooltip content={<DarkTip />} />
                <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '0.58rem', paddingLeft: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CHART 3: Horizontal Bar Kerahasiaan Dokumen */}
        <div className="chart-card">
          <div className="chart-head">
            <span className="chart-title">Tingkat Kerahasiaan Dokumen</span>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart layout="vertical" data={data.byConfidentiality} margin={{ top: 10, right: 10, left: 15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
                <YAxis dataKey="level" type="category" tick={{ fontSize: 7, fill: axisColor }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<DarkTip />} />
                <Bar dataKey="count" name="Jumlah" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={12}>
                  {data.byConfidentiality.map((entry, idx) => {
                    const colors = ['#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
                    return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ── DOKUMEN TERBARU ── */}
      <div style={{ marginTop: 24, ...slideUpStyle(8) }}>
        <div className="chart-card">
          <div className="chart-head">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="chart-title" style={{ fontSize: '0.72rem' }}>Daftar Dokumen Terbaru / Kritis</span>
              {filterStatus !== 'all' && (
                <span 
                  onClick={() => setFilterStatus('all')}
                  className="dbadge cursor-pointer hover:opacity-85" 
                  style={{ 
                    background: filterStatus === 'warning' ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                    color: filterStatus === 'warning' ? '#eab308' : '#ef4444',
                    border: `1px solid ${filterStatus === 'warning' ? 'rgba(234,179,8,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Klik untuk menghapus filter"
                >
                  Filter: {filterStatus === 'warning' ? 'Mendekati Exp' : 'Kadaluarsa'} ✕
                </span>
              )}
            </div>
            {filterStatus !== 'all' && (
              <span 
                style={{ fontSize: '0.6rem', color: '#3b82f6', fontWeight: 700, cursor: 'pointer' }} 
                onClick={() => setFilterStatus('all')}
              >
                Hapus Filter (Tampilkan Semua) →
              </span>
            )}
          </div>
          <div style={{ padding: '0 0.25rem 0.5rem', overflowX: 'auto' }}>
            <table className="recent-table">
              <thead>
                <tr>
                  <th>Judul Dokumen</th>
                  <th>Modul</th>
                  <th>Tanggal Terbit</th>
                  <th>Tanggal Expired</th>
                  <th>Hari Tersisa</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <ShieldAlert size={24} style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} />
                      Tidak ada dokumen untuk filter keaktifan terpilih.
                    </td>
                  </tr>
                ) : (
                  filteredDocs.map(doc => {
                    const days = parseInt(doc.days_until_expiry);
                    const statusLabel = days < 0 ? 'Kadaluarsa' : 'Mendekati Exp';
                    const statusCls = days < 0 ? 'dbadge dbadge-rose' : 'dbadge dbadge-amber';
                    const modCls = BADGE_MAP[doc.module] || 'dbadge dbadge-slate';
                    return (
                      <tr 
                        key={doc.id} 
                        onClick={() => openDetail(doc.id)}
                        className="cursor-pointer transition-colors"
                        style={{ cursor: 'pointer' }}
                      >
                        <td style={{ fontWeight: 600, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Eye size={11} className="opacity-20 hover:opacity-100" />
                            {doc.doc_name}
                          </div>
                        </td>
                        <td><span className={modCls}>{doc.module.charAt(0).toUpperCase() + doc.module.slice(1)}</span></td>
                        <td>{fmtDate(doc.issue_date)}</td>
                        <td style={{ color: days < 0 ? '#fb7185' : '#fbbf24', fontWeight: 700 }}>{fmtDate(doc.expiry_date)}</td>
                        <td style={{ fontWeight: 700, color: days < 0 ? '#ef4444' : '#f59e0b' }}>
                          {daysLabel(days)}
                        </td>
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

      {/* ── DETAIL DRAWER (SlideOver) ── */}
      <SlideOverShell
        isOpen={!!selectedDocId}
        onClose={() => setSelectedDocId(null)}
        title={detailDoc ? `Detail — ${detailDoc.doc_name}` : 'Memuat…'}
        size="md"
      >
        {detailLoading || !detailDoc ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '40vh' }}>
            <div className="animate-spin" style={{ width: 28, height: 28, border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%' }} />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: dark ? '#f8fafc' : '#0f172a', lineHeight: 1.3 }}>{detailDoc.doc_name}</h2>
                <p style={{ fontSize: '0.65rem', color: '#64748b', marginTop: 4 }}>{detailDoc.category}{detailDoc.id_number ? ` · ${detailDoc.id_number}` : ''}</p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <span className={DOC_STATUS_CLS[detailDoc.doc_status] || 'dbadge dbadge-slate'}>{detailDoc.doc_status || 'Draft'}</span>
                {detailDoc.status && <span className={EXPIRY_STATUS_CLS[detailDoc.status] || 'dbadge dbadge-slate'}>{detailDoc.status}</span>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
              <SBox icon={<Building2 size={13}/>} title="Informasi Dokumen">
                <InfoRow label="Kategori"    value={detailDoc.category}/>
                {detailDoc.id_number && <InfoRow label="Nomor Dokumen" value={<span style={{ fontFamily: 'monospace' }}>{detailDoc.id_number}</span>}/>}
                <InfoRow label="Perusahaan"  value={detailDoc.company_name}/>
                <InfoRow label="PIC"         value={detailDoc.pic}/>
                <InfoRow label="Status Dokumen" value={
                  <span className={DOC_STATUS_CLS[detailDoc.doc_status] || 'dbadge dbadge-slate'}>{detailDoc.doc_status || 'Draft'}</span>
                }/>
                <InfoRow label="Klasifikasi Kerahasiaan" value={
                  <span className={CONF_CLS[detailDoc.confidentiality] || 'dbadge dbadge-emerald'}>{detailDoc.confidentiality || 'Public/Internal'}</span>
                }/>
                <InfoRow label="Tgl Terbit" value={fmtDate(detailDoc.issue_date)}/>
                {detailDoc.expiry_date && (
                  <InfoRow label="Tgl Expired" value={
                    <span style={{ fontWeight: 700, color: parseInt(detailDoc.days_until_expiry) < 0 ? '#ef4444' : '#f59e0b' }}>
                      {fmtDate(detailDoc.expiry_date)}
                      {detailDoc.days_until_expiry !== null && (
                        <span style={{ fontSize: '0.6rem', color: '#64748b', marginLeft: 4 }}>({daysLabel(parseInt(detailDoc.days_until_expiry))})</span>
                      )}
                    </span>
                  }/>
                )}
              </SBox>
              
              <SBox icon={<FileCheck size={13}/>} title="Lampiran & Catatan">
                {detailDoc.file_url ? (
                  <a href={detailDoc.file_url} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#3b82f6', fontSize: '0.68rem', fontWeight: 600, textDecoration: 'none' }}
                    className="hover:underline"
                  >
                    <ExternalLink size={12}/>
                    {detailDoc.file_name || 'Lihat Dokumen Terlampir'}
                  </a>
                ) : (
                  <p style={{ fontSize: '0.65rem', color: '#64748b' }}>Tidak ada berkas yang diunggah</p>
                )}
                {detailDoc.notes && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: 800, color: dark ? '#94a3b8' : '#475569', marginBottom: 4 }}>Catatan Tambahan</p>
                    <p style={{ fontSize: '0.7rem', color: dark ? '#cbd5e1' : '#334155', lineHeight: 1.5 }}>{detailDoc.notes}</p>
                  </div>
                )}
              </SBox>
            </div>

            {/* Riwayat Aktivitas (Audit Logs) */}
            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 800, color: dark ? '#94a3b8' : '#475569', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <History size={11} /> Riwayat Aktivitas Audit
              </p>
              {detailDoc.audit_logs?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: 160, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 12 }}>
                  {detailDoc.audit_logs.map((log: any, idx: number) => {
                    const actionCls = log.action === 'view' 
                      ? 'dbadge dbadge-blue' 
                      : log.action === 'edit' 
                        ? 'dbadge dbadge-amber' 
                        : log.action === 'delete' 
                          ? 'dbadge dbadge-rose' 
                          : 'dbadge dbadge-slate';
                    return (
                      <div 
                        key={log.id} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          padding: '8px 12px',
                          borderBottom: idx < detailDoc.audit_logs.length - 1 ? '1px solid var(--border)' : undefined,
                          fontSize: '0.62rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className={actionCls}>{ACTION_LABEL[log.action] || log.action}</span>
                          <span style={{ color: dark ? '#94a3b8' : '#475569' }}>
                            oleh <b style={{ color: dark ? '#e2e8f0' : '#1e293b' }}>{log.performed_by}</b>
                          </span>
                        </div>
                        <span style={{ color: '#64748b', fontSize: '0.58rem' }}>{new Date(log.performed_at).toLocaleString('id-ID')}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.65rem', color: '#64748b', padding: '10px 0' }}>Tidak ada riwayat aktivitas yang tercatat</p>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
              <button 
                onClick={() => {
                  setSelectedDocId(null);
                  handleModuleClick(detailDoc.module);
                }} 
                className="dash-refresh-btn" 
                style={{ background: 'transparent', borderColor: '#3b82f6', color: '#3b82f6' }}
              >
                Buka Modul Dokumentasi →
              </button>
              <button onClick={() => setSelectedDocId(null)} className="dash-refresh-btn" style={{ background: '#3b82f6', color: '#fff', border: 'none' }}>
                Tutup Panel
              </button>
            </div>
          </div>
        )}
      </SlideOverShell>

    </div>
  );
}
