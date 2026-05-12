const express = require('express');
const { getProfile, updateProfile, sendConnectionRequest, respondToConnection, getConnections, getSuggestions } = require('../controllers/profileController');
const { authMiddleware } = require('../middlewares/auth');

const router = express.Router();

router.get('/suggestions', authMiddleware, getSuggestions);
router.get('/connections', authMiddleware, getConnections);
router.get('/:userId', authMiddleware, getProfile);
router.put('/me', authMiddleware, updateProfile);
router.post('/:userId/connect', authMiddleware, sendConnectionRequest);
router.put('/connections/:connectionId', authMiddleware, respondToConnection);

module.exports = router;
