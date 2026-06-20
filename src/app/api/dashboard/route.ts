import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryHelpdesk } from '@/lib/helpdeskDb';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Fetch rentals data from Helpdesk with fallback
    const rentalData = { count: 0, value: 0 };
    let rentalTypeRows: any[] = [];
    let rentalVendorRows: any[] = [];

    try {
      const [hdRentalRes, hdTypeRes, hdVendorRes] = await Promise.all([
        queryHelpdesk(`SELECT COUNT(*) as count, COALESCE(SUM("rentalCost"),0) as value FROM helpdesk."Asset" WHERE "ownershipType" = 'RENTAL'`),
        queryHelpdesk(`
          SELECT 
            CASE
              WHEN LOWER(model) LIKE '%iphone%' OR LOWER(model) LIKE '%galaxy%' OR LOWER(brand) IN ('oppo', 'vivo', 'samsung') THEN 'Smartphone'
              WHEN LOWER(model) LIKE '%imac%' OR LOWER(model) LIKE '%mac mini%' OR LOWER(model) LIKE '%all in one%' THEN 'iMac'
              WHEN LOWER(model) LIKE '%printer%' OR LOWER(model) LIKE '%canon%' OR LOWER(model) LIKE '%epson%' THEN 'Printer'
              ELSE 'Laptop'
            END as type,
            COUNT(*) as qty, 
            COALESCE(SUM("rentalCost"),0) as amount
          FROM helpdesk."Asset" 
          WHERE "ownershipType" = 'RENTAL'
          GROUP BY 1 
          ORDER BY qty DESC
        `),
        queryHelpdesk(`
          SELECT COALESCE(vendor, 'Unknown Vendor') as vendor,
                 COUNT(*) as qty, COALESCE(SUM("rentalCost"),0) as amount
          FROM helpdesk."Asset"
          WHERE "ownershipType" = 'RENTAL'
          GROUP BY 1 ORDER BY qty DESC LIMIT 10
        `)
      ]);
      
      rentalData.count = parseInt(hdRentalRes.rows[0].count) || 0;
      rentalData.value = parseFloat(hdRentalRes.rows[0].value) || 0;
      rentalTypeRows = hdTypeRes.rows.map((r: any) => ({
        type: r.type,
        qty: parseInt(r.qty) || 0,
        amount: parseFloat(r.amount) || 0
      }));
      rentalVendorRows = hdVendorRes.rows.map((r: any) => ({
        vendor: r.vendor,
        qty: parseInt(r.qty) || 0,
        amount: parseFloat(r.amount) || 0
      }));
    } catch (hdErr) {
      console.warn('Dashboard Helpdesk live queries failed, falling back to GA DB:', hdErr);
      
      const [gaRentalRes, gaTypeRes, gaVendorRes] = await Promise.all([
        query(`SELECT COUNT(*) as count, COALESCE(SUM(price),0) as value FROM device_rentals`),
        query(`SELECT COALESCE(device_type,'Other') as type,
                 COUNT(*) as qty, COALESCE(SUM(price),0) as amount
               FROM device_rentals GROUP BY device_type ORDER BY qty DESC`),
        query(`SELECT COALESCE(v.vendor_name,'Unknown') as vendor,
                 COUNT(r.id) as qty, COALESCE(SUM(r.price),0) as amount
               FROM device_rentals r
               LEFT JOIN vendors v ON r.vendor_id = v.id
               GROUP BY v.vendor_name ORDER BY qty DESC LIMIT 10`)
      ]);

      rentalData.count = parseInt(gaRentalRes.rows[0].count) || 0;
      rentalData.value = parseFloat(gaRentalRes.rows[0].value) || 0;
      rentalTypeRows = gaTypeRes.rows.map((r: any) => ({
        type: r.type,
        qty: parseInt(r.qty) || 0,
        amount: parseFloat(r.amount) || 0
      }));
      rentalVendorRows = gaVendorRes.rows.map((r: any) => ({
        vendor: r.vendor,
        qty: parseInt(r.qty) || 0,
        amount: parseFloat(r.amount) || 0
      }));
    }

    // 2. Fetch other metrics from GA Database
    const [
      assetQ, vehicleQ, vendorQ, insuranceQ, documentQ,
      assetCatQ, assetCondQ, assetStatQ,
      insStatusQ, insTypeQ, insVendorQ,
      docStatusQ, vehTypeQ,
      expenseTotalQ, expenseCatQ, expenseLedgerQ, maintenanceCountQ,
    ] = await Promise.all([
      query(`SELECT COUNT(*) as count, COALESCE(SUM(acquisition_cost),0) as value FROM assets`),
      query(`SELECT COUNT(*) as count FROM vehicles`),
      query(`SELECT COUNT(*) as total,
               SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active,
               SUM(CASE WHEN status!='Active' THEN 1 ELSE 0 END) as inactive
             FROM vendors`),
      query(`SELECT COUNT(*) as total,
               SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active,
               COALESCE(SUM(premium_idr),0) as total_premium,
               COALESCE(SUM(coverage_idr),0) as total_coverage
             FROM insurances`),
      query(`SELECT COUNT(*) as total,
               SUM(CASE WHEN status='Active' THEN 1 ELSE 0 END) as active
             FROM documents`),
      query(`SELECT mc.name as category, COUNT(a.id) as qty, COALESCE(SUM(a.acquisition_cost),0) as cost
             FROM m_asset_category mc
             LEFT JOIN assets a ON a.asset_category_id = mc.id
             GROUP BY mc.id, mc.name ORDER BY mc.name`),
      query(`SELECT mc.name as condition, COUNT(a.id) as count
             FROM m_condition mc
             LEFT JOIN assets a ON a.condition_id = mc.id
             GROUP BY mc.id, mc.name ORDER BY count DESC`),
      query(`SELECT ms.name as status, COUNT(a.id) as count
             FROM m_status ms
             LEFT JOIN assets a ON a.status_id = ms.id
             GROUP BY ms.id, ms.name ORDER BY count DESC`),
      query(`SELECT
               CASE
                 WHEN end_date < CURRENT_DATE THEN 'Expired'
                 WHEN end_date IS NOT NULL AND end_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'Renewal'
                 ELSE 'Active'
               END as status,
               COUNT(*) as count,
               COALESCE(SUM(premium_idr),0) as premium,
               COALESCE(SUM(coverage_idr),0) as coverage
             FROM insurances GROUP BY 1 ORDER BY 1`),
      query(`SELECT COALESCE(insurance_type,'Other') as type, COUNT(*) as count
             FROM insurances GROUP BY insurance_type ORDER BY count DESC`),
      query(`SELECT COALESCE(insurance_company,'Unknown') as vendor,
               COUNT(*) as count, COALESCE(SUM(premium_idr),0) as premium
             FROM insurances GROUP BY insurance_company ORDER BY count DESC`),
      query(`SELECT
               CASE
                 WHEN valid_until < CURRENT_DATE THEN 'Expired'
                 WHEN valid_until IS NOT NULL AND valid_until <= CURRENT_DATE + INTERVAL '30 days' THEN 'Renewal'
                 ELSE 'Active'
               END as status,
               COUNT(*) as count
             FROM documents GROUP BY 1 ORDER BY 1`),
      query(`SELECT COALESCE(vehicle_type,'Other') as type, COUNT(*) as count
             FROM vehicles GROUP BY vehicle_type ORDER BY count DESC`),
      query(`SELECT COALESCE(SUM(budget_amount),0) as budget, COALESCE(SUM(actual_amount),0) as actual FROM expense_budget`),
      query(`SELECT c.name as category, COALESCE(SUM(eb.budget_amount),0) as budget, COALESCE(SUM(eb.actual_amount),0) as actual FROM expense_budget eb JOIN m_coa c ON eb.coa_id = c.id GROUP BY c.name ORDER BY actual DESC LIMIT 7`),
      query(`SELECT c.name as category, COALESCE(SUM(eb.budget_amount),0) as budget, COALESCE(SUM(eb.actual_amount),0) as actual FROM expense_budget eb JOIN m_coa c ON eb.coa_id = c.id GROUP BY c.name ORDER BY c.name ASC`),
      query(`SELECT COUNT(*) as count FROM maintenances`),
    ]);

    const totalAssets = parseInt(assetQ.rows[0].count) || 0;
    const totalStatusCount = assetStatQ.rows.reduce((s: number, r: any) => s + (parseInt(r.count) || 0), 0);
    const totalRentals = rentalData.count;

    return NextResponse.json({
      assets: {
        count: totalAssets,
        value: parseFloat(assetQ.rows[0].value) || 0,
      },
      rentals: {
        count: totalRentals,
        value: rentalData.value,
      },
      vehicles: {
        total: parseInt(vehicleQ.rows[0].count) || 0,
        byType: vehTypeQ.rows.map((r: any) => ({ name: r.type, value: parseInt(r.count) || 0 })),
      },
      vendors: {
        total: parseInt(vendorQ.rows[0].total) || 0,
        active: parseInt(vendorQ.rows[0].active) || 0,
        inactive: parseInt(vendorQ.rows[0].inactive) || 0,
      },
      insurance: {
        total: parseInt(insuranceQ.rows[0].total) || 0,
        active: parseInt(insuranceQ.rows[0].active) || 0,
        totalPremium: parseFloat(insuranceQ.rows[0].total_premium) || 0,
        totalCoverage: parseFloat(insuranceQ.rows[0].total_coverage) || 0,
        byStatus: insStatusQ.rows.map((r: any) => ({
          status: r.status,
          count: parseInt(r.count) || 0,
          premium: parseFloat(r.premium) || 0,
          coverage: parseFloat(r.coverage) || 0,
        })),
        byType: insTypeQ.rows.map((r: any) => ({ type: r.type, count: parseInt(r.count) || 0 })),
        byVendor: insVendorQ.rows.map((r: any) => ({
          vendor: r.vendor,
          count: parseInt(r.count) || 0,
          premium: parseFloat(r.premium) || 0,
        })),
      },
      documents: {
        total: parseInt(documentQ.rows[0].total) || 0,
        active: parseInt(documentQ.rows[0].active) || 0,
        byStatus: docStatusQ.rows.map((r: any) => ({ status: r.status, count: parseInt(r.count) || 0 })),
      },
      assetByCategory: assetCatQ.rows.map((r: any) => ({
        category: r.category,
        qty: parseInt(r.qty) || 0,
        cost: parseFloat(r.cost) || 0,
      })),
      assetCondition: assetCondQ.rows.map((r: any) => ({
        name: r.condition,
        value: parseInt(r.count) || 0,
      })),
      assetStatus: assetStatQ.rows.map((r: any) => ({
        status: r.status,
        count: parseInt(r.count) || 0,
        pct: totalStatusCount > 0
          ? ((parseInt(r.count) / totalStatusCount) * 100).toFixed(1)
          : '0.0',
      })),
      totalStatusCount,
      rentalByType: rentalTypeRows,
      rentalByVendor: rentalVendorRows,
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
