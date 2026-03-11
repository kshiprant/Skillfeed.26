import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
    },

    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    roleRequested: {
      type: String,
      default: '',
      trim: true,
    },

    message: {
      type: String,
      default: '',
      trim: true,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

joinRequestSchema.index({ idea: 1, applicant: 1 }, { unique: true });

export default mongoose.model('JoinRequest', joinRequestSchema);
