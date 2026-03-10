import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { discoverUsers, getMyProfile, getUserById, updateProfile } from '../controllers/userController.js';

const router = express.Router();
router.use(protect);
router.get('/me', getMyProfile);
router.put('/me', updateProfile);
router.get('/discover', discoverUsers);
router.get('/:id', getUserById);
export default router;
