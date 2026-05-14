'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  AlertCircle, RefreshCw, LayoutDashboard, ShieldAlert,
  BadgeCheck, ClipboardList, BookOpen, UserCheck, Landmark, FlaskConical,
  FileText, Activity, Zap, TrendingUp,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Badge } from '@/components/PageShared';

// ── Palettes ──────────────────────────────────────────────────
const PIE_COLORS    = ['#2563eb','#4f46e5','#059669','#d97706','#e11d48','#0ea5e9','#7c3aed','#0d9488'];
const EXPIRY_COLORS = { Valid:'#059669', Warning:'#d97706', Critical:'#e11d48', Expired:'#94a3b8' };

// ── Helpers ───────────────────────────────────────────────────
const fmt     = (v: number) => new Intl.NumberFormat('id-ID').format(v || 0);
const fmtDate = (d: string) =>
  d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' }) : '—';

// ── Count-up ──────────────────────────────────────────────────
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

// ── Tooltip ───────────────────────────────────────────────────
function LightTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xl min-w-[130px]">
      {label && <p className="text-[10px] font-700 text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className={`flex items-center gap-1.5 text-xs ${i < payload.length - 1 ? 'mb-1' : ''}`}>
          <div className="w-2 h-2 rounded-[3px] shrink-0" style={{ background: p.color || p.fill || '#2563eb' }}/>
          <span className="text-slate-500">{p.name}:</span>
          <span className="text-slate-900 font-700">{fmt(Number(p.value))}</span>
        </div>
      ))}
    </div>
  );
}

// ── Section title ─────────────────────────────────────────────
function SecTitle({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 mt-10 mb-5">
      <div className="w-1 h-4 rounded-full bg-blue-500 shrink-0" />
      <span className="text-[11px] font-800 text-slate-400 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  );
}

// ── Chart container ───────────────────────────────────────────
function ChartCard({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: React.ElementType; children: React.ReactNode; delay?: number;
}) {
  return (
    <div
      className="bg-white rounded-[24px] overflow-hidden chart-reveal"
      style={{ boxShadow: '0 10px 40px rgba(15,23,42,0.08)', animationDelay: `${delay}ms` }}
    >
      <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
        <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
          <Icon size={16}/>
        </div>
        <span className="text-sm font-700 text-slate-700">{title}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── Expiry badge ──────────────────────────────────────────────
function ExpiryBadge({ status }: { status: string }) {
  const cls: Record<string, string> = {
    Valid:'badge-emerald', Warning:'badge-amber', Critical:'badge-rose', Expired:'badge-slate',
  };
  return <Badge label={status} colorClass={cls[status] || 'badge-slate'}/>;
}

// ── Module config ─────────────────────────────────────────────
const MODULE_CFG = {
  license:            { label:'License & Permit',   Icon: BadgeCheck,    gradient: '#3b82f6,#2563eb', badge:'badge-indigo'  },
  monitoring:         { label:'Compliance Docs',    Icon: ClipboardList, gradient: '#10b981,#059669', badge:'badge-emerald' },
  sop:                { label:'SOP & Policy',       Icon: BookOpen,      gradient: '#f59e0b,#d97706', badge:'badge-amber'   },
  hr_compliance:      { label:'HR & Employment',    Icon: UserCheck,     gradient: '#8b5cf6,#7c3aed', badge:'badge-violet'  },
  tax_finance:        { label:'Tax & Finance',      Icon: Landmark,      gradient: '#06b6d4,#0891b2', badge:'badge-cyan'    },
  product_regulatory: { label:'Product Regulatory', Icon: FlaskConical,  gradient: '#f43f5e,#e11d48', badge:'badge-rose'    },
} as const;

type ModuleKey = keyof typeof MODULE_CFG;

// ── Types ─────────────────────────────────────────────────────
interface SummaryData {
  kpi:               { total: number; active: number; expiringSoon: number; expired: number };
  byModule:          { module: string; label: string; total: number; critical: number }[];
  byDocStatus:       { status: string; count: number }[];
  byConfidentiality: { level: string; count: number }[];
  byExpiryStatus:    { module: string; label: string; Valid: number; Warning: number; Critical: number; Expired: number }[];
  criticalDocs:      any[];
}

// ── Main page ─────────────────────────────────────────────────
export default function ComplianceDashboardPage() {
  const [data, setData]       = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/legal-docs/summary?dept=compliance');
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat data');
      setData(j);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center py-32">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center">
              <LayoutDashboard size={22} className="text-white"/>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"/>
            <p className="text-sm text-slate-400 font-500">Memuat Compliance Dashboard…</p>
          </div>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex items-center justify-center py-32">
        <div className="bg-white rounded-[24px] p-8 text-center shadow-xl flex flex-col items-center gap-3">
          <AlertCircle size={36} className="text-rose-500"/>
          <p className="text-rose-600 font-600">{error}</p>
          <button type="button" className="btn btn-primary mt-2" onClick={load}><RefreshCw size={14}/> Coba Lagi</button>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  const { kpi } = data;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 md:pt-8">

        {/* ── HERO CARD ── */}
        <div
          className="relative overflow-hidden rounded-[28px] mb-8 p-7 md:p-10"
          style={{
            background: 'linear-gradient(135deg, #fff 0%, #f0fdf4 50%, #ecfdf5 100%)',
            boxShadow: '0 20px 50px rgba(5,150,105,0.12), 0 4px 16px rgba(5,150,105,0.06)',
          }}
        >
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none"/>
          <div className="absolute bottom-0 left-1/3 w-48 h-48 rounded-full bg-teal-400/8 blur-3xl pointer-events-none"/>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_3s_ease-in-out_2s_forwards] pointer-events-none"/>

          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg shrink-0"
                style={{ boxShadow: '0 8px 24px rgba(5,150,105,0.35)' }}
              >
                <LayoutDashboard size={24} className="text-white"/>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-900 text-slate-900 tracking-tight">Compliance Dashboard</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> LIVE
                  </span>
                </div>
                <p className="text-sm text-slate-500">Overview & monitoring dokumen departemen Compliance</p>
              </div>
            </div>
            <button
              type="button"
              className="self-start md:self-center flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-600 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              onClick={load}
            >
              <RefreshCw size={14}/> Refresh
            </button>
          </div>

          {/* Glassmorphism stats */}
          <div className="relative mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label:'Total Dokumen', value:kpi.total,        icon:FileText,    color:'text-blue-600',   bg:'bg-blue-50'   },
              { label:'Aktif',         value:kpi.active,       icon:Activity,    color:'text-emerald-600',bg:'bg-emerald-50'},
              { label:'Mendekati Exp', value:kpi.expiringSoon, icon:TrendingUp,  color:'text-amber-600',  bg:'bg-amber-50'  },
              { label:'Kadaluarsa',    value:kpi.expired,      icon:AlertCircle, color:'text-rose-600',   bg:'bg-rose-50'   },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div
                key={label}
                className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background:'rgba(255,255,255,0.6)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.6)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-600 text-slate-500">{label}</span>
                  <div className={`w-7 h-7 rounded-xl ${bg} flex items-center justify-center`}>
                    <Icon size={13} className={color}/>
                  </div>
                </div>
                <span className="text-3xl font-900 text-slate-900 tabular-nums"><AnimNum value={value}/></span>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECONDARY KPI ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
          {[
            {
              accent:'border-amber-400', bg:'from-amber-50/60',
              title:'Mendekati Kadaluarsa', sub:'Dokumen expiry ≤ 90 hari',
              value:kpi.expiringSoon, icon:Zap,
              iconBg:'bg-amber-100', iconColor:'text-amber-600', barColor:'bg-amber-400',
            },
            {
              accent:'border-rose-400', bg:'from-rose-50/60',
              title:'Dokumen Kadaluarsa', sub:'Perlu diperbaharui segera',
              value:kpi.expired, icon:AlertCircle,
              iconBg:'bg-rose-100', iconColor:'text-rose-600', barColor:'bg-rose-500',
            },
          ].map(({ accent, bg, title, sub, value, icon: Icon, iconBg, iconColor, barColor }) => (
            <div
              key={title}
              className={`relative overflow-hidden bg-gradient-to-br ${bg} to-white rounded-[20px] p-5 border-l-4 ${accent} group`}
              style={{ boxShadow:'0 4px 20px rgba(15,23,42,0.06)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none"/>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-700 text-slate-700">{title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center group-hover:rotate-6 group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className={iconColor}/>
                </div>
              </div>
              <p className="text-3xl font-900 text-slate-900 tabular-nums mb-3">{fmt(value)}</p>
              <div className="w-full h-1.5 rounded-full bg-slate-200/80">
                <div
                  className={`h-full rounded-full ${barColor} transition-all duration-1000`}
                  style={{ width:`${kpi.total ? Math.min((value / kpi.total) * 100, 100) : 0}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {kpi.total ? ((value / kpi.total) * 100).toFixed(1) : 0}% dari total
              </p>
            </div>
          ))}
        </div>

        {/* ── MODULE CARDS ── */}
        <SecTitle>Per-Modul Compliance</SecTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(Object.keys(MODULE_CFG) as ModuleKey[]).map((mod, idx) => {
            const m        = data.byModule.find(b => b.module === mod);
            const total    = m?.total    ?? 0;
            const critical = m?.critical ?? 0;
            const { label, Icon, gradient } = MODULE_CFG[mod];
            const pct = kpi.total ? (total / kpi.total) * 100 : 0;
            return (
              <div
                key={mod}
                className="chart-reveal relative overflow-hidden rounded-[22px] p-6 text-white"
                style={{
                  background: `linear-gradient(135deg, ${gradient})`,
                  boxShadow: '0 12px 32px rgba(15,23,42,0.15)',
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10 pointer-events-none"/>
                <div className="relative flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                    <Icon size={18}/>
                  </div>
                  {critical > 0 && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-700 border border-white/30">
                      <ShieldAlert size={9}/> {critical} kritis
                    </span>
                  )}
                </div>
                <p className="text-sm font-600 text-white/80 mb-1">{label}</p>
                <p className="text-4xl font-900 tabular-nums mb-4">{fmt(total)}</p>
                <div className="w-full h-1 rounded-full bg-white/20">
                  <div
                    className="h-full rounded-full bg-white/70 transition-all duration-1000"
                    style={{ width:`${Math.min(pct, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-white/60 mt-1.5">{pct.toFixed(1)}% dari seluruh dokumen</p>
              </div>
            );
          })}
        </div>

        {/* ── EXPIRY STATUS GROUPED BAR ── */}
        <SecTitle>Expiry Status per Modul</SecTitle>
        <ChartCard title="Distribusi Expiry Status per Modul" icon={TrendingUp} delay={0}>
          {data.byExpiryStatus.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2 border-2 border-dashed border-slate-200 rounded-2xl">
              <TrendingUp size={28} className="text-slate-300"/>
              <p className="text-sm text-slate-400">Tidak ada data</p>
            </div>
          ) : (
            <div className="chart-reveal" style={{ animationDelay:'100ms' }}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byExpiryStatus} margin={{ top:8, right:16, bottom:24, left:0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize:10, fill:'#64748b' }}
                    axisLine={false} tickLine={false}
                    angle={-30} textAnchor="end" interval={0}
                  />
                  <YAxis tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<LightTip/>}/>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:10, paddingTop:12 }}
                    formatter={(v) => <span style={{ color:'#64748b' }}>{v}</span>}/>
                  <Bar dataKey="Valid"    name="Valid"    fill={EXPIRY_COLORS.Valid}    radius={[3,3,0,0]} barSize={10}/>
                  <Bar dataKey="Warning"  name="Warning"  fill={EXPIRY_COLORS.Warning}  radius={[3,3,0,0]} barSize={10}/>
                  <Bar dataKey="Critical" name="Critical" fill={EXPIRY_COLORS.Critical} radius={[3,3,0,0]} barSize={10}/>
                  <Bar dataKey="Expired"  name="Expired"  fill={EXPIRY_COLORS.Expired}  radius={[3,3,0,0]} barSize={10}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        {/* ── DISTRIBUTION CHARTS ── */}
        <SecTitle>Distribusi Dokumen</SecTitle>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          <ChartCard title="Status Dokumen" icon={Activity} delay={0}>
            {data.byDocStatus.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText size={28} className="text-slate-300"/>
                <p className="text-sm text-slate-400">Tidak ada data</p>
              </div>
            ) : (
              <div className="chart-reveal" style={{ animationDelay:'200ms' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.byDocStatus} layout="vertical" margin={{ top:4, right:16, bottom:4, left:10 }}>
                    <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f1f5f9"/>
                    <XAxis type="number" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="status" tick={{ fontSize:10, fill:'#64748b' }} axisLine={false} tickLine={false} width={95}/>
                    <Tooltip content={<LightTip/>}/>
                    <Bar dataKey="count" name="Jumlah" fill="#059669" radius={[0,6,6,0]} barSize={14}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Klasifikasi Kerahasiaan" icon={ShieldAlert} delay={100}>
            {data.byConfidentiality.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 border-2 border-dashed border-slate-200 rounded-2xl">
                <ShieldAlert size={28} className="text-slate-300"/>
                <p className="text-sm text-slate-400">Tidak ada data</p>
              </div>
            ) : (
              <div className="chart-reveal" style={{ animationDelay:'300ms' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.byConfidentiality} dataKey="count" nameKey="level"
                      cx="50%" cy="50%" innerRadius={52} outerRadius={80} paddingAngle={3}>
                      {data.byConfidentiality.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]}/>
                      ))}
                    </Pie>
                    <Tooltip content={<LightTip/>}/>
                    <Legend iconType="circle" iconSize={8}
                      wrapperStyle={{ fontSize:10, paddingTop:8 }}
                      formatter={(v) => <span style={{ color:'#64748b' }}>{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>
        </div>

        {/* ── CRITICAL TABLE ── */}
        <SecTitle>Dokumen Kritis & Mendekati Kadaluarsa</SecTitle>
        <div
          className="bg-white rounded-[24px] overflow-hidden chart-reveal"
          style={{ boxShadow:'0 10px 40px rgba(15,23,42,0.08)', animationDelay:'400ms' }}
        >
          <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shrink-0">
              <ShieldAlert size={16}/>
            </div>
            <span className="text-sm font-700 text-slate-700">Top 10 Dokumen Perlu Perhatian</span>
          </div>

          {data.criticalDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 m-5 rounded-2xl border-2 border-dashed border-slate-200">
              <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center">
                <ShieldAlert size={22} className="text-emerald-500"/>
              </div>
              <p className="text-sm font-700 text-slate-600">Tidak ada dokumen kritis saat ini</p>
              <p className="text-xs text-slate-400">Semua dokumen Compliance dalam kondisi baik</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50">
                    {['Modul','Nama Dokumen','Kategori','PIC','Tgl Kadaluarsa','Sisa Hari','Status'].map((h, i) => (
                      <th key={h} className={`px-4 py-3 text-[10px] font-800 text-slate-400 uppercase tracking-wide border-b border-slate-100 whitespace-nowrap ${i < 4 ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.criticalDocs.map((doc) => {
                    const days = parseInt(doc.days_until_expiry);
                    const dayLabel = days < 0
                      ? `Exp ${Math.abs(days)}h lalu`
                      : days === 0 ? 'Hari ini!'
                      : `${days} hari`;
                    const cfg = MODULE_CFG[doc.module as ModuleKey];
                    return (
                      <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <Badge
                            label={cfg?.label ?? doc.module}
                            colorClass={cfg?.badge ?? 'badge-indigo'}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-600 max-w-[200px] truncate">{doc.doc_name}</td>
                        <td className="px-4 py-3 text-slate-500">{doc.category}</td>
                        <td className="px-4 py-3 text-slate-500">{doc.pic}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{fmtDate(doc.expiry_date)}</td>
                        <td className={`px-4 py-3 text-right font-700 ${days < 0 ? 'text-rose-600' : days < 30 ? 'text-rose-500' : 'text-amber-500'}`}>{dayLabel}</td>
                        <td className="px-4 py-3 text-right"><ExpiryBadge status={doc.status}/></td>
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
