import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { queryHelpdesk } from '@/lib/helpdeskDb';

function mergeSpecs(brand: string, model: string, processor: string, os: string, ram: string, storage: string) {
  const specs = [];
  if (processor && processor.trim()) specs.push(processor.trim());
  specs.push(`RAM ${ram && ram.trim() ? ram.trim() : '—'}`);
  specs.push(`Storage ${storage && storage.trim() ? storage.trim() : '—'}`);
  if (os && os.trim()) specs.push(`OS ${os.trim()}`);
  return `${brand ? brand.trim() : ''} ${model ? model.trim() : ''} (${specs.join(', ')})`.trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page')  || '1'));
    const limit  = Math.min(100, Math.max(5, parseInt(searchParams.get('limit') || '20')));
    const search = searchParams.get('search') || '';
    const compFilter = searchParams.get('company') || '';
    const category = searchParams.get('category') || '';
    const offset = (page - 1) * limit;

    // 1. Try Live Query from Helpdesk
    try {
      const conds: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (search) {
        conds.push(`(
          a.brand ILIKE $${idx} OR 
          a.model ILIKE $${idx} OR 
          a."assetTag" ILIKE $${idx} OR 
          a."vendorRef" ILIKE $${idx} OR 
          u.name ILIKE $${idx} OR 
          u.email ILIKE $${idx} OR 
          u.department ILIKE $${idx} OR 
          c.name ILIKE $${idx} OR 
          cm.name ILIKE $${idx}
        )`);
        params.push(`%${search}%`);
        idx++;
      }

      if (compFilter) {
        conds.push(`(c.name = $${idx} OR cm.name = $${idx})`);
        params.push(compFilter);
        idx++;
      }

      const whereClause = conds.length ? `AND ${conds.join(' AND ')}` : '';

      const countSql = `
        SELECT COUNT(*) 
        FROM helpdesk."Asset" a
        LEFT JOIN helpdesk."User" u ON a."userId" = u.id
        LEFT JOIN helpdesk."Company" c ON a."companyId" = c.id
        LEFT JOIN helpdesk."CompanyMaster" cm ON a."companyMasterId" = cm.id
        WHERE a."ownershipType" = 'RENTAL' ${whereClause}
      `;

      const dataSql = `
        WITH formatted_assets AS (
          SELECT 
            a.id,
            a."vendorRef" as order_id,
            a."assetTag" as unit_code,
            a."rentalCost" as price,
            a."rentalStart" as start_rent,
            a."rentalEnd" as end_rent,
            u.email as user_email,
            u.name as user_name,
            u.department,
            COALESCE(c.name, cm.name, '') as company,
            a.brand, a.model, a.processor, a.os, a.ram, a.storage,
            CASE
              WHEN LOWER(a.status) = 'disposed' THEN 'Terminated'
              WHEN a."rentalEnd" < CURRENT_DATE THEN 'Expired'
              ELSE 'Active'
            END as status,
            CASE
              WHEN LOWER(a.model) LIKE '%iphone%' OR LOWER(a.model) LIKE '%galaxy%' OR LOWER(a.brand) IN ('oppo', 'vivo', 'samsung') THEN 'Smartphone'
              WHEN LOWER(a.model) LIKE '%imac%' OR LOWER(a.model) LIKE '%mac mini%' OR LOWER(a.model) LIKE '%all in one%' THEN 'iMac'
              WHEN LOWER(a.model) LIKE '%printer%' OR LOWER(a.model) LIKE '%canon%' OR LOWER(a.model) LIKE '%epson%' THEN 'Printer'
              ELSE 'Laptop'
            END as device_type
          FROM helpdesk."Asset" a
          LEFT JOIN helpdesk."User" u ON a."userId" = u.id
          LEFT JOIN helpdesk."Company" c ON a."companyId" = c.id
          LEFT JOIN helpdesk."CompanyMaster" cm ON a."companyMasterId" = cm.id
          WHERE a."ownershipType" = 'RENTAL' ${whereClause}
        )
        SELECT *,
               GREATEST(
                 COALESCE(
                   (EXTRACT(YEAR FROM end_rent) - EXTRACT(YEAR FROM start_rent)) * 12 + 
                   (EXTRACT(MONTH FROM end_rent) - EXTRACT(MONTH FROM start_rent)),
                   1
                 ),
                 1
               )::int as duration_months
        FROM formatted_assets
        ORDER BY end_rent ASC
        LIMIT $${idx} OFFSET $${idx+1}
      `;

      const [countRes, dataRes] = await Promise.all([
        queryHelpdesk(countSql, params),
        queryHelpdesk(dataSql, [...params, limit, offset])
      ]);

      const totalItems = parseInt(countRes.rows[0].count) || 0;
      
      const mappedData = dataRes.rows.map((r: any) => ({
        id: r.id,
        order_id: r.order_id,
        item_name: mergeSpecs(r.brand, r.model, r.processor, r.os, r.ram, r.storage),
        device_type: r.device_type,
        unit_code: r.unit_code,
        price: r.price,
        duration_months: r.duration_months,
        start_rent: r.start_rent,
        end_rent: r.end_rent,
        department: r.department,
        status: r.status,
        company: r.company,
        user_name: r.user_name || null,
        user_email: r.user_email || null
      }));

      return NextResponse.json({
        data: mappedData,
        total: totalItems,
        page, limit,
        totalPages: Math.ceil(totalItems / limit),
      });

    } catch (hdErr) {
      console.warn('Helpdesk live query failed, falling back to GA database:', hdErr);
      
      // 2. Fallback to GA local database
      const conds: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (search) {
        conds.push(`(r.item_name ILIKE $${idx} OR r.order_id ILIKE $${idx} OR v.vendor_name ILIKE $${idx} OR r.device_type ILIKE $${idx} OR r.unit_code ILIKE $${idx})`);
        params.push(`%${search}%`); 
        idx++;
      }

      if (compFilter) {
        if (/^\d+$/.test(compFilter)) {
          conds.push(`r.company_id = $${idx}`);
          params.push(parseInt(compFilter)); 
          idx++;
        } else {
          // Resolve string name mapping
          const gaCosRes = await query('SELECT id FROM m_company WHERE name = $1', [compFilter]);
          if (gaCosRes.rows.length > 0) {
            conds.push(`r.company_id = $${idx}`);
            params.push(gaCosRes.rows[0].id);
            idx++;
          } else {
            conds.push(`r.company_id = -1`);
          }
        }
      }

      if (category === 'IT') {
        conds.push(`r.device_type IN ('Laptop', 'Smartphone', 'iMac', 'PC', 'IT Device', 'Printer')`);
      }

      const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

      const [dataRes, countRes] = await Promise.all([
        query(`
          SELECT r.id, r.order_id, r.item_name, r.device_type, r.unit_code,
                 r.price, r.duration_months, r.start_rent, r.end_rent,
                 r.department, r.status,
                 c.name AS company, c.id AS company_id,
                 v.vendor_name, v.id AS vendor_id,
                 u.full_name AS user_name, u.email AS user_email
          FROM device_rentals r
          LEFT JOIN m_company c ON r.company_id = c.id
          LEFT JOIN vendors v ON r.vendor_id = v.id
          LEFT JOIN m_user u ON r.user_id = u.id
          ${where}
          ORDER BY r.end_rent ASC
          LIMIT $${idx} OFFSET $${idx+1}
        `, [...params, limit, offset]),
        query(`SELECT COUNT(*) FROM device_rentals r LEFT JOIN vendors v ON r.vendor_id = v.id ${where}`, params),
      ]);

      const totalItems = parseInt(countRes.rows[0].count) || 0;

      return NextResponse.json({
        data: dataRes.rows,
        total: totalItems,
        page, limit,
        totalPages: Math.ceil(totalItems / limit),
      });
    }

  } catch (error: any) {
    console.error('Failed to get rentals:', error);
    return NextResponse.json({ error: 'Failed to fetch rentals' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ 
    error: 'Modifikasi data sewa IT hanya dapat dilakukan melalui aplikasi Helpdesk.' 
  }, { status: 405 });
}
