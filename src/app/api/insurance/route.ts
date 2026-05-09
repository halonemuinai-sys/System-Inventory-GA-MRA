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
      conds.push(`(i.policy_number ILIKE $${idx} OR i.insurance_company ILIKE $${idx} OR v.plate_number ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT i.id, i.policy_number, i.insurance_company, i.insurance_type, i.category,
               i.start_date, i.end_date, i.premium_idr, i.coverage_idr, i.status,
               i.broker, i.pic, i.vehicle_type,
               c.name AS company, c.id AS company_id,
               v.plate_number, v.id AS vehicle_id
        FROM insurances i
        LEFT JOIN m_company c ON i.company_id = c.id
        LEFT JOIN vehicles v ON i.vehicle_id = v.id
        ${where}
        ORDER BY i.end_date ASC NULLS LAST
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM insurances i LEFT JOIN vehicles v ON i.vehicle_id = v.id ${where}`, params),
    ]);

    return NextResponse.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count) || 0,
      page, limit,
      totalPages: Math.ceil((parseInt(countRes.rows[0].count) || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch insurances' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    if (!b.company_id) return NextResponse.json({ error: 'Perusahaan wajib dipilih' }, { status: 400 });

    const res = await query(`
      INSERT INTO insurances (company_id, insurance_company, insurance_type, category,
        policy_number, start_date, end_date, vehicle_id, vehicle_type,
        premium_idr, premium_usd, coverage_idr, coverage_usd, tjh3,
        broker, pic, contact_person, information, doc_url, checklist_status, status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
      RETURNING id, policy_number
    `, [b.company_id, b.insurance_company||null, b.insurance_type||null, b.category||null,
        b.policy_number||null, b.start_date||null, b.end_date||null, b.vehicle_id||null, b.vehicle_type||null,
        b.premium_idr||0, b.premium_usd||null, b.coverage_idr||null, b.coverage_usd||null, b.tjh3||null,
        b.broker||null, b.pic||null, b.contact_person||null, b.information||null,
        b.doc_url||null, b.checklist_status||null, b.status||'Active']);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan asuransi' }, { status: 500 });
  }
}
