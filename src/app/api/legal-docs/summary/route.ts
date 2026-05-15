import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const revalidate = 30;

const LEGAL_MODULES      = ['contract', 'corporate', 'litigation'];
const COMPLIANCE_MODULES = ['license', 'monitoring', 'sop', 'hr_compliance', 'tax_finance', 'product_regulatory'];

const MODULE_LABELS: Record<string, string> = {
  contract:           'Contract',
  corporate:          'Corporate',
  litigation:         'Litigation',
  license:            'License',
  monitoring:         'Monitoring',
  sop:                'SOP',
  hr_compliance:      'HR',
  tax_finance:        'Tax',
  product_regulatory: 'Product',
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dept = searchParams.get('dept') || '';

    if (dept !== 'legal' && dept !== 'compliance') {
      return NextResponse.json(
        { error: "dept must be 'legal' or 'compliance'" },
        { status: 400 }
      );
    }

    const modules      = dept === 'legal' ? LEGAL_MODULES : COMPLIANCE_MODULES;
    const companyId    = searchParams.get('company_id') || '';
    
    // Build filter conditions
    let moduleFilter = `module IN (${modules.map((_, i) => `$${i + 1}`).join(',')})`;
    let companyFilter = companyId ? `AND company_id = $${modules.length + 1}` : '';
    let finalFilter = `${moduleFilter} ${companyFilter}`;
    
    const p = companyId ? [...modules, companyId] : modules;

    const [kpiRes, moduleRes, statusRes, confRes, expiryRes, critRes, companyRes] =
      await Promise.all([

        // A — KPI row
        query(
          `SELECT
             COUNT(*)                                                           AS total,
             COUNT(*) FILTER (WHERE doc_status = 'Active')                    AS active,
             COUNT(*) FILTER (
               WHERE expiry_date IS NOT NULL
                 AND expiry_date >= CURRENT_DATE
                 AND expiry_date <  CURRENT_DATE + INTERVAL '90 days'
             )                                                                  AS expiring_soon,
             COUNT(*) FILTER (
               WHERE expiry_date IS NOT NULL
                 AND expiry_date < CURRENT_DATE
             )                                                                  AS expired
           FROM legal_documents
           WHERE ${finalFilter}`, p
        ),

        // B — per-module breakdown
        query(
          `SELECT
             module,
             COUNT(*)                                                           AS total,
             COUNT(*) FILTER (
               WHERE expiry_date IS NOT NULL
                 AND expiry_date < CURRENT_DATE + INTERVAL '30 days'
             )                                                                  AS critical
           FROM legal_documents
           WHERE ${finalFilter}
           GROUP BY module
           ORDER BY module`, p
        ),

        // C — doc_status distribution
        query(
          `SELECT doc_status AS status, COUNT(*) AS count
           FROM legal_documents
           WHERE ${finalFilter}
           GROUP BY doc_status
           ORDER BY count DESC`, p
        ),

        // D — confidentiality distribution
        query(
          `SELECT confidentiality AS level, COUNT(*) AS count
           FROM legal_documents
           WHERE ${finalFilter}
           GROUP BY confidentiality
           ORDER BY count DESC`, p
        ),

        // E — expiry status by module (for grouped bar chart)
        query(
          `SELECT
             module,
             COUNT(*) FILTER (
               WHERE expiry_date IS NULL
                  OR expiry_date >= CURRENT_DATE + INTERVAL '90 days'
             )                                                                  AS "Valid",
             COUNT(*) FILTER (
               WHERE expiry_date IS NOT NULL
                 AND expiry_date >= CURRENT_DATE + INTERVAL '30 days'
                 AND expiry_date <  CURRENT_DATE + INTERVAL '90 days'
             )                                                                  AS "Warning",
             COUNT(*) FILTER (
               WHERE expiry_date IS NOT NULL
                 AND expiry_date >= CURRENT_DATE
                 AND expiry_date <  CURRENT_DATE + INTERVAL '30 days'
             )                                                                  AS "Critical",
             COUNT(*) FILTER (
               WHERE expiry_date IS NOT NULL
                 AND expiry_date < CURRENT_DATE
             )                                                                  AS "Expired"
           FROM legal_documents
           WHERE ${finalFilter}
           GROUP BY module
           ORDER BY module`, p
        ),

        // F — critical docs table (top 10)
        query(
          `SELECT
             id, module, doc_name, category, pic, doc_status, expiry_date,
             (expiry_date - CURRENT_DATE)                                       AS days_until_expiry,
             CASE
               WHEN expiry_date < CURRENT_DATE                           THEN 'Expired'
               WHEN expiry_date < CURRENT_DATE + INTERVAL '30 days'     THEN 'Critical'
               ELSE 'Warning'
             END                                                                AS status
           FROM legal_documents
           WHERE ${finalFilter}
             AND expiry_date IS NOT NULL
             AND expiry_date < CURRENT_DATE + INTERVAL '90 days'
           ORDER BY expiry_date ASC
           LIMIT 10`, p
        ),

        // G — per-company breakdown
        query(
          `SELECT
             c.name                                                             AS company_name,
             COUNT(*)                                                           AS total,
             COUNT(*) FILTER (WHERE l.expiry_date < CURRENT_DATE)               AS expired,
             COUNT(*) FILTER (
               WHERE l.expiry_date >= CURRENT_DATE
                 AND l.expiry_date <  CURRENT_DATE + INTERVAL '30 days'
             )                                                                  AS critical
           FROM legal_documents l
           LEFT JOIN m_company c ON l.company_id = c.id
           WHERE ${finalFilter.replace(/module/g, 'l.module').replace(/company_id/g, 'l.company_id')}
           GROUP BY c.name
           ORDER BY total DESC`, p
        ),
      ]);

    const kpi = kpiRes.rows[0] || { total: 0, active: 0, expiring_soon: 0, expired: 0 };

    return NextResponse.json({
      kpi: {
        total:        parseInt(kpi.total        || '0'),
        active:       parseInt(kpi.active       || '0'),
        expiringSoon: parseInt(kpi.expiring_soon || '0'),
        expired:      parseInt(kpi.expired      || '0'),
      },
      byModule: moduleRes.rows.map(r => ({
        module:   r.module,
        label:    MODULE_LABELS[r.module] || r.module,
        total:    parseInt(r.total    || '0'),
        critical: parseInt(r.critical || '0'),
      })),
      byDocStatus: statusRes.rows.map(r => ({
        status: r.status,
        count:  parseInt(r.count || '0'),
      })),
      byConfidentiality: confRes.rows.map(r => ({
        level: r.level,
        count: parseInt(r.count || '0'),
      })),
      byExpiryStatus: expiryRes.rows.map(r => ({
        module:   r.module,
        label:    MODULE_LABELS[r.module] || r.module,
        Valid:    parseInt(r.Valid    || '0'),
        Warning:  parseInt(r.Warning  || '0'),
        Critical: parseInt(r.Critical || '0'),
        Expired:  parseInt(r.Expired  || '0'),
      })),
      criticalDocs: critRes.rows,
      byCompany: companyRes.rows.map(r => ({
        name:     r.company_name || 'Unassigned',
        total:    parseInt(r.total    || '0'),
        expired:  parseInt(r.expired  || '0'),
        critical: parseInt(r.critical || '0'),
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
