/**
 * Firestore Service
 * Replaces Prisma/PostgreSQL for Firebase Native architecture (Spark Plan)
 */

import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    try {
        // Check if we have credentials in env
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
        } else {
            console.warn('⚠️ No FIREBASE_SERVICE_ACCOUNT found. Trying accessible-by-default init (may fail on non-GCP).');
            admin.initializeApp({
                credential: admin.credential.applicationDefault(),
                storageBucket: process.env.FIREBASE_STORAGE_BUCKET
            });
        }
    } catch (error) {
        console.error('Firebase Admin Initialization Error:', error);
    }
}

const db = admin.firestore();

class FirestoreService {
    constructor(collectionName) {
        this.collection = db.collection(collectionName);
    }

    /**
     * Create a new document
     * @param {Object} data 
     * @param {string} [id] Optional custom ID
     */
    async create(data, id = null) {
        try {
            const now = new Date();
            const payload = {
                ...data,
                createdAt: now,
                updatedAt: now
            };

            // Remove undefined fields to prevent Firestore errors
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            if (id) {
                await this.collection.doc(id).set(payload);
                return { id, ...payload };
            } else {
                const docRef = await this.collection.add(payload);
                return { id: docRef.id, ...payload };
            }
        } catch (error) {
            console.error(`Firestore Create Error (${this.collection.id}):`, error);
            throw error;
        }
    }

    /**
     * Get a document by ID
     * @param {string} id 
     */
    async get(id) {
        try {
            const doc = await this.collection.doc(id).get();
            if (!doc.exists) return null;
            return { id: doc.id, ...doc.data() };
        } catch (error) {
            console.error(`Firestore Get Error (${this.collection.id}):`, error);
            throw error;
        }
    }

    /**
     * Update a document
     * @param {string} id 
     * @param {Object} data 
     */
    async update(id, data) {
        try {
            const payload = {
                ...data,
                updatedAt: new Date()
            };

            // Remove undefined fields
            Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

            await this.collection.doc(id).update(payload);
            return { id, ...payload };
        } catch (error) {
            console.error(`Firestore Update Error (${this.collection.id}):`, error);
            throw error;
        }
    }

    /**
     * Delete a document
     * @param {string} id 
     */
    async delete(id) {
        try {
            await this.collection.doc(id).delete();
            return true;
        } catch (error) {
            console.error(`Firestore Delete Error (${this.collection.id}):`, error);
            throw error;
        }
    }

    /**
     * List documents with basic filtering/pagination
     * Note: Firestore filtering is limited compared to SQL
     */
    async list(options = {}) {
        try {
            let query = this.collection;

            // Simple filtering
            if (options.where) {
                Object.entries(options.where).forEach(([field, value]) => {
                    if (value !== undefined) {
                        query = query.where(field, '==', value);
                    }
                });
            }

            // Ordering
            if (options.orderBy) {
                query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
            } else {
                query = query.orderBy('createdAt', 'desc');
            }

            // Pagination
            if (options.limit) {
                query = query.limit(options.limit);
            }

            const snapshot = await query.get();
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
            console.error(`Firestore List Error (${this.collection.id}):`, error);
            throw error;
        }
    }
}

// Export instances for specific collections
export const TenderServiceDB = new FirestoreService('tenders');
export const UserServiceDB = new FirestoreService('users');
export const SystemLogDB = new FirestoreService('system_logs');

export default FirestoreService;
