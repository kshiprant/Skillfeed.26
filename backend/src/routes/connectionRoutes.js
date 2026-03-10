import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { actOnRequest, getPendingRequests, sendConnectionRequest } from '../controllers/connectionController.js';

const router = express.Router();
router.use(protect);
router.post('/', sendConnectionRequest);
router.get('/', getPendingRequests);
router.patch('/:id', actOnRequest);
export default router;
