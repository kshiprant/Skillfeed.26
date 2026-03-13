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
    const safeStage = typeof stage === 'string' ? stage.trim().slice(0, 40) : '';

    if (!safeTitle || !safeDescription) {
      return res.status(400).json({ message: 'Title and description required' });
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
    console.error('createIdea error:', error.message);
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
    console.error('getIdeas error:', error.message);
    return res.status(500).json({ message: 'Failed to load ideas' });
  }
};

export const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const idea = await Idea.findById(id);

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    const existing = idea.likes.find(
      (likeUserId) => String(likeUserId) === String(req.user._id)
    );

    if (existing) {
      idea.likes = idea.likes.filter(
        (likeUserId) => String(likeUserId) !== String(req.user._id)
      );
    } else {
      idea.likes.push(req.user._id);
    }

    idea.score = calculateIdeaScore(idea);
    await idea.save();

    return res.json({
      likes: idea.likes.length,
      liked: !existing,
      score: idea.score,
    });
  } catch (error) {
    console.error('toggleLike error:', error.message);
    return res.status(500).json({ message: 'Failed to update like' });
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid idea ID' });
    }

    const safeText = typeof text === 'string' ? text.trim() : '';

    if (!safeText) {
      return res.status(400).json({ message: 'Comment required' });
    }

    const idea = await Idea.findById(id);

    if (!idea) {
      return res.status(404).json({ message: 'Idea not found' });
    }

    idea.comments.push({
      user: req.user._id,
      comment: safeText,
    });

    idea.score = calculateIdeaScore(idea);
    await idea.save();

    const updatedIdea = await Idea.findById(id)
      .populate('user', 'name headline avatarUrl')
      .populate('comments.user', 'name avatarUrl');

    const latestComment = updatedIdea.comments[updatedIdea.comments.length - 1];

    return res.status(201).json(latestComment);
  } catch (error) {
    console.error('addComment error:', error.message);
    return res.status(500).json({ message: 'Failed to add comment' });
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
      return res.status(403).json({ message: 'Not authorized to delete this idea' });
    }

    await idea.deleteOne();

    return res.json({ message: 'Idea deleted successfully', id });
  } catch (error) {
    console.error('deleteIdea error:', error.message);
    return res.status(500).json({ message: 'Failed to delete idea' });
  }
};
