'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { query } from '@/lib/db';
import { toRole, ROLE_HOME, UserRole } from '@/lib/role';

export async function login(formData: FormData) {
  const email    = (formData.get('email')    as string).trim().toLowerCase();
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: error.message };

  // Fetch role + name from m_user
  let role: UserRole = 'ga';
  let fullName = '';
  try {
    const res = await query(
      `SELECT role, full_name FROM m_user WHERE LOWER(email) = $1 AND is_active = TRUE LIMIT 1`,
      [email],
    );
    role     = toRole(res.rows[0]?.role);
    fullName = res.rows[0]?.full_name ?? '';
  } catch {
    // m_user not found → default ga, proceed
  }

  // Persist role + name in cookies (7 days)
  // user_role is NOT httpOnly so the client-side Shell can read it for sidebar filtering
  // Security: role is not sensitive — actual auth guard is Supabase session + middleware
  const jar = await cookies();
  jar.set('user_role',      role,     { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });
  jar.set('user_full_name', fullName, { httpOnly: false, sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' });

  redirect(ROLE_HOME[role]);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const jar = await cookies();
  jar.delete('user_role');
  jar.delete('user_full_name');

  redirect('/login');
}
