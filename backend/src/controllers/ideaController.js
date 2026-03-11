import Idea from '../models/Idea.js';

const calculateIdeaScore = (idea) => {
  return (
    (idea.likes?.length || 0) * 2 +
    (idea.comments?.length || 0) * 3 +
    (idea.joinRequestsCount || 0) * 5
  );
};

export const createIdea = async (req, res) => {
  const { title, description, stage, tags, lookingFor } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Title and description required' });
  }

  const idea = await Idea.create({
    user: req.user._id,
    title: title.trim(),
    description: description.trim(),
    stage,
    tags: Array.isArray(tags) ? tags : [],
    lookingFor: Array.isArray(lookingFor) ? lookingFor : [],
    comments: [],
    likes: [],
    joinRequestsCount: 0,
    views: 0,
    score: 0,
  });

  const populated = await Idea.findById(idea._id)
    .populate('user', 'name headline avatarUrl')
    .populate('comments.user', 'name avatarUrl');

  res.status(201).json(populated);
};

export const getIdeas = async (req, res) => {
  const ideas = await Idea.find()
    .populate('user', 'name headline avatarUrl')
    .populate('comments.user', 'name avatarUrl')
    .sort({ score: -1, createdAt: -1 });

  res.json(ideas);
};

export const toggleLike = async (req, res) => {
  const idea = await Idea.findById(req.params.id);

  if (!idea) {
    return res.status(404).json({ message: 'Idea not found' });
  }

  const existing = idea.likes.find(
    (id) => String(id) === String(req.user._id)
  );

  if (existing) {
    idea.likes = idea.likes.filter(
      (id) => String(id) !== String(req.user._id)
    );
  } else {
    idea.likes.push(req.user._id);
  }

  idea.score = calculateIdeaScore(idea);
  await idea.save();

  res.json({
    likes: idea.likes.length,
    liked: !existing,
    score: idea.score,
  });
};

export const addComment = async (req, res) => {
  const { comment } = req.body;

  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Comment required' });
  }

  const idea = await Idea.findById(req.params.id);

  if (!idea) {
    return res.status(404).json({ message: 'Idea not found' });
  }

  idea.comments.push({
    user: req.user._id,
    comment: comment.trim(),
  });

  idea.score = calculateIdeaScore(idea);
  await idea.save();

  const updatedIdea = await Idea.findById(req.params.id)
    .populate('user', 'name headline avatarUrl')
    .populate('comments.user', 'name avatarUrl');

  const latestComment = updatedIdea.comments[updatedIdea.comments.length - 1];

  res.status(201).json(latestComment);
};
