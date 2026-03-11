import express from 'express';
import Notification from '../models/Notification.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .populate('relatedUser', 'name headline avatarUrl')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error) {
    console.error('get notifications error:', error);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user._id,
      isRead: false,
    });

    res.json({ count });
  } catch (error) {
    console.error('unread count error:', error);
    res.status(500).json({ message: 'Failed to fetch unread count' });
  }
});

router.patch('/:id/read', protect, async (req, res) => {
  try {
    const item = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(item);
  } catch (error) {
    console.error('mark read error:', error);
    res.status(500).json({ message: 'Failed to update notification' });
  }
});

router.patch('/read-all/all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('mark all read error:', error);
    res.status(500).json({ message: 'Failed to update notifications' });
  }
});

export default router;
