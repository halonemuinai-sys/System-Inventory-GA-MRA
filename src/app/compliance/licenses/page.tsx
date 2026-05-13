import LegalDocPage from '@/components/LegalDocPage';
import { BadgeCheck } from 'lucide-react';

export default function LicensesPage() {
  return (
    <LegalDocPage config={{
      module:        'license',
      title:         'License & Permit',
      subtitle:      'Pemantauan seluruh izin dan perizinan perusahaan MRA Group.',
      icon:          <BadgeCheck size={36}/>,
      categories:    ['NIB', 'BPOM', 'Halal', 'OSS', 'API', 'SIUP', 'Lainnya'],
      idLabel:       'Nomor Izin / Sertifikat',
      expiryLabel:   'Tgl Kadaluarsa Izin',
      requireExpiry: true,
    }}/>
  );
}
