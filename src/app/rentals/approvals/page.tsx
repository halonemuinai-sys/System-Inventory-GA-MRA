'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, Check, X, Inbox, AlertCircle, HardDrive } from 'lucide-react';
import { Badge, TableShell } from '@/components/PageShared';

const fmtDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [processingId, setProcessingId] = useState<string|null>(null);
  const [processingType, setProcessingType] = useState<'approve'|'reject'|null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/rentals/approval-requests');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat daftar pengajuan');
      }
      setRequests(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (confirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} pengajuan alokasi ini?`)) {
      setProcessingId(id);
      setProcessingType(action);
      try {
        const res = await fetch(`/api/rentals/approval-requests/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Gagal memproses tindakan');
        }
        
        // Remove processed item from list
        setRequests(prev => prev.filter(r => r.id !== id));
        alert(data.message || 'Tindakan berhasil diproses.');
      } catch (err: any) {
        alert('Gagal memproses: ' + err.message);
      } finally {
        setProcessingId(null);
        setProcessingType(null);
      }
    }
  };

  return (
    <div className="container animate-fade-in pb-12">
      <div className="page-header mb-6">
        <div>
          <h1 className="header-title">Persetujuan Alokasi Rental</h1>
          <p className="header-subtitle">Setujui atau tolak alokasi pengalihan perangkat IT sewa langsung ke basis data Helpdesk.</p>
        </div>
      </div>

      {error ? (
        <div className="error-alert-container">
          <AlertCircle size={36} className="text-rose mb-3" />
          <p className="text-rose-bold">{error}</p>
          <p className="text-xs text-text-3 mt-1 mb-4">Pastikan tabel database helpdesk."ApprovalRequest" sudah dibuat.</p>
          <button className="btn btn-primary" onClick={loadRequests}>Coba Lagi</button>
        </div>
      ) : (
        <TableShell 
          headers={[
            { label: 'No' }, 
            { label: 'Perangkat / Unit' }, 
            { label: 'Target Karyawan' }, 
            { label: 'Target Perusahaan' }, 
            { label: 'Tanggal Pengajuan' }, 
            { label: 'Status' },
            { label: 'Tindakan', right: true }
          ]} 
          loading={loading} 
          colSpan={7}
        >
          {requests.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-16 text-center">
                <Inbox size={48} className="text-text-3 mx-auto mb-3 block" />
                <p className="text-sm-bold text-text-2">Tidak ada pengajuan alokasi pending</p>
                <p className="text-xs-muted mt-1">Semua pengajuan alokasi telah diproses.</p>
              </td>
            </tr>
          ) : (
            requests.map((r, idx) => {
              const isProcessing = processingId === r.id;
              return (
                <tr key={r.id} className="hover-row">
                  <td className="td-p text-sm text-text-3 font-mono">{idx + 1}</td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{r.brand} {r.model}</div>
                    <div className="text-xs-muted mt-0.5">Tag: {r.unit_code || '—'} · Ref Billing: {r.order_id || '—'}</div>
                  </td>
                  <td className="td-p">
                    <div className="text-sm-bold text-text">{r.user_name || '—'}</div>
                    <div className="text-xs-muted mt-0.5">{r.user_email || '—'}</div>
                  </td>
                  <td className="td-p">
                    <div className="text-sm font-600 text-text-2">{r.company_name || '—'}</div>
                  </td>
                  <td className="td-p">
                    <div className="text-xs text-text-2">{fmtDate(r.createdAt)}</div>
                  </td>
                  <td className="td-p">
                    <Badge label={r.status} colorClass="badge-amber" />
                  </td>
                  <td className="td-p text-right">
                    <div className="flex-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleAction(r.id, 'approve')}
                        disabled={isProcessing}
                        className="btn btn-primary btn-sm flex items-center gap-1"
                        title="Setujui Pengajuan"
                      >
                        {isProcessing && processingType === 'approve' ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <Check size={13} />
                        )}
                        Setujui
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAction(r.id, 'reject')}
                        disabled={isProcessing}
                        className="btn btn-outline btn-sm flex items-center gap-1 text-rose hover:bg-rose-50 border-rose/30"
                        title="Tolak Pengajuan"
                      >
                        {isProcessing && processingType === 'reject' ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <X size={13} />
                        )}
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </TableShell>
      )}
    </div>
  );
}
