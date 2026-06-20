import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryHelpdesk } from '@/lib/helpdeskDb';

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const requestId = parseInt(id);

  try {
    const body = await req.json();
    const { action } = body;

    if (!action || (action !== 'approve' && action !== 'reject')) {
      return NextResponse.json({ error: 'Action harus bernilai "approve" atau "reject"' }, { status: 400 });
    }

    // 1. Fetch the request details from GA database
    const requestRes = await query(
      'SELECT id, asset_id as "assetId", user_id as "userId", company_id as "companyId", company_master_id as "companyMasterId" FROM approval_requests WHERE id = $1',
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan atau sudah diproses' }, { status: 404 });
    }

    const requestItem = requestRes.rows[0];

    if (action === 'approve') {
      // 2. Update the Asset table in Helpdesk database
      await queryHelpdesk(`
        UPDATE helpdesk."Asset" 
        SET "userId" = $1, 
            "companyId" = $2, 
            "companyMasterId" = $3
        WHERE id = $4
      `, [
        requestItem.userId,
        requestItem.companyId,
        requestItem.companyMasterId,
        requestItem.assetId
      ]);
    }

    // 3. Delete the ApprovalRequest from GA database
    await query(
      'DELETE FROM approval_requests WHERE id = $1',
      [requestId]
    );

    return NextResponse.json({ 
      success: true, 
      message: action === 'approve' 
        ? 'Alokasi berhasil disetujui dan diperbarui.' 
        : 'Alokasi berhasil ditolak dan dihapus.' 
    });
  } catch (err: any) {
    console.error('Failed to process approval action:', err);
    return NextResponse.json({ error: 'Gagal memproses tindakan persetujuan alokasi' }, { status: 500 });
  }
}
