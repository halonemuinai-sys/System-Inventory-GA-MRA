'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { Building } from 'lucide-react';

const CONFIG = {
  module: 'corporate',
  title: 'Corporate Legal Documents',
  subtitle: 'Administrasi dokumen legal korporasi MRA Group.',
  icon: <Building size={14} />,
  categories: ['Akta Perusahaan', 'SK Menkumham', 'RUPS', 'Shareholder Resolution', 'Lainnya'],
  idLabel: 'Nomor Dokumen',
  expiryLabel: 'Tgl Berlaku / Review',
  requireExpiry: false,
};

export default function CorporateLegalPage() {
  return <LegalDocPage config={CONFIG} />;
}
