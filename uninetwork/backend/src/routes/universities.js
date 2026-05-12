const express = require('express');
const { getAllUniversities, getUniversityById } = require('../controllers/universityController');

const router = express.Router();

router.get('/', getAllUniversities);
router.get('/:id', getUniversityById);

module.exports = router;
