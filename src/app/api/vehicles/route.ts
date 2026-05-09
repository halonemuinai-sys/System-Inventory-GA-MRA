import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search')  || '';
    const compId = searchParams.get('company') || '';
    const offset = (page - 1) * limit;

    const conds: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      conds.push(`(v.plate_number ILIKE $${idx} OR v.brand_model ILIKE $${idx} OR v.driver_name ILIKE $${idx} OR v.department ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }
    if (compId) { conds.push(`v.company_id = $${idx}`); params.push(parseInt(compId)); idx++; }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT v.id, v.plate_number, v.chassis_number, v.vehicle_type,
               v.brand_model, v.year, v.color, v.driver_name, v.department,
               v.tax_date, v.last_km, v.last_service_date, v.status, v.information,
               c.name AS company, c.id AS company_id
        FROM vehicles v
        LEFT JOIN m_company c ON v.company_id = c.id
        ${where}
        ORDER BY v.plate_number ASC
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM vehicles v ${where}`, params),
    ]);

    return NextResponse.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count) || 0,
      page, limit,
      totalPages: Math.ceil((parseInt(countRes.rows[0].count) || 0) / limit),
    });
  } catch (error) {
    console.error('Vehicle GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vehicles' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    if (!b.plate_number?.trim()) return NextResponse.json({ error: 'Nomor plat wajib diisi' }, { status: 400 });
    if (!b.company_id)           return NextResponse.json({ error: 'Perusahaan wajib dipilih' }, { status: 400 });

    const res = await query(`
      INSERT INTO vehicles (company_id, plate_number, chassis_number, vehicle_type,
        brand_model, year, color, driver_name, department, tax_date, last_km,
        last_service_date, status, information)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id, plate_number
    `, [b.company_id, b.plate_number.trim(), b.chassis_number||null, b.vehicle_type||null,
        b.brand_model||null, b.year||null, b.color||null, b.driver_name||null,
        b.department||null, b.tax_date||null, b.last_km||null, b.last_service_date||null,
        b.status||'Aktif', b.information||null]);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Nomor plat sudah terdaftar' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menyimpan kendaraan' }, { status: 500 });
  }
}
