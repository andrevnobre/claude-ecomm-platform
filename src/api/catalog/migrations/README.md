# Database Migrations

This directory contains SQL migration files for the Catalog API database schema.

## Migration Files

Migrations are numbered sequentially and should be applied in order:

1. `001_initial_schema.sql` - Creates initial tables (categories, products)

## Running Migrations

### Manual Execution

Connect to your PostgreSQL database and execute the migrations in order:

```bash
psql -h localhost -U postgres -d ecommerce_catalog -f migrations/001_initial_schema.sql
```

### Using Docker

If running PostgreSQL in Docker:

```bash
docker exec -i postgres_container psql -U postgres -d ecommerce_catalog < migrations/001_initial_schema.sql
```

### Automated Migration Tool

For production environments, consider using a migration tool like:

- **node-pg-migrate**: Node.js migration tool
- **Flyway**: Java-based migration tool
- **Liquibase**: Database schema change management

## Schema Overview

### Categories Table

```sql
- id (UUID): Primary key
- name (VARCHAR): Category name
- slug (VARCHAR): URL-friendly identifier
- description (TEXT): Category description
- parent_id (UUID): Parent category for hierarchy
- is_active (BOOLEAN): Active status
- created_at (TIMESTAMP): Creation time
- updated_at (TIMESTAMP): Last update time
```

### Products Table

```sql
- id (UUID): Primary key
- name (VARCHAR): Product name
- description (TEXT): Product description
- price (DECIMAL): Product price
- sku (VARCHAR): Stock Keeping Unit (unique)
- category_id (UUID): Foreign key to categories
- stock_quantity (INTEGER): Available inventory
- image_url (TEXT): Product image URL
- is_active (BOOLEAN): Active status
- created_at (TIMESTAMP): Creation time
- updated_at (TIMESTAMP): Last update time
```

## Seed Data

The initial migration includes seed data:

- 5 sample categories
- 5 sample products

This data is useful for development and testing.

## Rollback

To rollback migrations, you'll need to manually drop the tables or execute rollback scripts.

Example rollback for 001_initial_schema.sql:

```sql
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP EXTENSION IF EXISTS "uuid-ossp";
```

## Best Practices

1. Never modify existing migration files after they've been deployed
2. Create new migrations for schema changes
3. Test migrations in development before production
4. Always backup your database before running migrations
5. Use transactions when possible
