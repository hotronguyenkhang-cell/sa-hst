/**
 * Scoring Service
 * Handles logic for experience scoring and aggregated results
 */

import prisma from '../prisma/client.js';

export const ScoringService = {
    /**
     * Calculate Experience Score based on historical contracts
     * Logic:
     * - Scale Score: 100% if >= 80% current budget
     * - Quantity Score: 100% if >= 3 similar contracts
     */
    async calculateExperienceScore(documentId) {
        const document = await prisma.tenderDocument.findUnique({
            where: { id: documentId },
            include: { scoringConfig: true }
        });

        if (!document) return 0;

        // Fetch our company profile (first one)
        const company = await prisma.companyProfile.findFirst({
            include: { experience: true }
        });

        if (!company || company.experience.length === 0) return 0;

        const currentBudget = document.estimatedBudget || 0;
        const history = company.experience;

        // 1. Quantity Check (>= 3 projects = 100 points)
        const quantityScore = Math.min((history.length / 3) * 100, 100);

        // 2. Scale Check (Find projects >= 80% of current budget)
        const scaleCount = history.filter(h => (h.value || 0) >= (currentBudget * 0.8)).length;
        const scaleScore = scaleCount > 0 ? 100 : 0;

        // Weighted Average for Experience
        return (quantityScore * 0.5) + (scaleScore * 0.5);
    },

    /**
     * Calculate Final Aggregated Score
     */
    async calculateFinalScore(documentId) {
        const document = await prisma.tenderDocument.findUnique({
            where: { id: documentId },
            include: {
                technicalEval: true,
                financialEval: true,
                scoringConfig: true
            }
        });

        if (!document) return 0;

        const config = document.scoringConfig || {
            techWeight: 0.4,
            personnelWeight: 0.2,
            experienceWeight: 0.4
        };

        const techScore = document.technicalEval?.score || 0;
        const financialScore = document.financialEval?.score || 0;
        const experienceScore = await this.calculateExperienceScore(documentId);

        // Calculate Feasibility based on Company Finance
        const company = await prisma.companyProfile.findFirst({
            include: { finances: { orderBy: { year: 'desc' }, take: 1 } }
        });

        let feasibilityScore = 0;
        if (company && company.finances.length > 0) {
            const latestFinance = company.finances[0];
            const budget = document.estimatedBudget || 0;

            // Financial Health Check: Revenue should be >= 1.5x Budget
            const revenueCheck = Math.min((latestFinance.revenue / (budget * 1.5)) * 100, 100);
            feasibilityScore = (revenueCheck * 0.6) + (experienceScore * 0.4);
        }

        return {
            totalScore: (techScore * config.techWeight) + (financialScore * (1 - config.techWeight)),
            feasibilityScore,
            breakdown: {
                technical: techScore,
                financial: financialScore,
                experience: experienceScore
            },
            criteria: {
                technical: document.techCriteria || [],
                procurement: document.procCriteria || []
            },
            weights: config
        };
    }
};

export default ScoringService;
