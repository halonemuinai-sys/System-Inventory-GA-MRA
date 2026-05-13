import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const STATUS_EXPR = `
  CASE
    WHEN ld.expiry_date IS NULL THEN NULL
    WHEN ld.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN ld.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Critical'
    WHEN ld.expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'Warning'
    ELSE 'Valid'
  END
`;

const DAYS_EXPR = `
  CASE WHEN ld.expiry_date IS NOT NULL THEN (ld.expiry_date - CURRENT_DATE) ELSE NULL END
`;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const module     = searchParams.get('module')     || '';
    const page       = parseInt(searchParams.get('page')   || '1');
    const limit      = parseInt(searchParams.get('limit')  || '20');
    const offset     = (page - 1) * limit;
    const search     = searchParams.get('search')     || '';
    const category   = searchParams.get('category')   || '';
    const status     = searchParams.get('status')     || '';
    const companyId  = searchParams.get('company_id') || '';
    const docStatus       = searchParams.get('doc_status')      || '';
    const confidentiality = searchParams.get('confidentiality') || '';

    if (!module) return NextResponse.json({ error: 'module required' }, { status: 400 });

    const conditions: string[] = ['ld.module = $1'];
    const params: unknown[]    = [module];
    let i = 2;

    if (search) {
      conditions.push(`(ld.doc_name ILIKE $${i} OR ld.id_number ILIKE $${i} OR ld.pic ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    if (category) {
      conditions.push(`ld.category = $${i}`);
      params.push(category); i++;
    }
    if (companyId) {
      conditions.push(`ld.company_id = $${i}`);
      params.push(parseInt(companyId)); i++;
    }
    if (status) {
      conditions.push(`(${STATUS_EXPR}) = $${i}`);
      params.push(status); i++;
    }
    if (docStatus) {
      conditions.push(`ld.doc_status = $${i}`);
      params.push(docStatus); i++;
    }
    if (confidentiality) {
      conditions.push(`ld.confidentiality = $${i}`);
      params.push(confidentiality); i++;
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const countRes = await query(
      `SELECT COUNT(*) FROM legal_documents ld ${where}`, params
    );
    const total      = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(total / limit) || 1;

    const dataRes = await query(
      `SELECT ld.id, ld.module, ld.doc_name, ld.category, ld.id_number,
              ld.issue_date, ld.expiry_date, ld.pic, ld.doc_status, ld.confidentiality,
              ld.file_url, ld.file_name, ld.notes,
              ld.company_id, c.name AS company_name,
              ${STATUS_EXPR}  AS status,
              ${DAYS_EXPR}    AS days_until_expiry,
              ld.created_at, ld.updated_at
       FROM legal_documents ld
       LEFT JOIN m_company c ON c.id = ld.company_id
       ${where}
       ORDER BY
         CASE WHEN ld.expiry_date IS NULL THEN 1 ELSE 0 END,
         ld.expiry_date ASC,
         ld.created_at DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({ data: dataRes.rows, total, totalPages, page });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { module, doc_name, category, id_number, issue_date, expiry_date,
            pic, company_id, doc_status, confidentiality: conf,
            file_url, file_name, notes } = body;

    if (!module || !doc_name || !category || !pic) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }

    const res = await query(
      `INSERT INTO legal_documents
         (module, doc_name, category, id_number, issue_date, expiry_date,
          pic, company_id, doc_status, confidentiality, file_url, file_name, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      [module, doc_name, category, id_number || null, issue_date || null,
       expiry_date || null, pic, company_id ? parseInt(company_id) : null,
       doc_status || 'Draft', conf || 'Public/Internal',
       file_url || null, file_name || null, notes || null]
    );

    const newId = res.rows[0].id;
    await query(
      `INSERT INTO legal_audit_logs (document_id, doc_name, module, action) VALUES ($1,$2,$3,'upload')`,
      [newId, doc_name, module]
    );

    return NextResponse.json({ id: newId, message: 'Dokumen berhasil ditambahkan' }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menyimpan' }, { status: 500 });
  }
}
