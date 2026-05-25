'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { UserCheck } from 'lucide-react';

const CONFIG = {
  module: 'hr_compliance',
  title: 'HR & Employment Compliance',
  subtitle: 'Pengelolaan dokumen ketenagakerjaan dan kepatuhan HR MRA Group.',
  icon: <UserCheck size={14} />,
  categories: ['PKWT', 'PKWTT', 'Employee Warning Letter', 'Company Regulation', 'Lainnya'],
  idLabel: 'Nomor Dokumen / Karyawan',
  expiryLabel: 'Tgl Berakhir Kontrak',
  requireExpiry: true,
};

export default function HrCompliancePage() {
  return <LegalDocPage config={CONFIG} />;
}
