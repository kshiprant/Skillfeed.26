import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import http from 'http';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';

import connectDB from './config/db.js';
import User from './models/User.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import ideaRoutes from './routes/ideaRoutes.js';
import joinRequestRoutes from './routes/joinRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import messageRoutes from './routes/messageRoutes.js';

import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);

const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((item) => item.trim())
  : true;

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);

/* Socket auth */

io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id name email');

    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Invalid token'));
  }
});

/* Socket events */

io.on('connection', (socket) => {
  const userId = String(socket.user._id);

  socket.join(`user:${userId}`);

  socket.on('join_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`conversation:${conversationId}`);
  });

  socket.on('leave_conversation', ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`conversation:${conversationId}`);
  });

  socket.on('disconnect', () => {
    // optional
  });
});

/* CORS */

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

/* Middleware */

app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));

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

/* NEW COLLABORATION ENGINE */

app.use('/api/join-requests', joinRequestRoutes);
app.use('/api/notifications', notificationRoutes);

/* Messaging */

app.use('/api/messages', messageRoutes);

/* Error Handling */

app.use(notFound);
app.use(errorHandler);

/* Start Server */

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Skillfeed API running on port ${PORT}`);
});
