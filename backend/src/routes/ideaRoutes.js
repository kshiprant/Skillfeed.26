import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { addComment, createIdea, getIdeas, toggleLike } from '../controllers/ideaController.js';

const router = express.Router();
router.use(protect);
router.route('/').get(getIdeas).post(createIdea);
router.post('/:id/like', toggleLike);
router.post('/:id/comment', addComment);
export default router;
