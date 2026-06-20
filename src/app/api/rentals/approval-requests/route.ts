import { NextResponse } from 'next/server';
import { queryHelpdesk } from '@/lib/helpdeskDb';

export const dynamic = 'force-dynamic';

// GET: Get all pending approval requests
export async function GET() {
  try {
    const res = await queryHelpdesk(`
      SELECT 
        ar.id,
        ar."assetId",
        ar."userId",
        ar."companyId",
        ar."companyMasterId",
        ar.status,
        ar."createdAt",
        a.brand,
        a.model,
        a."assetTag" as unit_code,
        a."vendorRef" as order_id,
        u.name as user_name,
        u.email as user_email,
        COALESCE(c.name, cm.name, '') as company_name
      FROM helpdesk."ApprovalRequest" ar
      LEFT JOIN helpdesk."Asset" a ON ar."assetId" = a.id
      LEFT JOIN helpdesk."User" u ON ar."userId" = u.id
      LEFT JOIN helpdesk."Company" c ON ar."companyId" = c.id
      LEFT JOIN helpdesk."CompanyMaster" cm ON ar."companyMasterId" = cm.id
      WHERE ar.status = 'PENDING'
      ORDER BY ar."createdAt" DESC
    `);
    
    return NextResponse.json(res.rows);
  } catch (err: any) {
    console.error('Failed to get pending approval requests:', err);
    return NextResponse.json({ error: 'Failed to fetch approval requests. Make sure database table exists.' }, { status: 500 });
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

    // Check if there is already a pending request for this asset
    const checkRes = await queryHelpdesk(
      'SELECT id FROM helpdesk."ApprovalRequest" WHERE "assetId" = $1 AND status = \'PENDING\'',
      [assetId]
    );

    if (checkRes.rows.length > 0) {
      return NextResponse.json({ error: 'Perangkat ini sudah memiliki pengajuan alokasi yang berstatus pending.' }, { status: 409 });
    }

    // Insert new request
    await queryHelpdesk(`
      INSERT INTO helpdesk."ApprovalRequest" ("assetId", "userId", "companyId", "companyMasterId", status)
      VALUES ($1, $2, $3, $4, 'PENDING')
    `, [assetId, userId, companyId, companyMasterId]);

    return NextResponse.json({ success: true, message: 'Pengajuan alokasi berhasil dikirim dan menunggu persetujuan.' });
  } catch (err: any) {
    console.error('Failed to submit approval request:', err);
    return NextResponse.json({ error: 'Gagal mengirim pengajuan alokasi. Hubungi IT Admin untuk memastikan tabel database tersedia.' }, { status: 500 });
  }
}
