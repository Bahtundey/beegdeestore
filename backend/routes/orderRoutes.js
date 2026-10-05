const express = require('express');
const router = express.Router();
const { getUserOrders, getOrderById } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, getUserOrders);
router.get('/:id', authMiddleware, getOrderById);

module.exports = router;
