import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query(`
      SELECT
        a.*,
        ac.name    AS category,
        atype.name AS asset_type,
        c.name     AS condition,
        s.name     AS status,
        co.name    AS company,
        l.full_name AS location_name,
        u.full_name AS pic_name
      FROM assets a
      LEFT JOIN m_asset_category ac    ON a.asset_category_id = ac.id
      LEFT JOIN m_asset_type     atype ON a.asset_type_id     = atype.id
      LEFT JOIN m_condition      c     ON a.condition_id      = c.id
      LEFT JOIN m_status         s     ON a.status_id         = s.id
      LEFT JOIN m_company        co    ON a.company_id        = co.id
      LEFT JOIN m_location       l     ON a.location_id       = l.id
      LEFT JOIN m_user           u     ON a.pic_id            = u.id
      WHERE a.id = $1
    `, [id]);

    if (!res.rows.length)
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('Asset GET[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params;
    const body    = await request.json();
    const {
      asset_name, asset_code,
      asset_category_id, asset_type_id,
      acquisition_date, acquisition_cost,
      condition_id, status_id,
      details, information, useful_life_months,
    } = body;

    await query(`
      UPDATE assets SET
        asset_name         = $1,
        asset_code         = $2,
        asset_category_id  = $3,
        asset_type_id      = $4,
        acquisition_date   = $5,
        acquisition_cost   = $6,
        condition_id       = $7,
        status_id          = $8,
        details            = $9,
        information        = $10,
        useful_life_months = $11,
        updated_at         = NOW()
      WHERE id = $12
    `, [
      asset_name, asset_code,
      asset_category_id  || null,
      asset_type_id      || null,
      acquisition_date   || null,
      acquisition_cost   || 0,
      condition_id       || null,
      status_id          || null,
      details            || null,
      information        || null,
      useful_life_months || null,
      id,
    ]);

    return NextResponse.json({ message: 'Asset updated' });
  } catch (error: any) {
    console.error('Asset PUT error:', error);
    if (error.code === '23505')
      return NextResponse.json({ error: 'Kode aset sudah digunakan' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
  }
}
