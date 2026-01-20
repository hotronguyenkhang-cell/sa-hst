/**
 * Cloud Functions for Firebase
 * Triggers for Background Processing
 */

import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import admin from 'firebase-admin';
import ProcessingService from '../services/processing.service.js';

// Initialize Admin SDK if not already done (ProcessingService might do it, but good practice here too)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Set global options for functions
setGlobalOptions({ region: 'asia-southeast1', maxInstances: 10 });

/**
 * Trigger: On Tender Document Created (or Updated to UPLOADING -> PENDING)
 * In our flow, Controller sets status 'UPLOADING' then 'PENDING'.
 * It's cleaner to trigger on 'PENDING' status update or just creation if we do it in one go.
 * 
 * Strategy: Listen to onDocumentUpdated. If status changes to 'PENDING', triggering processing.
 */
export const processTenderDocument = onDocumentUpdated('tenders/{tenderId}', async (event) => {
    const tenderId = event.params.tenderId;
    const oldStatus = event.data.before.data().status;
    const newStatus = event.data.after.data().status;

    // Only trigger if status changed to PENDING (Ready for processing)
    if (newStatus === 'PENDING' && oldStatus !== 'PENDING') {
        console.log(`🚀 Triggering processing for tender: ${tenderId}`);
        try {
            await ProcessingService.processDocument(tenderId);
        } catch (error) {
            console.error(`❌ Processing failed via trigger:`, error);
            // Error handling is done inside ProcessingService (setting status to FAILED)
        }
    }
});

// Optional: Manual http trigger for debugging or re-running
// export const manualProcess = onRequest(...)
