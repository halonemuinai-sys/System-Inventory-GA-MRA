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
        COUNT(*) as total_items,
        SUM(price) as total_price
      FROM device_rentals
      ${where}
    `, params);

    return NextResponse.json({
      total_items: parseInt(res.rows[0].total_items) || 0,
      total_price: parseFloat(res.rows[0].total_price) || 0,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
