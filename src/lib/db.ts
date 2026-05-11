import { Pool } from 'pg';

// Reuse pool across warm serverless invocations (Next.js hot-reload safe)
declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!global._pgPool) {
    global._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 3,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 8_000,
    });

    global._pgPool.on('error', (err) => {
      console.error('[db] pool error — resetting:', err.message);
      global._pgPool = undefined;
    });
  }
  return global._pgPool;
}

/**
 * Run a parameterised query.
 * Uses an explicit client so SET search_path and the real query
 * always execute on the SAME backend connection — required for
 * Supabase PgBouncer transaction-mode pooling (port 6543).
 */
export async function query(text: string, params?: unknown[]) {
  const client = await getPool().connect();
  try {
    await client.query('SET search_path TO ga, public');
    return await client.query(text, params as never[]);
  } finally {
    client.release();
  }
}
