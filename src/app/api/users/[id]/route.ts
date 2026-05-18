import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

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

// PUT /api/users/[id] — update user
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireAdmin();
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { full_name, phone, department, position, role, is_active } = body;

    const res = await query(
      `UPDATE m_user
       SET full_name = $1, phone = $2, department = $3, position = $4, role = $5, is_active = $6
       WHERE id = $7
       RETURNING id, full_name, email, role, is_active`,
      [full_name, phone || null, department || null, position || null, role, is_active ?? true, id],
    );
    if (res.rows.length === 0) return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    return NextResponse.json({ data: res.rows[0] });
  } catch {
    return NextResponse.json({ error: 'Gagal memperbarui user' }, { status: 500 });
  }
}
