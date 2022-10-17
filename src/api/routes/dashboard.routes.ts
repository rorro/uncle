import express from 'express';
import controller from '../controllers/dashboard.controller';

const router = express.Router();

// /
router.get('/', controller.getData);
router.get('/auth', controller.authenticate);
router.post('/logout', controller.logout);
router.get('/messages', controller.getMessages);
router.get('/verifylogin', controller.verifyLogin);

export default router;
