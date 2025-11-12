import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  next(new AppError(404, `Route ${req.method} ${req.url} not found`));
}
