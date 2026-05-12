import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const compId = searchParams.get('company') || '';
    
    let where = '';
    const params: any[] = [];
    if (compId) {
      where = 'WHERE company_id = $1';
      params.push(parseInt(compId));
    }

    const res = await query(`
      SELECT 
        COUNT(*) as total_assets,
        SUM(acquisition_cost) as total_value
      FROM assets
      ${where}
    `, params);

    return NextResponse.json({
      total_assets: parseInt(res.rows[0].total_assets) || 0,
      total_value: parseFloat(res.rows[0].total_value) || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
