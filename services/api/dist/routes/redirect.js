"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const redirect_controller_1 = require("../controllers/redirect.controller");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.get('/:code', (0, errorHandler_1.asyncHandler)(redirect_controller_1.redirectUrl));
exports.default = router;
