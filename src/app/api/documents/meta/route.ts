import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const [docTypes, vendors] = await Promise.all([
      query(`SELECT id, name FROM m_document_type ORDER BY name`),
      query(`SELECT id, vendor_name AS name FROM vendors ORDER BY vendor_name LIMIT 200`),
    ]);
    return NextResponse.json({ docTypes: docTypes.rows, vendors: vendors.rows });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch meta' }, { status: 500 });
  }
}
