import express from 'express';
import { body, param } from 'express-validator';
import protect from '../middleware/authMiddleware.js';
import {
  actOnRequest,
  getPendingRequests,
  sendConnectionRequest,
} from '../controllers/connectionController.js';

const router = express.Router();

router.use(protect);

router.post(
  '/',
  [
    body('toUser').isMongoId().withMessage('Valid target user ID is required'),
  ],
  sendConnectionRequest
);

router.get('/', getPendingRequests);

router.patch(
  '/:id',
  [
    param('id').isMongoId().withMessage('Valid request ID is required'),
    body('action')
      .isIn(['accept', 'reject'])
      .withMessage('Action must be accept or reject'),
  ],
  actOnRequest
);

export default router;
