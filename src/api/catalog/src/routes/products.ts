import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param } from 'express-validator';
import { validate } from '../middleware/validator';
import { AppError } from '../middleware/errorHandler';
import { ProductRepository } from '../repositories/ProductRepository';
import { ProductFilter, PaginationParams } from '../models/Product';

const router = Router();
const productRepo = new ProductRepository();

/**
 * @swagger
 * /products:
 *   get:
 *     tags: [Products]
 *     summary: List all products with filtering and pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of products
 */
router.get(
  '/',
  validate([
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category_id').optional().isUUID(),
    query('is_active').optional().isBoolean().toBoolean(),
    query('min_price').optional().isFloat({ min: 0 }).toFloat(),
    query('max_price').optional().isFloat({ min: 0 }).toFloat(),
    query('search').optional().isString().trim()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pagination: PaginationParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const filter: ProductFilter = {
        category_id: req.query.category_id as string,
        is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
        min_price: req.query.min_price ? parseFloat(req.query.min_price as string) : undefined,
        max_price: req.query.max_price ? parseFloat(req.query.max_price as string) : undefined,
        search: req.query.search as string
      };

      const result = await productRepo.findAll(filter, pagination);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Get product by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 */
router.get(
  '/:id',
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await productRepo.findById(req.params.id);

      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products:
 *   post:
 *     tags: [Products]
 *     summary: Create a new product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Product created
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  validate([
    body('name').isString().trim().notEmpty().isLength({ max: 255 }),
    body('description').isString().trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('sku').isString().trim().notEmpty().isLength({ max: 100 }),
    body('category_id').optional().isUUID(),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('image_url').optional().isURL(),
    body('is_active').optional().isBoolean()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if SKU already exists
      const existingProduct = await productRepo.findBySku(req.body.sku);
      if (existingProduct) {
        throw new AppError(400, 'Product with this SKU already exists');
      }

      const product = await productRepo.create(req.body);
      res.status(201).json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     tags: [Products]
 *     summary: Update product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().isString().trim().notEmpty().isLength({ max: 255 }),
    body('description').optional().isString().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('sku').optional().isString().trim().notEmpty().isLength({ max: 100 }),
    body('category_id').optional().isUUID(),
    body('stock_quantity').optional().isInt({ min: 0 }),
    body('image_url').optional().isURL(),
    body('is_active').optional().isBoolean()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If updating SKU, check if it already exists
      if (req.body.sku) {
        const existingProduct = await productRepo.findBySku(req.body.sku);
        if (existingProduct && existingProduct.id !== req.params.id) {
          throw new AppError(400, 'Product with this SKU already exists');
        }
      }

      const product = await productRepo.update(req.params.id, req.body);

      if (!product) {
        throw new AppError(404, 'Product not found');
      }

      res.json(product);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     tags: [Products]
 *     summary: Delete product
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Product deleted
 *       404:
 *         description: Product not found
 */
router.delete(
  '/:id',
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await productRepo.delete(req.params.id);

      if (!deleted) {
        throw new AppError(404, 'Product not found');
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as productRouter };
