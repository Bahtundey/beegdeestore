const Cart = require('../models/Cart');
const Product = require('../models/Product');


function buildCartResponse(cart) {
  const items = (cart.items || [])
    .filter((item) => item.product) 
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      subtotal: item.product.price * item.quantity,
    }));
  const total = items.reduce((sum, item) => sum + item.subtotal, 0);
  return {
    _id: cart._id,
    user: cart.user,
    items,
    total,
    createdAt: cart.createdAt,
    updatedAt: cart.updatedAt,
  };
}

async function findOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}


const getCart = async (req, res) => {
  const cart = await findOrCreateCart(req.user._id);
  await cart.populate('items.product');
  res.status(200).json({ success: true, data: buildCartResponse(cart) });
};


const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Number(quantity);

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Please provide a productId' });
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Quantity must be a positive whole number' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'This product is out of stock' });
    }

    const cart = await findOrCreateCart(req.user._id);
    const existing = cart.items.find((item) => item.product.toString() === productId);

    const currentQty = existing ? existing.quantity : 0;
    const newQty = currentQty + qty;

    if (newQty > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} units are available.`,
      });
    }

    if (existing) {
      existing.quantity = newQty;
    } else {
      cart.items.push({ product: productId, quantity: qty });
    }

    await cart.save();
    await cart.populate('items.product');
    res.status(200).json({ success: true, message: 'Product added to cart', data: buildCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};


const getCartById = async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.id).populate('items.product');
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    if (cart.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: you cannot access another user\'s cart' });
    }
    res.status(200).json({ success: true, data: buildCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};


const updateCart = async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    if (cart.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: you cannot modify another user\'s cart' });
    }

    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'Please provide an items array' });
    }

    const normalized = [];
    for (const item of items) {
      const qty = Number(item.quantity);
      if (!item.product || !Number.isInteger(qty) || qty <= 0) {
        return res.status(400).json({ success: false, message: 'Each item needs a product and a positive quantity' });
      }
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ success: false, message: 'One of the products no longer exists' });
      }
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units of "${product.name}" are available.`,
        });
      }
      normalized.push({ product: item.product, quantity: qty });
    }

    cart.items = normalized;
    await cart.save();
    await cart.populate('items.product');
    res.status(200).json({ success: true, message: 'Cart updated', data: buildCartResponse(cart) });
  } catch (error) {
    next(error);
  }
};


const deleteCart = async (req, res, next) => {
  try {
    const cart = await Cart.findById(req.params.id);
    if (!cart) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    if (cart.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Forbidden: you cannot delete another user\'s cart' });
    }
    await cart.deleteOne();
    res.status(200).json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCart, addToCart, getCartById, updateCart, deleteCart };
