/**
 * OCR Service with Multiple Provider Support
 * Tesseract.js (free, offline) and Google Cloud Vision (paid, better quality)
 */

import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import Jimp from 'jimp';
import fs from 'fs/promises';
import path from 'path';

class OCRService {
    constructor() {
        this.provider = process.env.OCR_PROVIDER || 'tesseract';
    }

    /**
     * Preprocess image for better OCR accuracy
     */
    async preprocessImage(imagePath) {
        try {
            const outputPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_processed.jpg');

            await sharp(imagePath)
                .grayscale() // Convert to grayscale
                .normalize() // Normalize contrast
                .sharpen() // Enhance edges
                .resize(null, 2000, { // Upscale if needed (max height 2000px)
                    withoutEnlargement: true,
                    fit: 'inside'
                })
                .jpeg({ quality: 95 })
                .toFile(outputPath);

            return outputPath;
        } catch (error) {
            console.error('Image preprocessing error:', error.message);
            return imagePath; // Return original if preprocessing fails
        }
    }

    /**
     * Additional enhancement using Jimp for difficult scans
     */
    async enhanceImage(imagePath) {
        try {
            const image = await Jimp.read(imagePath);

            image
                .contrast(0.3) // Increase contrast
                .brightness(0.1) // Slight brightness adjustment
                .quality(100);

            const enhancedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '_enhanced.jpg');
            await image.writeAsync(enhancedPath);

            return enhancedPath;
        } catch (error) {
            console.error('Image enhancement error:', error.message);
            return imagePath;
        }
    }

    /**
     * OCR using Tesseract.js (Free, Offline)
     */
    async extractTextTesseract(imagePath, language = 'vie+eng') {
        const startTime = Date.now();

        try {
            // Preprocess image
            const processedPath = await this.preprocessImage(imagePath);

            const worker = await Tesseract.createWorker(language, 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
                    }
                }
            });

            const { data } = await worker.recognize(processedPath);
            await worker.terminate();

            // Cleanup processed file
            if (processedPath !== imagePath) {
                await fs.unlink(processedPath).catch(() => { });
            }

            const processingTime = (Date.now() - startTime) / 1000;

            return {
                success: true,
                provider: 'tesseract',
                text: data.text.trim(),
                confidence: data.confidence,
                processingTime,
                words: data.words.length,
                lines: data.lines.length
            };
        } catch (error) {
            console.error('Tesseract OCR error:', error.message);
            return {
                success: false,
                provider: 'tesseract',
                error: error.message
            };
        }
    }

    /**
     * OCR using Google Cloud Vision (Paid, Better Quality)
     */
    async extractTextGoogleVision(imagePath) {
        // Note: Requires Google Cloud Vision setup
        // This is a placeholder for future implementation

        try {
            // const vision = require('@google-cloud/vision');
            // const client = new vision.ImageAnnotatorClient();
            // const [result] = await client.textDetection(imagePath);
            // const detections = result.textAnnotations;

            throw new Error('Google Cloud Vision not yet configured');
        } catch (error) {
            console.error('Google Vision OCR error:', error.message);
            return {
                success: false,
                provider: 'google-vision',
                error: error.message
            };
        }
    }

    /**
     * Main OCR method with provider selection
     */
    async extractText(imagePath, options = {}) {
        const provider = options.provider || this.provider;

        console.log(`📄 Processing OCR for: ${path.basename(imagePath)} using ${provider}`);

        switch (provider) {
            case 'google-vision':
                return await this.extractTextGoogleVision(imagePath);

            case 'tesseract':
            default:
                return await this.extractTextTesseract(imagePath, options.language);
        }
    }

    /**
     * Batch process multiple pages
     */
    async batchExtractText(imagePaths, options = {}) {
        const concurrency = options.concurrency || parseInt(process.env.CONCURRENT_OCR_JOBS) || 3;
        const results = [];

        console.log(`🔄 Batch OCR: ${imagePaths.length} pages with concurrency ${concurrency}`);

        // Process in batches
        for (let i = 0; i < imagePaths.length; i += concurrency) {
            const batch = imagePaths.slice(i, i + concurrency);
            const batchResults = await Promise.all(
                batch.map((imagePath, index) =>
                    this.extractText(imagePath, options).then(result => ({
                        pageNumber: i + index + 1,
                        imagePath,
                        ...result
                    }))
                )
            );

            results.push(...batchResults);

            console.log(`✓ Completed batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(imagePaths.length / concurrency)}`);
        }

        return results;
    }

    /**
     * Clean and format extracted text
     */
    cleanText(text) {
        return text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
            .replace(/[^\S\n]+/g, ' ') // Remove extra spaces but keep newlines
            .trim();
    }

    /**
     * Merge results from multiple pages
     */
    mergePageResults(pageResults) {
        const successfulPages = pageResults.filter(r => r.success);
        const failedPages = pageResults.filter(r => !r.success);

        const combinedText = successfulPages
            .map(r => `\n--- Trang ${r.pageNumber} ---\n${r.text}`)
            .join('\n\n');

        const avgConfidence = successfulPages.length > 0
            ? successfulPages.reduce((sum, r) => sum + (r.confidence || 0), 0) / successfulPages.length
            : 0;

        return {
            success: successfulPages.length > 0,
            totalPages: pageResults.length,
            successfulPages: successfulPages.length,
            failedPages: failedPages.length,
            combinedText: this.cleanText(combinedText),
            averageConfidence: avgConfidence,
            provider: pageResults[0]?.provider
        };
    }
}

export default new OCRService();
