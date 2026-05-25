'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { FileSignature } from 'lucide-react';

const CONFIG = {
  module: 'contract',
  title: 'Contract & Agreement',
  subtitle: 'Monitoring seluruh perjanjian dan kontrak perusahaan MRA Group.',
  icon: <FileSignature size={14} />,
  categories: ['Vendor Agreement', 'Lease Agreement', 'NDA', 'Distribution Agreement', 'Lainnya'],
  idLabel: 'Nomor Kontrak',
  expiryLabel: 'Tgl Berakhir Kontrak',
  requireExpiry: true,
};

export default function ContractsPage() {
  return <LegalDocPage config={CONFIG} />;
}
