import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await query(`
    SELECT m.*, c.name AS company, v.vendor_name
    FROM maintenances m
    LEFT JOIN m_company c ON m.company_id = c.id
    LEFT JOIN vendors v ON m.vendor_id = v.id
    WHERE m.id = $1`, [id]);
  if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  await query(`
    UPDATE maintenances SET company_id=$1, room_area=$2, asset_name=$3, detail=$4,
      pic=$5, service_type=$6, expired_date=$7, qty=$8, est_cost=$9, total_cost=$10,
      vendor_id=$11, status=$12, information=$13
    WHERE id=$14`,
    [b.company_id, b.room_area||null, b.asset_name||null, b.detail||null,
     b.pic||null, b.service_type||null, b.expired_date||null, b.qty||1,
     b.est_cost||0, b.total_cost||0, b.vendor_id||null, b.status||null, b.information||null, id]);
  return NextResponse.json({ message: 'Updated' });
}
