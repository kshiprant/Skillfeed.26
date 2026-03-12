import mongoose from 'mongoose';

const ideaCommentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
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
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 120,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      minlength: 10,
      maxlength: 2000,
    },

    stage: {
      type: String,
      enum: ['Idea', 'MVP', 'Early Traction', 'Scaling'],
      default: 'Idea',
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
        maxlength: 30,
      },
    ],

    lookingFor: [
      {
        type: String,
        trim: true,
        maxlength: 50,
      },
    ],

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    comments: [ideaCommentSchema],

    joinRequestsCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    score: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
  },
  { timestamps: true }
);

ideaSchema.index({ score: -1, createdAt: -1 });
ideaSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Idea', ideaSchema);
