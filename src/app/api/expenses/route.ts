import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const expenses = await query(`
      SELECT
        mc.name as coa_name,
        COALESCE(SUM(eb.budget_amount), 0) as total_budget,
        COALESCE(SUM(eb.actual_amount), 0) as total_actual
      FROM m_coa mc
      LEFT JOIN expense_budget eb ON eb.coa_id = mc.id
      GROUP BY mc.id, mc.name
      ORDER BY total_budget DESC
    `);

    return NextResponse.json(expenses.rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch expense data' }, { status: 500 });
  }
}
