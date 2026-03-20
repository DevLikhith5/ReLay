"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
exports.asyncHandler = asyncHandler;
const AppError_1 = require("../utils/AppError");
const logger_1 = require("../utils/logger");
function errorHandler(err, req, res, next) {
    // Known operational error — our AppError
    if (err instanceof AppError_1.AppError && err.isOperational) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            }
        });
    }
    // Unknown error — a real bug
    logger_1.logger.error({
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
    });
    // Never leak internal error details to client
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong',
        }
    });
}
// Catch async errors — wrap every async route handler with this
function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
