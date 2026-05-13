import LegalDocPage from '@/components/LegalDocPage';
import { UserCheck } from 'lucide-react';

export default function HrCompliancePage() {
  return (
    <LegalDocPage config={{
      module:        'hr_compliance',
      title:         'HR & Employment Compliance',
      subtitle:      'Pengelolaan dokumen ketenagakerjaan dan kepatuhan HR MRA Group.',
      icon:          <UserCheck size={36}/>,
      categories:    ['PKWT', 'PKWTT', 'Employee Warning Letter', 'Company Regulation', 'Lainnya'],
      idLabel:       'Nomor Dokumen / Karyawan',
      expiryLabel:   'Tgl Berakhir Kontrak',
      requireExpiry: true,
    }}/>
  );
}
