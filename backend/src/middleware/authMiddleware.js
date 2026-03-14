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

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'skillfeed-api',
      audience: 'skillfeed-app',
    });

    // Validate token payload
    if (!decoded?.sub || !mongoose.Types.ObjectId.isValid(decoded.sub)) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }

    // Fetch only required user fields (lighter query)
    const user = await User.findById(decoded.sub)
      .select('_id name email headline avatarUrl role')
      .lean();

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;

    next();
  } catch (error) {
    console.error('protect middleware error:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
};

export default protect;
