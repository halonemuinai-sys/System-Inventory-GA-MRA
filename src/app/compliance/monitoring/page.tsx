import LegalDocPage from '@/components/LegalDocPage';
import { ClipboardList } from 'lucide-react';

export default function ComplianceMonitoringPage() {
  return (
    <LegalDocPage config={{
      module:        'monitoring',
      title:         'Compliance Documents',
      subtitle:      'Monitoring kepatuhan regulasi internal dan eksternal MRA Group.',
      icon:          <ClipboardList size={36}/>,
      categories:    ['Audit Report', 'Compliance Checklist', 'Regulatory Update', 'Lainnya'],
      idLabel:       'Nomor Referensi',
      expiryLabel:   'Tgl Review',
      requireExpiry: false,
    }}/>
  );
}
