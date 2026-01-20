/**
 * Tender Document API Routes
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import * as tenderController from '../controllers/tender.controller.js';
import * as evalController from '../controllers/evaluation.controller.js';
import { auth, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = process.env.STORAGE_PATH || './uploads';
        await fs.mkdir(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];
        if (allowedMimes.includes(file.mimetype)) cb(null, true);
        else cb(new Error('File type not allowed'));
    }
});

// --- Core Routes ---
// Tender Operations
router.post('/upload', auth, authorize(['ADMIN', 'TECHNICAL']), upload.array('files'), tenderController.uploadDocument);
router.get('/list', auth, tenderController.listDocuments);
router.get('/compare', auth, tenderController.compareDocuments);
router.get('/evaluators', auth, authorize(['ADMIN']), tenderController.getEvaluators);
router.get('/:id/status', auth, tenderController.getStatus);
router.get('/:id/analysis', auth, tenderController.getAnalysis);
router.patch('/:id', auth, tenderController.updateDocument);
router.post('/:id/setup-criteria', auth, authorize(['ADMIN']), tenderController.setupTenderCriteria);
router.delete('/:id', auth, authorize(['ADMIN']), tenderController.deleteDocument);
router.get('/:id/similar', auth, tenderController.findSimilarDocuments);

// --- Evaluation Workflow Routes ---
router.post('/:id/pre-feasibility', auth, evalController.submitPreFeasibility);
router.post('/:id/technical-eval', auth, authorize(['ADMIN', 'TECHNICAL']), evalController.submitTechnicalEval);
router.post('/:id/financial-eval', auth, authorize(['ADMIN', 'PROCUREMENT']), evalController.submitFinancialEval);
router.post('/:id/approve', auth, authorize(['ADMIN']), evalController.submitApproval);

// --- Manual Data Routes ---
router.put('/:id/line-items/:itemId', auth, authorize(['ADMIN', 'PROCUREMENT']), evalController.updateLineItem);
router.post('/:id/bidding-config', auth, authorize(['ADMIN', 'PROCUREMENT']), evalController.saveBiddingConfig);

export default router;



