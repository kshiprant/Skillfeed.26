import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    stage: { type: String, enum: ['Idea', 'MVP', 'Early Traction', 'Scaling'], default: 'Idea' },
    tags: [{ type: String }],
    lookingFor: [{ type: String }],
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export default mongoose.model('Idea', ideaSchema);
