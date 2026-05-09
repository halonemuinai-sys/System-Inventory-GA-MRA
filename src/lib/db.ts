import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Set default schema to ga for every connection
pool.on('connect', (client) => {
  client.query('SET search_path TO ga, public');
});

export const query = (text: string, params?: any[]) => pool.query(text, params);
