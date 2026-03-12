import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized' });
  }

  try {
    const token = authHeader.split(' ')[1]?.trim();

    if (!token) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id || !mongoose.Types.ObjectId.isValid(decoded.id)) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id).select(
      '_id name email headline bio skills city avatarUrl role links createdAt updatedAt'
    );

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Optional future checks:
    // if (user.isBlocked) {
    //   return res.status(403).json({ message: 'Account is blocked' });
    // }

    req.user = user;
    return next();
  } catch (error) {
    console.error('protect middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default protect;
