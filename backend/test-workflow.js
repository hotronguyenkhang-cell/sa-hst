
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function runTest() {
    console.log('🧪 Starting Workflow Test...');

    try {
        // 1. Create Dummy Document
        const doc = await prisma.tenderDocument.create({
            data: {
                id: uuidv4(),
                title: 'Test Workflow Document',
                originalFileName: 'test.pdf',
                totalPages: 10,
                fileSize: 1024,
                mimeType: 'application/pdf',
                storagePath: '/tmp/test.pdf',
                status: 'COMPLETED',
                workflowStage: 'PRE_FEASIBILITY'
            }
        });
        console.log(`✅ Created Doc: ${doc.id} (Stage: ${doc.workflowStage})`);

        // 2. Submit Pre-Feasibility
        await prisma.preFeasibilityEvaluation.create({
            data: {
                documentId: doc.id,
                legalPass: true,
                bidBondPass: true,
                financePass: true,
                overallPass: true
            }
        });

        await prisma.tenderDocument.update({
            where: { id: doc.id },
            data: { workflowStage: 'TECHNICAL_EVALUATION' }
        });
        console.log(`✅ Submitted Pre-Feasibility. Stage updated to TECHNICAL_EVALUATION`);

        // 3. Setup Criteria (Simulate Admin Setup)
        const techCriteria = [
            { id: 'c1', label: 'Tech Spec', weight: 50 },
            { id: 'c2', label: 'Experience', weight: 50 }
        ];

        await prisma.tenderDocument.update({
            where: { id: doc.id },
            data: { techCriteria: techCriteria }
        });
        console.log(`✅ Configured Tech Criteria`);

        // 4. Submit Technical Evaluation
        await prisma.technicalEvaluation.create({
            data: {
                documentId: doc.id,
                score: 80,
                criteria: { c1: 80, c2: 80 },
                comments: 'Good'
            }
        });

        // Lock Technical
        await prisma.tenderDocument.update({
            where: { id: doc.id },
            data: {
                isTechLocked: true,
                workflowStage: 'FINANCIAL_EVALUATION'
            }
        });
        console.log(`✅ Submitted & Locked Technical. Stage: FINANCIAL_EVALUATION`);

        // 5. Submit Financial
        await prisma.financialEvaluation.create({
            data: {
                documentId: doc.id,
                score: 90,
                priceScore: 90
            }
        });

        await prisma.tenderDocument.update({
            where: { id: doc.id },
            data: { workflowStage: 'FINAL_APPROVAL' }
        });
        console.log(`✅ Submitted Financial. Stage: FINAL_APPROVAL`);

        // Cleanup
        await prisma.tenderDocument.delete({ where: { id: doc.id } });
        console.log(`🧹 Cleanup done.`);

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
