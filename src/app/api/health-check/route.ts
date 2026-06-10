import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({
      status: 'error',
      message: 'DATABASE_URL environment variable is NOT set on the server.'
    }, { status: 500 });
  }

  // Parse host for safe logging
  let safeHost = 'unknown';
  try {
    const match = dbUrl.match(/@([^:/]+)/);
    if (match) safeHost = match[1];
  } catch (e) {}

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    try {
      // Test basic connection
      const nowRes = await client.query('SELECT NOW()');
      
      // Test ga schema and device_rentals table
      let schemaExists = false;
      let tableExists = false;
      let tableCount = 0;
      let dbError = null;

      try {
        const schemaRes = await client.query(`
          SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'ga'
        `);
        schemaExists = schemaRes.rows.length > 0;

        await client.query('SET search_path TO ga, public');
        
        const tableRes = await client.query(`
          SELECT table_name FROM information_schema.tables 
          WHERE table_schema = 'ga' AND table_name = 'device_rentals'
        `);
        tableExists = tableRes.rows.length > 0;

        if (tableExists) {
          const countRes = await client.query('SELECT COUNT(*) FROM device_rentals');
          tableCount = parseInt(countRes.rows[0].count);
        }
      } catch (err: any) {
        dbError = err.message;
      }

      return NextResponse.json({
        status: 'success',
        database: {
          connected: true,
          safeHost,
          time: nowRes.rows[0].now,
          schemaGaExists: schemaExists,
          tableDeviceRentalsExists: tableExists,
          tableDeviceRentalsCount: tableCount,
          queryError: dbError
        }
      });
    } finally {
      client.release();
    }
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: 'Failed to connect to database.',
      safeHost,
      error: err.message,
      code: err.code
    }, { status: 500 });
  } finally {
    await pool.end();
  }
}
