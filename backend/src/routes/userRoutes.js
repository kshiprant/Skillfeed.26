import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import {
  discoverUsers,
  getMyProfile,
  getUserById,
  updateProfile,
} from '../controllers/userController.js';

const router = express.Router();

router.use(protect);

router.get('/me', getMyProfile);

router.put(
  '/me',
  [
    body('name').optional().isString().trim().isLength({ min: 2, max: 60 }),
    body('headline').optional().isString().trim().isLength({ max: 120 }),
    body('bio').optional().isString().trim().isLength({ max: 500 }),
    body('city').optional().isString().trim().isLength({ max: 80 }),
    body('role').optional().isString().trim().isLength({ max: 60 }),
    body('avatarUrl').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('instagram').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('linkedin').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('portfolio').optional().isURL({ protocols: ['http', 'https'], require_protocol: true }),
    body('skills').optional().isArray({ max: 30 }),
  ],
  updateProfile
);

router.get('/discover', discoverUsers);

router.get(
  '/:id',
  [param('id').isMongoId()],
  getUserById
);

export default router;
