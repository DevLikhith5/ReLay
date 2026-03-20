import { Router }             from 'express';
import { shortenUrl }         from '../controllers/shorten.controller';
import { validateShortenBody } from '../middleware/validateUrl';
import { asyncHandler }       from '../middleware/errorHandler';

const router = Router();

router.post('/', validateShortenBody, asyncHandler(shortenUrl));

export default router;