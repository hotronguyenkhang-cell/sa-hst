/**
 * Analytics Routes
 */

import express from 'express';
import prisma from '../prisma/client.js';

const router = express.Router();

// GET /api/analytics/summary
// Returns high-level metrics and monthly trends
router.get('/summary', async (req, res) => {
    try {
        const totalTenders = await prisma.tenderDocument.count();
        const completedTenders = await prisma.tenderDocument.count({
            where: { workflowStage: 'COMPLETED' }
        });

        // Get Win/Loss from ApprovalRequest
        const approvals = await prisma.approvalRequest.findMany({
            where: { status: { in: ['APPROVED', 'REJECTED'] } },
            select: { status: true, documentId: true }
        });

        const wonCount = approvals.filter(a => a.status === 'APPROVED').length;
        const lostCount = approvals.filter(a => a.status === 'REJECTED').length;

        // Calculate Total Value (Awarded)
        const awardedConfigs = await prisma.biddingConfig.findMany({
            where: {
                document: {
                    approvalRequests: {
                        some: { status: 'APPROVED' }
                    }
                }
            },
            select: { totalAdjustedBid: true }
        });

        const totalValue = awardedConfigs.reduce((sum, c) => sum + (c.totalAdjustedBid || 0), 0);

        // Monthly Trends (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlyData = await prisma.tenderDocument.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { createdAt: true, status: true, workflowStage: true, id: true },
            orderBy: { createdAt: 'asc' }
        });

        // Group by month
        const trends = {};
        monthlyData.forEach(doc => {
            const month = doc.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!trends[month]) {
                trends[month] = { month, total: 0, won: 0, lost: 0 };
            }
            trends[month].total++;
        });

        // Match with approvals for trends
        const monthlyApprovals = await prisma.approvalRequest.findMany({
            where: { createdAt: { gte: sixMonthsAgo } },
            select: { status: true, createdAt: true }
        });

        monthlyApprovals.forEach(app => {
            const month = app.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (trends[month]) {
                if (app.status === 'APPROVED') trends[month].won++;
                if (app.status === 'REJECTED') trends[month].lost++;
            }
        });

        res.json({
            summary: {
                totalTenders,
                completedTenders,
                wonCount,
                lostCount,
                winRate: totalTenders > 0 ? Math.round((wonCount / totalTenders) * 100) : 0,
                totalValue
            },
            trends: Object.values(trends)
        });
    } catch (error) {
        console.error('Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// GET /api/analytics/vendors
// Returns performance benchmarking per vendor
router.get('/vendors', async (req, res) => {
    try {
        const vendors = await prisma.tenderDocument.groupBy({
            by: ['vendorName'],
            _avg: {
                feasibilityScore: true,
                winProbability: true
            },
            _count: {
                id: true
            },
            where: { vendorName: { not: null } }
        });

        // Manual win count per vendor
        const vendorWins = await prisma.tenderDocument.findMany({
            where: {
                vendorName: { not: null },
                approvalRequests: { some: { status: 'APPROVED' } }
            },
            select: { vendorName: true }
        });

        const winMap = {};
        vendorWins.forEach(v => {
            winMap[v.vendorName] = (winMap[v.vendorName] || 0) + 1;
        });

        const result = vendors.map(v => ({
            name: v.vendorName,
            totalTenders: v._count.id,
            avgFeasibility: Math.round(v._avg.feasibilityScore || 0),
            avgWinProbability: Math.round(v._avg.winProbability || 0),
            wonCount: winMap[v.vendorName] || 0,
            winRate: Math.round(((winMap[v.vendorName] || 0) / v._count.id) * 100)
        }));

        res.json(result.sort((a, b) => b.winRate - a.winRate));
    } catch (error) {
        console.error('Vendor Analytics Error:', error);
        res.status(500).json({ error: 'Failed to fetch vendor analytics' });
    }
});

export default router;
