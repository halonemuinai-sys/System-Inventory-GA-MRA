import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [companies, categories, types, conditions, statuses] = await Promise.all([
      query(`SELECT id, name FROM m_company ORDER BY name`),
      query(`SELECT id, name FROM m_asset_category ORDER BY name`),
      query(`SELECT id, category_id, name FROM m_asset_type ORDER BY name`),
      query(`SELECT id, name FROM m_condition ORDER BY name`),
      query(`SELECT id, name FROM m_status    ORDER BY name`),
    ]);

    return NextResponse.json({
      companies:  companies.rows,
      categories: categories.rows,
      types:      types.rows,
      conditions: conditions.rows,
      statuses:   statuses.rows,
    });
  } catch (error) {
    console.error('Asset meta error:', error);
    return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 });
  }
}
