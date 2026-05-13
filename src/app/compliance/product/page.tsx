import LegalDocPage from '@/components/LegalDocPage';
import { FlaskConical } from 'lucide-react';

export default function ProductRegulatoryPage() {
  return (
    <LegalDocPage config={{
      module:        'product_regulatory',
      title:         'Product Regulatory Documents',
      subtitle:      'Pengelolaan dokumen regulasi dan sertifikasi produk MRA Group.',
      icon:          <FlaskConical size={36}/>,
      categories:    ['COA', 'Health Certificate', 'Label Approval', 'Product Registration', 'Lainnya'],
      idLabel:       'Nomor Registrasi / Sertifikat',
      expiryLabel:   'Tgl Kadaluarsa Sertifikat',
      requireExpiry: true,
    }}/>
  );
}
