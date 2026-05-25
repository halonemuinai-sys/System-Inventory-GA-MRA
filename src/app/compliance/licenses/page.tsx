'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { BadgeCheck } from 'lucide-react';

const CONFIG = {
  module: 'license',
  title: 'License & Permit',
  subtitle: 'Pemantauan seluruh izin dan perizinan perusahaan MRA Group.',
  icon: <BadgeCheck size={14} />,
  categories: ['NIB', 'BPOM', 'Halal', 'OSS', 'API', 'SIUP', 'Lainnya'],
  idLabel: 'Nomor Izin / Sertifikat',
  expiryLabel: 'Tgl Kadaluarsa Izin',
  requireExpiry: true,
};

export default function LicensesPage() {
  return <LegalDocPage config={CONFIG} />;
}
