import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    ideaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Idea', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export default mongoose.model('Comment', commentSchema);
