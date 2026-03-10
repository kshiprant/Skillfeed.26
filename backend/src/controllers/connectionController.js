import ConnectionRequest from '../models/ConnectionRequest.js';
import Conversation from '../models/Conversation.js';

const ensureConversation = async (userA, userB) => {
  const existing = await Conversation.findOne({ members: { $all: [userA, userB], $size: 2 } });
  if (existing) return existing;
  return Conversation.create({ members: [userA, userB] });
};

export const sendConnectionRequest = async (req, res) => {
  const toUser = req.body.toUser;
  if (!toUser || String(toUser) === String(req.user._id)) return res.status(400).json({ message: 'Invalid target user' });

  const existing = await ConnectionRequest.findOne({ fromUser: req.user._id, toUser });
  if (existing) return res.status(400).json({ message: 'Request already sent' });

  const reverse = await ConnectionRequest.findOne({ fromUser: toUser, toUser: req.user._id, status: 'pending' });
  if (reverse) {
    reverse.status = 'accepted';
    await reverse.save();
    await ensureConversation(req.user._id, toUser);
    return res.json({ message: 'Connection accepted automatically', request: reverse });
  }

  const request = await ConnectionRequest.create({ fromUser: req.user._id, toUser });
  res.status(201).json(request);
};

export const getPendingRequests = async (req, res) => {
  const incoming = await ConnectionRequest.find({ toUser: req.user._id, status: 'pending' }).populate('fromUser', 'name headline skills avatarUrl');
  const sent = await ConnectionRequest.find({ fromUser: req.user._id, status: 'pending' }).populate('toUser', 'name headline skills avatarUrl');
  const connections = await ConnectionRequest.find({
    status: 'accepted',
    $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
  })
    .populate('fromUser', 'name headline skills avatarUrl')
    .populate('toUser', 'name headline skills avatarUrl')
    .sort({ updatedAt: -1 });

  res.json({ incoming, sent, connections });
};

export const actOnRequest = async (req, res) => {
  const { status } = req.body;
  const request = await ConnectionRequest.findById(req.params.id);
  if (!request || String(request.toUser) !== String(req.user._id)) return res.status(404).json({ message: 'Request not found' });
  if (!['accepted', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid action' });

  request.status = status;
  await request.save();
  if (status === 'accepted') await ensureConversation(request.fromUser, request.toUser);
  res.json(request);
};
