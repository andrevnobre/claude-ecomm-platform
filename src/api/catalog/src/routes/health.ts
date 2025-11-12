import { Router, Request, Response } from 'express';
import { getPool } from '../config/database';
import { getCache } from '../config/cache';

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Basic health check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'catalog-api',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Health]
 *     summary: Readiness check (includes dependencies)
 *     responses:
 *       200:
 *         description: Service is ready
 *       503:
 *         description: Service is not ready
 */
router.get('/ready', async (req: Request, res: Response) => {
  const checks = {
    database: false,
    cache: false
  };

  try {
    // Check database
    const pool = getPool();
    await pool.query('SELECT 1');
    checks.database = true;
  } catch (error) {
    // Database check failed
  }

  try {
    // Check cache
    const cache = getCache();
    await cache.ping();
    checks.cache = true;
  } catch (error) {
    // Cache check failed
  }

  const allHealthy = checks.database && checks.cache;

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not_ready',
    checks,
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     responses:
 *       200:
 *         description: Service is alive
 */
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString()
  });
});

export { router as healthRouter };
