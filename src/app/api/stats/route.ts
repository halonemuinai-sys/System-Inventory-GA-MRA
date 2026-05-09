import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    // Queries based on your schema.sql / etl script
    const stats = await Promise.all([
      query('SELECT COUNT(*) FROM vendors'),
      query('SELECT COUNT(*), SUM(acquisition_cost) FROM assets'),
      query('SELECT COUNT(*) FROM vehicles'),
      query('SELECT COUNT(*) FROM documents'),
      query('SELECT COUNT(*), SUM(price) FROM device_rentals'),
      query('SELECT COUNT(*) FROM insurances'),
    ]);

    return NextResponse.json({
      vendors: stats[0].rows[0].count,
      assets: {
        count: stats[1].rows[0].count,
        totalValue: stats[1].rows[0].sum || 0
      },
      vehicles: stats[2].rows[0].count,
      documents: stats[3].rows[0].count,
      rentals: {
        count: stats[4].rows[0].count,
        totalValue: stats[4].rows[0].sum || 0
      },
      insurances: stats[5].rows[0].count,
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
