/**
 * Processing Service
 * Centralizes logic for OCR and AI Analysis
 * Compatible with both Bull (Legacy) and Cloud Functions (Firebase)
 */

import { TenderServiceDB } from './firestore.service.js';
import StorageService from './storage.service.js';
import aiAnalysisService from './ai-analysis.service.js';
import ocrService from './ocr.service.js';

class ProcessingService {

    /**
     * Process a tender document
     * @param {string} documentId 
     */
    async processDocument(documentId) {
        console.log(`\n🔄 Processing document (Firestore): ${documentId}`);

        try {
            // 1. Get document
            const document = await TenderServiceDB.get(documentId);
            if (!document) {
                throw new Error(`Document ${documentId} not found`);
            }

            // Update status
            await TenderServiceDB.update(documentId, {
                status: 'AI_ANALYZING',
                processingProgress: 10
            });

            // 2. Download file to temp
            const localFilePath = await StorageService.downloadToTemp(document.storagePath);
            console.log(`📄 Downloaded to: ${localFilePath}`);

            let analysisResult;

            // 3. Analyze
            if (document.mimeType === 'application/pdf') {
                console.log(`📄 PDF detected. Using Gemini Native PDF Analysis...`);

                // Note: For Gemini we might upload the *local* file we just downloaded
                // OR if using Google Cloud Storage + Vertex AI, passing the gs:// URI is better
                // But `aiAnalysisService` currently expects a path.

                analysisResult = await aiAnalysisService.analyzeTenderPDF(localFilePath, {
                    provider: 'gemini' // Enforce Gemini for Spark Plan
                });
            } else {
                // Image flow
                // TODO: Implement image processing if needed. For now assuming PDF main flow.
                throw new Error("Image processing flow not fully ported to Firestore yet");
            }

            if (!analysisResult.success) {
                throw new Error(`AI analysis failed: ${analysisResult.error}`);
            }

            const analysis = analysisResult.analysis;

            // 4. Save results to Firestore
            // We embed everything in the main document for simplicity in NoSQL
            await TenderServiceDB.update(documentId, {
                status: 'COMPLETED',
                processingProgress: 100,
                completedAt: new Date(),

                // Analysis Data
                documentType: analysis.classification?.documentType || null,
                vendorName: analysis.vendorName || null,
                finalReviewer: analysis.finalReviewer?.name || null,
                department: analysis.department?.primary || null,

                feasibilityScore: analysis.feasibility?.score || null,
                winProbability: analysis.feasibility?.winProbability || null,
                opportunityLevel: analysis.feasibility?.opportunityLevel || null,

                analysis: analysis, // Store full raw analysis object

                // Mapped Arrays
                risks: analysis.risks || [],
                complianceMatrix: analysis.complianceMatrix || [],
                lineItems: analysis.lineItems || [],

                aiProvider: analysisResult.provider || 'gemini',
                ocrProvider: 'gemini-native'
            });

            console.log(`✅ Document ${documentId} processed successfully!`);
            return { success: true, documentId };

        } catch (error) {
            console.error(`❌ Processing failed for ${documentId}:`, error);

            await TenderServiceDB.update(documentId, {
                status: 'FAILED',
                errorMessage: error.message
            });
            throw error;
        }
    }
}

export default new ProcessingService();
