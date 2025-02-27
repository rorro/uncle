import express from 'express';
import controller from '../controllers/dashboard.controller';

const router = express.Router();

router.get('/', controller.getData);
router.get('/auth', controller.authenticate);
router.post('/logout', controller.logout);
router.get('/verifylogin', controller.verifyLogin);
router.post('/savedata', controller.saveData);
router.delete('/deletemessage', controller.deleteScheduledMessage);
router.post('/updateleaderboard', controller.updateLeaderboard);
router.post('/leaderboardchangelog', controller.postLeaderboardChangelog);
router.get('/speedboard', controller.getSpeedBoard);
router.get('/petsleaderboard', controller.getPetsLeaderboard);
router.get('/embeds', controller.getEmbeds);
router.get('/scheduledmessages', controller.getScheduledMessages);
router.get('/sentmessages', controller.getSentMessages);
router.get('/configs', controller.getConfigs);

export default router;
