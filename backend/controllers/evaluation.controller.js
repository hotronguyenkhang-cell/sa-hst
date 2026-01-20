/**
 * Evaluation Controller
 */

import prisma from '../prisma/client.js';
import Joi from 'joi';
import ScoringService from '../services/scoring.service.js';

/**
 * Submit Pre-feasibility
 */
export const submitPreFeasibility = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            legalPass: Joi.boolean().required(),
            bidBondPass: Joi.boolean().required(),
            financePass: Joi.boolean().required(),
            notes: Joi.string().allow(''),
            overallPass: Joi.boolean().required()
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ success: false, error: error.details[0].message });

        const evaluation = await prisma.preFeasibilityEvaluation.upsert({
            where: { documentId: id },
            update: { ...value, evaluatedAt: new Date() },
            create: { ...value, documentId: id, evaluatedAt: new Date() }
        });

        if (value.overallPass) {
            await prisma.tenderDocument.update({
                where: { id },
                data: { workflowStage: 'TECHNICAL_EVALUATION' }
            });
        } else {
            await prisma.tenderDocument.update({
                where: { id },
                data: { workflowStage: 'COMPLETED', status: 'FAILED' }
            });
        }

        res.json({ success: true, data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Submit Technical Evaluation
 */
export const submitTechnicalEval = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            score: Joi.number().min(0).max(100).required(),
            maxScore: Joi.number().default(100),
            criteria: Joi.object().optional(),
            comments: Joi.string().allow(''),
            lockScore: Joi.boolean().default(false)
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ success: false, error: error.details[0].message });

        const { lockScore, ...evalData } = value;

        const tender = await prisma.tenderDocument.findUnique({
            where: { id },
            select: { assigneeTechId: true, workflowStage: true, isTechLocked: true }
        });

        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found' });

        // Assignee Check
        if (req.user.role !== 'ADMIN' && tender.assigneeTechId && tender.assigneeTechId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'You are not the designated technical evaluator for this tender' });
        }

        const evaluation = await prisma.technicalEvaluation.upsert({
            where: { documentId: id },
            update: evalData,
            create: { ...evalData, documentId: id }
        });

        if (lockScore) {
            const updatedTender = await prisma.tenderDocument.update({
                where: { id },
                data: { isTechLocked: true }
            });

            // Move to Final Approval if both are locked
            if (updatedTender.isProcLocked) {
                await prisma.tenderDocument.update({
                    where: { id },
                    data: { workflowStage: 'FINAL_APPROVAL' }
                });
            } else {
                // Keep in technical or move to financial if logical, 
                // but usually we stay in the combined evaluation phase.
                await prisma.tenderDocument.update({
                    where: { id },
                    data: { workflowStage: 'FINANCIAL_EVALUATION' }
                });
            }
        }

        res.json({ success: true, data: evaluation });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Submit Financial Evaluation
 */
export const submitFinancialEval = async (req, res) => {
    try {
        const { id } = req.params;
        const schema = Joi.object({
            score: Joi.number().min(0).max(100).required(),
            commercialTerms: Joi.string().allow(''),
            paymentTerms: Joi.string().allow(''),
            warrantyTerms: Joi.string().allow(''),
            priceScore: Joi.number().min(0).max(100),
            estimatedBudget: Joi.number(),
            lockScore: Joi.boolean().default(false)
        });

        const { error, value } = schema.validate(req.body);
        if (error) return res.status(400).json({ success: false, error: error.details[0].message });

        const tender = await prisma.tenderDocument.findUnique({
            where: { id },
            select: { assigneeProcId: true, isTechLocked: true }
        });

        if (!tender) return res.status(404).json({ success: false, error: 'Tender not found' });

        // Assignee Check
        if (req.user.role !== 'ADMIN' && tender.assigneeProcId && tender.assigneeProcId !== req.user.id) {
            return res.status(403).json({ success: false, error: 'You are not the designated procurement evaluator for this tender' });
        }

        const { lockScore, ...evalData } = value;

        const evaluation = await prisma.financialEvaluation.upsert({
            where: { documentId: id },
            update: evalData,
            create: { ...evalData, documentId: id }
        });

        if (lockScore) {
            const updatedTender = await prisma.tenderDocument.update({
                where: { id },
                data: { isProcLocked: true }
            });

            if (updatedTender.isTechLocked) {
                await prisma.tenderDocument.update({
                    where: { id },
                    data: { workflowStage: 'FINAL_APPROVAL' }
                });
            } else {
                await prisma.tenderDocument.update({
                    where: { id },
                    data: { workflowStage: 'TECHNICAL_EVALUATION' }
                });
            }
        }

        res.json({ success: true, data: evaluation });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Final Approval
 */
export const submitApproval = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, comments, approverRole } = req.body;

        const approval = await prisma.approvalRequest.create({
            data: {
                documentId: id,
                status: status || 'APPROVED',
                comments,
                approverRole
            }
        });

        if (status === 'APPROVED') {
            await prisma.tenderDocument.update({
                where: { id },
                data: { workflowStage: 'COMPLETED' }
            });
        }

        res.json({ success: true, data: approval });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Compare Tenders
 */
export const compareTenders = async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) return res.status(400).json({ success: false, error: 'No IDs provided' });

        const idList = ids.split(',');
        const tenders = await prisma.tenderDocument.findMany({
            where: { id: { in: idList } },
            include: {
                technicalEval: true,
                financialEval: true,
                scoringConfig: true,
                biddingConfig: true
            }
        });

        const result = await Promise.all(tenders.map(async (doc) => {
            const breakdown = await ScoringService.calculateFinalScore(doc.id);
            return {
                id: doc.id,
                title: doc.title,
                vendorName: doc.vendorName,
                documentType: doc.documentType,
                scoreBreakdown: breakdown,
                biddingConfig: doc.biddingConfig,
                financialEval: doc.financialEval
            };
        }));

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Update Line Item
 */
export const updateLineItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const updatedItem = await prisma.tenderLineItem.update({
            where: { id: itemId },
            data: { ...req.body, isManual: true }
        });
        res.json({ success: true, data: updatedItem });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Save Bidding Config
 */
export const saveBiddingConfig = async (req, res) => {
    try {
        const { id } = req.params;
        const biddingConfig = await prisma.biddingConfig.upsert({
            where: { documentId: id },
            update: req.body,
            create: { ...req.body, documentId: id }
        });
        res.json({ success: true, data: biddingConfig });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
