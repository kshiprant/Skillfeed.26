import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import ConnectionRequest from '../models/ConnectionRequest.js';
import Conversation from '../models/Conversation.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

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

const createNotification = async ({
  user,
  type,
  title,
  message,
  relatedUser = null,
  relatedRequest = null,
  relatedConversation = null,
}) => {
  return Notification.create({
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

const sanitizeConnectionRequest = (request) => ({
  _id: request._id,
  fromUser: request.fromUser,
  toUser: request.toUser,
  status: request.status,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

export const sendConnectionRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const io = req.app.get('io');
    const { toUser } = req.body;

    if (!toUser || !mongoose.Types.ObjectId.isValid(toUser)) {
      return res.status(400).json({ message: 'Invalid target user' });
    }

    if (String(toUser) === String(req.user._id)) {
      return res.status(400).json({ message: 'You cannot connect with yourself' });
    }

    const targetUserExists = await User.findById(toUser).select('_id');
    if (!targetUserExists) {
      return res.status(404).json({ message: 'Target user not found' });
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

        const currentUser = await User.findById(req.user._id).select(
          '_id name headline avatarUrl'
        );
        const targetUser = await User.findById(toUser).select(
          '_id name headline avatarUrl'
        );

        const acceptedForTarget = await createNotification({
          user: toUser,
          type: 'connection_accepted',
          title: 'Connection accepted',
          message: 'Your connection request was accepted.',
          relatedUser: req.user._id,
          relatedRequest: existingAnyDirection._id,
          relatedConversation: conversation._id,
        });

        const acceptedForMe = await createNotification({
          user: req.user._id,
          type: 'connection_accepted',
          title: 'Connection accepted',
          message: 'You are now connected.',
          relatedUser: toUser,
          relatedRequest: existingAnyDirection._id,
          relatedConversation: conversation._id,
        });

        if (io) {
          io.to(`user:${String(toUser)}`).emit('notification:new', {
            _id: acceptedForTarget._id,
            type: acceptedForTarget.type,
            title: acceptedForTarget.title,
            message: acceptedForTarget.message,
            relatedUser: currentUser,
            relatedConversation: conversation._id,
            createdAt: acceptedForTarget.createdAt,
          });

          io.to(`user:${String(req.user._id)}`).emit('notification:new', {
            _id: acceptedForMe._id,
            type: acceptedForMe.type,
            title: acceptedForMe.title,
            message: acceptedForMe.message,
            relatedUser: targetUser,
            relatedConversation: conversation._id,
            createdAt: acceptedForMe.createdAt,
          });

          io.to(`user:${String(toUser)}`).emit('conversation:updated', {
            _id: conversation._id,
            user: currentUser,
            lastMessage: conversation.lastMessage || '',
            lastMessageAt: conversation.lastMessageAt || null,
            updatedAt: conversation.updatedAt,
          });

          io.to(`user:${String(req.user._id)}`).emit('conversation:updated', {
            _id: conversation._id,
            user: targetUser,
            lastMessage: conversation.lastMessage || '',
            lastMessageAt: conversation.lastMessageAt || null,
            updatedAt: conversation.updatedAt,
          });
        }

        return res.json({
          message: 'Connection accepted automatically',
          request: sanitizeConnectionRequest(existingAnyDirection),
          conversation,
        });
      }

      if (existingAnyDirection.status === 'rejected') {
        return res.status(400).json({
          message: 'A request already existed and was rejected',
        });
      }
    }

    const request = await ConnectionRequest.create({
      fromUser: req.user._id,
      toUser,
      status: 'pending',
    });

    const senderUser = await User.findById(req.user._id).select(
      '_id name headline avatarUrl'
    );

    const notification = await createNotification({
      user: toUser,
      type: 'connection_request',
      title: 'New connection request',
      message: `${senderUser?.name || 'Someone'} sent you a connection request.`,
      relatedUser: req.user._id,
      relatedRequest: request._id,
    });

    if (io) {
      io.to(`user:${String(toUser)}`).emit('notification:new', {
        _id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedUser: senderUser,
        relatedRequest: request._id,
        createdAt: notification.createdAt,
      });
    }

    return res.status(201).json(sanitizeConnectionRequest(request));
  } catch (error) {
    console.error('sendConnectionRequest error:', error.message);
    return res.status(500).json({ message: 'Failed to send connection request' });
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
        conversationHint: [String(item.fromUser._id), String(item.toUser._id)]
          .sort()
          .join('_'),
      };
    });

    return res.json({ incoming, sent, connections });
  } catch (error) {
    console.error('getPendingRequests error:', error.message);
    return res.status(500).json({ message: 'Failed to fetch connections' });
  }
};

export const actOnRequest = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Invalid input',
        errors: errors.array().map((err) => ({
          field: err.path,
          message: err.msg,
        })),
      });
    }

    const io = req.app.get('io');
    const { id } = req.params;
    const { action } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    const statusMap = {
      accept: 'accepted',
      reject: 'rejected',
    };

    const status = statusMap[action];

    if (!status) {
      return res.status(400).json({ message: 'Invalid action' });
    }

    const request = await ConnectionRequest.findById(id);

    if (!request || String(request.toUser) !== String(req.user._id)) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = status;
    await request.save();

    const fromUser = await User.findById(request.fromUser).select(
      '_id name headline avatarUrl'
    );
    const toUser = await User.findById(request.toUser).select(
      '_id name headline avatarUrl'
    );

    let conversation = null;

    if (status === 'accepted') {
      conversation = await ensureConversation(request.fromUser, request.toUser);

      const notification = await createNotification({
        user: request.fromUser,
        type: 'connection_accepted',
        title: 'Connection accepted',
        message: 'Your connection request was accepted.',
        relatedUser: request.toUser,
        relatedRequest: request._id,
        relatedConversation: conversation._id,
      });

      if (io) {
        io.to(`user:${String(request.fromUser)}`).emit('notification:new', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedUser: toUser,
          relatedConversation: conversation._id,
          createdAt: notification.createdAt,
        });

        io.to(`user:${String(request.fromUser)}`).emit('conversation:updated', {
          _id: conversation._id,
          user: toUser,
          lastMessage: conversation.lastMessage || '',
          lastMessageAt: conversation.lastMessageAt || null,
          updatedAt: conversation.updatedAt,
        });

        io.to(`user:${String(request.toUser)}`).emit('conversation:updated', {
          _id: conversation._id,
          user: fromUser,
          lastMessage: conversation.lastMessage || '',
          lastMessageAt: conversation.lastMessageAt || null,
          updatedAt: conversation.updatedAt,
        });
      }
    }

    if (status === 'rejected') {
      const notification = await createNotification({
        user: request.fromUser,
        type: 'connection_rejected',
        title: 'Connection request declined',
        message: 'Your connection request was declined.',
        relatedUser: request.toUser,
        relatedRequest: request._id,
      });

      if (io) {
        io.to(`user:${String(request.fromUser)}`).emit('notification:new', {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          relatedUser: toUser,
          relatedRequest: request._id,
          createdAt: notification.createdAt,
        });
      }
    }

    return res.json({
      message: `Request ${status}`,
      request: sanitizeConnectionRequest(request),
      conversation,
    });
  } catch (error) {
    console.error('actOnRequest error:', error.message);
    return res.status(500).json({ message: 'Failed to update request' });
  }
};
