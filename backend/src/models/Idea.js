import mongoose from 'mongoose';

const ideaCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

const ideaSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    stage: {
      type: String,
      enum: ['Idea', 'MVP', 'Early Traction', 'Scaling'],
      default: 'Idea',
    },
    tags: [{ type: String, trim: true }],
    lookingFor: [{ type: String, trim: true }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    comments: [ideaCommentSchema],

    joinRequestsCount: {
      type: Number,
      default: 0,
    },

    views: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Idea', ideaSchema);
