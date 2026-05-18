import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

// Only admin can access this endpoint
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const res = await query(
    `SELECT role FROM m_user WHERE LOWER(email) = $1 AND is_active = TRUE LIMIT 1`,
    [user.email?.toLowerCase() ?? ''],
  );
  return res.rows[0]?.role === 'admin' ? user : null;
}

// GET /api/users — list all users
export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const res = await query(
      `SELECT id, full_name, email, phone, department, position, role, is_active, created_at
       FROM m_user ORDER BY created_at DESC`,
      [],
    );
    return NextResponse.json({ data: res.rows });
  } catch {
    return NextResponse.json({ error: 'Gagal memuat data user' }, { status: 500 });
  }
}

// POST /api/users — create new user row (Supabase Auth must be created separately)
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const body = await req.json();
    const { full_name, email, phone, department, position, role } = body;

    if (!full_name?.trim()) return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 });
    if (!email?.trim())     return NextResponse.json({ error: 'Email wajib diisi' }, { status: 400 });
    if (!role)              return NextResponse.json({ error: 'Role wajib dipilih' }, { status: 400 });

    const res = await query(
      `INSERT INTO m_user (full_name, email, phone, department, position, role, is_active)
       VALUES ($1, LOWER($2), $3, $4, $5, $6, TRUE)
       RETURNING id, full_name, email, role, is_active, created_at`,
      [full_name.trim(), email.trim(), phone || null, department || null, position || null, role],
    );
    return NextResponse.json({ data: res.rows[0] }, { status: 201 });
  } catch (e: any) {
    if (e.code === '23505') return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 });
  }
}
