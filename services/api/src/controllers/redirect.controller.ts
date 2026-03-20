
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { AppError }     from '../utils/AppError';

export async function redirectUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { code } = req.params as { code: string};

  try {

    const urlData = await cacheService.getUrl(code);

    if (!urlData) {
      return next(new AppError('Short URL not found', 404, 'URL_NOT_FOUND'));
    }


    if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
      await cacheService.invalidateUrl(code);
      return next(new AppError('This short URL has expired', 410, 'URL_EXPIRED'));
    }

    return res.redirect(302, urlData.longUrl);

  } catch (err) {
    next(err);
  }
}