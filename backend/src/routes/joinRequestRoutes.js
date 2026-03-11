import express from 'express';
import protect from '../middleware/authMiddleware.js';

import {
  createJoinRequest,
  getMyJoinRequests,
  updateJoinRequestStatus,
} from '../controllers/joinRequestController.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyJoinRequests);

router.post('/:ideaId', createJoinRequest);

router.put('/:requestId/status', updateJoinRequestStatus);

export default router;
