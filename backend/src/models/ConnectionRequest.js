import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

connectionRequestSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

export default mongoose.model('ConnectionRequest', connectionRequestSchema);
