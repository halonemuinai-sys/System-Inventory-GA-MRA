import { NextResponse } from 'next/server';
import { queryHelpdesk } from '@/lib/helpdeskDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const res = await queryHelpdesk(`
      SELECT id, name, email, department
      FROM helpdesk."User"
      ORDER BY name ASC
    `);
    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error('Failed to fetch helpdesk users:', err);
    return NextResponse.json({ error: 'Failed to fetch helpdesk users' }, { status: 500 });
  }
}
