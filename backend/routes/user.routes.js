/**
 * User Routes
 */

import express from 'express';
import * as userController from '../controllers/user.controller.js';
import { auth, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes require ADMIN role
router.use(auth, authorize(['ADMIN']));

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
