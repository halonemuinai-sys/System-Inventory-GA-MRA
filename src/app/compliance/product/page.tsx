'use client';

import LegalDocPage from '@/components/LegalDocPage';
import { FlaskConical } from 'lucide-react';

const CONFIG = {
  module: 'product_regulatory',
  title: 'Product Regulatory Documents',
  subtitle: 'Pengelolaan dokumen regulasi dan sertifikasi produk MRA Group.',
  icon: <FlaskConical size={14} />,
  categories: ['COA', 'Health Certificate', 'Label Approval', 'Product Registration', 'Lainnya'],
  idLabel: 'Nomor Registrasi / Sertifikat',
  expiryLabel: 'Tgl Kadaluarsa Sertifikat',
  requireExpiry: true,
};

export default function ProductRegulatoryPage() {
  return <LegalDocPage config={CONFIG} />;
}
