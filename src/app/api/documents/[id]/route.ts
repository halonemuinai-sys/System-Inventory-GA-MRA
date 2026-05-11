import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await query(`
    SELECT d.*, dt.name AS doc_type, c.name AS company, v.vendor_name,
           div.name AS division
    FROM documents d
    LEFT JOIN m_document_type dt ON d.doc_type_id = dt.id
    LEFT JOIN m_company c ON d.mra_party_id = c.id
    LEFT JOIN vendors v ON d.vendor_id = v.id
    LEFT JOIN m_division div ON d.division_id = div.id
    WHERE d.id = $1`, [id]);
  if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  if (!b.doc_number?.trim()) return NextResponse.json({ error: 'Nomor dokumen wajib diisi' }, { status: 400 });
  await query(`
    UPDATE documents SET doc_number=$1, doc_title=$2, doc_type_id=$3, doc_subtype=$4,
      division_id=$5, mra_party_id=$6, counter_party=$7, vendor_id=$8, pic_internal=$9,
      valid_from=$10, valid_until=$11, physical_location=$12, auto_renewal=$13,
      digital_doc_url=$14, amount=$15, notes=$16, status=$17, sto_status=$18, updated_at=NOW()
    WHERE id=$19`,
    [b.doc_number.trim(), b.doc_title||null, b.doc_type_id||null, b.doc_subtype||'agreement',
     b.division_id||null, b.mra_party_id||null, b.counter_party||null, b.vendor_id||null,
     b.pic_internal||null, b.valid_from||null, b.valid_until||null, b.physical_location||null,
     b.auto_renewal||false, b.digital_doc_url||null, b.amount||null, b.notes||null,
     b.status||'Active', b.sto_status||null, id]);
  return NextResponse.json({ message: 'Updated' });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query(`DELETE FROM documents WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('documents DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
