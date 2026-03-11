import ConnectionRequest from '../models/ConnectionRequest.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';

const ensureConversation = async (userA, userB) => {
  const existing = await Conversation.findOne({
    members: { $all: [userA, userB], $size: 2 },
  });

  if (existing) return existing;

  return Conversation.create({ members: [userA, userB] });
};

const createNotification = async ({
  user,
  type,
  title,
  message,
  relatedUser = null,
  relatedRequest = null,
  relatedConversation = null,
}) => {
  await Notification.create({
    user,
    type,
    title,
    message,
    relatedUser,
    relatedRequest,
    relatedConversation,
    isRead: false,
  });
};

export const sendConnectionRequest = async (req, res) => {
  try {
    const toUser = req.body.toUser;

    if (!toUser || String(toUser) === String(req.user._id)) {
      return res.status(400).json({ message: 'Invalid target user' });
    }

    const existingAnyDirection = await ConnectionRequest.findOne({
      $or: [
        { fromUser: req.user._id, toUser },
        { fromUser: toUser, toUser: req.user._id },
      ],
    });

    if (existingAnyDirection) {
      if (existingAnyDirection.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected' });
      }

      if (
        String(existingAnyDirection.fromUser) === String(req.user._id) &&
        String(existingAnyDirection.toUser) === String(toUser) &&
        existingAnyDirection.status === 'pending'
      ) {
        return res.status(400).json({ message: 'Request already sent' });
      }

      if (
        String(existingAnyDirection.fromUser) === String(toUser) &&
        String(existingAnyDirection.toUser) === String(req.user._id) &&
        existingAnyDirection.status === 'pending'
      ) {
        existingAnyDirection.status = 'accepted';
        await existingAnyDirection.save();

        const conversation = await ensureConversation(req.user._id, toUser);

        await createNotification({
          user: toUser,
          type: 'connection_accepted',
          title: 'Connection accepted',
          message: 'Your connection request was accepted.',
          relatedUser: req.user._id,
          relatedRequest: existingAnyDirection._id,
          relatedConversation: conversation._id,
        });

        await createNotification({
          user: req.user._id,
          type: 'connection_accepted',
          title: 'Connection accepted',
          message: 'You are now connected.',
          relatedUser: toUser,
          relatedRequest: existingAnyDirection._id,
          relatedConversation: conversation._id,
        });

        return res.json({
          message: 'Connection accepted automatically',
          request: existingAnyDirection,
          conversation,
        });
      }

      if (existingAnyDirection.status === 'rejected') {
        return res.status(400).json({ message: 'A request already existed and was rejected' });
      }
    }

    const request = await ConnectionRequest.create({
      fromUser: req.user._id,
      toUser,
      status: 'pending',
    });

    await createNotification({
      user: toUser,
      type: 'connection_request',
      title: 'New connection request',
      message: 'Someone sent you a connection request.',
      relatedUser: req.user._id,
      relatedRequest: request._id,
    });

    res.status(201).json(request);
  } catch (error) {
    console.error('sendConnectionRequest error:', error);
    res.status(500).json({ message: 'Failed to send connection request' });
  }
};

export const getPendingRequests = async (req, res) => {
  try {
    const incoming = await ConnectionRequest.find({
      toUser: req.user._id,
      status: 'pending',
    })
      .populate('fromUser', 'name headline skills avatarUrl')
      .sort({ createdAt: -1 });

    const sent = await ConnectionRequest.find({
      fromUser: req.user._id,
      status: 'pending',
    })
      .populate('toUser', 'name headline skills avatarUrl')
      .sort({ createdAt: -1 });

    const accepted = await ConnectionRequest.find({
      status: 'accepted',
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    })
      .populate('fromUser', 'name headline skills avatarUrl')
      .populate('toUser', 'name headline skills avatarUrl')
      .sort({ updatedAt: -1 });

    const connections = accepted.map((item) => {
      const isRequester = String(item.fromUser._id) === String(req.user._id);
      const otherUser = isRequester ? item.toUser : item.fromUser;

      return {
        _id: item._id,
        user: otherUser,
        connectedAt: item.updatedAt,
        conversationHint: [String(item.fromUser._id), String(item.toUser._id)].sort().join('_'),
      };
    });

    res.json({ incoming, sent, connections });
  } catch (error) {
    console.error('getPendingRequests error:', error);
    res.status(500).json({ message: 'Failed to fetch connections' });
  }
};

export const actOnRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await ConnectionRequest.findById(req.params.id);

    if (!request || String(request.toUser) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    request.status = status;
    await request.save();

    let conversation = null;

    if (status === 'accepted') {
      conversation = await ensureConversation(request.fromUser, request.toUser);

      await createNotification({
        user: request.fromUser,
        type: 'connection_accepted',
        title: 'Connection accepted',
        message: 'Your connection request was accepted.',
        relatedUser: request.toUser,
        relatedRequest: request._id,
        relatedConversation: conversation._id,
      });
    }

    if (status === 'rejected') {
      await createNotification({
        user: request.fromUser,
        type: 'connection_rejected',
        title: 'Connection request declined',
        message: 'Your connection request was declined.',
        relatedUser: request.toUser,
        relatedRequest: request._id,
      });
    }

    res.json({
      message: `Request ${status}`,
      request,
      conversation,
    });
  } catch (error) {
    console.error('actOnRequest error:', error);
    res.status(500).json({ message: 'Failed to update request' });
  }
};
