require('dotenv').config();

const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5500';
const allowedOrigins = [FRONTEND_URL, FRONTEND_URL.replace('localhost', '127.0.0.1')];

app.use(cors({ origin: allowedOrigins }));

app.use(express.json());


app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'E-commerce API is running' });
});

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/carts', cartRoutes);
app.use('/payments', paymentRoutes);
app.use('/orders', orderRoutes);
app.use('/admin', adminRoutes);
app.use('/admin/orders', adminOrderRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
