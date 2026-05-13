'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  AlertCircle, RefreshCw, Package, HardDrive, Truck, Users,
  ShieldCheck, FileText, TrendingUp, TrendingDown, ChevronRight,
  Scale, BookOpen, FileSignature, BadgeCheck, Gavel, UserCheck, Landmark, FlaskConical,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  AreaChart, Area,
} from 'recharts';

// ── Palettes ──────────────────────────────────────────────────
const PIE_COLORS = ['#2563eb','#4f46e5','#059669','#d97706','#e11d48','#0ea5e9','#7c3aed','#0d9488'];
const VEH_COLORS: Record<string,string> = {
  Minibus:'#f59e0b', Motor:'#8b5cf6', 'Blind Van':'#0ea5e9',
  'Pick Up':'#0d9488', Box:'#92400e', default:'#94a3b8',
};
const COND_COLORS: Record<string,string> = { Good:'#059669', 'Needs Maintenance':'#d97706', Damaged:'#e11d48' };
const STAT_COLORS: Record<string,string>  = { Active:'#059669', Idle:'#d97706', Lost:'#e11d48', Disposed:'#94a3b8' };
const DOC_COLORS: Record<string,string>   = { Active:'#059669', Renewal:'#d97706', Expired:'#e11d48' };

// ── Helpers ───────────────────────────────────────────────────
const fmt   = (v: number) => new Intl.NumberFormat('id-ID',{ maximumFractionDigits:0 }).format(v||0);
const fmtRp = (v: number) => `Rp ${fmt(v)}`;

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

// ── Adaptive tooltip (light + dark) ───────────────────────────
function LightTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface border border-border rounded-xl p-3 shadow-xl min-w-130">
      {label && <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1.5">{label}</p>}
      {payload.map((p: any, i: number) => (
        <div key={i} className={`flex-start gap-1.5 text-xs ${i < payload.length-1 ? 'mb-1' : ''}`}>
          <div className={`w-2 h-2 rounded-xs shrink-0 bg-blue`} />
          <span className="text-text-2">{p.name}:</span>
          <span className="text-text font-700">{fmt(p.value)}</span>
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
      <span className="text-xxs-bold text-text-3 uppercase letter-wide">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}

// ── Section card ─────────────────────────────────────────────
function SCard({ title, children, className }: { title:string; children:React.ReactNode; className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-2xl overflow-hidden shadow-premium transition-all hover:shadow-hover ${className||''}`}>
      <div className="px-4 py-3 border-b border-border-subtle bg-surface-2/50 flex-between">
        <span className="text-xxs-bold text-text-3 uppercase letter-wide">
          {title}
        </span>
        <div className="w-1.5 h-1.5 rounded-full bg-blue-border" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ── Adaptive table ────────────────────────────────────────────
function LTable({ headers, rows, footer }: { headers:string[]; rows:(string|number)[][]; footer?:(string|number)[] }) {
  return (
    <table className="w-full border-collapse text-xs">
      <thead>
        <tr className="bg-surface-2">
          {headers.map((h,i) => (
            <th key={i} className={`p-1.5 px-2.5 text-text-3 font-800 text-xxs letter-wide uppercase border-b border-border whitespace-nowrap ${i===0?'text-left':'text-right'}`}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row,i) => (
          <tr key={i} className={i%2===0 ? 'bg-surface' : 'bg-surface-2'}>
            {row.map((cell,j) => (
              <td key={j} className={`p-1.5 px-2.5 border-b border-border-subtle ${j===0 ? 'text-text-2 font-500 text-left' : 'text-text font-700 text-right'}`}>{cell}</td>
            ))}
          </tr>
        ))}
        {footer && (
          <tr className="bg-blue-light">
            {footer.map((cell,j) => (
              <td key={j} className={`p-1.5 px-2.5 font-800 text-xs ${j===0 ? 'text-blue-d text-left' : 'text-blue text-right'}`}>{cell}</td>
            ))}
          </tr>
        )}
      </tbody>
    </table>
  );
}

// ── Donut legend ──────────────────────────────────────────────
function Legend2({ items, colors, total }: { items:{name:string;value:number}[]; colors:string[]; total:number }) {
  return (
    <div className="flex flex-col gap-1">
      {items.slice(0,6).map((it,i) => {
        const pct = total>0 ? Math.round((it.value/total)*100) : 0;
        return (
          <div key={i} className="flex-start gap-1.5 text-xxs">
            <div className={`legend-dot bg-blue`} />
            <span className="text-text-2 flex-1 truncate">{it.name}</span>
            <span className="text-text font-800 shrink-0">{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Metric card (BVL MetricCard style) ────────────────────────
function MetricCard({
  title, count, sub, icon, topColor, iconBg, iconColor, delay = 0,
}: {
  title:string; count:number; sub?:string;
  icon:React.ReactNode; topColor:string;
  iconBg:string; iconColor:string; delay?:number;
}) {
  const n = useCountUp(count);
  const glowClass = topColor === '#059669' ? 'glow-emerald' : topColor === '#d97706' ? 'glow-amber' : 'glow-blue';
  const borderClass = topColor === '#059669' ? 'border-t-emerald' : topColor === '#d97706' ? 'border-t-amber' : 'border-t-blue';
  const delayClass = `delay-${Math.round((delay || 0) / 100) * 100}`;
  
  return (
    <div className={`card-metric animate-slide-up border-t-4 ${borderClass} ${glowClass} ${delayClass}`}>
      <div className="absolute inset-0 pointer-events-none bg-grad-blue translate-x-[-100%] transition-transform duration-1000 ease hover:translate-x-0" />

      <div className="flex-between items-start mb-4 relative z-1">
        <div>
          <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">{title}</p>
          <p className="text-3xl font-900 text-text letter-tight leading-none">
            {fmt(n)}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex-center shrink-0 shadow-sm ${iconBg==='#ecfdf5'?'bg-emerald-light text-emerald':iconBg==='#fffbeb'?'bg-amber-light text-amber':'bg-blue-light text-blue'}`}>
          {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { size: 20 }) : icon}
        </div>
      </div>

      <div className="flex-between items-end relative z-1">
        {sub && <p className="text-xs text-text-3 font-600">{sub}</p>}
        <div className="flex items-center gap-1 text-emerald font-800 text-xxs bg-emerald-light px-1.5 py-0.5 rounded-md">
          <TrendingUp size={10} />
          <span>+2.4%</span>
        </div>
      </div>
    </div>
  );
}

// ── Dark hero card (BVL Annual Sales style) ────────────────────
function HeroCard({
  title, count, sub, icon, badge, delay = 0,
}: {
  title:string; count:number; sub?:string;
  icon:React.ReactNode; badge?:string; delay?:number;
}) {
  const n = useCountUp(count);
  return (
    <div 
      className="card-hero shadow-hero hover:shadow-hero-hover hover:-translate-y-1 animate-slide-up"
    >
      <div className="absolute top-[-20%] right-[-10%] w-50 h-50 bg-blue/10 blur-3xl pointer-events-none rounded-full" />

      <div className="relative">
        <div className="flex-between items-start mb-4">
          <div className="flex-start gap-2">
            <div className="w-7.5 h-7.5 rounded-lg glass flex-center text-white/80">
              {icon}
            </div>
            <p className="text-xxs-bold text-slate-400 uppercase letter-wide">{title}</p>
          </div>
          {badge && (
            <div className="flex-start gap-1.5 glass border border-white/10 px-2 py-0.5 rounded-lg">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_6px_var(--emerald)]" />
              <span className="text-xxs-bold text-white">{badge}</span>
            </div>
          )}
        </div>

        <p className="text-4xl font-900 text-white letter-tighter leading-none mb-1.5">
          {fmt(n)}
        </p>
        {sub && <p className="text-sm text-slate-400/80 font-500">{sub}</p>}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
//  MAIN PAGE
// ═════════════════════════════════════════════════════════════
export default function Home() {
  const [data, setData]                   = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState<string|null>(null);
  const [compNotifs, setCompNotifs]       = useState<any[]>([]);

  async function load() {
    setLoading(true); setError(null);
    try {
      const res  = await fetch('/api/dashboard');
      if (!res.ok) throw new Error('Cannot connect to database');
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetch('/api/legal-docs/notifications')
      .then(r => r.json())
      .then(d => setCompNotifs(d.items || []))
      .catch(() => {});
  }, []);

  if (loading) return (
    <div className="flex-center h-82vh flex-col gap-4">
      <div className="w-10 h-10 border-3 border-slate-200 border-t-blue rounded-full animate-spin" />
      <p className="text-text-3 text-sm font-600">Loading dashboard data…</p>
    </div>
  );

  if (error) return (
    <div className="flex-center h-82vh">
      <div className="text-center max-w-380 bg-surface border border-rose-200 rounded-2xl p-8 shadow-premium">
        <div className="w-13 h-13 rounded-full bg-rose-light border border-rose-200 flex-center mx-auto mb-4">
          <AlertCircle size={24} className="text-rose" />
        </div>
        <h2 className="text-base font-800 mb-1.5 text-text">Connection Error</h2>
        <p className="text-text-3 text-xs mb-6 lh-1-6">{error}</p>
        <button className="btn btn-primary" onClick={load}><RefreshCw size={14}/> Retry</button>
      </div>
    </div>
  );

  const today = new Date().toLocaleDateString('id-ID',{ day:'2-digit', month:'long', year:'numeric' });

  const vehData = data.vehicles.byType.map((v: any) => ({
    ...v, color: VEH_COLORS[v.name] || VEH_COLORS.default,
  }));
  const totalRentalQty = data.rentalByVendor.reduce((s: number, r: any) => s + r.qty, 0);
  const sparkline = [60,65,72,80,88,95,data.assets.count].map((v,i) => ({ i, v }));

  return (
    <div className="container animate-fade-in pb-20 max-w-1500">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="mb-7">
        <div className="flex-start gap-2.5 mb-1">
          <h1 className="text-xl font-900 text-text letter-tight">
            Dashboard General Affairs
          </h1>
          <span className="text-xxs-bold bg-blue-light text-blue border border-blue-border px-2.5 py-1 rounded-lg uppercase letter-wide">
            Live
          </span>
        </div>
        <p className="text-text-3 text-sm font-500">
          MRA Group · Periode Januari – Desember 2026 · Update: {today}
        </p>
      </div>

      {/* ── ROW 1: 2 hero + 2 metric cards ─────────────── */}
      <div className="grid grid-cols-dash-hero gap-4 mb-4">

        {/* HERO: Total Asset */}
        <HeroCard
          title="Total Asset" count={data.assets.count}
          sub={`IDR ${fmt(data.assets.value)}`}
          icon={<Package size={15}/>}
          badge="Live" delay={0}
        />

        {/* Device Rental - premium card */}
        <div className="card-metric animate-slide-up border-l-4 border-l-indigo-600 flex flex-col glow-indigo delay-100">
          <div className="flex-between items-start mb-2 relative z-1">
            <div>
              <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Device Rental</p>
              <p className="text-3xl font-900 text-text letter-tight leading-none">
                <AnimNum value={data.rentals.count}/>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex-center text-indigo-600 shadow-sm">
              <HardDrive size={20}/>
            </div>
          </div>
          <p className="text-xs text-text-3 font-600 mb-3 relative z-1">IDR {fmt(data.rentals.value)}</p>
          
          <div className="spark-container mt-auto">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={sparkline} margin={{ top:0,right:0,bottom:0,left:0 }}>
                <defs>
                  <linearGradient id="indGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#4f46e5" stopOpacity={0.2}/>
                    <stop offset="90%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#4f46e5" strokeWidth={2.5} fill="url(#indGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle - white metric */}
        <MetricCard
          title="Vehicle Asset" count={data.vehicles.total}
          sub={`${data.vehicles.byType.length} vehicle types`}
          icon={<Truck size={16}/>}
          topColor="#059669" iconBg="#ecfdf5" iconColor="#059669" delay={160}
        />

        {/* Vendors - white metric */}
        <MetricCard
          title="Data Vendor" count={data.vendors.total}
          sub={`${data.vendors.active} active · ${data.vendors.inactive} inactive`}
          icon={<Users size={16}/>}
          topColor="#d97706" iconBg="#fffbeb" iconColor="#d97706" delay={240}
        />
      </div>

      {/* ── ROW 2: Insurance + Agreement + Vehicle donut ── */}
      <div className="grid grid-cols-dash-mini gap-4 mb-1">

        {/* Insurance */}
        <div className="card-metric animate-slide-up border-t-4 border-t-rose flex-between glow-rose delay-200">
          <div className="flex-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-light flex-center shadow-sm">
              <ShieldCheck size={22} className="text-rose"/>
            </div>
            <div>
              <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Insurance</p>
              <p className="text-2xl font-900 text-text leading-none"><AnimNum value={data.insurance.total}/></p>
            </div>
          </div>
          <div className="text-right bg-emerald-light border border-emerald-200/50 rounded-2xl px-4 py-2 shadow-sm">
            <p className="text-xxs-bold text-emerald uppercase mb-0.5">Active</p>
            <p className="text-xl font-900 text-emerald leading-none"><AnimNum value={data.insurance.active}/></p>
          </div>
        </div>

        {/* Agreement */}
        <div className="card-metric animate-slide-up border-t-4 border-t-blue flex-between glow-blue delay-300">
          <div className="flex-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-light flex-center shadow-sm">
              <FileText size={22} className="text-blue"/>
            </div>
            <div>
              <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Agreement</p>
              <p className="text-2xl font-900 text-text leading-none"><AnimNum value={data.documents.total}/></p>
            </div>
          </div>
          <div className="text-right bg-emerald-light border border-emerald-200/50 rounded-2xl px-4 py-2 shadow-sm">
            <p className="text-xxs-bold text-emerald uppercase mb-0.5">Active</p>
            <p className="text-xl font-900 text-emerald leading-none"><AnimNum value={data.documents.active}/></p>
          </div>
        </div>

        {/* Vehicle donut + vendor bar */}
        <div className="bg-surface border border-border border-t-3 border-t-emerald rounded-2xl px-5 py-3 shadow-premium flex-start gap-4">
          <div className="relative w-22.5 h-22.5 shrink-0">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={vehData.length?vehData:[{name:'–',value:1,color:'#e2e8f0'}]}
                  innerRadius={28} outerRadius={43} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {(vehData.length?vehData:[{color:'#e2e8f0'}]).map((e: any,i: number) => <Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip content={<LightTip/>}/>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex-center pointer-events-none">
              <span className="text-lg font-900 text-text">{data.vehicles.total}</span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Vehicle</p>
            <Legend2 items={vehData} colors={vehData.map((v: any)=>v.color)} total={data.vehicles.total}/>
          </div>
          <div className="w-40 shrink-0">
            <p className="text-xxs-bold text-text-3 uppercase letter-wide mb-1">Vendor Status</p>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart layout="vertical" data={[{ name:'Total', value:data.vendors.total },{ name:'Active', value:data.vendors.active },{ name:'Inactive', value:data.vendors.inactive }]} margin={{ top:0,right:22,bottom:0,left:0 }}>
                  <XAxis type="number" tick={{ fontSize:8, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" tick={{ fontSize:9, fill:'#64748b' }} axisLine={false} tickLine={false} width={48}/>
                  <Tooltip content={<LightTip/>}/>
                  <defs>
                    <linearGradient id="vGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#d97706" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                  <Bar dataKey="value" fill="url(#vGrad)" radius={[0,4,4,0]} barSize={11}
                    label={{ position:'right', fontSize:9, fontWeight:700, fill:'#64748b' }}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ ANALYTICS ══════════════════ */}
      <SecTitle>Analytics & Charts</SecTitle>

      <div className="grid grid-cols-dash-charts gap-4 mb-4">

        {/* Asset category table */}
        <SCard title="Asset Data Summary">
          <LTable
            headers={['Category','Qty','Acq. Cost']}
            rows={data.assetByCategory.map((r: any) => [r.category, fmt(r.qty), fmt(r.cost)])}
            footer={['TOTAL', fmt(data.assets.count), fmt(data.assets.value)]}
          />
        </SCard>

        {/* Asset Condition donut */}
        <SCard title="Asset Condition">
          {data.assetCondition.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <PieChart>
                  <Pie data={data.assetCondition} cx="50%" cy="46%"
                    innerRadius={52} outerRadius={76} paddingAngle={3}
                    dataKey="value" nameKey="name" strokeWidth={0}>
                    {data.assetCondition.map((e: any,i: number) => (
                      <Cell key={i} fill={COND_COLORS[e.name]||PIE_COLORS[i]}/>
                    ))}
                  </Pie>
                  <Tooltip content={<LightTip/>}/>
                  <Legend iconType="circle" iconSize={7}
                    formatter={(v) => <span className="text-xs text-text-3">{v}</span>}
                    wrapperStyle={{ paddingTop:6 }}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="no-data-placeholder">No data</div>
          )}
        </SCard>

        {/* Asset Status */}
        <SCard title="Asset Status">
          <div>
            {data.assetStatus.map((r: any,i: number) => (
              <div key={i} className="flex-start gap-2 py-1.5 border-b border-border-subtle">
                <div className={`w-2 h-2 rounded-full shrink-0 ${r.status==='Active'?'bg-emerald':r.status==='Pending'?'bg-amber':r.status==='Broken'?'bg-rose':'bg-slate-400'}`} />
                <span className="text-xs text-text-2 flex-1">{r.status}</span>
                <span className="text-xs text-text font-700 min-w-9 text-right">{fmt(r.count)}</span>
                <div className="w-15 h-1.25 bg-border-subtle rounded-xs overflow-hidden">
                  <div className={`h-full rounded-xs ${r.status==='Active'?'bg-emerald w-75':r.status==='Pending'?'bg-amber w-25':r.status==='Broken'?'bg-rose w-10':'bg-slate-400 w-10'}`} />
                </div>
                <span className={`text-xxs font-800 min-w-9 text-right ${r.status==='Active'?'text-emerald':r.status==='Pending'?'text-amber':r.status==='Broken'?'text-rose':'text-slate-400'}`}>{r.pct}%</span>
              </div>
            ))}
            <div className="flex-between pt-2 mt-1">
              <span className="text-xxs-bold text-blue uppercase">TOTAL</span>
              <span className="text-xxs-bold text-blue">{fmt(data.totalStatusCount)}</span>
              <span className="text-xxs-bold text-blue">100%</span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="h-13 mt-3">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <AreaChart data={sparkline} margin={{ top:0,right:0,bottom:0,left:0 }}>
                <defs>
                  <linearGradient id="blGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#2563eb" stopOpacity={0.15}/>
                    <stop offset="90%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} fill="url(#blGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xxs text-slate-300 text-right mt-0.5">Asset count trend</p>
        </SCard>
      </div>

      {/* ═══════════════════════ DEVICE RENTAL ══════════════ */}
      <SecTitle>Device Rental Summary</SecTitle>

      <div className="grid grid-cols-dash-rental gap-4 mb-4">

        <SCard title="By Device Type">
          <LTable
            headers={['Type','Qty','Amount']}
            rows={data.rentalByType.map((r: any) => [r.type, fmt(r.qty), fmt(r.amount)])}
            footer={['TOTAL', fmt(data.rentals.count), fmt(data.rentals.value)]}
          />
        </SCard>

        <SCard title="Unit Distribution by Vendor">
          {data.rentalByVendor.length > 0 ? (
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={data.rentalByVendor} margin={{ top:5,right:5,bottom:70,left:0 }}>
                  <defs>
                    <linearGradient id="bBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.55}/>
                    </linearGradient>
                    <linearGradient id="bGreen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#059669" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.55}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="vendor" tick={{ fontSize:8.5, fill:'#94a3b8', angle:-32, textAnchor:'end' }} axisLine={false} tickLine={false} interval={0}/>
                  <YAxis yAxisId="l" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="r" orientation="right" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => v>=1e6?`${(v/1e6).toFixed(0)}M`:String(v)}/>
                  <Tooltip content={<LightTip/>}/>
                  <Legend wrapperStyle={{ fontSize:10, paddingTop:4 }} formatter={(v) => <span className="text-text-3">{v}</span>}/>
                  <Bar yAxisId="l" dataKey="qty"    name="Qty"    fill="url(#bBlue)"  radius={[4,4,0,0]}/>
                  <Bar yAxisId="r" dataKey="amount" name="Amount" fill="url(#bGreen)" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="no-data-placeholder">No rental data</div>
          )}
        </SCard>

        <SCard title="Vendor Distribution">
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={data.rentalByVendor} cx="50%" cy="50%"
                  innerRadius={34} outerRadius={56} paddingAngle={3}
                  dataKey="qty" nameKey="vendor" strokeWidth={0}>
                  {data.rentalByVendor.map((_: any,i: number) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<LightTip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Legend2 items={data.rentalByVendor.map((r: any)=>({ name:r.vendor, value:r.qty }))} colors={PIE_COLORS} total={totalRentalQty}/>
        </SCard>
      </div>

      {/* ═══════════════════════ INSURANCE ══════════════════ */}
      <SecTitle>Insurance Summary</SecTitle>

      <div className="grid grid-cols-dash-insurance gap-4 mb-4">

        <SCard title="Policy Status">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-surface-2">
                {['Policy Status','Policies','Total Annual Premium','Total Sum Insured'].map((h,i) => (
                  <th key={i} className={`p-1.5 px-2.5 text-text-3 font-800 text-xxs letter-wide uppercase border-b border-border whitespace-nowrap ${i===0?'text-left':'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(['Active','Renewal','Expired'] as const).map((st,i) => {
                const r = data.insurance.byStatus.find((x: any)=>x.status===st)||{ count:0, premium:0, coverage:0 };
                return (
                  <tr key={i} className={i%2===0 ? 'bg-surface' : 'bg-surface-2'}>
                    <td className="p-2 px-2.5">
                      <div className="flex-start gap-2">
                        <div className={`w-2.5 h-2.5 rounded-xs shrink-0 ${st==='Active'?'bg-emerald':st==='Renewal'?'bg-amber':'bg-rose'}`}/>
                        <span className="text-text font-600">{st}</span>
                      </div>
                    </td>
                    <td className="p-2 px-2.5 text-right font-700 text-text">{fmt(r.count)}</td>
                    <td className="p-2 px-2.5 text-right text-text-2">{fmtRp(r.premium)}</td>
                    <td className="p-2 px-2.5 text-right text-text-2">{fmtRp(r.coverage)}</td>
                  </tr>
                );
              })}
              <tr className="bg-rose-light">
                <td className="p-2 px-2.5 font-800 text-rose uppercase">TOTAL</td>
                <td className="p-2 px-2.5 text-right font-800 text-rose">{fmt(data.insurance.total)}</td>
                <td className="p-2 px-2.5 text-right font-700 text-rose">{fmtRp(data.insurance.totalPremium)}</td>
                <td className="p-2 px-2.5 text-right font-700 text-rose">{fmtRp(data.insurance.totalCoverage)}</td>
              </tr>
            </tbody>
          </table>
        </SCard>

        <SCard title="Insurer Distribution">
          <div className="h-30">
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <PieChart>
                <Pie data={data.insurance.byVendor} cx="50%" cy="50%"
                  innerRadius={28} outerRadius={50} paddingAngle={3}
                  dataKey="count" nameKey="vendor" strokeWidth={0}>
                  {data.insurance.byVendor.map((_: any,i: number) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip content={<LightTip/>}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <Legend2 items={data.insurance.byVendor.map((v: any)=>({ name:v.vendor, value:v.count }))} colors={PIE_COLORS} total={data.insurance.total}/>
        </SCard>

        <SCard title="Coverage Type">
          <div className="flex flex-col gap-2.5">
            {data.insurance.byType.length > 0 ? data.insurance.byType.map((t: any,i: number) => {
              const variants = [
                'bg-blue-50 border-blue-200 text-blue',
                'bg-emerald-50 border-emerald-200 text-emerald',
                'bg-purple-50 border-purple-200 text-purple'
              ];
              const variant = variants[i%variants.length];
              return (
                <div key={i} className={`border rounded-xl p-2.5 px-3.5 flex-between items-center ${variant}`}>
                  <span className="text-xs font-600 text-text-2/70">{t.type}</span>
                  <span className="text-2xl font-900">
                    <AnimNum value={t.count}/>
                  </span>
                </div>
              );
            }) : <p className="text-xs text-text-3 text-center mt-2">No data</p>}
          </div>
        </SCard>
      </div>

      {/* ═══════════════════════ AGREEMENT + VEHICLE ════════ */}
      <SecTitle>Agreement & Vehicle Summary</SecTitle>

      <div className="grid grid-cols-dash-footer gap-4">

        <SCard title="Agreement Summary">
          {(['Active','Renewal','Expired'] as const).map((st,i) => {
            const r = data.documents.byStatus.find((x: any)=>x.status===st)||{ count:0 };
            const pct = data.documents.total>0 ? Math.round((r.count/data.documents.total)*100) : 0;
            const cls = st==='Active' ? 'bg-emerald' : st==='Renewal' ? 'bg-amber' : 'bg-rose';
            const wCls = pct > 75 ? 'w-100' : pct > 50 ? 'w-75' : pct > 25 ? 'w-50' : 'w-25';
            return (
              <div key={i} className={`flex-start gap-2 py-2 ${i<2?'border-b border-slate-100':''}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 ${cls}`} />
                <span className="text-xs text-text-3 flex-1">{st}</span>
                <span className="text-xs font-700 text-text min-w-7 text-right">{fmt(r.count)}</span>
                <div className="w-13 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cls} ${wCls}`} />
                </div>
              </div>
            );
          })}
          <div className="flex-between items-center pt-2 mt-1">
            <div className="flex-start gap-1">
              <TrendingUp size={13} className="text-blue"/>
              <span className="text-xxs-bold text-blue uppercase">TOTAL</span>
            </div>
            <span className="text-xxs-bold text-blue">{fmt(data.documents.total)} docs</span>
          </div>
        </SCard>

        <SCard title="Vehicle Summary">
          <div className="grid grid-cols-dash-veh gap-2.5">
            {data.vehicles.byType.map((v: any,i: number) => {
              const cls = v.name==='Minibus'?'bg-amber-light border-amber-200 text-amber':v.name==='Motor'?'bg-purple-light border-purple-200 text-purple':v.name==='Blind Van'?'bg-blue-light border-blue-200 text-blue':'bg-slate-light border-slate-200 text-slate';
              const pct   = data.vehicles.total>0 ? Math.round((v.value/data.vehicles.total)*100) : 0;
              return (
                <div key={i} 
                  className={`rounded-xl p-3.5 text-center transition-all cursor-default border ${cls}`}
                >
                  <p className="text-3xl font-900 leading-none">{v.value}</p>
                  <p className="text-xxs-bold mt-1.5 uppercase opacity-70">{v.name}</p>
                  <p className="text-xxxs mt-0.5 opacity-50">{pct}% of total</p>
                </div>
              );
            })}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center cursor-default">
              <p className="text-3xl font-900 text-blue leading-none">
                <AnimNum value={data.vehicles.total}/>
              </p>
              <p className="text-xxs-bold text-text-3 mt-1.5 uppercase">TOTAL</p>
              <p className="text-xxxs text-text-3/60 mt-0.5">All types</p>
            </div>
          </div>
        </SCard>
      </div>

      {/* ═══════════════════════ LEGAL & COMPLIANCE ALERTS ═ */}
      {compNotifs.length > 0 && (
        <>
          <SecTitle>Legal &amp; Compliance — Perhatian Segera</SecTitle>
          <div className="bg-surface border border-rose-200 rounded-2xl overflow-hidden shadow-premium mb-4">
            <div className="px-4 py-3 border-b border-rose-100 bg-rose-50/60 flex-between">
              <div className="flex-start gap-2">
                <Scale size={14} className="text-rose"/>
                <span className="text-xxs-bold text-rose uppercase letter-wide">
                  Dokumen Mendekati / Melewati Kadaluarsa
                </span>
              </div>
              <span className="text-xxs font-800 bg-rose text-white px-2 py-0.5 rounded-full">
                {compNotifs.length} dokumen
              </span>
            </div>
            <div className="divide-y divide-border-subtle">
              {compNotifs.slice(0, 8).map((d: any) => {
                const isExpired  = d.status === 'Expired';
                const isCritical = d.status === 'Critical';
                const dayNum     = parseInt(d.days_until_expiry);
                const dayLabel   = dayNum < 0
                  ? `Expired ${Math.abs(dayNum)} hari lalu`
                  : dayNum === 0 ? 'Hari ini!'
                  : `${dayNum} hari lagi`;
                const moduleIcon: Record<string, React.ReactNode> = {
                  contract:           <FileSignature size={11}/>,
                  corporate:          <Scale size={11}/>,
                  litigation:         <Gavel size={11}/>,
                  license:            <BadgeCheck size={11}/>,
                  monitoring:         <Scale size={11}/>,
                  sop:                <BookOpen size={11}/>,
                  hr_compliance:      <UserCheck size={11}/>,
                  tax_finance:        <Landmark size={11}/>,
                  product_regulatory: <FlaskConical size={11}/>,
                };
                const moduleLabel: Record<string, string> = {
                  contract: 'Contract', corporate: 'Corporate Legal', litigation: 'Litigation',
                  license: 'License & Permit', monitoring: 'Compliance',
                  sop: 'SOP & Policy', hr_compliance: 'HR & Employment',
                  tax_finance: 'Tax & Finance', product_regulatory: 'Product Regulatory',
                };
                return (
                  <div key={d.id} className={`flex-between px-4 py-2.5 ${isExpired || isCritical ? 'bg-rose-50/30' : ''}`}>
                    <div className="flex-start gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${isExpired || isCritical ? 'bg-rose' : 'bg-amber'}`}/>
                      <div className="min-w-0">
                        <p className="text-xs font-700 text-text truncate">{d.doc_name}</p>
                        <p className="text-xxs text-text-3 flex-start gap-1">
                          <span className="flex-start gap-0.5">{moduleIcon[d.module]}{moduleLabel[d.module] || d.module}</span>
                          <span>·</span>
                          <span>{d.category}</span>
                          <span>·</span>
                          <span>PIC: {d.pic}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className={`text-xs font-800 ${isExpired || isCritical ? 'text-rose' : 'text-amber'}`}>{dayLabel}</p>
                      <p className="text-xxs text-text-3">
                        {new Date(d.expiry_date).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            {compNotifs.length > 8 && (
              <div className="px-4 py-2 border-t border-rose-100 bg-rose-50/40 text-center">
                <span className="text-xxs text-rose font-700">+{compNotifs.length - 8} dokumen lainnya — lihat di menu Legal &amp; Compliance</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
