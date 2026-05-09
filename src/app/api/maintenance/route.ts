import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const offset = (page - 1) * limit;

    const conds: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      conds.push(`(m.asset_name ILIKE $${idx} OR m.room_area ILIKE $${idx} OR m.service_type ILIKE $${idx} OR m.pic ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT m.id, m.room_area, m.asset_name, m.detail, m.pic, m.service_type,
               m.expired_date AS expiry_date, m.qty, m.est_cost, m.total_cost,
               m.status, m.information,
               c.name AS company, c.id AS company_id,
               v.vendor_name, v.id AS vendor_id
        FROM maintenances m
        LEFT JOIN m_company c ON m.company_id = c.id
        LEFT JOIN vendors v ON m.vendor_id = v.id
        ${where}
        ORDER BY m.expired_date ASC NULLS LAST
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM maintenances m ${where}`, params),
    ]);

    return NextResponse.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count) || 0,
      page, limit,
      totalPages: Math.ceil((parseInt(countRes.rows[0].count) || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch maintenance data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    if (!b.company_id) return NextResponse.json({ error: 'Perusahaan wajib dipilih' }, { status: 400 });

    const res = await query(`
      INSERT INTO maintenances (company_id, room_area, asset_id, asset_name, detail,
        pic, service_type, expired_date, qty, est_cost, total_cost, vendor_id, status, information)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id
    `, [b.company_id, b.room_area||null, b.asset_id||null, b.asset_name||null, b.detail||null,
        b.pic||null, b.service_type||null, b.expired_date||null, b.qty||1,
        b.est_cost||0, b.total_cost||0, b.vendor_id||null, b.status||null, b.information||null]);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan maintenance' }, { status: 500 });
  }
}
