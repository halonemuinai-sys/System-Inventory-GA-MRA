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
        v.*,
        vc.name  AS category,
        ec.name  AS expense_category,
        d.name   AS division,
        co.name  AS partnership_company,
        b.name   AS bank_name
      FROM vendors v
      LEFT JOIN m_vendor_category  vc ON v.vendor_category_id     = vc.id
      LEFT JOIN m_expense_category ec ON v.expense_category_id    = ec.id
      LEFT JOIN m_division          d ON v.division_id            = d.id
      LEFT JOIN m_company          co ON v.partnership_company_id = co.id
      LEFT JOIN m_bank              b ON v.bank_id                = b.id
      WHERE v.id = $1
    `, [id]);

    if (!res.rows.length)
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

    return NextResponse.json(res.rows[0]);
  } catch (error) {
    console.error('Vendor GET[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch vendor' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const {
      vendor_code, vendor_name,
      vendor_category_id, expense_category_id,
      detail, division_id, partnership_company_id,
      pic_name, pic_position, phone, email,
      address, npwp,
      bank_id, account_name, account_number,
      contract_start, contract_end, top_days, contract_value,
      review_status, rating, status,
    } = await request.json();

    if (!vendor_name?.trim())
      return NextResponse.json({ error: 'Nama vendor wajib diisi' }, { status: 400 });

    await query(`
      UPDATE vendors SET
        vendor_code            = $1,
        vendor_name            = $2,
        vendor_category_id     = $3,
        expense_category_id    = $4,
        detail                 = $5,
        division_id            = $6,
        partnership_company_id = $7,
        pic_name               = $8,
        pic_position           = $9,
        phone                  = $10,
        email                  = $11,
        address                = $12,
        npwp                   = $13,
        bank_id                = $14,
        account_name           = $15,
        account_number         = $16,
        contract_start         = $17,
        contract_end           = $18,
        top_days               = $19,
        contract_value         = $20,
        review_status          = $21,
        rating                 = $22,
        status                 = $23,
        updated_at             = NOW()
      WHERE id = $24
    `, [
      vendor_code?.trim()       || null,
      vendor_name.trim(),
      vendor_category_id        || null,
      expense_category_id       || null,
      detail                    || null,
      division_id               || null,
      partnership_company_id    || null,
      pic_name                  || null,
      pic_position              || null,
      phone                     || null,
      email                     || null,
      address                   || null,
      npwp                      || null,
      bank_id                   || null,
      account_name              || null,
      account_number            || null,
      contract_start            || null,
      contract_end              || null,
      top_days                  || null,
      contract_value            || null,
      review_status             || null,
      rating                    || null,
      status                    || 'Active',
      id,
    ]);

    return NextResponse.json({ message: 'Vendor updated' });
  } catch (error: any) {
    console.error('Vendor PUT error:', error);
    if (error.code === '23505')
      return NextResponse.json({ error: 'Kode vendor sudah digunakan' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to update vendor' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query(`DELETE FROM vendors WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('vendors DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
