import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

function normalizeCompany(name: string) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\bpt\b\.?/g, '')
    .replace(/,\s*pt\.?/g, '')
    .replace(/\bcv\b\.?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const compId = searchParams.get('company') || '';
    const category = searchParams.get('category') || '';
    
    const conds: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (compId) {
      if (/^\d+$/.test(compId)) {
        conds.push(`company_id = $${idx}`);
        params.push(parseInt(compId));
        idx++;
      } else {
        // It's a Helpdesk company name string! Match via normalized GA company name.
        const normalizedInput = normalizeCompany(compId);
        const gaCosRes = await query('SELECT id, name FROM m_company');
        const matchedIds = gaCosRes.rows
          .filter(c => normalizeCompany(c.name) === normalizedInput)
          .map(c => c.id);

        if (matchedIds.length > 0) {
          conds.push(`company_id = ANY($${idx}::int[])`);
          params.push(matchedIds);
          idx++;
        } else {
          conds.push(`company_id = -1`); // force empty if no match
        }
      }
    }
    if (category === 'IT') {
      conds.push(`device_type IN ('Laptop', 'Smartphone', 'iMac', 'PC', 'IT Device', 'Printer')`);
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

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
