import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryHelpdesk } from '@/lib/helpdeskDb';

export const dynamic = 'force-dynamic';

// GET: Get all pending approval requests
export async function GET() {
  try {
    // 1. Fetch pending requests from GA database
    const reqRes = await query(`
      SELECT id, asset_id, user_id, company_id, company_master_id, status, created_at as "createdAt"
      FROM approval_requests
      WHERE status = 'PENDING'
      ORDER BY created_at DESC
    `);
    
    const requests = reqRes.rows;
    if (requests.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Fetch details from Helpdesk database
    const assetIds = Array.from(new Set(requests.map(r => r.asset_id)));
    const userIds = Array.from(new Set(requests.map(r => r.user_id)));
    const companyIds = Array.from(new Set(requests.map(r => r.company_id).filter(Boolean)));
    const masterIds = Array.from(new Set(requests.map(r => r.company_master_id).filter(Boolean)));

    // Fetch in parallel
    const [assetsRes, usersRes, companiesRes, mastersRes] = await Promise.all([
      assetIds.length > 0 
        ? queryHelpdesk('SELECT id, brand, model, "assetTag" as unit_code, "vendorRef" as order_id FROM helpdesk."Asset" WHERE id = ANY($1)', [assetIds])
        : { rows: [] },
      userIds.length > 0 
        ? queryHelpdesk('SELECT id, name, email FROM helpdesk."User" WHERE id = ANY($1)', [userIds])
        : { rows: [] },
      companyIds.length > 0 
        ? queryHelpdesk('SELECT id, name FROM helpdesk."Company" WHERE id = ANY($1)', [companyIds])
        : { rows: [] },
      masterIds.length > 0 
        ? queryHelpdesk('SELECT id, name FROM helpdesk."CompanyMaster" WHERE id = ANY($1)', [masterIds])
        : { rows: [] }
    ]);

    // Create maps for quick lookup
    const assetMap = new Map(assetsRes.rows.map((a: any) => [a.id, a]));
    const userMap = new Map(usersRes.rows.map((u: any) => [u.id, u]));
    const companyMap = new Map(companiesRes.rows.map((c: any) => [c.id, c.name]));
    const masterMap = new Map(mastersRes.rows.map((m: any) => [m.id, m.name]));

    // Join data in-memory
    const combined = requests.map(r => {
      const asset = assetMap.get(r.asset_id) || {};
      const user = userMap.get(r.user_id) || {};
      const companyName = r.company_id 
        ? companyMap.get(r.company_id) 
        : (r.company_master_id ? masterMap.get(r.company_master_id) : '');

      return {
        id: r.id,
        assetId: r.asset_id,
        userId: r.user_id,
        companyId: r.company_id,
        companyMasterId: r.company_master_id,
        status: r.status,
        createdAt: r.createdAt,
        brand: asset.brand || 'Unknown',
        model: asset.model || 'Device',
        unit_code: asset.unit_code || '—',
        order_id: asset.order_id || '—',
        user_name: user.name || '—',
        user_email: user.email || '—',
        company_name: companyName || '—'
      };
    });

    return NextResponse.json(combined);
  } catch (err: any) {
    console.error('Failed to get pending approval requests:', err);
    return NextResponse.json({ error: 'Gagal memuat pengajuan persetujuan. Hubungi IT Admin.' }, { status: 500 });
  }
}

// POST: Create a new approval request
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { assetId, userId, companySelectId } = body;

    if (!assetId || !userId || !companySelectId) {
      return NextResponse.json({ error: 'Data assetId, userId, dan companySelectId wajib diisi' }, { status: 400 });
    }

    // Parse companySelectId (e.g. "company_3" or "master_1")
    let companyId: number | null = null;
    let companyMasterId: number | null = null;

    if (companySelectId.startsWith('company_')) {
      companyId = parseInt(companySelectId.replace('company_', ''));
    } else if (companySelectId.startsWith('master_')) {
      companyMasterId = parseInt(companySelectId.replace('master_', ''));
    } else {
      return NextResponse.json({ error: 'Format companySelectId tidak valid' }, { status: 400 });
    }

    // Check if there is already a pending request for this asset in GA DB
    const checkRes = await query(
      'SELECT id FROM approval_requests WHERE asset_id = $1 AND status = \'PENDING\'',
      [assetId]
    );

    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Perangkat ini sudah memiliki pengajuan alokasi yang berstatus pending.' }, { status: 409 });
    }

    // Insert new request into GA DB
    await query(`
      INSERT INTO approval_requests (asset_id, user_id, company_id, company_master_id, status)
      VALUES ($1, $2, $3, $4, 'PENDING')
    `, [assetId, userId, companyId, companyMasterId]);

    return NextResponse.json({ success: true, message: 'Pengajuan alokasi berhasil dikirim dan menunggu persetujuan.' });
  } catch (err: any) {
    console.error('Failed to submit approval request:', err);
    return NextResponse.json({ error: 'Gagal mengirim pengajuan alokasi ke GA Database.' }, { status: 500 });
  }
}
