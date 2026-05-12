const express = require('express');
const { searchCareers, getCareerById, getFaculties, getCountries } = require('../controllers/careerController');

const router = express.Router();

router.get('/search', searchCareers);
router.get('/faculties', getFaculties);
router.get('/countries', getCountries);
router.get('/:id', getCareerById);

module.exports = router;
