export class AppError extends Error {
  statusCode: number;
  code:       string;
  isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode    = statusCode;
    this.code          = code;
    this.isOperational = true; 
    Error.captureStackTrace(this, this.constructor);
  }
}


export const Errors = {
  URL_NOT_FOUND:    new AppError('Short URL not found',          404, 'URL_NOT_FOUND'),
  URL_EXPIRED:      new AppError('This short URL has expired',   410, 'URL_EXPIRED'),
  INVALID_URL:      new AppError('Invalid URL format',           400, 'INVALID_URL'),
  RATE_LIMITED:     new AppError('Too many requests',            429, 'RATE_LIMITED'),
  CODE_GENERATION:  new AppError('Failed to generate short code',500, 'CODE_GENERATION'),
};