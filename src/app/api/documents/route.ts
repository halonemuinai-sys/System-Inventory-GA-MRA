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
      conds.push(`(d.doc_number ILIKE $${idx} OR d.doc_title ILIKE $${idx} OR d.counter_party ILIKE $${idx})`);
      params.push(`%${search}%`); idx++;
    }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const [dataRes, countRes] = await Promise.all([
      query(`
        SELECT d.id, d.doc_number, d.doc_title, d.doc_subtype,
               d.counter_party, d.valid_from, d.valid_until, d.status,
               d.amount, d.auto_renewal, d.pic_internal,
               dt.name AS doc_type,
               c.name AS company, c.id AS mra_party_id,
               v.vendor_name, v.id AS vendor_id
        FROM documents d
        LEFT JOIN m_document_type dt ON d.doc_type_id = dt.id
        LEFT JOIN m_company c ON d.mra_party_id = c.id
        LEFT JOIN vendors v ON d.vendor_id = v.id
        ${where}
        ORDER BY d.valid_until ASC NULLS LAST
        LIMIT $${idx} OFFSET $${idx+1}
      `, [...params, limit, offset]),
      query(`SELECT COUNT(*) FROM documents d ${where}`, params),
    ]);

    return NextResponse.json({
      data: dataRes.rows,
      total: parseInt(countRes.rows[0].count) || 0,
      page, limit,
      totalPages: Math.ceil((parseInt(countRes.rows[0].count) || 0) / limit),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const b = await request.json();
    if (!b.doc_number?.trim()) return NextResponse.json({ error: 'Nomor dokumen wajib diisi' }, { status: 400 });

    const res = await query(`
      INSERT INTO documents (doc_number, doc_title, doc_type_id, doc_subtype, division_id,
        mra_party_id, counter_party, vendor_id, pic_internal, valid_from, valid_until,
        physical_location, auto_renewal, digital_doc_url, amount, notes, status, sto_status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING id, doc_number
    `, [b.doc_number.trim(), b.doc_title||null, b.doc_type_id||null, b.doc_subtype||'agreement',
        b.division_id||null, b.mra_party_id||null, b.counter_party||null, b.vendor_id||null,
        b.pic_internal||null, b.valid_from||null, b.valid_until||null, b.physical_location||null,
        b.auto_renewal||false, b.digital_doc_url||null, b.amount||null, b.notes||null,
        b.status||'Active', b.sto_status||null]);

    return NextResponse.json(res.rows[0], { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Nomor dokumen sudah ada' }, { status: 409 });
    return NextResponse.json({ error: 'Gagal menyimpan dokumen' }, { status: 500 });
  }
}
