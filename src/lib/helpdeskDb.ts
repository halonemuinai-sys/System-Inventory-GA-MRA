import { Client } from 'pg';

let resolvedHelpdeskUrl: string | null = null;

export async function getHelpdeskClient(): Promise<Client> {
  const HELPDESK_URL = process.env.HELPDESK_DATABASE_URL;
  if (!HELPDESK_URL) {
    throw new Error('HELPDESK_DATABASE_URL is not set');
  }

  const urlToTry = resolvedHelpdeskUrl || HELPDESK_URL;
  let client = new Client({
    connectionString: urlToTry,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    resolvedHelpdeskUrl = urlToTry;
    return client;
  } catch (err: any) {
    await client.end().catch(() => {});
    
    const isSslError = err.message && err.message.includes('SSL');
    const isTimeoutOrDnsError = 
      err.code === 'ETIMEDOUT' || 
      err.code === 'ENOTFOUND' || 
      err.code === 'EADDRNOTAVAIL' || 
      err.code === 'ECONNREFUSED' || 
      err.message?.includes('ETIMEDOUT') ||
      err.message?.includes('ECONNREFUSED');
    
    // Self-healing: Try localhost if host.docker.internal failed
    if (isTimeoutOrDnsError && urlToTry.includes('host.docker.internal')) {
      const fallbackUrl = urlToTry.replace('host.docker.internal', 'localhost');
      const fallbackClient = new Client({
        connectionString: fallbackUrl,
        ssl: { rejectUnauthorized: false }
      });
      try {
        await fallbackClient.connect();
        resolvedHelpdeskUrl = fallbackUrl;
        return fallbackClient;
      } catch (fallbackErr) {
        await fallbackClient.end().catch(() => {});
      }
    }
    
    // Self-healing: Try without SSL if SSL handshake failed
    if (isSslError) {
      const noSslClient = new Client({ connectionString: urlToTry });
      try {
        await noSslClient.connect();
        resolvedHelpdeskUrl = urlToTry;
        return noSslClient;
      } catch (sslErr) {
        await noSslClient.end().catch(() => {});
      }
    }
    
    throw err;
  }
}

export async function queryHelpdesk(text: string, params?: any[]) {
  const client = await getHelpdeskClient();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    await client.end().catch(() => {});
  }
}
