'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { ClipboardList } from 'lucide-react';

const CONFIG = {
  module: 'monitoring',
  title: 'Compliance Documents',
  subtitle: 'Monitoring kepatuhan regulasi internal dan eksternal MRA Group.',
  icon: <ClipboardList size={14} />,
  categories: ['Audit Report', 'Compliance Checklist', 'Regulatory Update', 'Lainnya'],
  idLabel: 'Nomor Referensi',
  expiryLabel: 'Tgl Review',
  requireExpiry: false,
};

export default function ComplianceMonitoringPage() {
  return <LegalDocPage config={CONFIG} />;
}
