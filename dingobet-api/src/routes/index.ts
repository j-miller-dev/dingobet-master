import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import sportsRoutes from './sports.routes.js';
import eventsRoutes from './events.routes.js';
import oddsRoutes from './odds.routes.js';
import betsRoutes from './bets.routes.js';
import walletRoutes from './wallet.routes.js';
import adminRoutes from './admin.routes.js';

const router: Router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/sports', sportsRoutes);
router.use('/events', eventsRoutes);
router.use('/odds', oddsRoutes);
router.use('/bets', betsRoutes);
router.use('/wallet', walletRoutes);
router.use('/admin', adminRoutes);

export default router;
