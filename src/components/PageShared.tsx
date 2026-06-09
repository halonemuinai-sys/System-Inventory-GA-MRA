'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, AlertCircle, ChevronDown, Search } from 'lucide-react';

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
export function ModalShell({ 
  onClose, title, children, footer, size = 'md', overlayClassName = '', containerClassName = '',
  closeOnClickOutside = true 
}: {
  onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; size?: 'sm' | 'md' | 'lg' | 'xl';
  overlayClassName?: string;
  containerClassName?: string;
  closeOnClickOutside?: boolean;
}) {
  return (
    <div className={`modal-overlay ${overlayClassName}`} onClick={e => { if (closeOnClickOutside && e.target === e.currentTarget) onClose(); }}>
      <div className={`modal-container modal-${size} ${containerClassName}`}>
        {title && (
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
        )}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1 }}>{children}</div>
        {footer && <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>{footer}</div>}
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
  headers: { label: React.ReactNode; right?: boolean; width?: string | number; isCheckbox?: boolean }[];
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
                className={`text-xs-bold border-b border-border whitespace-nowrap ${
                  h.isCheckbox ? 'th-checkbox align-middle' : 'p-table ' + (h.right ? 'text-right pr-6' : 'text-left')
                }`}
                style={h.width ? { width: h.width } : {}}
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

// ── Slide-over drawer container ────────────────────────────────
export function SlideOverShell({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnClickOutside?: boolean;
}) {
  if (!isOpen) return null;

  return (
    <div 
      className="drawer-overlay" 
      onClick={e => { if (closeOnClickOutside && e.target === e.currentTarget) onClose(); }}
    >
      <div className={`drawer-container drawer-${size}`}>
        {title && (
          <div className="drawer-header">
            <span className="drawer-title">{title}</span>
            <button 
              type="button"
              onClick={onClose} 
              className="btn-icon" 
              title="Tutup"
              aria-label="Tutup panel"
            >
              <X size={15} />
            </button>
          </div>
        )}
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Skeleton components for shimmer loading ─────────────────────
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`card animate-pulse-shimmer flex flex-col gap-3 p-5 ${className}`}>
      <div className="h-3 w-2/5 bg-border rounded-md" />
      <div className="h-8 w-3/5 bg-border rounded-md" />
      <div className="h-4 w-4/5 bg-border rounded-md mt-2" />
    </div>
  );
}

export function SkeletonTable({ colSpan, rowCount = 5 }: { colSpan: number; rowCount?: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, rIdx) => (
        <tr key={rIdx} className="border-b border-border-subtle animate-pulse-shimmer">
          {Array.from({ length: colSpan }).map((_, cIdx) => (
            <td key={cIdx} className="p-table py-4">
              <div 
                className="h-3.5 bg-border rounded-md" 
                style={{ width: cIdx === 0 ? '60%' : cIdx === colSpan - 1 ? '40%' : '80%' }} 
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  id,
  disabled = false,
  className = '',
}: {
  value: string | number;
  onChange: (val: string) => void;
  options: { id: string | number; name: string }[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the selected option to display its name when not active/editing search
  const selectedOption = useMemo(() => {
    return options.find(o => String(o.id) === String(value));
  }, [options, value]);

  // When dropdown opens or value changes, reset search
  useEffect(() => {
    if (!isOpen) {
      setSearch('');
    }
  }, [isOpen]);

  // Click outside detection to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return options;
    const s = search.toLowerCase();
    return options.filter(o => o.name?.toLowerCase().includes(s));
  }, [options, search]);

  return (
    <div ref={containerRef} className={`relative w-full ${className}`} style={{ position: 'relative' }}>
      <div className="relative flex items-center">
        <input
          id={id}
          type="text"
          disabled={disabled}
          className="input-premium pr-8 w-full cursor-pointer text-left"
          style={{ paddingRight: '2rem' }}
          placeholder={selectedOption ? selectedOption.name : placeholder}
          value={isOpen ? search : (selectedOption ? selectedOption.name : '')}
          onChange={e => {
            if (!isOpen) setIsOpen(true);
            setSearch(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <div 
          className="absolute right-2.5 flex items-center gap-1 pointer-events-none text-text-3"
          style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}
        >
          {isOpen && search && (
            <button
              type="button"
              className="p-0.5 hover:text-text cursor-pointer pointer-events-auto"
              onClick={(e) => {
                e.stopPropagation();
                setSearch('');
              }}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div 
          className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden"
          style={{ 
            position: 'absolute', 
            zIndex: 50, 
            width: '100%', 
            marginTop: '0.25rem', 
            backgroundColor: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: '0.5rem', 
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
            maxHeight: '220px', 
            overflowY: 'auto'
          }}
        >
          <div className="py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-text-3 text-center">Tidak ada hasil</div>
            ) : (
              <>
                <div
                  className={`px-3 py-2 text-sm text-text-3 hover:bg-surface-2 cursor-pointer ${!value ? 'bg-surface-2 font-semibold text-blue' : ''}`}
                  style={{ cursor: 'pointer', padding: '0.5rem 0.75rem' }}
                  onClick={() => {
                    onChange('');
                    setIsOpen(false);
                  }}
                  onMouseEnter={(e) => {
                    if (value) {
                      e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  — Pilih Vendor —
                </div>
                {filteredOptions.map(opt => {
                  const isSelected = String(opt.id) === String(value);
                  return (
                    <div
                      key={opt.id}
                      className={`px-3 py-1.5 text-sm cursor-pointer ${
                        isSelected ? 'font-semibold text-blue' : 'text-text'
                      }`}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '0.375rem 0.75rem',
                        backgroundColor: isSelected ? 'var(--blue-light)' : undefined,
                        color: isSelected ? 'var(--blue)' : 'var(--text)'
                      }}
                      onClick={() => {
                        onChange(String(opt.id));
                        setIsOpen(false);
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = 'var(--surface-2)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = '';
                        }
                      }}
                    >
                      {opt.name}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

