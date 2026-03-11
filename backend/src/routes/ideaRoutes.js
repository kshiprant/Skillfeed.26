import express from 'express';
import protect from '../middleware/authMiddleware.js';
import {
  addComment,
  createIdea,
  getIdeas,
  toggleLike,
} from '../controllers/ideaController.js';

const router = express.Router();

router.use(protect);

/* Get all ideas / Create new idea */
router.route('/')
  .get(getIdeas)
  .post(createIdea);

/* Like or unlike idea */
router.post('/:id/like', toggleLike);

/* Add comment */
router.post('/:id/comment', addComment);

export default router;
