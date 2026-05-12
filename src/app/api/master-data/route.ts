import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const allowedTables = ['m_company', 'm_asset_category', 'm_asset_type', 'm_condition', 'm_status'];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');

    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }

    const res = await query(`SELECT * FROM ${table} ORDER BY id ASC`);
    return NextResponse.json({ data: res.rows });
  } catch (error) {
    console.error('Master data GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch master data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, name } = body;

    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const res = await query(`INSERT INTO ${table} (name) VALUES ($1) RETURNING *`, [name.trim()]);
    return NextResponse.json({ data: res.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('Master data POST error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to save master data' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { table, id, name } = body;

    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const res = await query(`UPDATE ${table} SET name = $1 WHERE id = $2 RETURNING *`, [name.trim(), id]);
    if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ data: res.rows[0] });
  } catch (error: any) {
    console.error('Master data PUT error:', error);
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to update master data' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const table = searchParams.get('table');
    const id = searchParams.get('id');

    if (!table || !allowedTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
    }
    if (!id) {
        return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const res = await query(`DELETE FROM ${table} WHERE id = $1 RETURNING *`, [parseInt(id)]);
    if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: res.rows[0] });
  } catch (error: any) {
    console.error('Master data DELETE error:', error);
    // Foreign key violation
    if (error.code === '23503') {
        return NextResponse.json({ error: 'Data ini tidak bisa dihapus karena sedang digunakan di tabel lain.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to delete master data' }, { status: 500 });
  }
}
