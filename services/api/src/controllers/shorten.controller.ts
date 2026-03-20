import { Request, Response, NextFunction } from 'express';
import { urlService }    from '../services/url.service';
import { ShortenRequest } from '../types';

export async function shortenUrl(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { longUrl, expiresIn, userId } = req.body as ShortenRequest;

  const result = await urlService.createShortUrl({
    longUrl,
    expiresIn,
    userId,
  });

  res.status(201).json({
    success:  true,
    shortCode: result.shortCode,
    shortUrl: `${process.env.BASE_URL}/${result.shortCode}`,
    shardId:result.shardId,
    expiresAt: result.expiresAt ?? null,
  });
}