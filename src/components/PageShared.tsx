'use client';

import { ChevronLeft, ChevronRight, X, AlertCircle } from 'lucide-react';

/**
 * PAGE SHARED COMPONENTS
 * Refactored to use globals.css classes to avoid inline styles and lint errors.
 */

// ── Input style (used via spread in form pages) ───────────────
export const iStyle: React.CSSProperties = {}; // Now handled via .input-premium class in globals.css

// ── Colored badge ─────────────────────────────────────────────
export function Badge({ label, colorClass = 'badge-slate' }: { label: string; colorClass?: string }) {
  return (
    <span className={`badge ${colorClass}`}>
      {label || '—'}
    </span>
  );
}

// ── Modal container ───────────────────────────────────────────
export function ModalShell({ onClose, title, children, size = 'md' }: {
  onClose: () => void; title: string; children: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-container modal-${size}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button 
            type="button"
            onClick={onClose} 
            className="btn-icon" 
            title="Tutup"
            aria-label="Tutup modal"
          >
            <X size={15} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// ── Form field with label ─────────────────────────────────────
export function FF({ label, required, children, id }: { label: string; required?: boolean; children: React.ReactNode; id?: string }) {
  return (
    <div className="mb-4">
      <label className="form-label" htmlFor={id}>
        {label}{required && <span className="text-rose ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

// ── Section label inside form/modal ──────────────────────────
export function SLabel({ children }: { children: string }) {
  return (
    <p className="text-xs-bold mb-2.5">
      {children}
    </p>
  );
}

// ── Pagination ────────────────────────────────────────────────
export function Pagination({ page, totalPages, onChange }: {
  page: number; totalPages: number; onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className="flex gap-2 flex-wrap items-center">
      <button 
        type="button" 
        title="Halaman sebelumnya" 
        aria-label="Halaman sebelumnya"
        className="pagination-btn"
        onClick={() => onChange(page - 1)} 
        disabled={page === 1}
      >
        <ChevronLeft size={15} />
      </button>

      {pages.map((p, i) =>
        p === '...'
          ? <span key={`ellipsis-${i}`} className="text-sm-muted px-1">…</span>
          : (
            <button 
              type="button" 
              key={`page-${p}`} 
              className={`pagination-btn ${p === page ? 'active' : ''}`}
              onClick={() => onChange(p as number)}
            >
              {p}
            </button>
          )
      )}

      <button 
        type="button" 
        title="Halaman berikutnya" 
        aria-label="Halaman berikutnya"
        className="pagination-btn"
        onClick={() => onChange(page + 1)} 
        disabled={page === totalPages}
      >
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

// ── Error alert ───────────────────────────────────────────────
export function FormError({ msg }: { msg: string }) {
  if (!msg) return null;
  return (
    <div className="form-error">
      <AlertCircle size={15} className="text-rose" />
      <span className="text-sm-bold text-rose">{msg}</span>
    </div>
  );
}

// ── Pagination bar with info text ─────────────────────────────
export function PaginationBar({ page, limit, total, totalPages, onChange }: { page: number; limit: number; total: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div className="pagination-bar">
      <p className="text-sm text-text-3">
        Menampilkan <b className="text-text">{(page - 1) * limit + 1}–{Math.min(page * limit, total)}</b> dari <b className="text-text">{new Intl.NumberFormat('id-ID').format(total)}</b>
      </p>
      <Pagination page={page} totalPages={totalPages} onChange={onChange} />
    </div>
  );
}

// ── Table shell ───────────────────────────────────────────────
export function TableShell({ headers, children, loading, colSpan }: {
  headers: { label: string; right?: boolean }[];
  children: React.ReactNode;
  loading?: boolean;
  colSpan: number;
}) {
  return (
    <div className="table-shell">
      <table>
        <thead>
          <tr className="bg-surface-2">
            {headers.map((h, i) => (
              <th 
                key={i} 
                className={`text-xs-bold p-table border-b border-border whitespace-nowrap ${h.right ? 'text-right' : 'text-left'}`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="py-14 text-center">
                <div className="w-6 h-6 border-3 border-border border-t-blue rounded-full animate-spin mx-auto" />
              </td>
            </tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

// ── Detail info row ───────────────────────────────────────────
export function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="info-row">
      <span className="text-sm-muted shrink-0">{label}</span>
      <span className="text-sm-bold text-right">{value || '—'}</span>
    </div>
  );
}

// ── Detail section box ────────────────────────────────────────
export function SBox({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="section-box">
      <div className="section-box-header">
        {icon && <span className="text-blue">{icon}</span>}
        <span className="text-xs-bold">{title}</span>
      </div>
      <div className="section-box-body">{children}</div>
    </div>
  );
}
