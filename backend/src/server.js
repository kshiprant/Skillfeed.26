import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { Server } from 'socket.io';
import mongoose from 'mongoose';

import connectDB from './config/db.js';
import User from './models/User.js';
import Conversation from './models/Conversation.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import ideaRoutes from './routes/ideaRoutes.js';
import joinRequestRoutes from './routes/joinRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

const requiredEnv = ['JWT_SECRET', 'MONGO_URI', 'CLIENT_URL'];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long');
}

await connectDB();

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true); // mobile apps / curl / same-origin tools
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
};

const io = new Server(httpServer, {
  cors: corsOptions,
});

app.set('io', io);

/* Security middleware */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(express.json({ limit: '2mb' }));
app.use(mongoSanitize());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});

app.use(globalLimiter);

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* CORS */

app.use(cors(corsOptions));

/* Socket auth */

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name email');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    return next();
  } catch (error) {
    return next(new Error('Invalid token'));
  }
});

/* Socket events */

io.on('connection', (socket) => {
  const userId = String(socket.user._id);

  socket.join(`user:${userId}`);

  socket.on('join_conversation', async ({ conversationId }) => {
    try {
      if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
        return;
      }

      const conversation = await Conversation.findById(conversationId).select('members');

      if (!conversation) return;

      const isMember = conversation.members.some(
        (memberId) => String(memberId) === userId
      );

      if (!isMember) return;

      socket.join(`conversation:${conversationId}`);
    } catch (error) {
      console.error('Socket join_conversation error:', error.message);
    }
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {
    // optional
  });
});

/* Health Check */

app.get('/api/health', (_, res) => {
  res.json({
    ok: true,
    message: 'Skillfeed API is running.',
  });
});

/* API Routes */

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/ideas', ideaRoutes);
app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/messages', messageRoutes);

/* Error Handling */

app.use(notFound);
app.use(errorHandler);

/* Start Server */

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Skillfeed API running on port ${PORT}`);
});
