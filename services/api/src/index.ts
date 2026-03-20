import express          from 'express';
import { errorHandler } from './middleware/errorHandler';
// import { rateLimiter }  from './middleware/rateLimiter';
import shortenRoutes    from './routes/shorten';
import redirectRoutes   from './routes/redirect';
// import analyticsRoutes  from './routes/analytics';
import healthRoutes     from './routes/health';

const app = express();
app.set('trust proxy', 1);


app.use(express.json());
// app.use(rateLimiter);   // rate limit ALL routes
app.use('/health',     healthRoutes);
app.use('/api/shorten',    shortenRoutes);
// app.use('/api/analytics',  analyticsRoutes);
app.use('/',redirectRoutes)


app.use(errorHandler);



const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`API running on port ${PORT}`));