import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryHelpdesk } from '@/lib/helpdeskDb';

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
    
    // 1. Try Live Query from Helpdesk
    try {
      const conds: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (compId) {
        conds.push(`(c.name = $${idx} OR cm.name = $${idx})`);
        params.push(compId);
        idx++;
      }

      const whereClause = conds.length ? `AND ${conds.join(' AND ')}` : '';

      const sql = `
        SELECT 
          COUNT(*) as total_items,
          COALESCE(SUM(a."rentalCost"), 0) as total_price
        FROM helpdesk."Asset" a
        LEFT JOIN helpdesk."Company" c ON a."companyId" = c.id
        LEFT JOIN helpdesk."CompanyMaster" cm ON a."companyMasterId" = cm.id
        WHERE a."ownershipType" = 'RENTAL' ${whereClause}
      `;

      const res = await queryHelpdesk(sql, params);

      return NextResponse.json({
        total_items: parseInt(res.rows[0].total_items) || 0,
        total_price: parseFloat(res.rows[0].total_price) || 0,
      });

    } catch (hdErr) {
      console.warn('Helpdesk summary live query failed, falling back to GA database:', hdErr);
    }

    // 2. Fallback to GA local database
    const conds: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (compId) {
      if (/^\d+$/.test(compId)) {
        conds.push(`company_id = $${idx}`);
        params.push(parseInt(compId));
        idx++;
      } else {
        // Resolve string name mapping
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
          conds.push(`company_id = -1`);
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
    console.error('Failed to get rentals summary:', error);
    return NextResponse.json({ error: 'Failed to fetch summary' }, { status: 500 });
  }
}
