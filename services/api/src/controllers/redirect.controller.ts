import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';
import { publishClick } from '../services/kafka.service';
import { AppError }     from '../utils/AppError';
import geoip from 'geoip-lite';
import { UAParser } from 'ua-parser-js';

export async function redirectUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  
  const { code } = req.params as { code: string};
  console.log("CODE", code)
  console.log("I AM HERE ABOVE")
  try {

    const urlData = await cacheService.getUrl(code);

    if (!urlData) {
      return next(new AppError('Short URL not found', 404, 'URL_NOT_FOUND'));
    }


    if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
      await cacheService.invalidateUrl(code);
      return next(new AppError('This short URL has expired', 410, 'URL_EXPIRED'));
    }

    // 🔬 Enrichment Logic
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
    const geo = geoip.lookup(ip);
    const ua = new UAParser(req.headers['user-agent']).getResult();

    console.log("I AM HERE ABOVE PUBLISH")

    publishClick({
      shortCode: code,
      shardId:   urlData.shardId,
      country:   geo?.country || 'XX',
      city:      geo?.city    || 'Unknown',
      device:    ua.device.type || 'desktop', 
      timestamp: Date.now(),
    }).catch(err => console.error('Failed to publish click:', err));

    console.log("PUBLISHED SUCCESSFULLY")


    return res.redirect(302, urlData.longUrl);

  } catch (err) {
    next(err);
  }
}