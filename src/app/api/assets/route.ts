import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit    = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const search   = searchParams.get('search')   || '';
    const catId    = searchParams.get('category') || '';
    const statusId = searchParams.get('status')   || '';
    const offset   = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(a.asset_name ILIKE $${idx} OR a.asset_code ILIKE $${idx} OR co.name ILIKE $${idx} OR ac.name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (catId) {
      conditions.push(`a.asset_category_id = $${idx}`);
      params.push(parseInt(catId));
      idx++;
    }
    if (statusId) {
      conditions.push(`a.status_id = $${idx}`);
      params.push(parseInt(statusId));
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT
          a.id, a.asset_code, a.asset_name,
          ac.name  AS category,
          atype.name AS asset_type,
          c.name   AS condition,
          s.name   AS status,
          a.acquisition_date,
          a.acquisition_cost,
          co.name  AS company,
          a.details, a.room, a.useful_life_months
        FROM assets a
        LEFT JOIN m_asset_category ac    ON a.asset_category_id = ac.id
        LEFT JOIN m_asset_type     atype ON a.asset_type_id     = atype.id
        LEFT JOIN m_condition      c     ON a.condition_id      = c.id
        LEFT JOIN m_status         s     ON a.status_id         = s.id
        LEFT JOIN m_company        co    ON a.company_id        = co.id
        ${where}
        ORDER BY a.created_at DESC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),

      query(`
        SELECT COUNT(*) FROM assets a
        LEFT JOIN m_asset_category ac ON a.asset_category_id = ac.id
        LEFT JOIN m_company        co ON a.company_id        = co.id
        ${where}
      `, params),
    ]);

    const total = parseInt(countRes.rows[0].count) || 0;

    return NextResponse.json({
      data:       dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Asset GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch assets' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      company_id, asset_code, asset_name,
      asset_category_id, asset_type_id,
      acquisition_date, acquisition_cost,
      condition_id, status_id,
      details, information, useful_life_months,
    } = body;

    if (!asset_name?.trim())  return NextResponse.json({ error: 'Nama aset wajib diisi' },      { status: 400 });
    if (!company_id)          return NextResponse.json({ error: 'Perusahaan wajib dipilih' },    { status: 400 });

    // Auto-generate code if blank
    let code = asset_code?.trim() || null;
    if (!code) {
      const seq = await query(`SELECT COUNT(*) FROM assets`);
      const num = parseInt(seq.rows[0].count) + 1;
      code = `AST-${String(num).padStart(5, '0')}`;
    }

    const res = await query(`
      INSERT INTO assets (
        company_id, asset_code, asset_name,
        asset_category_id, asset_type_id,
        acquisition_date, acquisition_cost,
        condition_id, status_id,
        details, information, useful_life_months
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id, asset_code, asset_name
    `, [
      company_id, code, asset_name.trim(),
      asset_category_id  || null,
      asset_type_id      || null,
      acquisition_date   || null,
      acquisition_cost   || 0,
      condition_id       || null,
      status_id          || null,
      details            || null,
      information        || null,
      useful_life_months || null,
    ]);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Asset POST error:', error);
    if (error.code === '23505')
      return NextResponse.json({ error: 'Kode aset sudah digunakan' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menyimpan aset' }, { status: 500 });
  }
}
