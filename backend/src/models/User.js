import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    headline: {
      type: String,
      default: '',
      trim: true,
    },

    bio: {
      type: String,
      default: '',
      trim: true,
    },

    skills: [{ type: String, trim: true }],

    city: {
      type: String,
      default: '',
      trim: true,
    },

    avatarUrl: {
      type: String,
      default: '',
      trim: true,
    },

    role: {
      type: String,
      default: 'Member',
      trim: true,
    },

    links: {
      instagram: { type: String, default: '', trim: true },
      linkedin: { type: String, default: '', trim: true },
      portfolio: { type: String, default: '', trim: true },
    },

    interests: [{ type: String, trim: true }],

    openToCollaborate: {
      type: Boolean,
      default: true,
    },

    profileScore: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
