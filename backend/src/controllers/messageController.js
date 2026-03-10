import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

export const getConversations = async (req, res) => {
  const conversations = await Conversation.find({ members: req.user._id })
    .populate('members', 'name headline avatarUrl')
    .sort({ lastMessageAt: -1, updatedAt: -1 });
  res.json(conversations);
};

export const getMessages = async (req, res) => {
  const convo = await Conversation.findById(req.params.conversationId);
  if (!convo || !convo.members.some((id) => String(id) === String(req.user._id))) {
    return res.status(403).json({ message: 'Conversation not found' });
  }
  const messages = await Message.find({ conversationId: convo._id })
    .populate('sender', 'name avatarUrl')
    .sort({ createdAt: 1 });
  res.json(messages);
};

export const sendMessage = async (req, res) => {
  const { receiverId, text } = req.body;
  if (!receiverId || !text?.trim()) return res.status(400).json({ message: 'Receiver and text required' });

  const conversation = await Conversation.findOne({ members: { $all: [req.user._id, receiverId], $size: 2 } });
  if (!conversation) return res.status(403).json({ message: 'You can only message accepted connections' });

  const message = await Message.create({
    conversationId: conversation._id,
    sender: req.user._id,
    receiver: receiverId,
    text: text.trim(),
  });

  conversation.lastMessage = text.trim();
  conversation.lastMessageAt = new Date();
  await conversation.save();

  const populated = await message.populate('sender', 'name avatarUrl');
  res.status(201).json(populated);
};
