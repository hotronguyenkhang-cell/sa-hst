import Queue from 'bull';
import dotenv from 'dotenv';
dotenv.config();

const documentQueue = new Queue('document-processing', {
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379
    }
});

async function retry(documentId) {
    console.log(`Adding document ${documentId} to queue...`);
    await documentQueue.add({ documentId });
    console.log('✅ Job added. Check backend logs for progress.');
    process.exit(0);
}

const docId = process.argv[2] || '8576e72d-cef4-4bfe-94d0-42e56dc6b975';
retry(docId);
