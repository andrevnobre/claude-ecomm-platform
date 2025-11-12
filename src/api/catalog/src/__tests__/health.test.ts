import request from 'supertest';
import app from '../app';

describe('Health Endpoints', () => {
  describe('GET /api/v1/health', () => {
    it('should return 200 and health status', async () => {
      const response = await request(app)
        .get('/api/v1/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('service', 'catalog-api');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /api/v1/health/live', () => {
    it('should return 200 and liveness status', async () => {
      const response = await request(app)
        .get('/api/v1/health/live')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'alive');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('service', 'Catalog API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('status', 'healthy');
      expect(response.body).toHaveProperty('documentation', '/api/docs');
    });
  });

  describe('GET /invalid-route', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/invalid-route')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});
