import LegalDocPage from '@/components/LegalDocPage';
import { BookOpen } from 'lucide-react';

export default function SopPolicyPage() {
  return (
    <LegalDocPage config={{
      module:        'sop',
      title:         'SOP & Policy Documents',
      subtitle:      'Pengelolaan SOP dan kebijakan internal MRA Group.',
      icon:          <BookOpen size={36}/>,
      categories:    ['SOP Operasional', 'Code of Conduct', 'Procurement Policy', 'Lainnya'],
      idLabel:       'Kode SOP / Nomor Dokumen',
      expiryLabel:   'Tgl Review / Revisi',
      requireExpiry: true,
    }}/>
  );
}
