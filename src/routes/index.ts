import { Router } from 'express';
import paymentRoutes from './payment';
import toolRoutes from './tool';

const router = Router();

router.use('/payment', paymentRoutes);
router.use('/tools', toolRoutes);

export default router;
