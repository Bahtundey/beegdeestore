const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  getCartById,
  updateCart,
  deleteCart,
} = require('../controllers/cartController');
const authMiddleware = require('../middleware/authMiddleware');


router.get('/', authMiddleware, getCart);
router.post('/', authMiddleware, addToCart);
router.get('/:id', authMiddleware, getCartById);
router.put('/:id', authMiddleware, updateCart);
router.delete('/:id', authMiddleware, deleteCart);

module.exports = router;
