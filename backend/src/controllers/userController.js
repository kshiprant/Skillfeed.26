import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import User from '../models/User.js';
import ConnectionRequest from '../models/ConnectionRequest.js';

const sanitizeUser = (user, extra = {}) => ({
  _id: user._id,
  name: user.name,
  headline: user.headline || '',
  bio: user.bio || '',
  skills: Array.isArray(user.skills) ? user.skills : [],
  city: user.city || '',
  avatarUrl: user.avatarUrl || '',
  role: user.role || '',
  links: user.links || {},
  openToCollaborate: user.openToCollaborate ?? true,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  ...extra,
});

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const updateProfile = async (req, res) => {
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

    const allowed = ['name', 'headline', 'bio', 'skills', 'city', 'avatarUrl', 'role', 'links'];

    for (const key of allowed) {
      if (req.body[key] === undefined) continue;

      if (key === 'skills') {
        req.user.skills = Array.isArray(req.body.skills)
          ? req.body.skills
              .map((item) => (typeof item === 'string' ? item.trim() : ''))
              .filter(Boolean)
              .slice(0, 30)
          : [];
        continue;
      }

      if (key === 'links') {
        const links = req.body.links || {};
        req.user.links = {
          instagram: typeof links.instagram === 'string' ? links.instagram.trim() : '',
          linkedin: typeof links.linkedin === 'string' ? links.linkedin.trim() : '',
          portfolio: typeof links.portfolio === 'string' ? links.portfolio.trim() : '',
        };
        continue;
      }

      req.user[key] =
        typeof req.body[key] === 'string' ? req.body[key].trim() : req.body[key];
    }

    const updated = await req.user.save();
    return res.json(sanitizeUser(updated));
  } catch (error) {
    console.error('updateProfile error:', error.message);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      '_id name email headline bio skills city avatarUrl role links openToCollaborate createdAt updatedAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      ...sanitizeUser(user),
      email: user.email,
    });
  } catch (error) {
    console.error('getMyProfile error:', error.message);
    return res.status(500).json({ message: 'Failed to load profile' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = await User.findById(id).select(
      '_id name headline bio skills city avatarUrl role links openToCollaborate createdAt updatedAt'
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(sanitizeUser(user));
  } catch (error) {
    console.error('getUserById error:', error.message);
    return res.status(500).json({ message: 'Failed to load user' });
  }
};

export const discoverUsers = async (req, res) => {
  try {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const q = rawQuery.slice(0, 50);

    const baseFilter = {
      _id: { $ne: req.user._id },
    };

    let filter = baseFilter;

    if (q) {
      const safeRegex = new RegExp(escapeRegex(q), 'i');
      filter = {
        ...baseFilter,
        $or: [
          { name: safeRegex },
          { headline: safeRegex },
          { skills: { $elemMatch: { $regex: safeRegex } } },
        ],
      };
    }

    const users = await User.find(filter)
      .select('_id name headline bio skills city avatarUrl role links openToCollaborate createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(50);

    const relationRows = await ConnectionRequest.find({
      $or: [{ fromUser: req.user._id }, { toUser: req.user._id }],
    }).select('fromUser toUser status');

    const relationMap = new Map();

    relationRows.forEach((row) => {
      const other =
        String(row.fromUser) === String(req.user._id)
          ? String(row.toUser)
          : String(row.fromUser);

      relationMap.set(other, row.status);
    });

    return res.json(
      users.map((user) =>
        sanitizeUser(user, {
          relationStatus: relationMap.get(String(user._id)) || 'none',
        })
      )
    );
  } catch (error) {
    console.error('discoverUsers error:', error.message);
    return res.status(500).json({ message: 'Failed to discover users' });
  }
};
