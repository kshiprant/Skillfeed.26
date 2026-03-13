import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import {
  addComment,
  createIdea,
  getIdeas,
  toggleLike,
  deleteIdea,
} from '../controllers/ideaController.js';

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getIdeas)
  .post(
    [
      body('title').isString().trim().isLength({ min: 3, max: 120 }),
      body('description').isString().trim().isLength({ min: 10, max: 2000 }),
      body('stage').optional().isString().trim().isLength({ max: 40 }),
      body('tags').optional().isArray({ max: 15 }),
      body('lookingFor').optional().isString().trim().isLength({ max: 300 }),
    ],
    createIdea
  );

router.post(
  '/:id/like',
  [param('id').isMongoId()],
  toggleLike
);

router.post(
  '/:id/comment',
  [
    param('id').isMongoId(),
    body('text').isString().trim().isLength({ min: 1, max: 1000 }),
  ],
  addComment
);

router.delete(
  '/:id',
  [param('id').isMongoId()],
  deleteIdea
);

export default router;
