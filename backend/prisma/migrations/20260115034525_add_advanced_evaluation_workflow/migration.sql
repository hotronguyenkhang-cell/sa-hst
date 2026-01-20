-- CreateEnum
CREATE TYPE "WorkflowStage" AS ENUM ('PRE_FEASIBILITY', 'TECHNICAL_EVALUATION', 'FINANCIAL_EVALUATION', 'FINAL_APPROVAL', 'COMPLETED');

-- AlterTable
ALTER TABLE "TenderDocument" ADD COLUMN     "estimatedBudget" DOUBLE PRECISION,
ADD COLUMN     "isTechLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workflowStage" "WorkflowStage" NOT NULL DEFAULT 'PRE_FEASIBILITY';

-- CreateTable
CREATE TABLE "PreFeasibilityEvaluation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "legalPass" BOOLEAN NOT NULL DEFAULT false,
    "bidBondPass" BOOLEAN NOT NULL DEFAULT false,
    "financePass" BOOLEAN NOT NULL DEFAULT false,
    "overallPass" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "evaluatedAt" TIMESTAMP(3),

    CONSTRAINT "PreFeasibilityEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TechnicalEvaluation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "criteria" JSONB,
    "comments" TEXT,

    CONSTRAINT "TechnicalEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialEvaluation" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "score" DOUBLE PRECISION,
    "maxScore" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "commercialTerms" TEXT,
    "paymentTerms" TEXT,
    "warrantyTerms" TEXT,
    "priceScore" DOUBLE PRECISION,

    CONSTRAINT "FinancialEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoringConfig" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "techWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "personnelWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
    "experienceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
    "priceWeight" DOUBLE PRECISION NOT NULL DEFAULT 0.0,

    CONSTRAINT "ScoringConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "approverId" TEXT,
    "approverRole" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreFeasibilityEvaluation_documentId_key" ON "PreFeasibilityEvaluation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "TechnicalEvaluation_documentId_key" ON "TechnicalEvaluation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialEvaluation_documentId_key" ON "FinancialEvaluation"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "ScoringConfig_documentId_key" ON "ScoringConfig"("documentId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_documentId_idx" ON "ApprovalRequest"("documentId");

-- AddForeignKey
ALTER TABLE "PreFeasibilityEvaluation" ADD CONSTRAINT "PreFeasibilityEvaluation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TechnicalEvaluation" ADD CONSTRAINT "TechnicalEvaluation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialEvaluation" ADD CONSTRAINT "FinancialEvaluation_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScoringConfig" ADD CONSTRAINT "ScoringConfig_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
