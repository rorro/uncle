import express from 'express';
import controller from '../controllers/dashboard.controller';

const router = express.Router();

router.get('/', controller.getData);
router.get('/auth', controller.authenticate);
router.post('/logout', controller.logout);
router.get('/verifylogin', controller.verifyLogin);
router.post('/savedata', controller.saveData);
router.delete('/deletemessage', controller.deleteScheduledMessage);

export default router;
