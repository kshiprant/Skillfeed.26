import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';

import {
  createJoinRequest,
  getMyJoinRequests,
  updateJoinRequestStatus,
} from '../controllers/joinRequestController.js';

const router = express.Router();

router.use(protect);

router.get('/', getMyJoinRequests);

router.post(
  '/:ideaId',
  [
    param('ideaId').isMongoId().withMessage('Valid idea ID is required'),
    body('roleRequested')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 80 }),
    body('message')
      .optional()
      .isString()
      .trim()
      .isLength({ max: 500 }),
  ],
  createJoinRequest
);

router.put(
  '/:requestId/status',
  [
    param('requestId').isMongoId().withMessage('Valid request ID is required'),
    body('status')
      .isIn(['accepted', 'rejected'])
      .withMessage('Status must be accepted or rejected'),
  ],
  updateJoinRequestStatus
);

export default router;
