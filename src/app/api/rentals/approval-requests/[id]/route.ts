import { NextResponse } from 'next/server';
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

    // 1. Fetch the request details
    const requestRes = await queryHelpdesk(
      'SELECT * FROM helpdesk."ApprovalRequest" WHERE id = $1',
      [requestId]
    );

    if (requestRes.rows.length === 0) {
      return NextResponse.json({ error: 'Pengajuan tidak ditemukan atau sudah diproses' }, { status: 404 });
    }

    const requestItem = requestRes.rows[0];

    if (action === 'approve') {
      // 2. Update the Asset table
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

    // 3. Delete the ApprovalRequest (Delete Approval Requests tapi pakai ini)
    await queryHelpdesk(
      'DELETE FROM helpdesk."ApprovalRequest" WHERE id = $1',
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
    return NextResponse.json({ error: 'Gagal memproses persetujuan alokasi' }, { status: 500 });
  }
}
