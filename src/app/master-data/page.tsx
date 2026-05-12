'use client';

import { useEffect, useState } from 'react';
import { Database, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react';
import { Badge, ModalShell, FF, FormError, TableShell } from '@/components/PageShared';

const masterTables = [
  { id: 'm_company', label: 'Perusahaan (Company)' },
  { id: 'm_asset_category', label: 'Kategori Aset' },
  { id: 'm_asset_type', label: 'Tipe Aset' },
  { id: 'm_condition', label: 'Kondisi' },
  { id: 'm_status', label: 'Status' },
];

export default function MasterDataConfig() {
  const [activeTable, setActiveTable] = useState(masterTables[0].id);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = async (table: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/master-data?table=${table}`);
      const json = await res.json();
      if (res.ok) {
        setData(json.data || []);
      } else {
        alert(json.error || 'Gagal memuat data');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeTable);
  }, [activeTable]);

  const handleOpenModal = (item?: any) => {
    setErrorMsg('');
    if (item) {
      setEditItem(item);
      setFormName(item.name);
    } else {
      setEditItem(null);
      setFormName('');
    }
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('Nama tidak boleh kosong');
      return;
    }
    
    setSaving(true);
    setErrorMsg('');
    try {
      const isEdit = !!editItem;
      const method = isEdit ? 'PUT' : 'POST';
      const body = isEdit 
        ? { table: activeTable, id: editItem.id, name: formName }
        : { table: activeTable, name: formName };

      const res = await fetch('/api/master-data', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const json = await res.json();
      
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan data');
      
      setShowModal(false);
      loadData(activeTable); // reload
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (item: any) => {
    setDeleteItem(item);
  };

  const executeDelete = async () => {
    if (!deleteItem) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/master-data?table=${activeTable}&id=${deleteItem.id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus data');
      
      setDeleteItem(null);
      loadData(activeTable);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container animate-slide-up">
      <div className="page-header">
        <div>
          <h1 className="header-title flex-center gap-3 justify-start">
            <div className="stat-icon-wrapper bg-blue-light text-blue"><Database size={20} /></div>
            Master Data Config
          </h1>
          <p className="header-subtitle">Kelola data referensi utama sistem</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar for tables */}
        <div className="lg:col-span-1">
          <div className="card p-4">
            <p className="text-xs-bold mb-3 text-text-3">PILIH TABEL</p>
            <div className="flex flex-col gap-2">
              {masterTables.map(t => (
                <button
                  key={t.id}
                  className={`text-left px-4 py-2.5 rounded-xl font-600 text-sm transition-all border ${
                    activeTable === t.id 
                      ? 'bg-blue text-white border-blue shadow-md' 
                      : 'bg-surface-2 text-text-2 border-transparent hover:border-border hover:bg-surface'
                  }`}
                  onClick={() => setActiveTable(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:col-span-3">
          <div className="card">
            <div className="flex-between mb-4">
              <h2 className="text-sm font-800 text-text uppercase letter-wide">
                {masterTables.find(t => t.id === activeTable)?.label}
              </h2>
              <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                <Plus size={16} /> Tambah Data
              </button>
            </div>

            <TableShell 
              headers={[
                { label: 'ID' },
                { label: 'NAMA' },
                { label: 'AKSI', right: true }
              ]} 
              loading={loading} 
              colSpan={3}
            >
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={3}>
                    <div className="no-data-placeholder">Tidak ada data.</div>
                  </td>
                </tr>
              ) : (
                data.map(item => (
                  <tr key={item.id} className="hover:bg-surface-2 transition-colors">
                    <td className="w-20"><Badge label={`#${item.id}`} /></td>
                    <td className="font-500 text-text">{item.name}</td>
                    <td>
                      <div className="flex-end gap-2">
                        <button 
                          className="btn-icon" 
                          onClick={() => handleOpenModal(item)}
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          className="btn-icon text-rose hover:bg-rose hover:text-white border-rose-200" 
                          onClick={() => confirmDelete(item)}
                          title="Hapus"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </TableShell>
          </div>
        </div>
      </div>

      {showModal && (
        <ModalShell title={editItem ? 'Edit Data' : 'Tambah Data'} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave} className="flex flex-col gap-4">
            <FormError msg={errorMsg} />
            <FF label="Nama" required>
              <input
                type="text"
                className="input-premium"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="Masukkan nama data..."
                autoFocus
              />
            </FF>
            <div className="modal-footer-border mt-2">
              <button type="button" className="btn" onClick={() => setShowModal(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Menyimpan...</> : <><Save size={16} /> Simpan</>}
              </button>
            </div>
          </form>
        </ModalShell>
      )}

      {deleteItem && (
        <ModalShell 
          title="" 
          onClose={() => !deleting && setDeleteItem(null)} 
          size="sm"
          overlayClassName="modal-top-align"
          containerClassName="modal-top-content"
        >
          <div className="flex flex-col gap-3 text-center items-center py-2">
            <div className="w-12 h-12 bg-rose-light text-rose rounded-full flex items-center justify-center mb-1">
              <Trash2 size={24} />
            </div>
            <h3 className="text-md font-800 text-text">Hapus Data?</h3>
            <p className="text-sm text-text-2">
              Anda yakin ingin menghapus <b>{deleteItem.name}</b>?
            </p>
            <div className="flex gap-3 w-full mt-2">
              <button 
                type="button" 
                className="btn flex-1 justify-center py-2" 
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
              >
                Batal
              </button>
              <button 
                type="button" 
                className="btn bg-rose text-white border-none flex-1 justify-center py-2 hover:opacity-90" 
                onClick={executeDelete}
                disabled={deleting}
              >
                {deleting ? <><Loader2 size={16} className="animate-spin" /> ...</> : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
