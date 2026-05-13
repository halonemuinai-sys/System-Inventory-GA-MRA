import LegalDocPage from '@/components/LegalDocPage';
import { Building2 } from 'lucide-react';

export default function CorporateLegalPage() {
  return (
    <LegalDocPage config={{
      module:        'corporate',
      title:         'Corporate Legal Documents',
      subtitle:      'Administrasi dokumen legal korporasi MRA Group.',
      icon:          <Building2 size={36}/>,
      categories:    ['Akta Perusahaan', 'SK Menkumham', 'RUPS', 'Shareholder Resolution', 'Lainnya'],
      idLabel:       'Nomor Dokumen',
      expiryLabel:   'Tgl Berlaku / Review',
      requireExpiry: false,
    }}/>
  );
}
