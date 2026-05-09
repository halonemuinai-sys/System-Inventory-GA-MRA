import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST: Scan/verify an asset in a session
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, asset_code, check_status, condition_note, location_found, checked_by, notes } = body;

    if (!session_id || !asset_code) {
      return NextResponse.json({ error: 'Session ID dan kode aset wajib diisi' }, { status: 400 });
    }

    // Find the check record
    const checkRes = await query(`
      SELECT ic.id, ic.check_status, a.asset_name, a.asset_code, 
             ac.name AS category, co.name AS company, a.room,
             cond.name AS current_condition
      FROM inventory_checks ic
      JOIN assets a ON ic.asset_id = a.id
      LEFT JOIN m_asset_category ac ON a.asset_category_id = ac.id
      LEFT JOIN m_company co ON a.company_id = co.id
      LEFT JOIN m_condition cond ON a.condition_id = cond.id
      WHERE ic.session_id = $1 AND ic.asset_code = $2
    `, [session_id, asset_code.trim()]);

    if (!checkRes.rows.length) {
      // Asset code not found in this session
      return NextResponse.json({
        error: 'Kode aset tidak ditemukan dalam sesi ini',
        asset_code,
      }, { status: 404 });
    }

    const check = checkRes.rows[0];

    // Update the check record
    await query(`
      UPDATE inventory_checks 
      SET check_status = $1, condition_note = $2, location_found = $3,
          checked_by = $4, checked_at = NOW(), notes = $5
      WHERE id = $6
    `, [
      check_status || 'Found',
      condition_note || null,
      location_found || null,
      checked_by || 'Scanner',
      notes || null,
      check.id,
    ]);

    // Update session counts
    await query(`
      UPDATE stock_opname_sessions SET
        checked_count = (SELECT COUNT(*) FROM inventory_checks WHERE session_id = $1 AND check_status != 'Pending'),
        found_count   = (SELECT COUNT(*) FROM inventory_checks WHERE session_id = $1 AND check_status = 'Found'),
        missing_count = (SELECT COUNT(*) FROM inventory_checks WHERE session_id = $1 AND check_status = 'Missing')
      WHERE id = $1
    `, [session_id]);

    return NextResponse.json({
      success: true,
      asset: {
        asset_name: check.asset_name,
        asset_code: check.asset_code,
        category: check.category,
        company: check.company,
        room: check.room,
        current_condition: check.current_condition,
        check_status: check_status || 'Found',
      },
    });
  } catch (error) {
    console.error('Scan POST error:', error);
    return NextResponse.json({ error: 'Gagal memproses scan' }, { status: 500 });
  }
}
