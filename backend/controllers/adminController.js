const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

const getDashboardStats = async (req, res, next) => {
  try {
    const [products, users, orders, pendingOrders, paidOrdersList] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ paymentStatus: 'pending' }),
      Order.find({ paymentStatus: 'paid' }),
    ]);

    const paidOrders = paidOrdersList.length;
    const revenue = paidOrdersList.reduce((sum, order) => sum + (order.total || 0), 0);

    res.status(200).json({
      success: true,
      data: { products, users, orders, paidOrders, pendingOrders, revenue },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
