import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const compId = searchParams.get('company') || '';
    const offset = (page - 1) * limit;

    const conds: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      conds.push(`(r.item_name ILIKE $${idx} OR r.order_id ILIKE $${idx} OR v.vendor_name ILIKE $${idx} OR r.device_type ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (compId) {
      conds.push(`r.company_id = $${idx}`);
      params.push(parseInt(compId)); idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT r.id, r.order_id, r.item_name, r.device_type, r.unit_code,
               r.price, r.duration_months, r.start_rent, r.end_rent,
               r.department, r.status,
               c.name AS company, c.id AS company_id,
               v.vendor_name, v.id AS vendor_id
        FROM device_rentals r
        LEFT JOIN m_company c ON r.company_id = c.id
        LEFT JOIN vendors v ON r.vendor_id = v.id
        ${where}
        ORDER BY r.end_rent ASC
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM device_rentals r LEFT JOIN vendors v ON r.vendor_id = v.id ${where}`, params),
    ]);

    return NextResponse.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count) || 0,
      page, limit,
      totalPages: Math.ceil((parseInt(countRes.rows[0].count) || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    if (!b.item_name?.trim()) return NextResponse.json({ error: 'Nama item wajib diisi' }, { status: 400 });
    if (!b.company_id)        return NextResponse.json({ error: 'Perusahaan wajib dipilih' }, { status: 400 });

    const res = await query(`
      INSERT INTO device_rentals (company_id, vendor_id, device_type, order_id, item_name,
        price, unit_code, duration_months, start_rent, end_rent, department, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, order_id, item_name
    `, [b.company_id, b.vendor_id||null, b.device_type||null, b.order_id||null,
        b.item_name.trim(), b.price||0, b.unit_code||null, b.duration_months||null,
        b.start_rent||null, b.end_rent||null, b.department||null, b.status||'Active']);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan rental' }, { status: 500 });
  }
}
