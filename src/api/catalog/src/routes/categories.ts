import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validator';
import { AppError } from '../middleware/errorHandler';
import { CategoryRepository } from '../repositories/CategoryRepository';

const router = Router();
const categoryRepo = new CategoryRepository();

/**
 * @swagger
 * /categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await categoryRepo.findAll();
    res.json(categories);
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get category by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 */
router.get(
  '/:id',
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = await categoryRepo.findById(req.params.id);

      if (!category) {
        throw new AppError(404, 'Category not found');
      }

      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /categories:
 *   post:
 *     tags: [Categories]
 *     summary: Create a new category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       201:
 *         description: Category created
 *       400:
 *         description: Invalid input
 */
router.post(
  '/',
  validate([
    body('name').isString().trim().notEmpty().isLength({ max: 100 }),
    body('slug').isString().trim().notEmpty().matches(/^[a-z0-9-]+$/),
    body('description').optional().isString().trim(),
    body('parent_id').optional().isUUID(),
    body('is_active').optional().isBoolean()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if slug already exists
      const existingCategory = await categoryRepo.findBySlug(req.body.slug);
      if (existingCategory) {
        throw new AppError(400, 'Category with this slug already exists');
      }

      const category = await categoryRepo.create(req.body);
      res.status(201).json(category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   put:
 *     tags: [Categories]
 *     summary: Update category
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
 *             $ref: '#/components/schemas/Category'
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
 */
router.put(
  '/:id',
  validate([
    param('id').isUUID(),
    body('name').optional().isString().trim().notEmpty().isLength({ max: 100 }),
    body('slug').optional().isString().trim().notEmpty().matches(/^[a-z0-9-]+$/),
    body('description').optional().isString().trim(),
    body('parent_id').optional().isUUID(),
    body('is_active').optional().isBoolean()
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // If updating slug, check if it already exists
      if (req.body.slug) {
        const existingCategory = await categoryRepo.findBySlug(req.body.slug);
        if (existingCategory && existingCategory.id !== req.params.id) {
          throw new AppError(400, 'Category with this slug already exists');
        }
      }

      const category = await categoryRepo.update(req.params.id, req.body);

      if (!category) {
        throw new AppError(404, 'Category not found');
      }

      res.json(category);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /categories/{id}:
 *   delete:
 *     tags: [Categories]
 *     summary: Delete category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Category deleted
 *       404:
 *         description: Category not found
 */
router.delete(
  '/:id',
  validate([param('id').isUUID()]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const deleted = await categoryRepo.delete(req.params.id);

      if (!deleted) {
        throw new AppError(404, 'Category not found');
      }

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export { router as categoryRouter };
