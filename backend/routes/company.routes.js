/**
 * Company Profile Routes
 */
import express from 'express';
import * as companyController from '../controllers/company.controller.js';
import { auth, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected by auth
router.use(auth);

// GET /api/company/profile
router.get('/profile', companyController.getProfile);

// POST /api/company/profile (Admin only)
router.post('/profile', authorize(['ADMIN']), companyController.updateProfile);

// POST /api/company/finance (Admin only)
router.post('/finance', authorize(['ADMIN']), companyController.addFinance);

// POST /api/company/personnel (Admin only)
router.post('/personnel', authorize(['ADMIN']), companyController.addPersonnel);

// POST /api/company/experience (Admin only)
router.post('/experience', authorize(['ADMIN']), companyController.addExperience);

export default router;
