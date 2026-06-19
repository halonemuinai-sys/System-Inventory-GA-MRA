import { NextResponse } from 'next/server';
import { Client } from 'pg';
import { query } from '@/lib/db';

async function connectHelpdeskClient(connectionString: string): Promise<Client> {
  let client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    return client;
  } catch (err: any) {
    await client.end().catch(() => {});
    const isSslError = err.message && err.message.includes('SSL');
    const isTimeoutOrDnsError = err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND' || err.code === 'EADDRNOTAVAIL' || err.message?.includes('ETIMEDOUT');
    
    if (isTimeoutOrDnsError && connectionString.includes('host.docker.internal')) {
      const newConnectionString = connectionString.replace('host.docker.internal', 'localhost');
      return connectHelpdeskClient(newConnectionString);
    }
    
    if (isSslError) {
      client = new Client({ connectionString });
      await client.connect();
      return client;
    }
    throw err;
  }
}

export async function GET() {
  const HELPDESK_URL = process.env.HELPDESK_DATABASE_URL;
  
  if (!HELPDESK_URL) {
    console.warn('HELPDESK_DATABASE_URL is not set, falling back to GA companies');
    return await getFallbackGACompanies();
  }

  let helpdeskClient: Client;
  try {
    helpdeskClient = await connectHelpdeskClient(HELPDESK_URL);
  } catch (err: any) {
    console.error('Failed to connect to helpdesk DB for companies:', err);
    return await getFallbackGACompanies();
  }

  try {
    const res = await helpdeskClient.query(`
      SELECT DISTINCT name FROM (
        SELECT name FROM helpdesk."Company" WHERE name IS NOT NULL AND name <> ''
        UNION
        SELECT name FROM helpdesk."CompanyMaster" WHERE name IS NOT NULL AND name <> ''
      ) AS combined
      ORDER BY name
    `);

    const formatted = res.rows.map((r: any) => ({
      id: r.name,
      name: r.name
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('Error fetching companies from Helpdesk DB:', error);
    console.warn('Falling back to GA companies due to Helpdesk query failure');
    return await getFallbackGACompanies();
  } finally {
    try {
      await helpdeskClient.end();
    } catch (e) {}
  }
}

async function getFallbackGACompanies() {
  try {
    const res = await query(`
      SELECT DISTINCT name FROM m_company 
      WHERE is_active = true AND name IS NOT NULL AND name <> ''
      ORDER BY name
    `);
    const formatted = res.rows.map((r: any) => ({
      id: r.name,
      name: r.name
    }));
    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GA companies fallback error:', error);
    return NextResponse.json({ error: 'Failed to fetch fallback companies' }, { status: 500 });
  }
}
