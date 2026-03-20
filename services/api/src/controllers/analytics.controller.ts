import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { AppError }         from '../utils/AppError';

export async function getAnalytics(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { code } = req.params;

  const analytics = await analyticsService.getClickAnalytics(code as string);

  if (!analytics) {
    return next(new AppError('Short URL not found', 404, 'URL_NOT_FOUND'));
  }

  res.json({
    success: true,
    data: analytics,
  });
}