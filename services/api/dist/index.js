"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middleware/errorHandler");
// import { rateLimiter }  from './middleware/rateLimiter';
const shorten_1 = __importDefault(require("./routes/shorten"));
const redirect_1 = __importDefault(require("./routes/redirect"));
// import analyticsRoutes  from './routes/analytics';
const health_1 = __importDefault(require("./routes/health"));
const app = (0, express_1.default)();
app.set('trust proxy', 1);
app.use(express_1.default.json());
// app.use(rateLimiter);   // rate limit ALL routes
app.use('/health', health_1.default);
app.use('/api/shorten', shorten_1.default);
// app.use('/api/analytics',  analyticsRoutes);
app.use('/', redirect_1.default);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));
