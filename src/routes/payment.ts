import express, { Router } from 'express';
import {getPlans, getPublicSessionUrl, webhook} from '../controllers/paymentController';

const router = Router();

router.post('/webhook',express.raw({type: 'application/json'}), webhook);
router.get('/public-session-url', getPublicSessionUrl)
router.get("/plans", getPlans)


export default router;
