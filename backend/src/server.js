import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import connectDB from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import ideaRoutes from './routes/ideaRoutes.js';

import joinRequestRoutes from './routes/joinRequestRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// import messageRoutes from './routes/messageRoutes.js';

import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();
connectDB();

const app = express();

/* CORS */

app.use(
  cors({
    origin: process.env.CLIENT_URL
      ? process.env.CLIENT_URL.split(',')
      : true,
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

/* Optional Messaging */
// app.use('/api/messages', messageRoutes);

/* Error Handling */

app.use(notFound);
app.use(errorHandler);

/* Start Server */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () =>
  console.log(`Skillfeed API running on port ${PORT}`)
);
