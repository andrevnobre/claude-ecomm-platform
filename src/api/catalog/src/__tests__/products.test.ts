import request from 'supertest';
import app from '../app';

// Mock the database and cache modules
jest.mock('../config/database', () => ({
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
  query: jest.fn(),
  getPool: jest.fn(() => ({
    query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 })
  }))
}));

jest.mock('../config/cache', () => ({
  initializeCache: jest.fn(),
  closeCache: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  clearPattern: jest.fn(),
  getCache: jest.fn(() => ({
    ping: jest.fn()
  }))
}));

describe('Product Endpoints', () => {
  describe('GET /api/v1/products', () => {
    it('should return paginated products list', async () => {
      const { query } = require('../config/database');

      // Mock count query
      query.mockResolvedValueOnce({ rows: [{ count: '10' }] });

      // Mock data query
      query.mockResolvedValueOnce({
        rows: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Test Product',
            description: 'Test Description',
            price: 99.99,
            sku: 'TEST-SKU-001',
            stock_quantity: 10,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date()
          }
        ]
      });

      const response = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page');
      expect(response.body.pagination).toHaveProperty('limit');
      expect(response.body.pagination).toHaveProperty('total');
      expect(response.body.pagination).toHaveProperty('totalPages');
    });

    it('should accept pagination parameters', async () => {
      const { query } = require('../config/database');

      query.mockResolvedValueOnce({ rows: [{ count: '50' }] });
      query.mockResolvedValueOnce({ rows: [] });

      const response = await request(app)
        .get('/api/v1/products?page=2&limit=10')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should accept filter parameters', async () => {
      const { query } = require('../config/database');

      query.mockResolvedValueOnce({ rows: [{ count: '5' }] });
      query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/api/v1/products?is_active=true&min_price=10&max_price=100&search=test')
        .expect(200);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a new product with valid data', async () => {
      const { query } = require('../config/database');

      // Mock SKU check (no existing product)
      query.mockResolvedValueOnce({ rows: [] });

      // Mock insert
      query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'New Product',
          description: 'New Description',
          price: 49.99,
          sku: 'NEW-SKU-001',
          stock_quantity: 20,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const productData = {
        name: 'New Product',
        description: 'New Description',
        price: 49.99,
        sku: 'NEW-SKU-001',
        stock_quantity: 20
      };

      const response = await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(productData.name);
      expect(response.body.sku).toBe(productData.sku);
    });

    it('should return 400 for invalid product data', async () => {
      const invalidData = {
        name: '',
        description: 'Test',
        price: -10,
        sku: ''
      };

      await request(app)
        .post('/api/v1/products')
        .send(invalidData)
        .expect(400);
    });

    it('should return 400 for duplicate SKU', async () => {
      const { query } = require('../config/database');

      // Mock SKU check (existing product found)
      query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          sku: 'DUPLICATE-SKU'
        }]
      });

      const productData = {
        name: 'Product',
        description: 'Description',
        price: 29.99,
        sku: 'DUPLICATE-SKU'
      };

      await request(app)
        .post('/api/v1/products')
        .send(productData)
        .expect(400);
    });
  });

  describe('GET /api/v1/products/:id', () => {
    it('should return product by valid UUID', async () => {
      const { query } = require('../config/database');

      query.mockResolvedValueOnce({
        rows: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          sku: 'TEST-SKU',
          stock_quantity: 10,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }]
      });

      const response = await request(app)
        .get('/api/v1/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    it('should return 400 for invalid UUID', async () => {
      await request(app)
        .get('/api/v1/products/invalid-uuid')
        .expect(400);
    });

    it('should return 404 for non-existent product', async () => {
      const { query } = require('../config/database');

      query.mockResolvedValueOnce({ rows: [] });

      await request(app)
        .get('/api/v1/products/123e4567-e89b-12d3-a456-426614174000')
        .expect(404);
    });
  });
});
