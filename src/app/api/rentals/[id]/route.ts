import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await query(`
    SELECT r.*, c.name AS company, v.vendor_name
    FROM device_rentals r
    LEFT JOIN m_company c ON r.company_id = c.id
    LEFT JOIN vendors v ON r.vendor_id = v.id
    WHERE r.id = $1`, [id]);
  if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  if (!b.item_name?.trim()) return NextResponse.json({ error: 'Nama item wajib diisi' }, { status: 400 });
  await query(`
    UPDATE device_rentals SET company_id=$1, vendor_id=$2, device_type=$3, order_id=$4,
      item_name=$5, price=$6, unit_code=$7, duration_months=$8, start_rent=$9, end_rent=$10,
      department=$11, status=$12
    WHERE id=$13`,
    [b.company_id, b.vendor_id||null, b.device_type||null, b.order_id||null,
     b.item_name.trim(), b.price||0, b.unit_code||null, b.duration_months||null,
     b.start_rent||null, b.end_rent||null, b.department||null, b.status||'Active', id]);
  return NextResponse.json({ message: 'Updated' });
}
