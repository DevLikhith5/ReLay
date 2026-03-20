import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Known operational error — our AppError
  if (err instanceof AppError && err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code:    err.code,
        message: err.message,
      }
    });
  }

  // Unknown error — a real bug
  logger.error({
    message: err.message,
    stack:   err.stack,
    url:     req.url,
    method:  req.method,
  });

  // Never leak internal error details to client
  return res.status(500).json({
    success: false,
    error: {
      code:    'INTERNAL_ERROR',
      message: 'Something went wrong',
    }
  });
}

// Catch async errors — wrap every async route handler with this
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}