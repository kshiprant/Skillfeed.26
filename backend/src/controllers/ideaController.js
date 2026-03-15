import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Idea from '../models/Idea.js';

const calculateIdeaScore = (idea) => {
  return (
    (idea.likes?.length || 0) * 2 +
    (idea.comments?.length || 0) * 3 +
    (idea.joinRequestsCount || 0) * 5
  );
};

const normalizeStringArray = (value, maxItems = 15, maxLength = 40) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean)
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
};

export const createIdea = async (req, res) => {
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

    const { title, description, stage, tags, lookingFor } = req.body;

    const safeTitle = typeof title === 'string' ? title.trim() : '';
    const safeDescription =
      typeof description === 'string' ? description.trim() : '';
    const safeStage =
      typeof stage === 'string' ? stage.trim().slice(0, 40) : '';

    if (!safeTitle || !safeDescription) {
      return res.status(400).json({
        message: 'Title and description required',
      });
    }

    const idea = await Idea.create({
      user: req.user._id,
      title: safeTitle,
      description: safeDescription,
      stage: safeStage,
      tags: normalizeStringArray(tags, 15, 30),
      lookingFor: normalizeStringArray(lookingFor, 15, 50),
      comments: [],
      likes: [],
      joinRequestsCount: 0,
      views: 0,
      score: 0,
    });

    const populated = await Idea.findById(idea._id)
      .populate('user', 'name headline avatarUrl')
      .populate('comments.user', 'name avatarUrl');

    return res.status(201).json(populated);
  } catch (error) {
    console.error('createIdea error:', error);
    return res.status(500).json({ message: 'Failed to create idea' });
  }
};

export const getIdeas = async (req, res) => {
  try {
    const ideas = await Idea.find()
      .populate('user', 'name headline avatarUrl')
      .populate('comments.user', 'name avatarUrl')
      .sort({ score: -1, createdAt: -1 })
      .limit(100);

    return res.json(ideas);
  } catch (error) {
    console.error('getIdeas error:', error);
    return res.status(500).json({ message: 'Failed to load ideas' });
  }
};

export const getIdeaComments = async (req, res) => {
  try {
    const { id } = req.params;

    const rawPage = Number(req.query.page);
    const rawLimit = Number(req.query.limit);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, 20)
        : 10;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const idea = await Idea.findById(id)
      .populate('comments.user', 'name avatarUrl')
      .select('comments')
      .lean();

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const comments = Array.isArray(idea.comments) ? idea.comments : [];
    const total = comments.length;

    const sortedComments = [...comments].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const start = (page - 1) * limit;
    const paginatedComments = sortedComments.slice(start, start + limit);

    return res.json({
      comments: paginatedComments,
      page,
      limit,
      total,
      hasMore: start + limit < total,
    });
  } catch (error) {
    console.error('getIdeaComments error:', error);
    return res.status(500).json({ message: 'Failed to load comments' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const idea = await Idea.findById(id).select(
      'likes comments joinRequestsCount'
    );

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const likes = Array.isArray(idea.likes) ? idea.likes : [];

    const alreadyLiked = likes.some(
      (likeUserId) => String(likeUserId) === String(userId)
    );

    let updatedIdea;

    if (alreadyLiked) {
      updatedIdea = await Idea.findByIdAndUpdate(
        id,
        { $pull: { likes: userId } },
        {
          new: true,
          runValidators: false,
          projection: 'likes comments joinRequestsCount',
        }
      );
    } else {
      updatedIdea = await Idea.findByIdAndUpdate(
        id,
        { $addToSet: { likes: userId } },
        {
          new: true,
          runValidators: false,
          projection: 'likes comments joinRequestsCount',
        }
      );
    }

    const score = calculateIdeaScore(updatedIdea);

    await Idea.updateOne({ _id: id }, { $set: { score } });

    return res.json({
      likes: updatedIdea.likes.length,
      liked: !alreadyLiked,
      score,
    });
  } catch (error) {
    console.error('toggleLike error:', error);
    return res.status(500).json({
      message: 'Failed to update like',
      error: error.message,
    });
  }
};

export const addComment = async (req, res) => {
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

    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const safeText = typeof text === 'string' ? text.trim() : '';

    if (!safeText) {
      return res.status(400).json({ message: 'Comment required' });
    }

    const idea = await Idea.findById(id).select(
      '_id likes comments joinRequestsCount'
    );

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const commentDoc = {
      user: userId,
      comment: safeText,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await Idea.updateOne(
      { _id: id },
      { $push: { comments: commentDoc } },
      { runValidators: false }
    );

    const refreshedIdea = await Idea.findById(id)
      .populate('comments.user', 'name avatarUrl')
      .select('comments likes joinRequestsCount');

    const score = calculateIdeaScore(refreshedIdea);

    await Idea.updateOne({ _id: id }, { $set: { score } });

    const comments = Array.isArray(refreshedIdea.comments)
      ? refreshedIdea.comments
      : [];

    const latestComments = comments.slice(-2);
    const newComment = comments[comments.length - 1];

    return res.status(201).json({
      comment: newComment,
      commentsCount: comments.length,
      latestComments,
      score,
    });
  } catch (error) {
    console.error('addComment error:', error);
    return res.status(500).json({
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

export const deleteIdea = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const idea = await Idea.findById(id);

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    if (String(idea.user) !== String(req.user._id)) {
      return res
        .status(403)
        .json({ message: 'Not authorized to delete this idea' });
    }

    await idea.deleteOne();

    return res.json({ message: 'Idea deleted successfully', id });
  } catch (error) {
    console.error('deleteIdea error:', error);
    return res.status(500).json({ message: 'Failed to delete idea' });
  }
};
