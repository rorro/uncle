import express from 'express';
import controller from '../controllers/admin.controller';

const router = express.Router();

// /me/id
router.get('/me', controller.getAdmin);

export default router;
