'use client';

import React, { useEffect, useState } from 'react';
import { Search, BarChart3, TrendingDown, TrendingUp, AlertCircle, PieChart, Loader2 } from 'lucide-react';
import { TableShell, Badge } from '@/components/PageShared';

export default function ExpensesPage() {
  const [data, setData] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/expenses');
      if (!res.ok) throw new Error('Failed to fetch expense data');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const formatNumber = (val: number) => {
    if (isNaN(val)) return '0';
    return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);
  };

  const filtered = data.filter(i => 
    i.coa_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBudget = filtered.reduce((sum, item) => sum + parseFloat(item.total_budget || 0), 0);
  const totalActual = filtered.reduce((sum, item) => sum + parseFloat(item.total_actual || 0), 0);
  const totalVariance = totalBudget - totalActual;

  if (loading) {
    return (
      <div className="container flex-center h-80vh">
        <Loader2 size={40} className="animate-spin text-blue" />
      </div>
    );
  }

  return (
    <div className="container animate-fade-in pb-12">
      <header className="page-header">
        <div>
          <h1 className="header-title">Expense Analysis</h1>
          <p className="header-subtitle">Analyze budget vs actual spending across all Chart of Accounts (COA).</p>
        </div>
      </header>

      <div className="filter-bar">
        <div className="search-box">
          <Search size={15} className="search-icon" />
          <input 
            type="text" 
            placeholder="Search COA..." 
            className="input-premium w-full pl-9"
            title="Search COA"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="stats-grid mb-6">
        <div className="card">
          <div className="flex-start gap-3 mb-2">
            <BarChart3 size={18} className="text-blue" />
            <span className="text-xs-bold text-text-3">Total YTD Budget</span>
          </div>
          <p className="text-2xl font-800 text-text">Rp {formatNumber(totalBudget)}</p>
        </div>
        <div className="card">
          <div className="flex-start gap-3 mb-2">
            <PieChart size={18} className="text-indigo" />
            <span className="text-xs-bold text-text-3">Total YTD Actual</span>
          </div>
          <p className="text-2xl font-800 text-text">Rp {formatNumber(totalActual)}</p>
        </div>
        <div className="card">
          <div className="flex-start gap-3 mb-2">
            {totalVariance >= 0 ? <TrendingDown size={18} className="text-emerald" /> : <TrendingUp size={18} className="text-rose" />}
            <span className="text-xs-bold text-text-3">Total Savings</span>
          </div>
          <p className={`text-2xl font-800 ${totalVariance >= 0 ? 'text-emerald' : 'text-rose'}`}>
            Rp {formatNumber(totalVariance)}
          </p>
        </div>
      </div>

      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-4" onClick={fetchData} title="Try Fetching Again">Retry</button>
        </div>
      ) : (
        <TableShell headers={[{label:'Chart of Account (COA)'}, {label:'YTD Budget', right:true}, {label:'YTD Actual', right:true}, {label:'Variance', right:true}, {label:'Status', right:true}]} loading={loading} colSpan={5}>
          {filtered.length > 0 ? filtered.map((item, idx) => {
            const variance = parseFloat(item.total_budget || 0) - parseFloat(item.total_actual || 0);
            const isOverBudget = variance < 0;
            const pctUsed = (parseFloat(item.total_actual || 0) / parseFloat(item.total_budget || 1)) * 100;

            return (
              <tr key={idx} className="hover-row">
                <td className="td-p font-600 text-text">{item.coa_name}</td>
                <td className="td-p text-right text-text-2">{formatNumber(parseFloat(item.total_budget || 0))}</td>
                <td className="td-p text-right font-600 text-text">{formatNumber(parseFloat(item.total_actual || 0))}</td>
                <td className={`td-p text-right font-700 ${isOverBudget ? 'text-rose' : 'text-emerald'}`}>
                  {formatNumber(variance)}
                </td>
                <td className="td-p">
                  <div className="flex-end gap-2">
                    <div className="h-1.5 bg-surface-2 rounded-sm w-20 overflow-hidden border">
                      <div 
                        className={`h-full rounded-sm ${pctUsed > 100 ? 'bg-rose w-full' : pctUsed > 75 ? 'bg-amber w-75' : pctUsed > 50 ? 'bg-blue w-50' : pctUsed > 25 ? 'bg-blue w-25' : 'bg-slate-400 w-10'}`}
                      ></div>
                    </div>
                    <span className="text-xs-bold text-text-2 min-w-35">
                      {pctUsed.toFixed(0)}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          }) : (
            <tr>
              <td colSpan={5} className="py-14 text-center text-text-3">
                No expense records found matching your search.
              </td>
            </tr>
          )}
        </TableShell>
      )}
    </div>
  );
}
