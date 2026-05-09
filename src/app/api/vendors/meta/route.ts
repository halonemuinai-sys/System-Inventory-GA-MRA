import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [categories, expenseCategories, divisions, companies, banks] = await Promise.all([
      query(`SELECT id, name FROM m_vendor_category ORDER BY name`),
      query(`SELECT id, name FROM m_expense_category WHERE level = 1 ORDER BY name`),
      query(`SELECT id, name FROM m_division ORDER BY name`),
      query(`SELECT id, name FROM m_company ORDER BY name`),
      query(`SELECT id, name FROM m_bank ORDER BY name`),
    ]);

    return NextResponse.json({
      categories:        categories.rows,
      expenseCategories: expenseCategories.rows,
      divisions:         divisions.rows,
      companies:         companies.rows,
      banks:             banks.rows,
    });
  } catch (error) {
    console.error('Vendor meta error:', error);
    return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 });
  }
}
