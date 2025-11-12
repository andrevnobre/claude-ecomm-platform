import { createClient, RedisClientType } from 'redis';
import { logger } from '../utils/logger';

let redisClient: RedisClientType | null = null;

export async function initializeCache(): Promise<void> {
  if (redisClient) {
    logger.warn('Redis client already initialized');
    return;
  }

  const redisUrl = process.env.REDIS_PASSWORD
    ? `redis://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`
    : `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}/${process.env.REDIS_DB}`;

  redisClient = createClient({
    url: redisUrl,
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          logger.error('Redis max reconnection attempts reached');
          return new Error('Redis max reconnection attempts reached');
        }
        return Math.min(retries * 100, 3000);
      }
    }
  });

  redisClient.on('error', (err) => {
    logger.error({ error: err }, 'Redis client error');
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('reconnecting', () => {
    logger.warn('Redis client reconnecting');
  });

  await redisClient.connect();
}

export async function closeCache(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client closed');
  }
}

export function getCache(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeCache first.');
  }
  return redisClient;
}

export async function get(key: string): Promise<string | null> {
  try {
    const value = await getCache().get(key);
    logger.debug({ key, hit: !!value }, 'Cache get');
    return value;
  } catch (error) {
    logger.error({ error, key }, 'Cache get failed');
    return null;
  }
}

export async function set(
  key: string,
  value: string,
  ttlSeconds?: number
): Promise<boolean> {
  try {
    const ttl = ttlSeconds || parseInt(process.env.CACHE_TTL || '300');
    await getCache().setEx(key, ttl, value);
    logger.debug({ key, ttl }, 'Cache set');
    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache set failed');
    return false;
  }
}

export async function del(key: string): Promise<boolean> {
  try {
    await getCache().del(key);
    logger.debug({ key }, 'Cache delete');
    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache delete failed');
    return false;
  }
}

export async function clearPattern(pattern: string): Promise<number> {
  try {
    const keys = await getCache().keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    await getCache().del(keys);
    logger.debug({ pattern, count: keys.length }, 'Cache pattern cleared');
    return keys.length;
  } catch (error) {
    logger.error({ error, pattern }, 'Cache pattern clear failed');
    return 0;
  }
}
