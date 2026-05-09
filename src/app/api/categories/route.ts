import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const assetCategories = await query(`
      SELECT mc.name as category, COUNT(a.id) as qty, SUM(a.acquisition_cost) as cost
      FROM m_asset_category mc
      LEFT JOIN assets a ON a.asset_category_id = mc.id
      GROUP BY mc.name
      ORDER BY qty DESC
    `);

    const rentalTypes = await query(`
      SELECT device_type as type, COUNT(*) as qty, SUM(price) as amount
      FROM device_rentals
      GROUP BY device_type
    `);

    const vehicleDist = await query(`
      SELECT vehicle_type as name, COUNT(*) as value
      FROM vehicles
      GROUP BY vehicle_type
      ORDER BY value DESC
    `);

    return NextResponse.json({
      assets: assetCategories.rows,
      rentals: rentalTypes.rows,
      vehicles: vehicleDist.rows
    });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}
