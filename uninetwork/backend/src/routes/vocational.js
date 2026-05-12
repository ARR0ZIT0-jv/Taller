const express = require('express');
const { authMiddleware } = require('../middlewares/auth');
const { getQuestions, submitTest, getResults, getLatestResult } = require('../controllers/vocationalController');

const router = express.Router();

router.get('/questions', authMiddleware, getQuestions);
router.post('/submit', authMiddleware, submitTest);
router.get('/results', authMiddleware, getResults);
router.get('/results/latest', authMiddleware, getLatestResult);

module.exports = router;
