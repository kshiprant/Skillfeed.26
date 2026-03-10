import Idea from '../models/Idea.js';
import Comment from '../models/Comment.js';

export const createIdea = async (req, res) => {
  const { title, description, stage, tags, lookingFor } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'Title and description required' });

  const idea = await Idea.create({
    user: req.user._id,
    title,
    description,
    stage,
    tags: Array.isArray(tags) ? tags : [],
    lookingFor: Array.isArray(lookingFor) ? lookingFor : [],
  });

  const populated = await idea.populate('user', 'name headline avatarUrl');
  res.status(201).json(populated);
};

export const getIdeas = async (req, res) => {
  const ideas = await Idea.find()
    .populate('user', 'name headline avatarUrl')
    .sort({ createdAt: -1 })
    .lean();

  const ideaIds = ideas.map((idea) => idea._id);
  const comments = await Comment.find({ ideaId: { $in: ideaIds } }).populate('user', 'name avatarUrl').sort({ createdAt: 1 }).lean();
  const grouped = comments.reduce((acc, item) => {
    const key = String(item.ideaId);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  res.json(ideas.map((idea) => ({ ...idea, comments: grouped[String(idea._id)] || [] })));
};

export const toggleLike = async (req, res) => {
  const idea = await Idea.findById(req.params.id);
  if (!idea) return res.status(404).json({ message: 'Idea not found' });

  const existing = idea.likes.find((id) => String(id) === String(req.user._id));
  if (existing) idea.likes = idea.likes.filter((id) => String(id) !== String(req.user._id));
  else idea.likes.push(req.user._id);

  await idea.save();
  res.json({ likes: idea.likes.length, liked: !existing });
};

export const addComment = async (req, res) => {
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ message: 'Comment required' });
  const row = await Comment.create({ ideaId: req.params.id, user: req.user._id, comment });
  const populated = await row.populate('user', 'name avatarUrl');
  res.status(201).json(populated);
};
