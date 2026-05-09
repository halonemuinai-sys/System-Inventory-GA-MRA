import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page     = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit    = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const search   = searchParams.get('search')   || '';
    const catId    = searchParams.get('category') || '';
    const statusQ  = searchParams.get('status')   || '';
    const offset   = (page - 1) * limit;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(v.vendor_name ILIKE $${idx} OR v.vendor_code ILIKE $${idx} OR v.phone ILIKE $${idx} OR v.pic_name ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }
    if (catId) {
      conditions.push(`v.vendor_category_id = $${idx}`);
      params.push(parseInt(catId));
      idx++;
    }
    if (statusQ) {
      conditions.push(`v.status = $${idx}`);
      params.push(statusQ);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT DISTINCT ON (v.id)
          v.id, v.vendor_code, v.vendor_name,
          vc.name  AS category,
          ec.name  AS expense_category,
          v.pic_name, v.pic_position,
          v.phone, v.email,
          v.rating, v.status,
          v.contract_start, v.contract_end,
          v.contract_value, v.review_status
        FROM vendors v
        LEFT JOIN m_vendor_category vc ON v.vendor_category_id = vc.id
        LEFT JOIN m_expense_category ec ON v.expense_category_id = ec.id
        ${where}
        ORDER BY v.id, v.vendor_name ASC
        LIMIT $${idx} OFFSET $${idx + 1}
      `, [...params, limit, offset]),

      query(`
        SELECT COUNT(DISTINCT v.id) FROM vendors v
        LEFT JOIN m_vendor_category vc ON v.vendor_category_id = vc.id
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
    console.error('Vendor GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendors' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      vendor_code, vendor_name,
      vendor_category_id, expense_category_id,
      detail, division_id, partnership_company_id,
      pic_name, pic_position, phone, email,
      address, npwp,
      bank_id, account_name, account_number,
      contract_start, contract_end, top_days, contract_value,
      review_status, rating, status,
    } = body;

    if (!vendor_name?.trim())
      return NextResponse.json({ error: 'Nama vendor wajib diisi' }, { status: 400 });

    // Auto-generate code if blank
    let code = vendor_code?.trim() || null;
    if (!code) {
      const seq = await query(`SELECT COUNT(*) FROM vendors`);
      const num = parseInt(seq.rows[0].count) + 1;
      code = `VND-${String(num).padStart(5, '0')}`;
    }

    const res = await query(`
      INSERT INTO vendors (
        vendor_code, vendor_name,
        vendor_category_id, expense_category_id,
        detail, division_id, partnership_company_id,
        pic_name, pic_position, phone, email,
        address, npwp,
        bank_id, account_name, account_number,
        contract_start, contract_end, top_days, contract_value,
        review_status, rating, status
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
        $11,$12,$13,$14,$15,$16,$17,$18,$19,$20,
        $21,$22,$23
      )
      RETURNING id, vendor_code, vendor_name
    `, [
      code, vendor_name.trim(),
      vendor_category_id   || null,
      expense_category_id  || null,
      detail               || null,
      division_id          || null,
      partnership_company_id || null,
      pic_name             || null,
      pic_position         || null,
      phone                || null,
      email                || null,
      address              || null,
      npwp                 || null,
      bank_id              || null,
      account_name         || null,
      account_number       || null,
      contract_start       || null,
      contract_end         || null,
      top_days             || null,
      contract_value       || null,
      review_status        || null,
      rating               || null,
      status               || 'Active',
    ]);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Vendor POST error:', error);
    if (error.code === '23505')
      return NextResponse.json({ error: 'Kode vendor sudah digunakan' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menyimpan vendor' }, { status: 500 });
  }
}
