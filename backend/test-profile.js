import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log("🔍 Testing Company Profile fetch/create...");

        let profile = await prisma.companyProfile.findFirst({
            include: {
                finances: { orderBy: { year: 'desc' } },
                personnel: true,
                experience: { orderBy: { completionDate: 'desc' } }
            }
        });

        if (!profile) {
            console.log("🆕 Profile not found, creating seed data...");
            profile = await prisma.companyProfile.create({
                data: {
                    name: "CÔNG TY TNHH INDURIS VIỆT NAM",
                    taxCode: "3502362055",
                    address: "69B Đỗ Xuân Hợp, Phường Phước Long, Thành phố Hồ Chí Minh",
                    website: "http://www.torishima.com.vn",
                    industry: "Xây lắp, Cung cấp hàng hóa, Tư vấn kỹ thuật",
                    description: "Chuyên cung cấp giải pháp máy bơm Torishima, xây lắp hệ thống cấp thoát nước và xử lý nước thải công nghiệp.",
                    finances: {
                        create: [
                            { year: 2023, revenue: 120000000000, profit: 15000000000, netWorth: 45000000000, creditLimit: 30000000000 },
                            { year: 2022, revenue: 95000000000, profit: 10000000000, netWorth: 35000000000, creditLimit: 25000000000 },
                            { year: 2021, revenue: 80000000000, profit: 8000000000, netWorth: 28000000000, creditLimit: 20000000000 }
                        ]
                    },
                    experience: {
                        create: [
                            {
                                projectTitle: "Cung cấp hệ thống máy bơm Nhà máy nước Thủ Đức",
                                clientName: "SAWACO",
                                value: 45000000000,
                                completionDate: new Date('2023-08-15'),
                                description: "Cung cấp và lắp đặt hệ thống máy bơm ly tâm trục đứng công suất lớn."
                            },
                            {
                                projectTitle: "Xây lắp trạm xử lý nước thải KCN VSIP II",
                                clientName: "Becamex",
                                value: 28000000000,
                                completionDate: new Date('2022-12-20'),
                                description: "Thi công trọn gói trạm xử lý nước thải công suất 5000m3/ngày đêm."
                            }
                        ]
                    },
                    personnel: {
                        create: [
                            { name: "Nguyễn Văn A", position: "Giám đốc kỹ thuật", yearsOfExp: 20, certifications: ["Chỉ huy trưởng hạng I", "Hành nghề giám sát XD"] },
                            { name: "Trần Thị B", position: "Trưởng phòng tài chính", yearsOfExp: 15, certifications: ["Kế toán trưởng", "CPA Việt Nam"] }
                        ]
                    }
                }
            });
            console.log("✅ Seed data created successfully!");
        } else {
            console.log("✅ Profile found:", profile.name);
        }

    } catch (error) {
        console.error("❌ ERROR FOUND:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
