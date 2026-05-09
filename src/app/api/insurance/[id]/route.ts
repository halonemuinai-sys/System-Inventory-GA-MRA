import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await query(`
    SELECT i.*, c.name AS company, v.plate_number
    FROM insurances i
    LEFT JOIN m_company c ON i.company_id = c.id
    LEFT JOIN vehicles v ON i.vehicle_id = v.id
    WHERE i.id = $1`, [id]);
  if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(res.rows[0]);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await request.json();
  await query(`
    UPDATE insurances SET company_id=$1, insurance_company=$2, insurance_type=$3, category=$4,
      policy_number=$5, start_date=$6, end_date=$7, vehicle_id=$8, vehicle_type=$9,
      premium_idr=$10, coverage_idr=$11, broker=$12, pic=$13, contact_person=$14,
      information=$15, status=$16
    WHERE id=$17`,
    [b.company_id, b.insurance_company||null, b.insurance_type||null, b.category||null,
     b.policy_number||null, b.start_date||null, b.end_date||null, b.vehicle_id||null, b.vehicle_type||null,
     b.premium_idr||0, b.coverage_idr||null, b.broker||null, b.pic||null, b.contact_person||null,
     b.information||null, b.status||'Active', id]);
  return NextResponse.json({ message: 'Updated' });
}
