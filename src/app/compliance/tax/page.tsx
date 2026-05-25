'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { Landmark } from 'lucide-react';

const CONFIG = {
  module: 'tax_finance',
  title: 'Tax & Finance Compliance',
  subtitle: 'Pengelolaan dokumen perpajakan dan kepatuhan keuangan MRA Group.',
  icon: <Landmark size={14} />,
  categories: ['Tax Report', 'Transfer Pricing', 'Faktur Pajak', 'Lainnya'],
  idLabel: 'Nomor Dokumen / NPWP',
  expiryLabel: 'Tgl Jatuh Tempo / Deadline',
  requireExpiry: true,
};

export default function TaxFinancePage() {
  return <LegalDocPage config={CONFIG} />;
}
