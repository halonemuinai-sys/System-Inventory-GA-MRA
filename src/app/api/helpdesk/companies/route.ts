import { NextResponse } from 'next/server';
import { queryHelpdesk } from '@/lib/helpdeskDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [companiesRes, masterRes] = await Promise.all([
      queryHelpdesk('SELECT id, name FROM helpdesk."Company" ORDER BY name ASC'),
      queryHelpdesk('SELECT id, name FROM helpdesk."CompanyMaster" ORDER BY name ASC')
    ]);

    const formattedList = [
      ...companiesRes.rows.map((c: any) => ({
        id: `company_${c.id}`,
        name: c.name,
        rawId: c.id,
        isMaster: false
      })),
      ...masterRes.rows.map((cm: any) => ({
        id: `master_${cm.id}`,
        name: `${cm.name} (Induk)`,
        rawId: cm.id,
        isMaster: true
      }))
    ].sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json(formattedList);
  } catch (err: any) {
    console.error('Failed to fetch helpdesk companies:', err);
    return NextResponse.json({ error: 'Failed to fetch helpdesk companies' }, { status: 500 });
  }
}
