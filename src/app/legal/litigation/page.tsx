import LegalDocPage from '@/components/LegalDocPage';
import { Gavel } from 'lucide-react';

export default function LitigationPage() {
  return (
    <LegalDocPage config={{
      module:        'litigation',
      title:         'Litigation & Dispute',
      subtitle:      'Pengelolaan dokumen sengketa dan litigasi MRA Group.',
      icon:          <Gavel size={36}/>,
      categories:    ['Gugatan', 'Somasi', 'Mediasi', 'Arbitrase', 'Lainnya'],
      idLabel:       'Nomor Perkara / Referensi',
      expiryLabel:   'Tgl Deadline / Sidang',
      requireExpiry: false,
    }}/>
  );
}
