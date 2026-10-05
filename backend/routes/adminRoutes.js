const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


router.get('/dashboard', authMiddleware, adminMiddleware, getDashboardStats);

module.exports = router;
