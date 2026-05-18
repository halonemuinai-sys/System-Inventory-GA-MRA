'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, Plus, Edit2, Shield, ShieldOff, Save, X,
  Loader2, AlertCircle, UserCheck, RefreshCw,
} from 'lucide-react';
import { ModalShell, FF, FormError } from '@/components/PageShared';

// ── Types ─────────────────────────────────────────────────────
type UserRole = 'admin' | 'ga' | 'legal' | 'compliance';

interface AppUser {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  department: string | null;
  position: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

// ── Constants ─────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; color: string }[] = [
  { value: 'admin',      label: 'Admin',      color: 'badge-rose'    },
  { value: 'ga',         label: 'GA',         color: 'badge-indigo'  },
  { value: 'legal',      label: 'Legal',      color: 'badge-violet'  },
  { value: 'compliance', label: 'Compliance', color: 'badge-emerald' },
];

const ROLE_COLOR: Record<string, string> = {
  admin: 'badge-rose', ga: 'badge-indigo', legal: 'badge-violet', compliance: 'badge-emerald',
};

const EMPTY_FORM = {
  full_name: '', email: '', phone: '', department: '', position: '', role: 'ga' as UserRole,
};

function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`badge ${ROLE_COLOR[role] ?? 'badge-slate'} uppercase text-[10px] font-800 tracking-wide`}>
      {role}
    </span>
  );
}

function getInitials(name: string) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Main Page ─────────────────────────────────────────────────
export default function UserSettingsPage() {
  const [users, setUsers]     = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [showAdd, setShowAdd]   = useState(false);
  const [editUser, setEditUser] = useState<AppUser | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [formErr, setFormErr]   = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/users');
      const j   = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal memuat');
      setUsers(j.data);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const sf = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => {
    setEditUser(null);
    setForm(EMPTY_FORM);
    setFormErr('');
    setShowAdd(true);
  };

  const openEdit = (u: AppUser) => {
    setEditUser(u);
    setForm({
      full_name:  u.full_name,
      email:      u.email,
      phone:      u.phone ?? '',
      department: u.department ?? '',
      position:   u.position ?? '',
      role:       u.role,
    });
    setFormErr('');
    setShowAdd(true);
  };

  const closeForm = () => { setShowAdd(false); setEditUser(null); setFormErr(''); };

  const save = async () => {
    if (!form.full_name.trim()) { setFormErr('Nama lengkap wajib diisi'); return; }
    if (!editUser && !form.email.trim()) { setFormErr('Email wajib diisi'); return; }
    setSaving(true);
    try {
      const url    = editUser ? `/api/users/${editUser.id}` : '/api/users';
      const method = editUser ? 'PUT' : 'POST';
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, is_active: editUser?.is_active ?? true }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Gagal menyimpan');
      closeForm();
      load();
    } catch (e: any) { setFormErr(e.message); }
    finally { setSaving(false); }
  };

  const toggleActive = async (u: AppUser) => {
    const label = u.is_active ? 'nonaktifkan' : 'aktifkan';
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} user "${u.full_name}"?`)) return;
    try {
      await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: u.full_name, phone: u.phone, department: u.department,
          position: u.position, role: u.role, is_active: !u.is_active,
        }),
      });
      load();
    } catch { alert('Gagal mengubah status user'); }
  };

  return (
    <div className="container animate-fade-in pb-12">

      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="header-title flex items-center gap-2">
            <Users size={20} className="text-blue" /> Manajemen User
          </h1>
          <p className="header-subtitle">Kelola akun dan role akses untuk tiap departemen</p>
        </div>
        <div className="flex gap-2">
          <button className="btn" onClick={load} title="Refresh">
            <RefreshCw size={15} /> Refresh
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Tambah User
          </button>
        </div>
      </div>

      {/* ROLE LEGEND */}
      <div className="flex flex-wrap gap-3 mb-6">
        {ROLES.map(r => (
          <div key={r.value} className="flex items-center gap-2 px-3 py-1.5 bg-surface border border-border rounded-xl text-xs">
            <span className={`badge ${r.color}`}>{r.label}</span>
            <span className="text-text-3">
              {r.value === 'admin'      ? 'Akses penuh semua menu' :
               r.value === 'ga'        ? 'Aset, kendaraan, vendor, dokumen' :
               r.value === 'legal'     ? 'Legal dashboard & modul' :
                                         'Compliance dashboard & modul'}
            </span>
          </div>
        ))}
      </div>

      {/* TABLE */}
      {loading ? (
        <div className="flex-center py-20"><Loader2 size={28} className="animate-spin text-blue" /></div>
      ) : error ? (
        <div className="error-alert-container">
          <AlertCircle size={32} className="text-rose mb-2" />
          <p className="text-rose-bold">{error}</p>
          <button className="btn btn-primary mt-3" onClick={load}><RefreshCw size={13}/> Coba Lagi</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-surface-2 border-b border-border">
                {['User', 'Email', 'Departemen', 'Jabatan', 'Role', 'Status', 'Aksi'].map((h, i) => (
                  <th key={h} className={`px-4 py-3 text-[10px] font-800 text-text-3 uppercase tracking-wide whitespace-nowrap ${i >= 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm-muted">
                    <Users size={28} className="mx-auto mb-2 opacity-30" />
                    Belum ada user. Klik "Tambah User" untuk menambahkan.
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className={`hover:bg-surface-2 transition-colors ${!u.is_active ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue flex items-center justify-center text-white text-[11px] font-800 shrink-0">
                        {getInitials(u.full_name)}
                      </div>
                      <span className="font-700 text-text">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-2 font-mono text-[11px]">{u.email}</td>
                  <td className="px-4 py-3 text-text-2">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-text-2">{u.position || '—'}</td>
                  <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-4 py-3 text-right">
                    <span className={`badge ${u.is_active ? 'badge-emerald' : 'badge-slate'}`}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-1.5">
                      <button className="btn-icon hover:bg-blue-light hover:text-blue border-transparent"
                        onClick={() => openEdit(u)} title="Edit User">
                        <Edit2 size={13} />
                      </button>
                      <button
                        className={`btn-icon border-transparent ${u.is_active ? 'hover:bg-rose-light hover:text-rose' : 'hover:bg-emerald-light hover:text-emerald'}`}
                        onClick={() => toggleActive(u)}
                        title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                        {u.is_active ? <ShieldOff size={13} /> : <UserCheck size={13} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showAdd && (
        <ModalShell
          title={editUser ? `Edit User — ${editUser.full_name}` : 'Tambah User Baru'}
          onClose={closeForm}
          size="md"
          closeOnClickOutside={false}
          footer={
            <div className="flex-end gap-3">
              <button className="btn" onClick={closeForm} disabled={saving}>Batal</button>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ minWidth: 120 }}>
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {editUser ? 'Simpan Perubahan' : 'Buat User'}
              </button>
            </div>
          }
        >
          <div className="flex flex-col gap-5">
            <FormError msg={formErr} />

            {!editUser && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 flex gap-2">
                <Shield size={14} className="shrink-0 mt-0.5" />
                <span>Buat akun login di <strong>Supabase Auth Dashboard</strong> terlebih dahulu dengan email yang sama, lalu tambahkan di sini untuk mengatur role.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              <FF label="Nama Lengkap" id="u_name" required>
                <input id="u_name" type="text" value={form.full_name}
                  onChange={e => sf('full_name', e.target.value)}
                  placeholder="Nama lengkap" className="input-premium" />
              </FF>
              <FF label="Email" id="u_email" required>
                <input id="u_email" type="email" value={form.email}
                  onChange={e => sf('email', e.target.value)}
                  placeholder="email@mra.co.id" className="input-premium"
                  disabled={!!editUser} />
              </FF>
              <FF label="No. Telepon" id="u_phone">
                <input id="u_phone" type="text" value={form.phone}
                  onChange={e => sf('phone', e.target.value)}
                  placeholder="08xx-xxxx-xxxx" className="input-premium" />
              </FF>
              <FF label="Role Akses" id="u_role" required>
                <select id="u_role" value={form.role}
                  onChange={e => sf('role', e.target.value)}
                  className="input-premium">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </FF>
              <FF label="Departemen" id="u_dept">
                <input id="u_dept" type="text" value={form.department}
                  onChange={e => sf('department', e.target.value)}
                  placeholder="Contoh: Legal" className="input-premium" />
              </FF>
              <FF label="Jabatan / Posisi" id="u_pos">
                <input id="u_pos" type="text" value={form.position}
                  onChange={e => sf('position', e.target.value)}
                  placeholder="Contoh: Staff Legal" className="input-premium" />
              </FF>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
