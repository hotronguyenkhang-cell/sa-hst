/**
 * Prisma Seed Script
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create Admin
    await prisma.user.upsert({
        where: { email: 'admin@sahst.com' },
        update: {},
        create: {
            email: 'admin@sahst.com',
            password: hashedPassword,
            name: 'System Admin',
            role: 'ADMIN'
        }
    });

    // Create Technical
    await prisma.user.upsert({
        where: { email: 'tech@sahst.com' },
        update: {},
        create: {
            email: 'tech@sahst.com',
            password: hashedPassword,
            name: 'Technical Officer',
            role: 'TECHNICAL'
        }
    });

    // Create Procurement
    await prisma.user.upsert({
        where: { email: 'proc@sahst.com' },
        update: {},
        create: {
            email: 'proc@sahst.com',
            password: hashedPassword,
            name: 'Procurement Specialist',
            role: 'PROCUREMENT'
        }
    });

    console.log('✅ Initial users seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
