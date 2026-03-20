"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redirectUrl = redirectUrl;
const cache_service_1 = require("../services/cache.service");
const AppError_1 = require("../utils/AppError");
async function redirectUrl(req, res, next) {
    const { code } = req.params;
    try {
        const urlData = await cache_service_1.cacheService.getUrl(code);
        if (!urlData) {
            return next(new AppError_1.AppError('Short URL not found', 404, 'URL_NOT_FOUND'));
        }
        if (urlData.expiresAt && new Date(urlData.expiresAt) < new Date()) {
            await cache_service_1.cacheService.invalidateUrl(code);
            return next(new AppError_1.AppError('This short URL has expired', 410, 'URL_EXPIRED'));
        }
        return res.redirect(302, urlData.longUrl);
    }
    catch (err) {
        next(err);
    }
}
