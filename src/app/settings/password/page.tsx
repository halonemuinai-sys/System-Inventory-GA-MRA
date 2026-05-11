'use client';

import { useState } from 'react';
import { updatePassword } from './actions';
import {
  Lock, ShieldCheck, Loader2, CheckCircle2,
  AlertCircle, Eye, EyeOff, KeyRound, ChevronRight, Info,
} from 'lucide-react';

const RULES = [
  { text: 'Minimal 8 karakter',   check: (p: string) => p.length >= 8 },
  { text: 'Huruf besar & kecil',   check: (p: string) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { text: 'Angka & karakter unik', check: (p: string) => /[0-9]/.test(p) && /[^A-Za-z0-9]/.test(p) },
];

function PasswordInput({ name, label, show, onToggle, onChange }: {
  name: string; label: string; show: boolean;
  onToggle: () => void; onChange?: (v: string) => void;
}) {
  return (
    <div className="sp-field">
      <label className="sp-label">{label}</label>
      <div className="sp-input-wrap">
        <Lock size={16} className="sp-input-icon" />
        <input
          type={show ? 'text' : 'password'}
          name={name}
          required
          placeholder="••••••••••"
          onChange={e => onChange?.(e.target.value)}
          className="sp-input"
        />
        <button type="button" className="sp-eye-btn" onClick={onToggle}>
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCnf, setShowCnf] = useState(false);
  const [newPwd,  setNewPwd]  = useState('');
  const [status,  setStatus]  = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const rules = RULES.map(r => ({ ...r, ok: newPwd ? r.check(newPwd) : false }));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true); setStatus(null);
    const result = await updatePassword(new FormData(e.currentTarget));
    if (result?.error) {
      setStatus({ type: 'error', msg: result.error });
    } else {
      setStatus({ type: 'success', msg: 'Password berhasil diperbarui!' });
      (e.target as HTMLFormElement).reset();
      setNewPwd('');
    }
    setLoading(false);
  }

  return (
    <div className="container sp-page">

      {/* Breadcrumb */}
      <div className="sp-breadcrumb">
        <span>Settings</span>
        <ChevronRight size={13} />
        <span className="sp-breadcrumb-active">Security</span>
      </div>

      <h1 className="sp-title">Keamanan Akun</h1>
      <p className="sp-subtitle">Kelola kredensial dan lindungi akses ke sistem MRA Inventory.</p>

      <div className="sp-grid">

        {/* ══ LEFT ══ */}
        <div className="sp-left">

          {/* Hero */}
          <div className="sp-hero">
            <ShieldCheck size={160} strokeWidth={1} className="sp-hero-watermark" />
            <div className="sp-hero-icon">
              <ShieldCheck size={26} color="#fff" />
            </div>
            <h2 className="sp-hero-title">Proteksi Akun</h2>
            <p className="sp-hero-text">
              Ganti password secara berkala untuk menjaga akun Anda tetap aman dari akses tidak sah.
            </p>
          </div>

          {/* Rules */}
          <div className="sp-rules-card">
            <div className="sp-rules-header">
              <div className="sp-rules-icon">
                <ShieldCheck size={15} color="#4f46e5" />
              </div>
              <span className="sp-rules-title">Standar Keamanan</span>
            </div>
            <div className="sp-rules-list">
              {rules.map((r, i) => (
                <div key={i} className="sp-rule-item">
                  <CheckCircle2 size={18} color={r.ok ? '#4f46e5' : 'var(--border-2)'} className="sp-rule-check" />
                  <span className={`sp-rule-text${r.ok ? ' ok' : ''}`}>{r.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT — Form ══ */}
        <div className="sp-form-card">

          {/* Header */}
          <div className="sp-form-header">
            <div className="sp-form-header-left">
              <div className="sp-form-icon">
                <KeyRound size={20} color="#4f46e5" />
              </div>
              <div>
                <p className="sp-form-title">Ganti Password</p>
                <p className="sp-form-sub">Update kredensial login Anda.</p>
              </div>
            </div>
            <span className="sp-session-badge">
              <span className="sp-session-dot" />
              Sesi Aktif
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="sp-form-body">

            {status && (
              <div className={`sp-alert ${status.type === 'success' ? 'sp-alert-success' : 'sp-alert-error'}`}>
                {status.type === 'success'
                  ? <CheckCircle2 size={16} color="var(--emerald)" />
                  : <AlertCircle  size={16} color="var(--rose)" />}
                <span className={status.type === 'success' ? 'sp-alert-text-success' : 'sp-alert-text-error'}>
                  {status.msg}
                </span>
              </div>
            )}

            <PasswordInput name="newPassword"     label="Password Baru"       show={showNew} onToggle={() => setShowNew(s => !s)} onChange={setNewPwd} />
            <PasswordInput name="confirmPassword" label="Konfirmasi Password" show={showCnf} onToggle={() => setShowCnf(s => !s)} />

            <div className="sp-alert sp-alert-info">
              <Info size={15} color="#4f46e5" className="sp-info-icon" />
              <p className="sp-alert-text-info">
                Password yang kuat melindungi data inventaris dari akses yang tidak sah.
              </p>
            </div>

            <button type="submit" disabled={loading} className="sp-submit">
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Menyimpan…</>
                : <><KeyRound size={16} /> Simpan Perubahan</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
