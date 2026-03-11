import express from 'express';
import protect from '../middleware/authMiddleware.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Notification from '../models/Notification.js';

const router = express.Router();

const ensureConversation = async (userA, userB) => {
  const existing = await Conversation.findOne({
    members: { $all: [userA, userB], $size: 2 },
  });

  if (existing) return existing;

  return Conversation.create({
    members: [userA, userB],
    lastMessage: '',
    lastMessageAt: null,
  });
};

const areUsersConnected = async (userA, userB) => {
  const connection = await ConnectionRequest.findOne({
    status: 'accepted',
    $or: [
      { fromUser: userA, toUser: userB },
      { fromUser: userB, toUser: userA },
    ],
  });

  return Boolean(connection);
};

/**
 * GET /api/messages
 * Return all conversations for logged in user
 */
router.get('/', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: req.user._id,
    })
      .populate('members', 'name headline avatarUrl')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    const result = conversations.map((conversation) => {
      const otherUser = conversation.members.find(
        (member) => String(member._id) !== String(req.user._id)
      );

      return {
        _id: conversation._id,
        user: otherUser || null,
        lastMessage: conversation.lastMessage || '',
        lastMessageAt: conversation.lastMessageAt || null,
        updatedAt: conversation.updatedAt,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('GET /api/messages error:', error);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/messages/thread/:userId
 * Return full thread between logged in user and target user
 */
router.get('/thread/:userId', protect, async (req, res) => {
  try {
    const me = String(req.user._id);
    const otherUserId = String(req.params.userId);

    const connected = await areUsersConnected(me, otherUserId);

    if (!connected) {
      return res.status(403).json({ message: 'You can only message accepted connections' });
    }

    const conversation = await ensureConversation(me, otherUserId);

    const messages = await Message.find({
      conversationId: conversation._id,
    })
      .populate('sender', 'name avatarUrl')
      .populate('receiver', 'name avatarUrl')
      .sort({ createdAt: 1 });

    res.json({
      conversationId: conversation._id,
      messages,
    });
  } catch (error) {
    console.error('GET /api/messages/thread/:userId error:', error);
    res.status(500).json({ message: 'Failed to fetch thread' });
  }
});

/**
 * POST /api/messages
 * Send message to accepted connection
 * body: { text, toUser }
 */
router.post('/', protect, async (req, res) => {
  try {
    const { text, toUser } = req.body;

    if (!toUser || String(toUser) === String(req.user._id)) {
      return res.status(400).json({ message: 'Invalid recipient' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const connected = await areUsersConnected(req.user._id, toUser);

    if (!connected) {
      return res.status(403).json({ message: 'You can only message accepted connections' });
    }

    const conversation = await ensureConversation(req.user._id, toUser);

    const message = await Message.create({
      conversationId: conversation._id,
      sender: req.user._id,
      receiver: toUser,
      text: text.trim(),
      read: false,
    });

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    await Notification.create({
      user: toUser,
      type: 'message',
      title: 'New message',
      message: text.trim().slice(0, 100),
      relatedUser: req.user._id,
      relatedConversation: conversation._id,
      relatedMessage: message._id,
      isRead: false,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name avatarUrl')
      .populate('receiver', 'name avatarUrl');

    res.status(201).json({
      message: 'Message sent',
      conversationId: conversation._id,
      data: populatedMessage,
    });
  } catch (error) {
    console.error('POST /api/messages error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
