import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

export function validateShortenBody(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { longUrl } = req.body;

  if (!longUrl || typeof longUrl !== 'string') {
    return next(new AppError('longUrl is required', 400, 'INVALID_URL'));
  }

  try {
    const url = new URL(longUrl);

    if (!['http:', 'https:'].includes(url.protocol)) {
      return next(new AppError('Only http/https URLs allowed', 400, 'INVALID_URL'));
    }
  } catch {
    return next(new AppError('Invalid URL format', 400, 'INVALID_URL'));
  }

  next();
}