import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(`
      SELECT
        r.id,
        r.order_id,
        r.item_name,
        r.device_type,
        r.unit_code,
        r.price,
        r.duration_months,
        r.start_rent,
        r.end_rent,
        r.department,
        r.status,
        c.name AS company,
        v.vendor_name
      FROM device_rentals r
      LEFT JOIN m_company c ON r.company_id = c.id
      LEFT JOIN vendors    v ON r.vendor_id  = v.id
      ORDER BY r.end_rent ASC
    `, []);

    return NextResponse.json({ data: res.rows, total: res.rows.length });
  } catch {
    return NextResponse.json({ error: 'Gagal mengekspor data' }, { status: 500 });
  }
}
