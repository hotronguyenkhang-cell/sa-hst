import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Migrating Legacy Data to Admin ---');

    // 1. Find the Admin user
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@sahst.com' }
    });

    if (!admin) {
        console.error('Error: Admin user (admin@sahst.com) not found. Please run seed script first.');
        process.exit(1);
    }

    console.log(`Found Admin ID: ${admin.id}`);

    // 2. Update all TenderDocuments with no uploaderId
    const result = await prisma.tenderDocument.updateMany({
        where: { uploaderId: null },
        data: { uploaderId: admin.id }
    });

    console.log(`Successfully migrated ${result.count} documents to Admin.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
