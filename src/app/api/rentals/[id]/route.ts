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

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    // 1. Try Live Query from Helpdesk
    try {
      const dataSql = `
        WITH formatted_assets AS (
          SELECT 
            a.id,
            a."vendorRef" as order_id,
            a.vendor as vendor_name,
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
          WHERE a.id = $1
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
      `;

      const res = await queryHelpdesk(dataSql, [id]);
      
      if (res.rows.length > 0) {
        const r = res.rows[0];
        return NextResponse.json({
          id: r.id,
          order_id: r.order_id,
          vendor_name: r.vendor_name || null,
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
        });
      }
    } catch (hdErr) {
      console.warn('Helpdesk detail live query failed, falling back to GA database:', hdErr);
    }

    // 2. Fallback to GA local database
    if (/^\d+$/.test(id)) {
      const res = await query(`
        SELECT r.*, c.name AS company, v.vendor_name,
               u.full_name AS user_name, u.email AS user_email
        FROM device_rentals r
        LEFT JOIN m_company c ON r.company_id = c.id
        LEFT JOIN vendors v ON r.vendor_id = v.id
        LEFT JOIN m_user u ON r.user_id = u.id
        WHERE r.id = $1`, [parseInt(id)]);
      
      if (res.rows.length > 0) {
        return NextResponse.json(res.rows[0]);
      }
    }

    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  } catch (error: any) {
    console.error('Failed to get rental details:', error);
    return NextResponse.json({ error: 'Failed to fetch rental details' }, { status: 500 });
  }
}

export async function PUT() {
  return NextResponse.json({ 
    error: 'Modifikasi data sewa IT hanya dapat dilakukan melalui aplikasi Helpdesk.' 
  }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ 
    error: 'Modifikasi data sewa IT hanya dapat dilakukan melalui aplikasi Helpdesk.' 
  }, { status: 405 });
}
