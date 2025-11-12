import { query } from '../config/database';
import * as cache from '../config/cache';
import { logger } from '../utils/logger';
import {
  Product,
  CreateProductDto,
  UpdateProductDto,
  ProductFilter,
  PaginationParams,
  PaginatedResponse
} from '../models/Product';

const CACHE_PREFIX = 'product:';
const CACHE_LIST_PREFIX = 'products:list:';

export class ProductRepository {
  private getCacheKey(id: string): string {
    return `${CACHE_PREFIX}${id}`;
  }

  private getListCacheKey(filter: ProductFilter, pagination: PaginationParams): string {
    const filterStr = JSON.stringify({ filter, pagination });
    return `${CACHE_LIST_PREFIX}${Buffer.from(filterStr).toString('base64')}`;
  }

  async findAll(
    filter: ProductFilter = {},
    pagination: PaginationParams = { page: 1, limit: 20 }
  ): Promise<PaginatedResponse<Product>> {
    const cacheKey = this.getListCacheKey(filter, pagination);

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug({ cacheKey }, 'Product list cache hit');
      return JSON.parse(cached);
    }

    // Build query
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (filter.category_id) {
      paramCount++;
      conditions.push(`category_id = $${paramCount}`);
      params.push(filter.category_id);
    }

    if (filter.is_active !== undefined) {
      paramCount++;
      conditions.push(`is_active = $${paramCount}`);
      params.push(filter.is_active);
    }

    if (filter.min_price !== undefined) {
      paramCount++;
      conditions.push(`price >= $${paramCount}`);
      params.push(filter.min_price);
    }

    if (filter.max_price !== undefined) {
      paramCount++;
      conditions.push(`price <= $${paramCount}`);
      params.push(filter.max_price);
    }

    if (filter.search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${filter.search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countQuery = `SELECT COUNT(*) as count FROM products ${whereClause}`;
    const countResult = await query<{ count: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Fetch data
    const offset = (pagination.page - 1) * pagination.limit;
    paramCount++;
    const limitParam = `$${paramCount}`;
    params.push(pagination.limit);
    paramCount++;
    const offsetParam = `$${paramCount}`;
    params.push(offset);

    const dataQuery = `
      SELECT * FROM products
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const dataResult = await query<Product>(dataQuery, params);

    const response: PaginatedResponse<Product> = {
      data: dataResult.rows,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit)
      }
    };

    // Cache result
    await cache.set(cacheKey, JSON.stringify(response), 300);

    return response;
  }

  async findById(id: string): Promise<Product | null> {
    const cacheKey = this.getCacheKey(id);

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug({ id, cacheKey }, 'Product cache hit');
      return JSON.parse(cached);
    }

    // Query database
    const result = await query<Product>(
      'SELECT * FROM products WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const product = result.rows[0];

    // Cache result
    await cache.set(cacheKey, JSON.stringify(product));

    return product;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const result = await query<Product>(
      'SELECT * FROM products WHERE sku = $1',
      [sku]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const result = await query<Product>(
      `INSERT INTO products (
        name, description, price, sku, category_id,
        stock_quantity, image_url, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        dto.name,
        dto.description,
        dto.price,
        dto.sku,
        dto.category_id || null,
        dto.stock_quantity || 0,
        dto.image_url || null,
        dto.is_active !== undefined ? dto.is_active : true
      ]
    );

    const product = result.rows[0];

    // Cache new product
    await cache.set(this.getCacheKey(product.id), JSON.stringify(product));

    // Invalidate list cache
    await cache.clearPattern(`${CACHE_LIST_PREFIX}*`);

    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (dto.name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(dto.name);
    }

    if (dto.description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(dto.description);
    }

    if (dto.price !== undefined) {
      paramCount++;
      updates.push(`price = $${paramCount}`);
      params.push(dto.price);
    }

    if (dto.sku !== undefined) {
      paramCount++;
      updates.push(`sku = $${paramCount}`);
      params.push(dto.sku);
    }

    if (dto.category_id !== undefined) {
      paramCount++;
      updates.push(`category_id = $${paramCount}`);
      params.push(dto.category_id);
    }

    if (dto.stock_quantity !== undefined) {
      paramCount++;
      updates.push(`stock_quantity = $${paramCount}`);
      params.push(dto.stock_quantity);
    }

    if (dto.image_url !== undefined) {
      paramCount++;
      updates.push(`image_url = $${paramCount}`);
      params.push(dto.image_url);
    }

    if (dto.is_active !== undefined) {
      paramCount++;
      updates.push(`is_active = $${paramCount}`);
      params.push(dto.is_active);
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    paramCount++;
    updates.push(`updated_at = NOW()`);
    params.push(id);

    const result = await query<Product>(
      `UPDATE products SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    const product = result.rows[0];

    // Invalidate cache
    await cache.del(this.getCacheKey(id));
    await cache.clearPattern(`${CACHE_LIST_PREFIX}*`);

    return product;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM products WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return false;
    }

    // Invalidate cache
    await cache.del(this.getCacheKey(id));
    await cache.clearPattern(`${CACHE_LIST_PREFIX}*`);

    return true;
  }
}
