"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const shorten_controller_1 = require("../controllers/shorten.controller");
const validateUrl_1 = require("../middleware/validateUrl");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.post('/', validateUrl_1.validateShortenBody, (0, errorHandler_1.asyncHandler)(shorten_controller_1.shortenUrl));
exports.default = router;
