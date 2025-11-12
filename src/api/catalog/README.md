# Catalog API

RESTful API service for managing the e-commerce product catalog, built with Node.js, TypeScript, Express, PostgreSQL, and Redis.

## Overview

The Catalog API provides endpoints for managing products and categories in the e-commerce platform. It follows the architecture principles defined in the [platform architecture documentation](../../docs/arquitetura.md).

### Key Features

- **Product Management**: Full CRUD operations for products
- **Category Management**: Hierarchical category structure
- **Search & Filtering**: Advanced product search with filters
- **Caching**: Redis-based caching for improved performance
- **Pagination**: Efficient pagination for large datasets
- **Validation**: Input validation with express-validator
- **Observability**: Structured logging with Pino, X-Ray tracing
- **OpenAPI Documentation**: Swagger UI for API documentation
- **Health Checks**: Kubernetes/ECS-compatible health endpoints

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL (Aurora)
- **Cache**: Redis (ElastiCache)
- **Observability**: Pino (logging), AWS X-Ray (tracing)
- **Testing**: Jest, Supertest
- **Container**: Docker, ECS Fargate

## Architecture

Following the cell-based architecture:

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
┌──────▼──────┐
│     ALB     │
└──────┬──────┘
       │
┌──────▼──────────┐
│  ECS Fargate    │
│  Catalog API    │
└─────┬─────┬─────┘
      │     │
      │     └─────────┐
      │               │
┌─────▼─────┐   ┌────▼─────┐
│  Aurora   │   │  Redis   │
│PostgreSQL │   │  Cache   │
└───────────┘   └──────────┘
```

## Getting Started

### Prerequisites

- Node.js 18 or higher
- PostgreSQL 15+
- Redis 7+
- Docker (optional)

### Installation

```bash
# Clone the repository
cd src/api/catalog

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env with your configuration
vim .env
```

### Database Setup

```bash
# Run migrations
psql -h localhost -U postgres -d ecommerce_catalog -f migrations/001_initial_schema.sql
```

### Development

```bash
# Run in development mode with hot reload
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Build for production
npm run build

# Run production build
npm start
```

### Using Docker Compose

```bash
# Start all services (API + PostgreSQL + Redis)
docker-compose up -d

# View logs
docker-compose logs -f catalog-api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## API Documentation

### Interactive Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:3000/api/docs

### Main Endpoints

#### Health Checks

```
GET /api/v1/health        - Basic health check
GET /api/v1/health/ready  - Readiness check (includes dependencies)
GET /api/v1/health/live   - Liveness check
```

#### Products

```
GET    /api/v1/products           - List products (with pagination & filters)
GET    /api/v1/products/:id       - Get product by ID
POST   /api/v1/products           - Create product
PUT    /api/v1/products/:id       - Update product
DELETE /api/v1/products/:id       - Delete product
```

#### Categories

```
GET    /api/v1/categories         - List all categories
GET    /api/v1/categories/:id     - Get category by ID
POST   /api/v1/categories         - Create category
PUT    /api/v1/categories/:id     - Update category
DELETE /api/v1/categories/:id     - Delete category
```

### Example Requests

#### Create Product

```bash
curl -X POST http://localhost:3000/api/v1/products \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Laptop Pro 15",
    "description": "High-performance laptop",
    "price": 1299.99,
    "sku": "LAPTOP-PRO-15",
    "stock_quantity": 25,
    "is_active": true
  }'
```

#### List Products with Filters

```bash
curl "http://localhost:3000/api/v1/products?page=1&limit=20&is_active=true&min_price=100&max_price=2000&search=laptop"
```

#### Get Product by ID

```bash
curl http://localhost:3000/api/v1/products/123e4567-e89b-12d3-a456-426614174000
```

## Configuration

### Environment Variables

See `.env.example` for all available configuration options.

Key variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | `development` |
| `PORT` | Server port | `3000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `ecommerce_catalog` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `CACHE_TTL` | Cache TTL in seconds | `300` |
| `LOG_LEVEL` | Logging level | `info` |
| `XRAY_ENABLED` | Enable AWS X-Ray tracing | `false` |

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# View coverage report
open coverage/index.html
```

### Test Coverage

Current test coverage targets:
- Branches: 70%
- Functions: 70%
- Lines: 70%
- Statements: 70%

## Deployment

### Docker

```bash
# Build image
docker build -t catalog-api:latest .

# Run container
docker run -p 3000:3000 --env-file .env catalog-api:latest
```

### AWS ECS Fargate

See [deployment/README.md](deployment/README.md) for detailed deployment instructions.

Quick deploy:

```bash
# Build and push to ECR
./scripts/deploy.sh production

# Or use GitHub Actions
git push origin main
```

## Performance

### Caching Strategy

- **Product listings**: Cached for 5 minutes
- **Individual products**: Cached for 5 minutes
- **Categories**: Cached for 10 minutes (less frequent updates)

### Database Optimization

- Indexes on frequently queried columns (sku, category_id, price)
- Full-text search index for product search
- Automatic updated_at trigger

### Auto-Scaling

ECS tasks auto-scale based on:
- CPU > 70%
- Memory > 80%
- Request count > 1000 RPS

## Monitoring

### Logs

Structured JSON logs are sent to CloudWatch Logs:

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
    "url": "/api/v1/products"
  },
  "res": {
    "statusCode": 200
  },
  "responseTime": 45
}
```

### Metrics

Key CloudWatch metrics:
- Request count
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Cache hit rate
- Database connection pool utilization

### Tracing

AWS X-Ray provides distributed tracing:
- End-to-end request flow
- Service map visualization
- Performance bottleneck identification

## Troubleshooting

### Common Issues

#### Database Connection Failed

```
Error: Connection timeout
```

**Solution**: Check database host, port, and credentials in `.env`

#### Redis Connection Failed

```
Error: Redis client not initialized
```

**Solution**: Ensure Redis is running and accessible

#### High Memory Usage

**Solution**:
- Check for memory leaks in application code
- Review database connection pool size
- Consider scaling up task resources

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Commit your changes (`git commit -m 'Add new feature'`)
6. Push to the branch (`git push origin feature/new-feature`)
7. Create a Pull Request

## License

MIT

## Support

- Documentation: [/docs](../../docs/)
- Issues: GitHub Issues
- Architecture: [docs/arquitetura.md](../../docs/arquitetura.md)

---

**Version**: 1.0.0
**Last Updated**: 2025-11-12
**Maintainer**: E-Commerce Platform Team
