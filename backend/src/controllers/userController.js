import User from '../models/User.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

export const updateProfile = async (req, res) => {
  const allowed = ['name', 'headline', 'bio', 'skills', 'city', 'avatarUrl', 'role', 'links'];
  allowed.forEach((key) => {
    if (req.body[key] !== undefined) req.user[key] = req.body[key];
  });
  const updated = await req.user.save();
  res.json(updated);
};

export const getMyProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

export const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
};

export const discoverUsers = async (req, res) => {
  const { q = '' } = req.query;
  const users = await User.find({
    _id: { $ne: req.user._id },
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { headline: { $regex: q, $options: 'i' } },
      { skills: { $elemMatch: { $regex: q, $options: 'i' } } },
    ],
  })
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(50);

  const relationRows = await ConnectionRequest.find({
    $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
  });

  const relationMap = new Map();
  relationRows.forEach((row) => {
    const other = String(row.fromUser) === String(req.user._id) ? String(row.toUser) : String(row.fromUser);
    relationMap.set(other, row.status);
  });

  res.json(users.map((user) => ({ ...user.toObject(), relationStatus: relationMap.get(String(user._id)) || 'none' })));
};
