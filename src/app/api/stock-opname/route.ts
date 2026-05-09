import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET: List all sessions or a specific session with stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (sessionId) {
      // Single session with check details
      const sessionRes = await query(`SELECT * FROM stock_opname_sessions WHERE id = $1`, [sessionId]);
      if (!sessionRes.rows.length) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

      const checksRes = await query(`
        SELECT ic.*, a.asset_name, a.asset_code AS orig_code,
               ac.name AS category, co.name AS company, a.room,
               cond.name AS current_condition, stat.name AS current_status
        FROM inventory_checks ic
        JOIN assets a ON ic.asset_id = a.id
        LEFT JOIN m_asset_category ac ON a.asset_category_id = ac.id
        LEFT JOIN m_company co ON a.company_id = co.id
        LEFT JOIN m_condition cond ON a.condition_id = cond.id
        LEFT JOIN m_status stat ON a.status_id = stat.id
        WHERE ic.session_id = $1
        ORDER BY ic.check_status ASC, a.asset_name ASC
      `, [sessionId]);

      return NextResponse.json({
        session: sessionRes.rows[0],
        checks: checksRes.rows,
      });
    }

    // List all sessions
    const res = await query(`
      SELECT * FROM stock_opname_sessions
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ sessions: res.rows });
  } catch (error) {
    console.error('Stock Opname GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}

// POST: Create a new session (populates all assets as Pending)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_name, description, created_by, company_id, category_id } = body;

    if (!session_name?.trim()) {
      return NextResponse.json({ error: 'Nama sesi wajib diisi' }, { status: 400 });
    }

    // Create session
    const sessionRes = await query(`
      INSERT INTO stock_opname_sessions (session_name, description, created_by)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [session_name.trim(), description || null, created_by || 'System']);

    const sessionId = sessionRes.rows[0].id;

    // Populate with all active assets (optionally filtered by company and category)
    let assetFilter = `WHERE (s.name = 'Active' OR s.name IS NULL)`;
    const params: any[] = [];
    if (company_id) {
      params.push(company_id);
      assetFilter += ` AND a.company_id = $${params.length}`;
    }
    if (category_id) {
      params.push(category_id);
      assetFilter += ` AND a.asset_category_id = $${params.length}`;
    }

    const assetsRes = await query(`
      SELECT a.id, a.asset_code FROM assets a
      LEFT JOIN m_status s ON a.status_id = s.id
      ${assetFilter}
    `, params);

    // Bulk insert all assets as Pending
    if (assetsRes.rows.length > 0) {
      const values = assetsRes.rows.map((a: any, i: number) =>
        `($1, $${i * 2 + 2}, $${i * 2 + 3})`
      ).join(',');
      const insertParams: any[] = [sessionId];
      assetsRes.rows.forEach((a: any) => {
        insertParams.push(a.id);
        insertParams.push(a.asset_code);
      });

      await query(`
        INSERT INTO inventory_checks (session_id, asset_id, asset_code)
        VALUES ${values}
      `, insertParams);
    }

    // Update session total
    await query(`
      UPDATE stock_opname_sessions SET total_assets = $1 WHERE id = $2
    `, [assetsRes.rows.length, sessionId]);

    return NextResponse.json({
      id: sessionId,
      total_assets: assetsRes.rows.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Stock Opname POST error:', error);
    return NextResponse.json({ error: 'Gagal membuat sesi' }, { status: 500 });
  }
}

// DELETE: Remove a session and its checks
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await query(`DELETE FROM stock_opname_sessions WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Stock Opname DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
  }
}
