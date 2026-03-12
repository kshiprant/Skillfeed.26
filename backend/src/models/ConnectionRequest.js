import mongoose from 'mongoose';

const connectionRequestSchema = new mongoose.Schema(
  {
    fromUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    toUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
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

/* Prevent duplicate requests */
connectionRequestSchema.index(
  { fromUser: 1, toUser: 1 },
  { unique: true }
);

/* Speed up dashboards */
connectionRequestSchema.index({ toUser: 1, status: 1, createdAt: -1 });
connectionRequestSchema.index({ fromUser: 1, status: 1, createdAt: -1 });

/* Prevent self-connection */
connectionRequestSchema.pre('save', function (next) {
  if (String(this.fromUser) === String(this.toUser)) {
    return next(new Error('Users cannot connect with themselves'));
  }
  next();
});

export default mongoose.model('ConnectionRequest', connectionRequestSchema);
