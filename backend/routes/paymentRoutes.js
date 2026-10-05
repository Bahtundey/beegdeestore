const express = require('express');
const router = express.Router();
const { initializePayment, verifyPayment } = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');


router.post('/initialize', authMiddleware, initializePayment);
router.get('/verify/:reference', authMiddleware, verifyPayment);

module.exports = router;
