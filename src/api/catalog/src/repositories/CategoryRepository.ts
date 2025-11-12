import { query } from '../config/database';
import * as cache from '../config/cache';
import { logger } from '../utils/logger';
import { Category, CreateCategoryDto, UpdateCategoryDto } from '../models/Category';

const CACHE_PREFIX = 'category:';
const CACHE_ALL_KEY = 'categories:all';

export class CategoryRepository {
  private getCacheKey(id: string): string {
    return `${CACHE_PREFIX}${id}`;
  }

  async findAll(): Promise<Category[]> {
    // Try cache first
    const cached = await cache.get(CACHE_ALL_KEY);
    if (cached) {
      logger.debug('Categories cache hit');
      return JSON.parse(cached);
    }

    const result = await query<Category>(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    // Cache result
    await cache.set(CACHE_ALL_KEY, JSON.stringify(result.rows), 600);

    return result.rows;
  }

  async findById(id: string): Promise<Category | null> {
    const cacheKey = this.getCacheKey(id);

    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug({ id, cacheKey }, 'Category cache hit');
      return JSON.parse(cached);
    }

    const result = await query<Category>(
      'SELECT * FROM categories WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const category = result.rows[0];

    // Cache result
    await cache.set(cacheKey, JSON.stringify(category));

    return category;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const result = await query<Category>(
      'SELECT * FROM categories WHERE slug = $1',
      [slug]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const result = await query<Category>(
      `INSERT INTO categories (
        name, slug, description, parent_id, is_active
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        dto.name,
        dto.slug,
        dto.description || null,
        dto.parent_id || null,
        dto.is_active !== undefined ? dto.is_active : true
      ]
    );

    const category = result.rows[0];

    // Cache new category
    await cache.set(this.getCacheKey(category.id), JSON.stringify(category));

    // Invalidate all categories cache
    await cache.del(CACHE_ALL_KEY);

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category | null> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (dto.name !== undefined) {
      paramCount++;
      updates.push(`name = $${paramCount}`);
      params.push(dto.name);
    }

    if (dto.slug !== undefined) {
      paramCount++;
      updates.push(`slug = $${paramCount}`);
      params.push(dto.slug);
    }

    if (dto.description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(dto.description);
    }

    if (dto.parent_id !== undefined) {
      paramCount++;
      updates.push(`parent_id = $${paramCount}`);
      params.push(dto.parent_id);
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

    const result = await query<Category>(
      `UPDATE categories SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return null;
    }

    const category = result.rows[0];

    // Invalidate cache
    await cache.del(this.getCacheKey(id));
    await cache.del(CACHE_ALL_KEY);

    return category;
  }

  async delete(id: string): Promise<boolean> {
    const result = await query(
      'DELETE FROM categories WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      return false;
    }

    // Invalidate cache
    await cache.del(this.getCacheKey(id));
    await cache.del(CACHE_ALL_KEY);

    return true;
  }
}
