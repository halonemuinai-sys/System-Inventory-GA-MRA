import { NextResponse } from 'next/server';
import { queryHelpdesk } from '@/lib/helpdeskDb';
import crypto from 'crypto';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: requestId } = await params;

  try {
    const body = await req.json();
    const { action } = body;

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Action harus bernilai "approve" atau "reject"' }, { status: 400 });
    }

    // 1. Fetch the request details from Helpdesk database
    const requestRes = await queryHelpdesk(
      'SELECT id, "entityId", "entityName", reason FROM helpdesk."ApprovalRequest" WHERE id = $1 AND status = \'PENDING\'',
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan atau sudah diproses' }, { status: 404 });
    }

    const requestItem = requestRes.rows[0];
    const assetId = requestItem.entityId;

    if (action === 'approve') {
      const targetUserId = requestItem.reason.startsWith('ALLOCATE_TO:') 
        ? requestItem.reason.replace('ALLOCATE_TO:', '') 
        : requestItem.reason;

      // 2. Fetch User to resolve their company settings
      const userRes = await queryHelpdesk(
        'SELECT name, email, "companyId" FROM helpdesk."User" WHERE id = $1',
        [targetUserId]
      );

      if (userRes.rows.length === 0) {
        return NextResponse.json({ error: 'Karyawan yang dituju tidak ditemukan di database Helpdesk' }, { status: 400 });
      }

      const user = userRes.rows[0];
      const companyId = user.companyId;
      let companyMasterId = null;

      if (companyId) {
        const compRes = await queryHelpdesk('SELECT "companyMasterId" FROM helpdesk."Company" WHERE id = $1', [companyId]);
        if (compRes.rows.length > 0) {
          companyMasterId = compRes.rows[0].companyMasterId;
        }
      }

      // 3. Update the Asset table in Helpdesk database
      await queryHelpdesk(`
        UPDATE helpdesk."Asset" 
        SET "userId" = $1, 
            "companyId" = $2, 
            "companyMasterId" = $3,
            status = 'ASSIGNED',
            "updatedAt" = NOW()
        WHERE id = $4
      `, [targetUserId, companyId, companyMasterId, assetId]);

      // 4. Update the ApprovalRequest in Helpdesk database
      await queryHelpdesk(`
        UPDATE helpdesk."ApprovalRequest"
        SET status = 'APPROVED',
            "updatedAt" = NOW(),
            "handledById" = 'ADMIN-01',
            "adminNotes" = 'Disetujui melalui Aplikasi Inventory GA'
        WHERE id = $1
      `, [requestId]);

      // 5. Create System Audit Log in Helpdesk database
      const auditLogId = crypto.randomUUID();
      const details = `Alokasi perangkat ${requestItem.entityName} ke ${user.name} (${user.email}) disetujui via GA Inventory.`;
      await queryHelpdesk(`
        INSERT INTO helpdesk."SystemAuditLog" (id, action, details, "performedBy", "createdAt")
        VALUES ($1, $2, $3, 'Super Admin MRA (ADMIN-01)', NOW())
      `, [auditLogId, 'ASSET_ALLOCATED', details]);

    } else {
      // 3. Update the ApprovalRequest to REJECTED in Helpdesk database
      await queryHelpdesk(`
        UPDATE helpdesk."ApprovalRequest"
        SET status = 'REJECTED',
            "updatedAt" = NOW(),
            "handledById" = 'ADMIN-01',
            "adminNotes" = 'Ditolak melalui Aplikasi Inventory GA'
        WHERE id = $1
      `, [requestId]);

      // 4. Create System Audit Log in Helpdesk database
      const auditLogId = crypto.randomUUID();
      const details = `Permintaan alokasi perangkat ${requestItem.entityName} ditolak via GA Inventory.`;
      await queryHelpdesk(`
        INSERT INTO helpdesk."SystemAuditLog" (id, action, details, "performedBy", "createdAt")
        VALUES ($1, $2, $3, 'Super Admin MRA (ADMIN-01)', NOW())
      `, [auditLogId, 'ASSET_ALLOCATION_REJECTED', details]);
    }

    return NextResponse.json({ 
      success: true, 
      message: action === 'approve' 
        ? 'Alokasi berhasil disetujui dan diperbarui.' 
        : 'Alokasi berhasil ditolak.' 
    });
  } catch (err: any) {
    console.error('Failed to process approval action:', err);
    return NextResponse.json({ error: 'Gagal memproses tindakan persetujuan alokasi' }, { status: 500 });
  }
}
