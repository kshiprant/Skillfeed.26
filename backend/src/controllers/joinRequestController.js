import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import JoinRequest from '../models/JoinRequest.js';
import Idea from '../models/Idea.js';
import Notification from '../models/Notification.js';

const sanitizeJoinRequest = (request) => ({
  _id: request._id,
  idea: request.idea,
  founder: request.founder,
  applicant: request.applicant,
  roleRequested: request.roleRequested || '',
  message: request.message || '',
  status: request.status,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

/* Send join request */

export const createJoinRequest = async (req, res, next) => {
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

    const { ideaId } = req.params;
    const roleRequested =
      typeof req.body.roleRequested === 'string'
        ? req.body.roleRequested.trim().slice(0, 80)
        : '';
    const message =
      typeof req.body.message === 'string'
        ? req.body.message.trim().slice(0, 500)
        : '';

    if (!mongoose.Types.ObjectId.isValid(ideaId)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const idea = await Idea.findById(ideaId).populate('user', 'name');

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    if (String(idea.user._id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: 'You cannot join your own project' });
    }

    const existing = await JoinRequest.findOne({
      idea: idea._id,
      applicant: req.user._id,
    });

    if (existing) {
      return res.status(400).json({
        message: 'You have already sent a request for this project',
      });
    }

    const request = await JoinRequest.create({
      idea: idea._id,
      founder: idea.user._id,
      applicant: req.user._id,
      roleRequested,
      message,
      status: 'pending',
    });

    idea.joinRequestsCount = (idea.joinRequestsCount || 0) + 1;
    await idea.save();

    await Notification.create({
      user: idea.user._id,
      type: 'join_request',
      title: 'New join request',
      message: `${req.user.name} requested to join your project.`,
      relatedUser: req.user._id,
      relatedIdea: idea._id,
      relatedJoinRequest: request._id,
      isRead: false,
    });

    return res.status(201).json(sanitizeJoinRequest(request));
  } catch (err) {
    console.error('createJoinRequest error:', err.message);
    return next(err);
  }
};

/* Get my join requests */

export const getMyJoinRequests = async (req, res, next) => {
  try {
    const incoming = await JoinRequest.find({ founder: req.user._id })
      .populate('idea', 'title stage')
      .populate('applicant', 'name headline skills city avatarUrl')
      .sort({ createdAt: -1 });

    const sent = await JoinRequest.find({ applicant: req.user._id })
      .populate('idea', 'title stage')
      .populate('founder', 'name headline avatarUrl')
      .sort({ createdAt: -1 });

    return res.json({
      incoming: incoming.map(sanitizeJoinRequest),
      sent: sent.map(sanitizeJoinRequest),
    });
  } catch (err) {
    console.error('getMyJoinRequests error:', err.message);
    return next(err);
  }
};

/* Accept or reject request */

export const updateJoinRequestStatus = async (req, res, next) => {
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

    const { requestId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({ message: 'Invalid request ID' });
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await JoinRequest.findById(requestId)
      .populate('idea', 'title')
      .populate('applicant', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (String(request.founder) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }

    request.status = status;
    await request.save();

    await Notification.create({
      user: request.applicant._id,
      type: status === 'accepted' ? 'join_accepted' : 'join_rejected',
      title: status === 'accepted' ? 'Join request accepted' : 'Join request rejected',
      message:
        status === 'accepted'
          ? `Your request to join "${request.idea.title}" was accepted.`
          : `Your request to join "${request.idea.title}" was rejected.`,
      relatedUser: req.user._id,
      relatedIdea: request.idea._id,
      relatedJoinRequest: request._id,
      isRead: false,
    });

    return res.json(sanitizeJoinRequest(request));
  } catch (err) {
    console.error('updateJoinRequestStatus error:', err.message);
    return next(err);
  }
};
