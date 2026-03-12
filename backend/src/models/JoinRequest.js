import mongoose from 'mongoose';

const joinRequestSchema = new mongoose.Schema(
  {
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      required: true,
      index: true,
    },

    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    roleRequested: {
      type: String,
      default: '',
      trim: true,
      maxlength: 80,
    },

    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

joinRequestSchema.index({ idea: 1, applicant: 1 }, { unique: true });
joinRequestSchema.index({ founder: 1, status: 1, createdAt: -1 });
joinRequestSchema.index({ applicant: 1, status: 1, createdAt: -1 });

export default mongoose.model('JoinRequest', joinRequestSchema);
