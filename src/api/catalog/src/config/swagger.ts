import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Catalog API',
      version: '1.0.0',
      description: 'RESTful API for managing product catalog in the e-commerce platform',
      contact: {
        name: 'E-Commerce Platform Team',
        email: 'api@ecommerce-platform.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: '/api/v1',
        description: 'API v1'
      }
    ],
    tags: [
      {
        name: 'Health',
        description: 'Health check endpoints'
      },
      {
        name: 'Products',
        description: 'Product catalog operations'
      },
      {
        name: 'Categories',
        description: 'Product category operations'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'description', 'price', 'sku'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Product unique identifier'
            },
            name: {
              type: 'string',
              description: 'Product name',
              minLength: 1,
              maxLength: 255
            },
            description: {
              type: 'string',
              description: 'Product description'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Product price',
              minimum: 0
            },
            sku: {
              type: 'string',
              description: 'Stock Keeping Unit',
              minLength: 1,
              maxLength: 100
            },
            category_id: {
              type: 'string',
              format: 'uuid',
              description: 'Category identifier'
            },
            stock_quantity: {
              type: 'integer',
              description: 'Available stock quantity',
              minimum: 0,
              default: 0
            },
            image_url: {
              type: 'string',
              format: 'uri',
              description: 'Product image URL'
            },
            is_active: {
              type: 'boolean',
              description: 'Product active status',
              default: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Category unique identifier'
            },
            name: {
              type: 'string',
              description: 'Category name',
              minLength: 1,
              maxLength: 100
            },
            slug: {
              type: 'string',
              description: 'URL-friendly category identifier',
              pattern: '^[a-z0-9-]+$'
            },
            description: {
              type: 'string',
              description: 'Category description'
            },
            parent_id: {
              type: 'string',
              format: 'uuid',
              description: 'Parent category identifier (for hierarchical categories)',
              nullable: true
            },
            is_active: {
              type: 'boolean',
              description: 'Category active status',
              default: true
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'object',
              description: 'Additional error details'
            }
          }
        }
      },
      responses: {
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        BadRequest: {
          description: 'Invalid request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);
