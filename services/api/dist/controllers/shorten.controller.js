"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shortenUrl = shortenUrl;
const url_service_1 = require("../services/url.service");
async function shortenUrl(req, res, next) {
    const { longUrl, expiresIn, userId } = req.body;
    const result = await url_service_1.urlService.createShortUrl({
        longUrl,
        expiresIn,
        userId,
    });
    res.status(201).json({
        success: true,
        shortCode: result.shortCode,
        shortUrl: `${process.env.BASE_URL}/${result.shortCode}`,
        shardId: result.shardId,
        expiresAt: result.expiresAt ?? null,
    });
}
