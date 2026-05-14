import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createClient } from '@/utils/supabase/server';

const STATUS_EXPR = `
  CASE
    WHEN ld.expiry_date IS NULL THEN NULL
    WHEN ld.expiry_date < CURRENT_DATE THEN 'Expired'
    WHEN ld.expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Critical'
    WHEN ld.expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'Warning'
    ELSE 'Valid'
  END
`;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const performer = user?.email || 'system';

    const { id } = await params;
    const res = await query(
      `SELECT ld.*,
              c.name AS company_name,
              ${STATUS_EXPR.replace(/ld\./g, 'ld.')} AS status,
              CASE WHEN ld.expiry_date IS NOT NULL THEN (ld.expiry_date - CURRENT_DATE) ELSE NULL END AS days_until_expiry

       FROM legal_documents ld
       LEFT JOIN m_company c ON c.id = ld.company_id
       WHERE ld.id = $1`,
      [id]
    );
    if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const doc = res.rows[0];
    await query(
      `INSERT INTO legal_audit_logs (document_id, doc_name, module, action, performed_by) VALUES ($1,$2,$3,'view',$4)`,
      [id, doc.doc_name, doc.module, performer]
    );

    const logs = await query(
      `SELECT * FROM legal_audit_logs WHERE document_id = $1 ORDER BY performed_at DESC LIMIT 20`,
      [id]
    );

    return NextResponse.json({ ...doc, audit_logs: logs.rows });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const performer = user?.email || 'system';

    const { id } = await params;
    const { doc_name, category, id_number, issue_date, expiry_date,
            pic, company_id, doc_status, confidentiality,
            file_url, file_name, notes } = await req.json();

    if (!doc_name || !category || !pic) {
      return NextResponse.json({ error: 'Field wajib tidak boleh kosong' }, { status: 400 });
    }

    await query(
      `UPDATE legal_documents
       SET doc_name=$1, category=$2, id_number=$3, issue_date=$4, expiry_date=$5,
           pic=$6, company_id=$7, doc_status=$8, confidentiality=$9,
           file_url=$10, file_name=$11, notes=$12, updated_at=NOW()
       WHERE id=$13`,
      [doc_name, category, id_number || null, issue_date || null, expiry_date || null,
       pic, company_id ? parseInt(company_id) : null,
       doc_status || 'Draft', confidentiality || 'Public/Internal',
       file_url || null, file_name || null, notes || null, id]
    );

    const existing = await query(`SELECT module FROM legal_documents WHERE id = $1`, [id]);
    await query(
      `INSERT INTO legal_audit_logs (document_id, doc_name, module, action, performed_by) VALUES ($1,$2,$3,'edit',$4)`,
      [id, doc_name, existing.rows[0]?.module, performer]
    );

    return NextResponse.json({ message: 'Dokumen berhasil diperbarui' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const performer = user?.email || 'system';

    const { id } = await params;
    const existing = await query(`SELECT doc_name, module FROM legal_documents WHERE id = $1`, [id]);
    const { doc_name = 'Unknown', module = '' } = existing.rows[0] || {};

    await query(`DELETE FROM legal_documents WHERE id = $1`, [id]);
    await query(
      `INSERT INTO legal_audit_logs (document_id, doc_name, module, action, performed_by) VALUES (NULL,$1,$2,'delete',$3)`,
      [doc_name, module, performer]
    );

    return NextResponse.json({ message: 'Dokumen berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
