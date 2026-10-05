const jwt = require('jsonwebtoken');
const User = require('../models/User');


const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: user.toPublicUser(),
    },
  });
};


const getMe = async (req, res) => {
  return res.status(200).json({ success: true, data: req.user });
};

module.exports = { login, getMe };
