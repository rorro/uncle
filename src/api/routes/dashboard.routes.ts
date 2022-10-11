import express from 'express';
import controller from '../controllers/dashboard.controller';

const router = express.Router();

// /
router.get('/', controller.getData);
router.get('/auth', controller.authenticate);
router.get('/logout', controller.logout);

export default router;
