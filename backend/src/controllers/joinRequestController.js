import JoinRequest from '../models/JoinRequest.js';
import Idea from '../models/Idea.js';
import Notification from '../models/Notification.js';

/* Send join request */

export const createJoinRequest = async (req, res, next) => {
  try {
    const { roleRequested, message } = req.body;

    const idea = await Idea.findById(req.params.ideaId).populate(
      'user',
      'name'
    );

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    if (String(idea.user._id) === String(req.user._id)) {
      return res
        .status(400)
        .json({ message: 'You cannot join your own project' });
    }

    const request = await JoinRequest.create({
      idea: idea._id,
      founder: idea.user._id,
      applicant: req.user._id,
      roleRequested,
      message,
    });

    idea.joinRequestsCount += 1;
    await idea.save();

    await Notification.create({
      user: idea.user._id,
      actor: req.user._id,
      type: 'join_request',
      idea: idea._id,
      joinRequest: request._id,
      text: `${req.user.name} requested to join your project`,
    });

    res.status(201).json(request);
  } catch (err) {
    next(err);
  }
};

/* Get my join requests */

export const getMyJoinRequests = async (req, res, next) => {
  try {
    const incoming = await JoinRequest.find({ founder: req.user._id })
      .populate('idea', 'title stage')
      .populate('applicant', 'name headline skills city')
      .sort({ createdAt: -1 });

    const sent = await JoinRequest.find({ applicant: req.user._id })
      .populate('idea', 'title stage')
      .populate('founder', 'name headline')
      .sort({ createdAt: -1 });

    res.json({ incoming, sent });
  } catch (err) {
    next(err);
  }
};

/* Accept or reject request */

export const updateJoinRequestStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const request = await JoinRequest.findById(req.params.requestId)
      .populate('idea', 'title')
      .populate('applicant', 'name');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (String(request.founder) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not allowed' });
    }

    request.status = status;
    await request.save();

    await Notification.create({
      user: request.applicant._id,
      actor: req.user._id,
      type: status === 'accepted' ? 'join_accepted' : 'join_rejected',
      idea: request.idea._id,
      joinRequest: request._id,
      text:
        status === 'accepted'
          ? `Your request to join "${request.idea.title}" was accepted`
          : `Your request to join "${request.idea.title}" was rejected`,
    });

    res.json(request);
  } catch (err) {
    next(err);
  }
};
