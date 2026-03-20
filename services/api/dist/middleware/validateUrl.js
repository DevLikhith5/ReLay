"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateShortenBody = validateShortenBody;
const AppError_1 = require("../utils/AppError");
function validateShortenBody(req, res, next) {
    const { longUrl } = req.body;
    if (!longUrl || typeof longUrl !== 'string') {
        return next(new AppError_1.AppError('longUrl is required', 400, 'INVALID_URL'));
    }
    try {
        const url = new URL(longUrl);
        if (!['http:', 'https:'].includes(url.protocol)) {
            return next(new AppError_1.AppError('Only http/https URLs allowed', 400, 'INVALID_URL'));
        }
    }
    catch {
        return next(new AppError_1.AppError('Invalid URL format', 400, 'INVALID_URL'));
    }
    next();
}
