import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await query(
    `SELECT v.*, c.name AS company FROM vehicles v LEFT JOIN m_company c ON v.company_id = c.id WHERE v.id = $1`, [id]
  );
  if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  if (!b.plate_number?.trim()) return NextResponse.json({ error: 'Nomor plat wajib diisi' }, { status: 400 });
  try {
    await query(`
      UPDATE vehicles SET plate_number=$1, chassis_number=$2, vehicle_type=$3, brand_model=$4,
        year=$5, color=$6, driver_name=$7, department=$8, tax_date=$9, last_km=$10,
        last_service_date=$11, status=$12, information=$13, company_id=$14
      WHERE id=$15`,
      [b.plate_number.trim(), b.chassis_number||null, b.vehicle_type||null, b.brand_model||null,
       b.year||null, b.color||null, b.driver_name||null, b.department||null, b.tax_date||null,
       b.last_km||null, b.last_service_date||null, b.status||'Aktif', b.information||null, b.company_id, id]);
    return NextResponse.json({ message: 'Updated' });
  } catch (error: any) {
    if (error.code === '23505') return NextResponse.json({ error: 'Nomor plat sudah digunakan' }, { status: 409 });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await query(`DELETE FROM vehicles WHERE id = $1`, [id]);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error) {
    console.error('vehicles DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
