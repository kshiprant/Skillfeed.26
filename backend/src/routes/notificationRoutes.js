import express from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

const sanitizeNotification = (item) => ({
  _id: item._id,
  type: item.type,
  title: item.title,
  message: item.message,
  isRead: item.isRead,
  relatedConversation: item.relatedConversation || null,
  relatedMessage: item.relatedMessage || null,
  relatedUser: item.relatedUser
    ? {
        _id: item.relatedUser._id,
        name: item.relatedUser.name,
        headline: item.relatedUser.headline || '',
        avatarUrl: item.relatedUser.avatarUrl || '',
      }
    : null,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
});

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedUser', 'name headline avatarUrl')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json(notifications.map(sanitizeNotification));
  } catch (error) {
    console.error('get notifications error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    return res.json({ count });
  } catch (error) {
    console.error('unread count error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid notification ID' });
    }

    const item = await Notification.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { isRead: true },
      { new: true }
    ).populate('relatedUser', 'name headline avatarUrl');

    if (!item) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    return res.json(sanitizeNotification(item));
  } catch (error) {
    console.error('mark read error:', error.message);
    return res.status(500).json({ message: 'Failed to update notification' });
  }
});

router.patch('/read-all/all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    return res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('mark all read error:', error.message);
    return res.status(500).json({ message: 'Failed to update notifications' });
  }
});

export default router;
