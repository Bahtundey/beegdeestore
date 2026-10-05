const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const {
  initializePayment: initPaystack,
  verifyPayment: verifyPaystack,
} = require('../services/paystackService');

const CURRENCY = process.env.PAYSTACK_CURRENCY || 'NGN';

function isEmail(value) {
  return typeof value === 'string' && /.+@.+\..+/.test(value);
}

async function validateCart(cart) {
  const items = [];
  let total = 0;
  for (const item of cart.items) {
    if (!item.product) {
      throw new Error('One of the products in your cart is no longer available.');
    }
    if (item.quantity > item.product.stock) {
      throw new Error(`Only ${item.product.stock} units of "${item.product.name}" are currently available.`);
    }
    total += item.product.price * item.quantity;
    items.push({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.image,
    });
  }
  return { items, total };
}


const initializePayment = async (req, res, next) => {
  try {
    const email = (req.body && req.body.email && req.body.email.trim()) || req.user.email;
    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    let items, total;
    try {
      ({ items, total } = await validateCart(cart));
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const amount = Math.round(total * 100); 
    const result = await initPaystack({
      email,
      amount,
      currency: CURRENCY,
      callbackUrl: (process.env.FRONTEND_URL || 'http://localhost:5500') + '/payment-success.html',
    });

    if (!result.status) {
      return res.status(502).json({ success: false, message: result.message || 'Could not initialize payment' });
    }

    res.status(200).json({
      success: true,
      message: 'Payment initialized',
      data: {
        authorizationUrl: result.data.authorization_url,
        reference: result.data.reference,
      },
    });
  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const reference = req.params.reference;
    if (!reference) {
      return res.status(400).json({ success: false, message: 'Missing transaction reference' });
    }

    const result = await verifyPaystack(reference);
    if (!result.status) {
      return res.status(502).json({ success: false, message: result.message || 'Could not verify payment' });
    }

    const tx = result.data;
    if (!tx || tx.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment was not successful',
        data: { status: tx ? tx.status : 'unknown' },
      });
    }

   
    const existing = await Order.findOne({ paymentReference: reference });
    if (existing) {
      return res.status(200).json({ success: true, data: existing });
    }

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: 'Your cart is empty' });
    }

    let items, total;
    try {
      ({ items, total } = await validateCart(cart));
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    
    const expectedAmount = Math.round(total * 100);
    if (tx.amount !== expectedAmount) {
      return res.status(400).json({ success: false, message: 'Payment amount does not match the order total' });
    }

    const order = await Order.create({
      user: req.user._id,
      items,
      subtotal: total,
      total,
      currency: tx.currency || CURRENCY,
      paymentReference: reference,
      paymentStatus: 'paid',
      orderStatus: 'processing',
      customer: { name: req.user.name, email: req.user.email },
    });

    
    for (const item of items) {
      const updated = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (!updated) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.name}" — your order could not be completed.`,
        });
      }
    }

    cart.items = [];
    await cart.save();

    res.status(201).json({ success: true, message: 'Payment verified and order created', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = { initializePayment, verifyPayment };
