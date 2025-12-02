import { Router } from 'express';
import { getOffersCountSinceController } from '../controllers/offersCount.controller.js'; // <- notar .js

const router = Router();

router.get('/offers/count-since', getOffersCountSinceController);

export default router;
