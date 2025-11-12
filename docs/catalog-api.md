# Catalog API - Technical Documentation

## Overview

The Catalog API is a microservice responsible for managing the e-commerce product catalog. It provides RESTful endpoints for products and categories, with built-in caching, observability, and following the platform's cell-based architecture.

## Architecture Integration

### Cell-Based Architecture

The Catalog API is deployed within each cell as part of the cell-based architecture:

```
Cell A (US East)                Cell B (EU West)
┌─────────────────┐            ┌─────────────────┐
│  Catalog API    │            │  Catalog API    │
│  ├─ ECS Tasks   │            │  ├─ ECS Tasks   │
│  ├─ Aurora DB   │            │  ├─ Aurora DB   │
│  └─ Redis Cache │            │  └─ Redis Cache │
└─────────────────┘            └─────────────────┘
```

Each cell maintains its own:
- Independent Catalog API instances
- Dedicated Aurora PostgreSQL shard
- Isolated Redis cache
- Separate monitoring and logs

### Data Sharding

Products and categories are partitioned by cell:
- Cell A: User IDs 0-999999
- Cell B: User IDs 1000000-1999999
- Cell C: User IDs 2000000-2999999

### Routing

The Cell Router (Lambda@Edge) determines which cell handles each request based on:
1. User session data
2. Geographic location
3. Cell health status

## API Specification

### Base URL

```
Production: https://api.ecommerce-platform.com/api/v1
Development: http://localhost:3000/api/v1
```

### Authentication

Currently, the API is unauthenticated for MVP. Future versions will integrate with:
- AWS Cognito for user authentication
- API Gateway API keys for service-to-service auth
- JWT tokens for session management

### Rate Limiting

Default rate limits:
- 100 requests per minute per IP
- Configurable via `RATE_LIMIT_MAX_REQUESTS` environment variable

### Response Format

All endpoints return JSON responses:

```json
{
  "data": { /* response data */ },
  "pagination": { /* pagination info (for list endpoints) */ }
}
```

Error responses:

```json
{
  "error": "Error message",
  "details": { /* optional error details */ }
}
```

## Products

### Data Model

```typescript
interface Product {
  id: string;              // UUID
  name: string;            // Max 255 chars
  description: string;
  price: number;           // Decimal(10,2)
  sku: string;             // Unique, max 100 chars
  category_id?: string;    // UUID, nullable
  stock_quantity: number;  // Integer, min 0
  image_url?: string;      // URL
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Endpoints

#### List Products

```
GET /products
```

Query parameters:
- `page` (integer, default: 1)
- `limit` (integer, default: 20, max: 100)
- `category_id` (UUID)
- `is_active` (boolean)
- `min_price` (number)
- `max_price` (number)
- `search` (string) - searches name and description

Response:
```json
{
  "data": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Laptop Pro 15",
      "price": 1299.99,
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

**Performance**:
- Cached for 5 minutes
- Indexed queries
- Full-text search enabled

#### Get Product

```
GET /products/:id
```

Response: Single product object

**Performance**:
- Cached for 5 minutes
- Average response time: 15ms (cache hit), 45ms (cache miss)

#### Create Product

```
POST /products
```

Request body:
```json
{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "sku": "UNIQUE-SKU",
  "category_id": "uuid",
  "stock_quantity": 10,
  "image_url": "https://example.com/image.jpg",
  "is_active": true
}
```

Validations:
- `name`: required, string, max 255 chars
- `description`: required, string
- `price`: required, number >= 0
- `sku`: required, string, unique, max 100 chars
- `stock_quantity`: optional, integer >= 0
- `image_url`: optional, valid URL
- `is_active`: optional, boolean

#### Update Product

```
PUT /products/:id
```

Request body: Same as create, all fields optional

**Cache invalidation**: Clears product cache and list caches

#### Delete Product

```
DELETE /products/:id
```

Response: 204 No Content

**Cache invalidation**: Clears product cache and list caches

## Categories

### Data Model

```typescript
interface Category {
  id: string;           // UUID
  name: string;         // Max 100 chars
  slug: string;         // Unique, lowercase-hyphenated
  description?: string;
  parent_id?: string;   // UUID, nullable (for hierarchy)
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
```

### Hierarchical Structure

Categories support parent-child relationships:

```
Electronics (parent_id: null)
├── Computers (parent_id: Electronics.id)
│   ├── Laptops (parent_id: Computers.id)
│   └── Desktops (parent_id: Computers.id)
└── Mobile Devices (parent_id: Electronics.id)
```

### Endpoints

#### List Categories

```
GET /categories
```

Returns all categories (no pagination due to typically small dataset).

**Performance**:
- Cached for 10 minutes
- Typically < 100 categories

#### Get Category

```
GET /categories/:id
```

Response: Single category object

#### Create Category

```
POST /categories
```

Request body:
```json
{
  "name": "Electronics",
  "slug": "electronics",
  "description": "Electronic devices",
  "parent_id": null,
  "is_active": true
}
```

Validations:
- `name`: required, string, max 100 chars
- `slug`: required, string, pattern: ^[a-z0-9-]+$, unique
- `description`: optional, string
- `parent_id`: optional, UUID
- `is_active`: optional, boolean

#### Update Category

```
PUT /categories/:id
```

Request body: Same as create, all fields optional

#### Delete Category

```
DELETE /categories/:id
```

Response: 204 No Content

**Note**: Products referencing the deleted category will have `category_id` set to NULL.

## Caching Strategy

### Cache Hierarchy

```
┌──────────────────┐
│   CloudFront     │  24h TTL, static assets
└────────┬─────────┘
         │
┌────────▼─────────┐
│   Redis Cache    │  5-10min TTL, dynamic data
└────────┬─────────┘
         │
┌────────▼─────────┐
│  Aurora Cache    │  Automatic query cache
└──────────────────┘
```

### Cache Keys

Products:
- `product:{id}` - Individual product
- `products:list:{hash}` - Product list with filters

Categories:
- `category:{id}` - Individual category
- `categories:all` - All categories

### Cache Invalidation

- **Product update/delete**: Clears product and all product list caches
- **Category update/delete**: Clears category and categories list caches
- **TTL expiration**: Automatic after 5-10 minutes

### Cache Hit Rates

Target metrics:
- Product reads: 85% cache hit rate
- Category reads: 90% cache hit rate

## Database Schema

### Tables

#### products

```sql
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
    sku VARCHAR(100) NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

Indexes:
- `idx_products_sku` on `sku`
- `idx_products_category_id` on `category_id`
- `idx_products_is_active` on `is_active`
- `idx_products_price` on `price`
- `idx_products_search` (full-text) on `name || description`

#### categories

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
```

Indexes:
- `idx_categories_slug` on `slug`
- `idx_categories_parent_id` on `parent_id`

### Migrations

Migrations are located in `src/api/catalog/migrations/` and must be applied in order.

Current migrations:
1. `001_initial_schema.sql` - Creates tables, indexes, and seed data

## Observability

### Logging

Structured JSON logs with Pino:

```json
{
  "level": "INFO",
  "timestamp": "2025-11-12T10:00:00.000Z",
  "service": "catalog-api",
  "cell_id": "A",
  "environment": "production",
  "msg": "Request completed",
  "req": {
    "method": "GET",
    "url": "/api/v1/products",
    "ip": "10.0.1.45"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 45
}
```

### Metrics

CloudWatch metrics (custom):
- `CatalogAPI.ProductRead` - Product read operations
- `CatalogAPI.ProductWrite` - Product write operations
- `CatalogAPI.CacheHitRate` - Redis cache hit rate
- `CatalogAPI.ResponseTime` - API response time percentiles

Standard ECS metrics:
- CPU utilization
- Memory utilization
- Request count
- Error rate

### Tracing

AWS X-Ray traces include:
- HTTP request/response
- Database queries
- Cache operations
- External service calls

Sampling: 5% in production, 100% in development

### Alarms

Critical alarms:
- Error rate > 1% for 5 minutes
- p99 latency > 1s for 10 minutes
- Cache hit rate < 60% for 30 minutes
- Database connections > 80% of max

## Performance Targets

### Latency

| Operation | p50 | p95 | p99 |
|-----------|-----|-----|-----|
| GET /products | 30ms | 100ms | 200ms |
| GET /products/:id | 15ms | 50ms | 100ms |
| POST /products | 100ms | 250ms | 500ms |
| GET /categories | 10ms | 30ms | 60ms |

### Throughput

- Target: 1000 RPS per cell
- Peak capacity: 5000 RPS with auto-scaling
- Concurrent users: 10,000 per cell

### Availability

- Target SLO: 99.9% (43 minutes downtime per month)
- Multi-AZ deployment
- Auto-healing via ECS
- Health checks every 30 seconds

## Security

### Current Implementation

- Helmet.js security headers
- CORS configuration
- Rate limiting (100 req/min per IP)
- Input validation
- SQL injection prevention (parameterized queries)
- Non-root container user
- Secrets in AWS Secrets Manager

### Future Enhancements

- Authentication with AWS Cognito
- Authorization with RBAC
- API key management
- Request signing
- Audit logging
- WAF rules

## Operational Runbook

### Deployment

1. Code merged to `main` branch
2. GitHub Actions triggers CI/CD
3. Tests run (must pass)
4. Docker image built and pushed to ECR
5. ECS task definition updated
6. Rolling deployment to ECS service
7. Health checks validate new tasks
8. Old tasks drained and terminated

### Rollback

```bash
# List task definitions
aws ecs list-task-definitions --family-prefix catalog-api

# Rollback to previous version
aws ecs update-service \
  --cluster ecommerce-cluster \
  --service catalog-api \
  --task-definition catalog-api:PREVIOUS_VERSION
```

### Scaling

```bash
# Manual scaling
aws ecs update-service \
  --cluster ecommerce-cluster \
  --service catalog-api \
  --desired-count 10
```

Auto-scaling is configured to scale based on:
- CPU > 70%
- Memory > 80%
- Request count > 1000 RPS

### Troubleshooting

#### High Latency

1. Check X-Ray traces for bottlenecks
2. Review database slow query log
3. Check cache hit rate in CloudWatch
4. Verify no database connection pool exhaustion

#### High Error Rate

1. Check CloudWatch Logs for errors
2. Review recent deployments
3. Check database and Redis connectivity
4. Verify input validation errors vs server errors

#### Database Connection Issues

1. Check security group rules
2. Verify Aurora endpoint in Secrets Manager
3. Check connection pool configuration
4. Review database CPU and connections metric

## Future Enhancements

### Phase 2 (3 months)

- Product variants (size, color)
- Product reviews and ratings
- Inventory management integration
- Image optimization and CDN
- Advanced search (Elasticsearch)

### Phase 3 (6 months)

- Product recommendations (ML)
- Real-time inventory updates
- Multi-language support
- Price history tracking
- Bulk import/export APIs

## References

- [Platform Architecture](./arquitetura.md)
- [API Documentation (Swagger)](http://localhost:3000/api/docs)
- [Deployment Guide](../src/api/catalog/deployment/README.md)
- [Migration Guide](../src/api/catalog/migrations/README.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-12
**Owner**: Backend Team
