import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const isValidUrl = (value) => {
  if (!value) return true;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const trimmedString = (maxLength, defaultValue = '') => ({
  type: String,
  trim: true,
  maxlength: maxLength,
  default: defaultValue,
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 200,
      select: false,
    },

    headline: trimmedString(120),

    bio: trimmedString(500),

    skills: [
      {
        type: String,
        trim: true,
        maxlength: 40,
      },
    ],

    city: trimmedString(80),

    avatarUrl: {
      ...trimmedString(500),
      validate: {
        validator: isValidUrl,
        message: 'Invalid avatar URL',
      },
    },

    role: {
      type: String,
      default: 'Member',
      trim: true,
      maxlength: 60,
    },

    links: {
      instagram: {
        ...trimmedString(500),
        validate: {
          validator: isValidUrl,
          message: 'Invalid Instagram URL',
        },
      },
      linkedin: {
        ...trimmedString(500),
        validate: {
          validator: isValidUrl,
          message: 'Invalid LinkedIn URL',
        },
      },
      portfolio: {
        ...trimmedString(500),
        validate: {
          validator: isValidUrl,
          message: 'Invalid portfolio URL',
        },
      },
    },

    interests: [
      {
        type: String,
        trim: true,
        maxlength: 40,
      },
    ],

    openToCollaborate: {
      type: Boolean,
      default: true,
    },

    profileScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function save(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model('User', userSchema);
