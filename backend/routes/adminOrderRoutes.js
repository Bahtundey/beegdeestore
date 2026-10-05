const express = require('express');
const router = express.Router();
const { getAdminOrders, getAdminOrderById, updateOrderStatus } = require('../controllers/orderController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');


router.get('/', authMiddleware, adminMiddleware, getAdminOrders);
router.get('/:id', authMiddleware, adminMiddleware, getAdminOrderById);
router.put('/:id', authMiddleware, adminMiddleware, updateOrderStatus);

module.exports = router;
