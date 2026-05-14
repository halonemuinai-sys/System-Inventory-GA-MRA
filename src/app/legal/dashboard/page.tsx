'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Scale, FileSignature, Gavel, LayoutDashboard,
  ShieldAlert, RefreshCw, AlertCircle, TrendingUp,
  FileText, Clock, CheckCircle, Archive,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';

// ── Utils ──────────────────────────────────────────────────────
const cn = (...classes: (string | false | null | undefined)[]) =>
  classes.filter(Boolean).join(' ');

const fmt = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);

const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ── Count-up ───────────────────────────────────────────────────
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
function Num({ v }: { v: number }) { return <>{fmt(useCountUp(v))}</>; }

// ── Tooltip ────────────────────────────────────────────────────
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs min-w-[120px]">
      {label && <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color || p.fill }}/>
          <span className="text-slate-500">{p.name}:</span>
          <span className="font-black text-slate-900">{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

// ── Module config ──────────────────────────────────────────────
const MODULES = [
  {
    key: 'contract',
    label: 'Contract Management',
    short: 'Contract',
    icon: <FileSignature className="w-5 h-5" />,
    gradient: 'from-[#1e3a8a] to-[#1e40af]',
    glow: 'bg-blue-500/20',
    accent: 'bg-blue-50 text-blue-600',
    border: 'border-t-blue-600',
  },
  {
    key: 'corporate',
    label: 'Corporate Legal',
    short: 'Corporate',
    icon: <Scale className="w-5 h-5" />,
    gradient: 'from-[#312e81] to-[#4338ca]',
    glow: 'bg-indigo-500/20',
    accent: 'bg-indigo-50 text-indigo-600',
    border: 'border-t-indigo-600',
  },
  {
    key: 'litigation',
    label: 'Litigation & Dispute',
    short: 'Litigation',
    icon: <Gavel className="w-5 h-5" />,
    gradient: 'from-[#1e1b4b] to-[#5b21b6]',
    glow: 'bg-violet-500/20',
    accent: 'bg-violet-50 text-violet-600',
    border: 'border-t-violet-600',
  },
] as const;

const PIE_COLORS = ['#2563eb', '#4f46e5', '#059669', '#d97706', '#e11d48', '#0ea5e9', '#7c3aed'];

const DOC_STATUS_ICONS: Record<string, React.ReactNode> = {
  'Draft':         <Archive className="w-3 h-3" />,
  'Under Review':  <Clock className="w-3 h-3" />,
  'Approved':      <CheckCircle className="w-3 h-3" />,
  'Active':        <TrendingUp className="w-3 h-3" />,
  'Expiring Soon': <ShieldAlert className="w-3 h-3" />,
  'Expired':       <AlertCircle className="w-3 h-3" />,
  'Archived':      <Archive className="w-3 h-3" />,
};

// ── Types ──────────────────────────────────────────────────────
interface SummaryData {
  kpi:               { total: number; active: number; expiringSoon: number; expired: number };
  byModule:          { module: string; label: string; total: number; critical: number }[];
  byDocStatus:       { status: string; count: number }[];
  byConfidentiality: { level: string; count: number }[];
  byExpiryStatus:    any[];
  criticalDocs:      any[];
}

// ── Page ───────────────────────────────────────────────────────
export default function LegalDashboardPage() {
  const [data, setData]       = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/legal-docs/summary?dept=legal');
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data');
      setData(j);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  // ── Loading ──
  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-slate-100"/>
          <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"/>
        </div>
        <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Memuat data…</p>
      </div>
    </div>
  );

  // ── Error ──
  if (error) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-3"/>
        <p className="font-bold text-slate-700 mb-1">Gagal memuat dashboard</p>
        <p className="text-sm text-slate-400 mb-4">{error}</p>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors">
          <RefreshCw className="w-3.5 h-3.5"/> Coba Lagi
        </button>
      </div>
    </div>
  );

  if (!data) return null;
  const { kpi } = data;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1e3a8a] flex items-center justify-center shadow-lg shadow-blue-900/30">
            <LayoutDashboard className="w-6 h-6 text-white"/>
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Legal Dashboard</h1>
            <p className="text-sm text-slate-400 font-medium">Overview & monitoring departemen Legal</p>
          </div>
        </div>
        <button type="button" onClick={load} className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-sm font-bold text-slate-600 rounded-xl hover:border-blue-300 hover:text-blue-600 hover:shadow-md transition-all duration-300 self-start sm:self-auto">
          <RefreshCw className="w-3.5 h-3.5"/> Refresh
        </button>
      </div>

      {/* ── KPI ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Hero: Total Docs */}
        <div className="lg:col-span-2 group relative bg-gradient-to-br from-[#0F172A] via-[#1e293b] to-[#1E3A8A] rounded-[24px] p-7 text-white overflow-hidden shadow-xl shadow-slate-900/20 hover:shadow-2xl hover:shadow-blue-900/40 transition-all duration-500 chart-reveal">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3 group-hover:bg-blue-400/25 transition-colors duration-700"/>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-200"/>
                </div>
                <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">Total Dokumen Legal</p>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
                <span className="text-[10px] font-bold text-white">LIVE</span>
              </div>
            </div>
            <h3 className="text-[2.75rem] font-black text-white tracking-tighter leading-none mb-2 group-hover:scale-[1.02] origin-left transition-transform duration-500">
              <Num v={kpi.total}/>
            </h3>
            <p className="text-[11px] text-blue-200/70 font-medium mb-5">Total dokumen di seluruh modul Legal</p>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-[16px] p-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black text-blue-200/70 uppercase tracking-widest mb-1">Aktif</p>
                <p className="text-xl font-black text-white"><Num v={kpi.active}/></p>
              </div>
              <div>
                <p className="text-[9px] font-black text-blue-200/70 uppercase tracking-widest mb-1">Kritis / Expired</p>
                <p className="text-xl font-black text-rose-300"><Num v={kpi.expired}/></p>
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="group relative bg-white rounded-[24px] p-6 border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-amber-100 hover:-translate-y-1 transition-all duration-500 chart-reveal" style={{ animationDelay: '100ms' }}>
          <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-amber-500 rounded-r-full"/>
          <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/80 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out mix-blend-overlay"/>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
              <Clock className="w-5 h-5"/>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mendekati Exp.</p>
            <h3 className="text-[2rem] font-black text-slate-900 tracking-tighter leading-none">
              <Num v={kpi.expiringSoon}/>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">dokumen ≤ 90 hari</p>
          </div>
        </div>

        {/* Expired */}
        <div className="group relative bg-white rounded-[24px] p-6 border border-slate-200 overflow-hidden shadow-lg hover:shadow-2xl hover:shadow-rose-100 hover:-translate-y-1 transition-all duration-500 chart-reveal" style={{ animationDelay: '200ms' }}>
          <div className="absolute left-0 top-6 bottom-6 w-1.5 bg-rose-500 rounded-r-full"/>
          <div className="absolute inset-0 rounded-[24px] overflow-hidden pointer-events-none">
            <div className="absolute inset-0 -translate-x-[150%] bg-gradient-to-r from-transparent via-white/80 to-transparent group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out mix-blend-overlay"/>
          </div>
          <div className="relative z-10">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
              <AlertCircle className="w-5 h-5"/>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kadaluarsa</p>
            <h3 className={cn('text-[2rem] font-black tracking-tighter leading-none', kpi.expired > 0 ? 'text-rose-600' : 'text-slate-900')}>
              <Num v={kpi.expired}/>
            </h3>
            <p className="text-[10px] text-slate-400 mt-1">perlu tindak lanjut</p>
          </div>
        </div>
      </div>

      {/* ── MODULE CARDS ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-4 rounded-full bg-blue-600 shrink-0"/>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Per-Modul Legal</span>
          <div className="flex-1 h-px bg-slate-100"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MODULES.map((mod, i) => {
            const m        = data.byModule.find(b => b.module === mod.key);
            const total    = m?.total    ?? 0;
            const critical = m?.critical ?? 0;
            const pct      = kpi.total > 0 ? Math.round((total / kpi.total) * 100) : 0;
            return (
              <div key={mod.key}
                className={`group relative bg-gradient-to-br ${mod.gradient} rounded-[20px] p-6 text-white overflow-hidden shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 chart-reveal`}
                style={{ animationDelay: `${i * 100}ms` }}>
                <div className={`absolute top-0 right-0 w-48 h-48 ${mod.glow} rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/3`}/>
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center">
                      {mod.icon}
                    </div>
                    {critical > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black shadow-lg shadow-rose-900/30">
                        <ShieldAlert className="w-2.5 h-2.5"/> {critical} kritis
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mb-1">{mod.short}</p>
                  <h3 className="text-[2rem] font-black text-white tracking-tighter leading-none mb-1"><Num v={total}/></h3>
                  <p className="text-[11px] text-white/50 mb-4">dokumen</p>
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2.5">
                    <div className="flex justify-between text-[9px] font-bold text-white/60 mb-1.5 uppercase tracking-wider">
                      <span>Proporsi</span><span>{pct}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-white/70 rounded-full transition-all duration-1000" style={{ width: `${pct}%` }}/>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── CHARTS ROW ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-4 rounded-full bg-blue-600 shrink-0"/>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Distribusi Dokumen</span>
          <div className="flex-1 h-px bg-slate-100"/>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Doc Status Bar */}
          <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 chart-reveal">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <FileText className="w-4 h-4 text-white"/>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Status Dokumen</span>
              </div>
              <span className="text-[9px] font-bold text-slate-300 bg-slate-100 px-2 py-1 rounded-lg">{data.byDocStatus.length} status</span>
            </div>
            <div className="p-4">
              {data.byDocStatus.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-slate-300">Tidak ada data</div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byDocStatus} layout="vertical" margin={{ top: 4, right: 20, bottom: 4, left: 8 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis type="number" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="status" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} axisLine={false} tickLine={false} width={95}/>
                    <Tooltip content={<Tip/>} cursor={{ fill: '#f8fafc' }}/>
                    <Bar dataKey="count" name="Jumlah" fill="#2563eb" radius={[0, 5, 5, 0]} barSize={14} animationDuration={1200}/>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Confidentiality Donut */}
          <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 chart-reveal" style={{ animationDelay: '100ms' }}>
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
                  <Scale className="w-4 h-4 text-white"/>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Klasifikasi Kerahasiaan</span>
              </div>
            </div>
            <div className="p-4">
              {data.byConfidentiality.length === 0 ? (
                <div className="flex items-center justify-center h-48 text-sm text-slate-300">Tidak ada data</div>
              ) : (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={data.byConfidentiality} dataKey="count" nameKey="level"
                          cx="50%" cy="50%" innerRadius={56} outerRadius={82} paddingAngle={3} animationDuration={1200}>
                          {data.byConfidentiality.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                          ))}
                        </Pie>
                        <Tooltip content={<Tip/>}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="shrink-0 space-y-2 pr-2">
                    {data.byConfidentiality.map((d, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}/>
                        <div>
                          <p className="text-[9px] font-black text-slate-500 leading-none">{d.level}</p>
                          <p className="text-[11px] font-black text-slate-900">{fmt(d.count)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CRITICAL TABLE ── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-4 rounded-full bg-rose-500 shrink-0"/>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dokumen Kritis & Mendekati Kadaluarsa</span>
          <div className="flex-1 h-px bg-slate-100"/>
          {data.criticalDocs.length > 0 && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-100">
              {data.criticalDocs.length} dokumen
            </span>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-[20px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-500 chart-reveal">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-rose-600 rounded-xl flex items-center justify-center shadow-md shadow-rose-900/20">
              <ShieldAlert className="w-4 h-4 text-white"/>
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top 10 Dokumen Perlu Perhatian</span>
          </div>

          {data.criticalDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-emerald-500"/>
              </div>
              <p className="font-black text-slate-700">Semua aman</p>
              <p className="text-sm text-slate-400">Tidak ada dokumen Legal yang kritis saat ini</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50">
                    {['Modul', 'Nama Dokumen', 'Kategori', 'PIC', 'Kadaluarsa', 'Sisa', 'Status'].map((h, i) => (
                      <th key={h} className={cn(
                        'px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 whitespace-nowrap',
                        i >= 4 ? 'text-right' : 'text-left'
                      )}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60">
                  {data.criticalDocs.map((doc, i) => {
                    const days = parseInt(doc.days_until_expiry);
                    const dayLabel = days < 0 ? `${Math.abs(days)}h lalu` : days === 0 ? 'Hari ini!' : `${days} hari`;
                    const mod = MODULES.find(m => m.key === doc.module);
                    const statusCls = doc.status === 'Expired' ? 'bg-slate-100 text-slate-500' : doc.status === 'Critical' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100';
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50/60 transition-colors duration-150">
                        <td className="px-4 py-3">
                          <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black', mod?.accent || 'bg-blue-50 text-blue-600')}>
                            {mod?.icon}<span>{mod?.short || doc.module}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-bold text-slate-800 max-w-[180px] truncate">{doc.doc_name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{doc.category}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{doc.pic}</td>
                        <td className="px-4 py-3 text-right text-xs text-slate-500 whitespace-nowrap">{fmtDate(doc.expiry_date)}</td>
                        <td className={cn('px-4 py-3 text-right text-xs font-black whitespace-nowrap', days < 0 ? 'text-slate-500' : days < 30 ? 'text-rose-600' : 'text-amber-500')}>{dayLabel}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn('text-[9px] font-black px-2 py-0.5 rounded-full', statusCls)}>{doc.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
