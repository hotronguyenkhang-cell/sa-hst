/**
 * PDF to Image conversion service
 */

import pdf from 'pdf-poppler';
import fs from 'fs/promises';
import path from 'path';

class PDFService {
    /**
     * Convert PDF pages to images
     */
    async convertPDFToImages(pdfPath, outputDir) {
        try {
            console.log(`📄 Converting PDF: ${path.basename(pdfPath)}`);

            // Get PDF info
            const info = await pdf.info(pdfPath);
            const totalPages = info.pages;

            console.log(`📊 PDF has ${totalPages} pages`);

            // Create temp directory
            const tempDir = path.join(outputDir, 'temp_pdf_' + Date.now());
            await fs.mkdir(tempDir, { recursive: true });

            // Convert options
            const opts = {
                format: 'jpeg',
                out_dir: tempDir,
                out_prefix: 'page',
                page: null, // all pages
                scale: 1024, // 1024px width for good quality
                jpeg_quality: 85
            };

            // Convert PDF to images
            await pdf.convert(pdfPath, opts);

            // Get all generated images
            const files = await fs.readdir(tempDir);
            const imageFiles = files
                .filter(f => f.endsWith('.jpg'))
                .sort((a, b) => {
                    const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                    const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                    return numA - numB;
                })
                .map(f => path.join(tempDir, f));

            console.log(`✅ Converted ${imageFiles.length} pages to images`);

            return {
                success: true,
                totalPages,
                images: imageFiles,
                tempDir
            };

        } catch (error) {
            console.error('❌ PDF conversion error:', error.message);
            return {
                success: false,
                error: error.message,
                images: []
            };
        }
    }

    /**
     * Cleanup temp directory
     */
    async cleanup(tempDir) {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
            console.log(`🗑️  Cleaned up temp directory: ${path.basename(tempDir)}`);
        } catch (error) {
            console.error('Cleanup error:', error.message);
        }
    }
}

export default new PDFService();
