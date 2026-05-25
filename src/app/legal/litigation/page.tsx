'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { Gavel } from 'lucide-react';

const CONFIG = {
  module: 'litigation',
  title: 'Litigation & Dispute',
  subtitle: 'Pengelolaan dokumen sengketa dan litigasi MRA Group.',
  icon: <Gavel size={14} />,
  categories: ['Gugatan', 'Somasi', 'Mediasi', 'Arbitrase', 'Lainnya'],
  idLabel: 'Nomor Perkara / Referensi',
  expiryLabel: 'Tgl Deadline / Sidang',
  requireExpiry: false,
};

export default function LitigationPage() {
  return <LegalDocPage config={CONFIG} />;
}
