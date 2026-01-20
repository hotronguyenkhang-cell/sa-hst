
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🗑️  Cleaning up tender documents...');
    // Delete dependent records first due to foreign keys if cascade isn't perfect
    await prisma.analysis.deleteMany({});
    await prisma.complianceItem.deleteMany({});
    await prisma.tenderLineItem.deleteMany({});
    await prisma.riskAssessment.deleteMany({});
    await prisma.documentPage.deleteMany({});
    await prisma.tenderDocument.deleteMany({});

    console.log('👤 Fetching Admin user...');
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@sahst.com' }
    });

    if (!admin) {
        console.error('❌ Admin user not found! Please run seed.js first.');
        process.exit(1);
    }

    console.log(`✅ Found Admin: ${admin.id} (${admin.name})`);

    console.log('🌱 Seeding fresh sample tenders...');

    // Sample 1: Completed Historical Tender
    await prisma.tenderDocument.create({
        data: {
            title: 'Hồ sơ thầu Bệnh viện Đa khoa Tỉnh (Sample)',
            documentType: 'ONLINE_URGENT',
            status: 'COMPLETED',
            processingProgress: 100,
            totalPages: 145,
            fileSize: 4500000,
            mimeType: 'application/pdf',
            storagePath: '/uploads/sample1',
            originalFileName: 'hst_bv_dakhoa.pdf',
            uploaderId: admin.id,
            feasibilityScore: 88,
            winProbability: 75,
            opportunityLevel: 'HIGH',
            createdAt: new Date('2025-12-20T10:00:00Z'),
            completedAt: new Date('2025-12-20T10:15:00Z'),
        }
    });

    // Sample 2: Pending Processing
    await prisma.tenderDocument.create({
        data: {
            title: 'Gói thầu Mua sắm TBYT 2026',
            status: 'PENDING',
            processingProgress: 10,
            totalPages: 50,
            fileSize: 2100000,
            mimeType: 'application/pdf',
            storagePath: '/uploads/sample2',
            originalFileName: 'goi_thau_tbyt.pdf',
            uploaderId: admin.id,
            createdAt: new Date(),
        }
    });

    // Sample 3: Processing
    await prisma.tenderDocument.create({
        data: {
            title: 'Dự án Cung cấp Vật tư Tiêu hao',
            status: 'OCR_PROCESSING',
            processingProgress: 45,
            totalPages: 12,
            fileSize: 1200000,
            mimeType: 'application/pdf',
            storagePath: '/uploads/sample3',
            originalFileName: 'vtth_2026.pdf',
            uploaderId: admin.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 mins ago
        }
    });

    console.log('✨ Database reset and seeded successfully!');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
