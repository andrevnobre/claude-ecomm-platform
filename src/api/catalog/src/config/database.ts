import { Pool, PoolClient, QueryResult } from 'pg';
import { logger } from '../utils/logger';

let pool: Pool | null = null;

export async function initializeDatabase(): Promise<void> {
  if (pool) {
    logger.warn('Database pool already initialized');
    return;
  }

  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ecommerce_catalog',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '10000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000')
  });

  pool.on('error', (err) => {
    logger.error({ error: err }, 'Unexpected database pool error');
  });

  // Test connection
  try {
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    logger.info('Database connection test successful');
  } catch (error) {
    logger.error({ error }, 'Database connection test failed');
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
}

export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initializeDatabase first.');
  }
  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  const client = getPool();

  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    logger.debug({
      query: text,
      duration,
      rows: result.rowCount
    }, 'Database query executed');

    return result;
  } catch (error) {
    logger.error({
      error,
      query: text,
      params
    }, 'Database query failed');
    throw error;
  }
}

export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error({ error }, 'Transaction rolled back');
    throw error;
  } finally {
    client.release();
  }
}
