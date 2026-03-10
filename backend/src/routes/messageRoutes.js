import express from 'express';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// get messages
router.get('/', protect, async (req, res) => {
  res.json([]);
});

// send message
router.post('/', protect, async (req, res) => {
  const { text, toUser } = req.body;

  res.json({
    message: 'Message sent',
    text,
    toUser,
  });
});

export default router;
