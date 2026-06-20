import { NextResponse } from 'next/server';
import { queryHelpdesk } from '@/lib/helpdeskDb';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// GET: Get all pending approval requests from Helpdesk
export async function GET() {
  try {
    // 1. Fetch pending requests from Helpdesk database
    const reqRes = await queryHelpdesk(`
      SELECT id, "entityId", "entityName", reason, "createdAt"
      FROM helpdesk."ApprovalRequest"
      WHERE "entityType" = 'ASSET_ALLOCATION' AND status = 'PENDING'
      ORDER BY "createdAt" DESC
    `);
    
    const rawRequests = reqRes.rows;
    if (rawRequests.length === 0) {
      return NextResponse.json([]);
    }

    const requests = rawRequests.map((r: any) => {
      const targetUserId = r.reason.startsWith('ALLOCATE_TO:') 
        ? r.reason.replace('ALLOCATE_TO:', '') 
        : r.reason;
      return {
        id: r.id,
        assetId: r.entityId,
        entityName: r.entityName,
        userId: targetUserId,
        createdAt: r.createdAt
      };
    });

    // 2. Fetch details from Helpdesk database
    const assetIds = Array.from(new Set(requests.map(r => r.assetId)));
    const userIds = Array.from(new Set(requests.map(r => r.userId)));

    // Fetch in parallel
    const [assetsRes, usersRes] = await Promise.all([
      assetIds.length > 0 
        ? queryHelpdesk('SELECT id, brand, model, "assetTag" as unit_code, "vendorRef" as order_id, "companyId", "companyMasterId" FROM helpdesk."Asset" WHERE id = ANY($1)', [assetIds])
        : { rows: [] },
      userIds.length > 0 
        ? queryHelpdesk('SELECT id, name, email, "companyId" FROM helpdesk."User" WHERE id = ANY($1)', [userIds])
        : { rows: [] }
    ]);

    const userCompanyIds = Array.from(new Set(usersRes.rows.map((u: any) => u.companyId).filter(Boolean)));
    const assetCompanyIds = Array.from(new Set(assetsRes.rows.map((a: any) => a.companyId).filter(Boolean)));
    const assetMasterIds = Array.from(new Set(assetsRes.rows.map((a: any) => a.companyMasterId).filter(Boolean)));

    const allCompanyIds = Array.from(new Set([...userCompanyIds, ...assetCompanyIds]));

    const [companiesRes, mastersRes] = await Promise.all([
      allCompanyIds.length > 0 
        ? queryHelpdesk('SELECT id, name FROM helpdesk."Company" WHERE id = ANY($1)', [allCompanyIds])
        : { rows: [] },
      assetMasterIds.length > 0 
        ? queryHelpdesk('SELECT id, name FROM helpdesk."CompanyMaster" WHERE id = ANY($1)', [assetMasterIds])
        : { rows: [] }
    ]);

    // Create maps for quick lookup
    const assetMap = new Map(assetsRes.rows.map((a: any) => [a.id, a]));
    const userMap = new Map(usersRes.rows.map((u: any) => [u.id, u]));
    const companyMap = new Map(companiesRes.rows.map((c: any) => [c.id, c.name]));
    const masterMap = new Map(mastersRes.rows.map((m: any) => [m.id, m.name]));

    // Join data in-memory
    const combined = requests.map(r => {
      const asset = assetMap.get(r.assetId) || {};
      const user = userMap.get(r.userId) || {};
      
      const companyName = user.companyId 
        ? companyMap.get(user.companyId) 
        : (asset.companyId ? companyMap.get(asset.companyId) : (asset.companyMasterId ? masterMap.get(asset.companyMasterId) : ''));

      return {
        id: r.id,
        assetId: r.assetId,
        userId: r.userId,
        status: 'PENDING',
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
    const { assetId, userId } = body;

    if (!assetId || !userId) {
      return NextResponse.json({ error: 'Data assetId dan userId wajib diisi' }, { status: 400 });
    }

    // 1. Fetch asset details from Helpdesk database to verify it exists and get its name
    const assetRes = await queryHelpdesk(
      'SELECT id, brand, model, "assetTag" FROM helpdesk."Asset" WHERE id = $1',
      [assetId]
    );

    if (assetRes.rows.length === 0) {
      return NextResponse.json({ error: 'Perangkat tidak ditemukan di database Helpdesk' }, { status: 404 });
    }

    const asset = assetRes.rows[0];

    // 2. Check if there is already a pending request for this asset in Helpdesk DB
    const checkRes = await queryHelpdesk(
      'SELECT id FROM helpdesk."ApprovalRequest" WHERE "entityId" = $1 AND "entityType" = \'ASSET_ALLOCATION\' AND status = \'PENDING\'',
      [assetId]
    );

    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Perangkat ini sudah memiliki pengajuan alokasi yang berstatus pending.' }, { status: 409 });
    }

    // 3. Insert new request into Helpdesk DB
    const requestId = crypto.randomUUID();
    const entityName = `${asset.brand} ${asset.model} (${asset.assetTag})`;
    const reason = `ALLOCATE_TO:${userId}`;

    await queryHelpdesk(`
      INSERT INTO helpdesk."ApprovalRequest" (id, "entityType", "entityId", "entityName", reason, status, "createdAt", "updatedAt", "requestedById")
      VALUES ($1, $2, $3, $4, $5, 'PENDING', NOW(), NOW(), 'ADMIN-01')
    `, [requestId, 'ASSET_ALLOCATION', assetId, entityName, reason]);

    return NextResponse.json({ success: true, message: 'Pengajuan alokasi berhasil dikirim dan menunggu persetujuan.' });
  } catch (err: any) {
    console.error('Failed to submit approval request:', err);
    return NextResponse.json({ error: 'Gagal mengirim pengajuan alokasi ke Database Helpdesk.' }, { status: 500 });
  }
}
