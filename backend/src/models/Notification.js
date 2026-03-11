import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    type: {
      type: String,
      enum: ['like', 'comment', 'join_request', 'join_accepted', 'join_rejected'],
      required: true,
    },

    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Idea',
      default: null,
    },

    joinRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JoinRequest',
      default: null,
    },

    read: {
      type: Boolean,
      default: false,
    },

    text: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);
