/**
 * Storage Service
 * Adapter for Local vs Firebase Storage
 */

import fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';

class StorageService {
    constructor() {
        this.provider = process.env.STORAGE_PROVIDER || 'local'; // 'local' or 'firebase'
        this.bucket = null;
        this.uploadDir = path.join(process.cwd(), 'uploads');

        // Initialize Firebase Bucket if needed
        if (this.provider === 'firebase') {
            try {
                if (!admin.apps.length) {
                    admin.initializeApp({
                        credential: admin.credential.applicationDefault()
                    });
                }
                this.bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
            } catch (err) {
                console.error('Firebase Storage Init Error:', err);
            }
        } else {
            // Ensure local upload dir exists
            fs.mkdir(this.uploadDir, { recursive: true }).catch(console.error);
        }
    }

    /**
     * Upload a file
     * @param {Object} file - Multer file object or object with { path, mimetype, originalname, buffer }
     * @returns {Promise<string>} - The storage path or URL
     */
    async uploadFile(file) {
        const filename = `${uuidv4()}-${file.originalname}`;

        if (this.provider === 'firebase') {
            return this.uploadToFirebase(file, filename);
        } else {
            return this.uploadToLocal(file, filename);
        }
    }

    /**
     * Download file to local temp path (for processing)
     * @param {string} storagePath - The path stored in DB
     * @returns {Promise<string>} - Local path to the file
     */
    async downloadToTemp(storagePath) {
        if (this.provider === 'local') {
            // It's already local, just verify it exists
            try {
                await fs.access(storagePath);
                return storagePath;
            } catch (e) {
                throw new Error(`Local file not found: ${storagePath}`);
            }
        } else {
            // Download from Firebase
            const tempPath = path.join(process.cwd(), 'temp', path.basename(storagePath));
            await fs.mkdir(path.dirname(tempPath), { recursive: true });

            try {
                // If storagePath is a full URL, extract the path/name
                // For now assuming storagePath is the object name in bucket
                const file = this.bucket.file(storagePath);
                await file.download({ destination: tempPath });
                return tempPath;
            } catch (error) {
                console.error('Firebase Download Error:', error);
                throw error;
            }
        }
    }

    // --- Private Implementations ---

    async uploadToLocal(file, filename) {
        const destPath = path.join(this.uploadDir, filename);

        // If file has buffer (memory storage)
        if (file.buffer) {
            await fs.writeFile(destPath, file.buffer);
        }
        // If file is already on disk (multer disk storage temp)
        else if (file.path) {
            await fs.copyFile(file.path, destPath);
            // Optional: delete temp file?
        }

        return destPath; // Return absolute path for local
    }

    async uploadToFirebase(file, filename) {
        if (!this.bucket) throw new Error('Firebase Storage not initialized');

        const destination = `tenders/${filename}`;
        const contentType = file.mimetype;

        try {
            const fileRef = this.bucket.file(destination);

            const metadata = {
                metadata: {
                    originalName: file.originalname,
                    contentType
                },
                contentType
            };

            if (file.buffer) {
                await fileRef.save(file.buffer, { metadata });
            } else if (file.path) {
                await this.bucket.upload(file.path, {
                    destination,
                    metadata
                });
            }

            // Return the object path (not Signed URL, to keep it private/internal)
            return destination;
        } catch (error) {
            console.error('Firebase Upload Error:', error);
            throw error;
        }
    }

    /**
     * Generate a signed URL for frontend viewing
     */
    async getSignedUrl(storagePath) {
        if (this.provider === 'local') {
            // Local: serve via static route (e.g. /uploads/filename)
            // Need to ensure backend serves this static dir
            return `/uploads/${path.basename(storagePath)}`;
        } else {
            const [url] = await this.bucket.file(storagePath).getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60, // 1 hour
            });
            return url;
        }
    }
}

export default new StorageService();
