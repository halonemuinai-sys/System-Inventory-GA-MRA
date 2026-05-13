import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const res = await query(
      `SELECT id, module, doc_name, category, expiry_date, pic,
              CASE
                WHEN expiry_date < CURRENT_DATE THEN 'Expired'
                WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days' THEN 'Critical'
                WHEN expiry_date < CURRENT_DATE + INTERVAL '90 days' THEN 'Warning'
                ELSE 'Valid'
              END AS status,
              (expiry_date - CURRENT_DATE) AS days_until_expiry
       FROM legal_documents
       WHERE expiry_date IS NOT NULL
         AND expiry_date < CURRENT_DATE + INTERVAL '90 days'
       ORDER BY expiry_date ASC
       LIMIT 20`,
      []
    );

    // count per module for sidebar badges
    const perModule: Record<string, number> = {};
    for (const row of res.rows) {
      perModule[row.module] = (perModule[row.module] || 0) + 1;
    }

    return NextResponse.json({ total: res.rows.length, perModule, items: res.rows });
  } catch {
    return NextResponse.json({ total: 0, perModule: {}, items: [] });
  }
}
