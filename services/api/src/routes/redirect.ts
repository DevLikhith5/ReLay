import { Router }       from 'express';
import { redirectUrl }  from '../controllers/redirect.controller';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

console.log("HELLO")
router.get('/:code', asyncHandler(redirectUrl));

export default router;