import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import {
  discoverUsers,
  getMyProfile,
  getUserById,
  updateProfile,
  deleteMyAccount,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

/* =========================
   Get My Profile
========================= */

router.get('/me', getMyProfile);

/* =========================
   Update Profile
========================= */

router.put(
  '/me',
  [
    body('name')
      .optional()
      .isString()
      .trim()
      .isLength({ min: 2, max: 60 }),

    body('headline')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 120 }),

    body('bio')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 }),

    body('city')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 80 }),

    body('role')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 60 }),

    body('avatarUrl')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true }),

    body('links.instagram')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true }),

    body('links.linkedin')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true }),

    body('links.portfolio')
      .optional({ values: 'falsy' })
      .isURL({ protocols: ['http', 'https'], require_protocol: true }),

    body('skills')
      .optional()
      .isArray({ max: 30 }),
  ],
  updateProfile
);

/* =========================
   Delete Account
========================= */

router.delete('/me', deleteMyAccount);

/* =========================
   Discover Users
========================= */

router.get('/discover', discoverUsers);

/* =========================
   Get User By ID
========================= */

router.get(
  '/:id',
  [param('id').isMongoId()],
  getUserById
);

export default router;
