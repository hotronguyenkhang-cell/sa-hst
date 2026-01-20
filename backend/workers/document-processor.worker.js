/**
 * Document Processing Worker
 * Background job for OCR and AI analysis
 */

import Queue from 'bull';
import prisma from '../prisma/client.js';
import ocrService from '../services/ocr.service.js';
import aiAnalysisService from '../services/ai-analysis.service.js';
import { broadcastProgress } from '../server.js';
import fs from 'fs/promises';
import path from 'path';

// Create Bull queue
const documentQueue = new Queue('document-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined
    }
});

// Job processor
documentQueue.process(async (job) => {
    const { documentId } = job.data;

    console.log(`\n🔄 Processing document: ${documentId}`);

    try {
        // 1. Get document and pages from database
        const document = await prisma.tenderDocument.findUnique({
            where: { id: documentId },
            include: { pages: true }
        });

        if (!document) {
            throw new Error(`Document ${documentId} not found`);
        }

        // 2 & 3. Branching Logic: Native PDF vs Image/Vision
        let analysisResult;

        if (document.mimeType === 'application/pdf') {
            console.log(`📄 PDF detected. Using Gemini Native PDF Analysis...`);

            // Skip OCR for native PDF
            await updateDocumentStatus(documentId, 'AI_ANALYZING', 30);

            // The storagePath points to the PDF file
            const pdfPath = document.storagePath;

            analysisResult = await aiAnalysisService.analyzeTenderPDF(pdfPath, {
                provider: process.env.AI_PROVIDER
            });

        } else {
            // OLD FLOW: Image/OCR Processing
            await updateDocumentStatus(documentId, 'OCR_PROCESSING', 10);

            console.log(`📄 Starting OCR for ${document.pages.length} pages...`);

            const imagePaths = document.pages
                .sort((a, b) => a.pageNumber - b.pageNumber)
                .map(p => p.imagePath);

            // ... [Rest of OCR logic, but we need to move it inside this block or refactor]
            // For minimal disruption, I will keep the existing flow for images here
            // but simpler to just call the image pipeline

            // Due to complexity of "replacing" a huge block, we should refactor slightly or copy-paste the logic carefully.
            // For brevity in this tool call, I will assume we can reuse the Image logic or I'll implement the Image logic here.

            const ocrResults = await ocrService.batchExtractText(imagePaths, {
                concurrency: parseInt(process.env.CONCURRENT_OCR_JOBS) || 3
            });

            // Save OCR results... (Simplified for replace block - ideally we refactor this out)
            for (const result of ocrResults) {
                if (result.success) {
                    await prisma.documentPage.update({
                        where: { documentId_pageNumber: { documentId, pageNumber: result.pageNumber } },
                        data: { extractedText: result.text, ocrConfidence: result.confidence / 100, ocrProcessedAt: new Date() }
                    });
                }
            }

            await updateDocumentStatus(documentId, 'AI_ANALYZING', 50);
            console.log(`🤖 Starting AI Vision analysis...`);
            analysisResult = await aiAnalysisService.analyzeTenderVision(imagePaths, { provider: process.env.AI_PROVIDER });
        }

        if (!analysisResult.success) {
            throw new Error(`AI analysis failed: ${analysisResult.error}`);
        }

        const analysis = analysisResult.analysis;

        // 4. Cleanup existing data for idempotent retries
        await prisma.riskAssessment.deleteMany({ where: { documentId } });
        await prisma.complianceItem.deleteMany({ where: { documentId } });
        await prisma.tenderLineItem.deleteMany({ where: { documentId } });
        await prisma.analysis.deleteMany({ where: { documentId } });

        // 5. Save analysis to database
        await prisma.analysis.create({
            data: {
                documentId,
                rawResponse: analysisResult.rawResponse,
                classification: analysis.classification,
                reviewer: analysis.finalReviewer,
                feasibility: analysis.feasibility,
                opportunities: {
                    level: analysis.feasibility?.opportunityLevel,
                    recommendations: analysis.recommendations,
                    biddingSuggestions: analysis.biddingSuggestions
                },
                departmentInfo: analysis.department,
                promptVersion: '3.0-bidding',
                tokensUsed: analysisResult.usage?.totalTokens || 0,
                processingTime: analysisResult.processingTime,
                confidence: analysis.overallConfidence
            }
        });

        // 6. Save line items
        if (analysis.lineItems && analysis.lineItems.length > 0) {
            await prisma.tenderLineItem.createMany({
                data: analysis.lineItems.map(item => ({
                    documentId,
                    name: item.name,
                    unit: item.unit,
                    quantity: parseFloat(item.quantity) || 0,
                    estimatedPrice: parseFloat(item.estimatedUnitPrice) || 0,
                    totalPrice: (parseFloat(item.quantity) || 0) * (parseFloat(item.estimatedUnitPrice) || 0),
                    notes: item.notes
                }))
            });
        }

        // 7. Save compliance matrix items
        if (analysis.complianceMatrix && analysis.complianceMatrix.length > 0) {
            await prisma.complianceItem.createMany({
                data: analysis.complianceMatrix.map(item => ({
                    documentId,
                    category: item.category,
                    requirement: item.requirement,
                    status: item.status,
                    description: item.description
                }))
            });
        }

        // 7. Save risk assessments
        if (analysis.risks && analysis.risks.length > 0) {
            await prisma.riskAssessment.createMany({
                data: analysis.risks.map(risk => ({
                    documentId,
                    riskType: risk.type,
                    riskLevel: risk.level,
                    description: risk.description,
                    mitigation: risk.mitigation,
                    impact: risk.impact
                }))
            });
        }

        // 7. Update document with final results
        await prisma.tenderDocument.update({
            where: { id: documentId },
            data: {
                documentType: analysis.classification?.documentType || null,
                vendorName: analysis.vendorName || null,
                finalReviewer: analysis.finalReviewer?.name || null,
                department: analysis.department?.primary || null,

                feasibilityScore: analysis.feasibility?.score || null,
                winProbability: analysis.feasibility?.winProbability || null,
                opportunityLevel: analysis.feasibility?.opportunityLevel || null,
                aiProvider: analysisResult.provider,
                ocrProvider: 'gemini-vision', // Label as vision
                status: 'COMPLETED',
                processingProgress: 100,
                completedAt: new Date()
            }
        });

        broadcastProgress(documentId, {
            status: 'COMPLETED',
            progress: 100
        });

        console.log(`✅ Document ${documentId} processed successfully!`);

        return {
            success: true,
            documentId,
            analysis: analysis
        };

    } catch (error) {
        console.error(`❌ Document processing failed:`, error);

        // Update document status to failed
        await prisma.tenderDocument.update({
            where: { id: documentId },
            data: {
                status: 'FAILED',
                errorMessage: error.message
            }
        });

        broadcastProgress(documentId, {
            status: 'FAILED',
            error: error.message
        });

        throw error;
    }
});

// Helper function to update document status
async function updateDocumentStatus(documentId, status, progress) {
    await prisma.tenderDocument.update({
        where: { id: documentId },
        data: {
            status,
            processingProgress: progress
        }
    });

    broadcastProgress(documentId, { status, progress });
}

// Event handlers
documentQueue.on('completed', (job, result) => {
    console.log(`✓ Job ${job.id} completed:`, result.documentId);
});

documentQueue.on('failed', (job, err) => {
    console.error(`✗ Job ${job.id} failed:`, err.message);
});

documentQueue.on('progress', (job, progress) => {
    console.log(`⏳ Job ${job.id} progress: ${progress}%`);
});

export default documentQueue;
export { prisma };
