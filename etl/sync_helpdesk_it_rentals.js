/**
 * ETL Sync Script: IT Helpdesk MRA -> System Inventory MRA
 * 
 * This script runs independently to fetch IT rentals and owned assets from the Helpdesk database
 * and synchronize them into the General Affairs (GA) System Inventory database.
 * 
 * Run using: node etl/sync_helpdesk_it_rentals.js
 */

const { Client } = require('pg');
const path = require('path');

// Load .env.local from System Inventory MRA directory
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const HELPDESK_URL = process.env.HELPDESK_DATABASE_URL;
const GA_URL = process.env.DATABASE_URL;

if (!HELPDESK_URL) {
  console.error('ERROR: HELPDESK_DATABASE_URL is not set in .env.local');
  process.exit(1);
}
if (!GA_URL) {
  console.error('ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

// Helper to normalize company names for matching
function normalizeCompany(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/\bpt\b\.?/g, '')
    .replace(/,\s*pt\.?/g, '')
    .replace(/\bcv\b\.?/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper to merge specs into a single item_name string
function mergeSpecs(brand, model, processor, os, ram, storage) {
  const specs = [];
  if (processor && processor.trim()) specs.push(processor.trim());
  specs.push(`RAM ${ram && ram.trim() ? ram.trim() : '—'}`);
  specs.push(`Storage ${storage && storage.trim() ? storage.trim() : '—'}`);
  if (os && os.trim()) specs.push(`OS ${os.trim()}`);
  return `${brand ? brand.trim() : ''} ${model ? model.trim() : ''} (${specs.join(', ')})`.trim();
}

async function main() {
  console.log('=== STARTING IT ASSET SYNC PIPELINE ===');
  
  const helpdeskClient = new Client({
    connectionString: HELPDESK_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  const gaClient = new Client({
    connectionString: GA_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Connecting to databases...');
    await helpdeskClient.connect();
    await gaClient.connect();
    console.log('Databases connected successfully.');

    // 1. Fetch lookup maps from GA Database
    console.log('Fetching lookup references from GA system...');
    
    // Set search path for GA
    await gaClient.query('SET search_path TO ga, public');

    // Fetch Companies
    const gaCompaniesRes = await gaClient.query('SELECT id, name FROM m_company WHERE is_active = true');
    const gaCompanies = gaCompaniesRes.rows;
    console.log(`Loaded ${gaCompanies.length} active companies from GA.`);

    // Fetch Category ID for IT Electronic Equipment
    const itCatName = 'Office & IT Electronic Equip';
    let itCatId = null;
    const catRes = await gaClient.query('SELECT id FROM m_asset_category WHERE name = $1', [itCatName]);
    if (catRes.rows.length > 0) {
      itCatId = catRes.rows[0].id;
    } else {
      const newCat = await gaClient.query('INSERT INTO m_asset_category (name) VALUES ($1) RETURNING id', [itCatName]);
      itCatId = newCat.rows[0].id;
      console.log(`Created new asset category: "${itCatName}" (ID: ${itCatId})`);
    }

    // Fetch Conditions and Statuses
    const condRes = await gaClient.query('SELECT id, name FROM m_condition');
    const statRes = await gaClient.query('SELECT id, name FROM m_status');
    const condMap = Object.fromEntries(condRes.rows.map(r => [r.name, r.id]));
    const statMap = Object.fromEntries(statRes.rows.map(r => [r.name, r.id]));

    // Fetch GA Users
    const gaUsersRes = await gaClient.query('SELECT id, email FROM m_user WHERE is_active = true');
    const gaUsersMap = Object.fromEntries(gaUsersRes.rows.map(r => [r.email.toLowerCase(), r.id]));

    // 2. Fetch data from Helpdesk Database
    console.log('Fetching assets and user mappings from Helpdesk...');
    
    // Fetch all companies and company masters to resolve names
    const hdCompaniesRes = await helpdeskClient.query('SELECT id, name FROM helpdesk."Company"');
    const hdMastersRes = await helpdeskClient.query('SELECT id, name FROM helpdesk."CompanyMaster"');
    const hdCompanyMap = Object.fromEntries(hdCompaniesRes.rows.map(r => [r.id, r.name]));
    const hdMasterMap = Object.fromEntries(hdMastersRes.rows.map(r => [r.id, r.name]));

    // Fetch assets
    const hdAssetsRes = await helpdeskClient.query(`
      SELECT a.*, u.email as user_email, u.department as user_dept 
      FROM helpdesk."Asset" a
      LEFT JOIN helpdesk."User" u ON a."userId" = u.id
    `);
    const hdAssets = hdAssetsRes.rows;
    console.log(`Loaded ${hdAssets.length} assets from IT Helpdesk.`);

    // 3. Process and Synchronize
    let rentalSyncCount = 0;
    let ownedSyncCount = 0;

    for (const asset of hdAssets) {
      // Resolve company name
      let companyName = '';
      if (asset.companyId && hdCompanyMap[asset.companyId]) {
        companyName = hdCompanyMap[asset.companyId];
      } else if (asset.companyMasterId && hdMasterMap[asset.companyMasterId]) {
        companyName = hdMasterMap[asset.companyMasterId];
      }

      // Map to GA company_id
      let gaCompanyId = null;
      if (companyName) {
        const normName = normalizeCompany(companyName);
        const match = gaCompanies.find(c => normalizeCompany(c.name) === normName);
        if (match) {
          gaCompanyId = match.id;
        }
      }

      // Fallback if company not matched: Mugi Rekso Abadi, PT (usually ID 1 or matches name)
      if (!gaCompanyId) {
        const fallback = gaCompanies.find(c => c.name.includes('Mugi Rekso Abadi'));
        gaCompanyId = fallback ? fallback.id : (gaCompanies[0] ? gaCompanies[0].id : null);
      }

      if (!gaCompanyId) {
        console.warn(`WARNING: Skipping asset ${asset.assetTag} because no company could be resolved.`);
        continue;
      }

      // Resolve PIC User ID
      let gaUserId = null;
      if (asset.user_email) {
        gaUserId = gaUsersMap[asset.user_email.toLowerCase()] || null;
      }

      // Mapped specs
      const brand = asset.brand || '';
      const model = asset.model || '';
      const processor = asset.processor || '';
      const os = asset.os || '';
      const ram = asset.ram || '';
      const storage = asset.storage || '';
      
      const item_name = mergeSpecs(brand, model, processor, os, ram, storage);

      if (asset.ownershipType === 'RENTAL') {
        // --- SYNC TO ga.device_rentals ---
        
        // Deduce device_type
        let device_type = 'Laptop';
        const modelLower = model.toLowerCase();
        const brandLower = brand.toLowerCase();
        if (modelLower.includes('iphone') || modelLower.includes('galaxy') || brandLower === 'oppo' || brandLower === 'vivo' || brandLower === 'samsung') {
          device_type = 'Smartphone';
        } else if (modelLower.includes('imac') || modelLower.includes('mac mini') || modelLower.includes('all in one')) {
          device_type = 'iMac';
        } else if (modelLower.includes('printer') || modelLower.includes('canon') || modelLower.includes('epson')) {
          device_type = 'Printer';
        }

        // Calculate duration if start/end dates are present
        let duration_months = null;
        if (asset.rentalStart && asset.rentalEnd) {
          const start = new Date(asset.rentalStart);
          const end = new Date(asset.rentalEnd);
          duration_months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
          if (duration_months <= 0) duration_months = 1;
        }

        // Map status
        let rentalStatus = 'Active';
        if (asset.status === 'DISPOSED') {
          rentalStatus = 'Terminated';
        } else if (asset.rentalEnd && new Date(asset.rentalEnd) < new Date()) {
          rentalStatus = 'Expired';
        }

        // Check if rental exists in GA database by unit_code (assetTag)
        const checkRes = await gaClient.query('SELECT id FROM ga.device_rentals WHERE unit_code = $1', [asset.assetTag]);
        
        if (checkRes.rows.length > 0) {
          // Update existing rental
          await gaClient.query(`
            UPDATE ga.device_rentals SET
              company_id = $1,
              device_type = $2,
              order_id = $3,
              item_name = $4,
              price = $5,
              duration_months = $6,
              start_rent = $7,
              end_rent = $8,
              user_id = $9,
              department = $10,
              status = $11
            WHERE id = $12
          `, [
            gaCompanyId,
            device_type,
            asset.vendorRef || null, // Order ID matches vendorRef
            item_name,
            asset.rentalCost || 0,
            duration_months,
            asset.rentalStart || null,
            asset.rentalEnd || null,
            gaUserId,
            asset.user_dept || null,
            rentalStatus,
            checkRes.rows[0].id
          ]);
        } else {
          // Insert new rental
          await gaClient.query(`
            INSERT INTO ga.device_rentals (
              company_id, device_type, order_id, item_name, price, 
              unit_code, duration_months, start_rent, end_rent, user_id, department, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            gaCompanyId,
            device_type,
            asset.vendorRef || null,
            item_name,
            asset.rentalCost || 0,
            asset.assetTag,
            duration_months,
            asset.rentalStart || null,
            asset.rentalEnd || null,
            gaUserId,
            asset.user_dept || null,
            rentalStatus
          ]);
        }
        rentalSyncCount++;

      } else {
        // --- SYNC TO ga.assets (OWNED) ---
        
        // Resolve type id (Laptop, PC, Smartphone, etc.)
        let typeName = 'Laptop';
        const modelLower = model.toLowerCase();
        if (modelLower.includes('iphone') || modelLower.includes('galaxy')) {
          typeName = 'Smartphone';
        } else if (modelLower.includes('imac') || modelLower.includes('mac mini')) {
          typeName = 'iMac';
        } else if (modelLower.includes('printer')) {
          typeName = 'Printer';
        }
        
        let typeId = null;
        const typeCheck = await gaClient.query('SELECT id FROM ga.m_asset_type WHERE category_id = $1 AND name = $2', [itCatId, typeName]);
        if (typeCheck.rows.length > 0) {
          typeId = typeCheck.rows[0].id;
        } else {
          const newType = await gaClient.query('INSERT INTO ga.m_asset_type (category_id, name) VALUES ($1, $2) RETURNING id', [itCatId, typeName]);
          typeId = newType.rows[0].id;
        }

        // Map status and conditions
        let conditionId = condMap['Good'] || 1;
        let statusId = statMap['Active'] || 1;

        if (asset.status === 'AVAILABLE') {
          conditionId = condMap['Good'] || 1;
          statusId = statMap['Idle'] || 2;
        } else if (asset.status === 'MAINTENANCE') {
          conditionId = condMap['Needs Maintenance'] || 2;
          statusId = statMap['Active'] || 1;
        } else if (asset.status === 'DISPOSED') {
          conditionId = condMap['Damaged'] || 3;
          statusId = statMap['Disposed'] || 4;
        }

        const detailsText = `Specs: Processor: ${processor || '—'}, RAM: ${ram || '—'}, Storage: ${storage || '—'}, OS: ${os || '—'}, Office: ${asset.office || '—'}`;

        // Upsert into ga.assets
        await gaClient.query(`
          INSERT INTO ga.assets (
            company_id, asset_code, asset_category_id, asset_type_id, asset_name, 
            details, pic_id, acquisition_date, acquisition_cost, condition_id, status_id, information
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          ON CONFLICT (asset_code) DO UPDATE SET
            company_id = EXCLUDED.company_id,
            asset_category_id = EXCLUDED.asset_category_id,
            asset_type_id = EXCLUDED.asset_type_id,
            asset_name = EXCLUDED.asset_name,
            details = EXCLUDED.details,
            pic_id = EXCLUDED.pic_id,
            acquisition_date = EXCLUDED.acquisition_date,
            acquisition_cost = EXCLUDED.acquisition_cost,
            condition_id = EXCLUDED.condition_id,
            status_id = EXCLUDED.status_id,
            information = EXCLUDED.information,
            updated_at = NOW()
        `, [
          gaCompanyId,
          asset.assetTag, // asset_code matches assetTag
          itCatId,
          typeId,
          `${brand} ${model}`,
          detailsText,
          gaUserId,
          asset.rentalStart || null, // Owned purchase/lease start date
          asset.rentalCost || 0,     // Owned purchase cost if mapped
          conditionId,
          statusId,
          asset.notes || null
        ]);
        
        ownedSyncCount++;
      }
    }

    console.log(`Synchronization summary:`);
    console.log(`- Synced ${rentalSyncCount} RENTAL IT assets to ga.device_rentals.`);
    console.log(`- Synced ${ownedSyncCount} OWNED IT assets to ga.assets.`);
    console.log('=== INTEGRATION PIPELINE COMPLETED SUCCESSFULLY ===');

  } catch (error) {
    console.error('ERROR during synchronization process:', error);
  } finally {
    await helpdeskClient.end();
    await gaClient.end();
    console.log('Database connections closed.');
  }
}

main();
