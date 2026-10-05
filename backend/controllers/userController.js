const User = require('../models/User');


const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide name, email and password' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
  }

  
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    role: 'user',
  });

  return res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: { user: user.toPublicUser() },
  });
};


const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users.map((u) => u.toPublicUser()) });
  } catch (error) {
    next(error);
  }
};


const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const isSelf = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: you cannot view this user' });
    }
    res.status(200).json({ success: true, data: user.toPublicUser() });
  } catch (error) {
    next(error);
  }
};


const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSelf = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: you cannot update this user' });
    }

    const { name, email, password, role } = req.body;

    if (name !== undefined && name !== '') user.name = name.trim();
    if (email !== undefined && email !== '') user.email = email.toLowerCase().trim();
    if (password !== undefined && password !== '') user.password = password; // hashed by pre-save hook

    
    if (role !== undefined && role !== user.role) {
      if (!isAdmin) {
        return res.status(403).json({ success: false, message: 'You cannot change your account role' });
      }
      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Invalid role' });
      }
     
      if (user.role === 'admin' && role === 'user') {
        const adminCount = await User.countDocuments({ role: 'admin' });
        if (adminCount <= 1) {
          return res.status(400).json({ success: false, message: 'Cannot demote the last administrator' });
        }
      }
      user.role = role;
    }

    await user.save();
    res.status(200).json({ success: true, message: 'Profile updated', data: user.toPublicUser() });
  } catch (error) {
    next(error);
  }
};


const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isSelf = req.user._id.toString() === user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Forbidden: you cannot delete this user' });
    }

    
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Cannot delete the last administrator' });
      }
    }

    await user.deleteOne();
    res.status(200).json({ success: true, message: 'User deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerUser, getUsers, getUserById, updateUser, deleteUser };
