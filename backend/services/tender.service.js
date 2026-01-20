/**
 * Tender Service
 * Refactored for Firestore (Firebase Native)
 */

import { TenderServiceDB, UserServiceDB } from './firestore.service.js';
import StorageService from './storage.service.js';
import ScoringService from './scoring.service.js'; // Might need refactor later if it uses Prisma

class TenderService {
    /**
     * Get document status
     */
    async getStatus(id) {
        const doc = await TenderServiceDB.get(id);
        if (!doc) return null;

        return {
            id: doc.id,
            title: doc.title,
            status: doc.status,
            processingProgress: doc.processingProgress,
            errorMessage: doc.errorMessage,
            totalPages: doc.totalPages,
            createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate() : doc.createdAt,
            updatedAt: doc.updatedAt?.toDate ? doc.updatedAt.toDate() : doc.updatedAt,
            completedAt: doc.completedAt?.toDate ? doc.completedAt.toDate() : doc.completedAt,
            uploaderId: doc.uploaderId,
            assigneeId: doc.assigneeId
        };
    }

    /**
     * Get list of documents with filters
     */
    async getList({ page = 1, limit = 20, status, documentType, userId, role }) {
        const filters = { where: {} };
        if (status) filters.where.status = status;
        if (documentType) filters.where.documentType = documentType;

        // Note: Firestore simplified list doesn't strictly support OR queries easily in the basic service
        // For now, we will fetch based on basic filters and sort in memory if needed or rely on basic rules
        // Admin sees all. Tech/Proc see what they are assigned to + what they uploaded.

        // This simple list implementation might return more than needed if we don't apply strict Firestore rules
        // For MVP/Spark plan, allow listing all for authorized users or refine FirestoreService later.

        filters.orderBy = 'createdAt';
        filters.limit = parseInt(limit);

        let documents = await TenderServiceDB.list(filters);

        // Client-side filtering for Role (since Firestore simple adapter doesn't do complex OR)
        if (role === 'TECHNICAL' || role === 'PROCUREMENT') {
            documents = documents.filter(doc =>
                doc.uploaderId === userId ||
                doc.assigneeId === userId ||
                !doc.assigneeId
            );
        }

        // Map dates
        documents = documents.map(doc => ({
            ...doc,
            createdAt: doc.createdAt?.toDate ? doc.createdAt.toDate() : doc.createdAt,
            completedAt: doc.completedAt?.toDate ? doc.completedAt.toDate() : doc.completedAt,
        }));

        // Mock pagination total since Firestore doesn't give "total count" easily without reading all
        // We will just return the current page count or a large number if there are more
        const total = documents.length; // Simplified

        return {
            documents,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: 1 // Simplified
            }
        };
    }

    /**
     * Get full analysis
     * In NoSQL, we expect 'analysis', 'risks', etc. to be embedded in the document
     */
    async getAnalysis(id) {
        const doc = await TenderServiceDB.get(id);
        if (!doc) return null;

        // Transform Firestore Timestamps to Dates
        const transformDates = (obj) => {
            if (!obj) return obj;
            if (obj.toDate && typeof obj.toDate === 'function') return obj.toDate();
            if (typeof obj === 'object') {
                Object.keys(obj).forEach(k => obj[k] = transformDates(obj[k]));
            }
            return obj;
        };

        const document = transformDates(doc);

        // Ensure arrays exist even if empty
        return {
            ...document,
            analysis: document.analysis || {},
            riskAssessments: document.risks || [], // Note: Remapped from 'risks' field in Firestore
            complianceItems: document.complianceMatrix || [], // Remapped
            lineItems: document.lineItems || [],
            pages: document.pages || []
        };
    }

    /**
     * Create document
     */
    async createDocument(data) {
        return await TenderServiceDB.create(data);
    }

    /**
     * Update document
     */
    async updateDocument(id, data) {
        return await TenderServiceDB.update(id, data);
    }

    /**
     * Delete document and files
     */
    async deleteDocument(id) {
        const document = await TenderServiceDB.get(id);
        if (!document) return null;

        // Delete files from storage (Local or Firebase)
        // Main PDF
        if (document.mimeType === 'application/pdf' && document.storagePath) {
            // We can't easily delete from StorageService purely by path if it expects an object
            // But let's assuming StorageService (if we add delete support) or just ignore for now
            // TODO: Add delete method to StorageService
        }

        // Delete from DB
        return await TenderServiceDB.delete(id);
    }
}

export default new TenderService();
