-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ONLINE_WIDE', 'ONLINE_COMPETITIVE', 'ONLINE_URGENT');

-- CreateEnum
CREATE TYPE "ProcessingStatus" AS ENUM ('PENDING', 'UPLOADING', 'OCR_PROCESSING', 'AI_ANALYZING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "Department" AS ENUM ('PROCUREMENT', 'TECHNICAL', 'MIXED');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateTable
CREATE TABLE "TenderDocument" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "originalFileName" TEXT NOT NULL,
    "totalPages" INTEGER NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "status" "ProcessingStatus" NOT NULL DEFAULT 'PENDING',
    "processingProgress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "documentType" "DocumentType",
    "finalReviewer" TEXT,
    "department" "Department",
    "feasibilityScore" DOUBLE PRECISION,
    "winProbability" DOUBLE PRECISION,
    "opportunityLevel" TEXT,
    "aiProvider" TEXT,
    "ocrProvider" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "TenderDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentPage" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "pageNumber" INTEGER NOT NULL,
    "imagePath" TEXT NOT NULL,
    "extractedText" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "ocrProcessedAt" TIMESTAMP(3),

    CONSTRAINT "DocumentPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Analysis" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "rawResponse" JSONB NOT NULL,
    "classification" JSONB,
    "reviewer" JSONB,
    "feasibility" JSONB,
    "opportunities" JSONB,
    "departmentInfo" JSONB,
    "promptVersion" TEXT NOT NULL,
    "tokensUsed" INTEGER,
    "processingTime" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Analysis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "description" TEXT NOT NULL,
    "mitigation" TEXT,
    "impact" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimilarDocument" (
    "id" TEXT NOT NULL,
    "sourceDocumentId" TEXT NOT NULL,
    "similarDocumentId" TEXT,
    "similarityScore" DOUBLE PRECISION NOT NULL,
    "matchingCriteria" JSONB NOT NULL,
    "historicalTitle" TEXT,
    "historicalType" "DocumentType",
    "historicalOutcome" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SimilarDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenderDocument_status_idx" ON "TenderDocument"("status");

-- CreateIndex
CREATE INDEX "TenderDocument_documentType_idx" ON "TenderDocument"("documentType");

-- CreateIndex
CREATE INDEX "TenderDocument_createdAt_idx" ON "TenderDocument"("createdAt");

-- CreateIndex
CREATE INDEX "DocumentPage_documentId_idx" ON "DocumentPage"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentPage_documentId_pageNumber_key" ON "DocumentPage"("documentId", "pageNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Analysis_documentId_key" ON "Analysis"("documentId");

-- CreateIndex
CREATE INDEX "RiskAssessment_documentId_idx" ON "RiskAssessment"("documentId");

-- CreateIndex
CREATE INDEX "RiskAssessment_riskLevel_idx" ON "RiskAssessment"("riskLevel");

-- CreateIndex
CREATE INDEX "SimilarDocument_sourceDocumentId_idx" ON "SimilarDocument"("sourceDocumentId");

-- CreateIndex
CREATE INDEX "SimilarDocument_similarityScore_idx" ON "SimilarDocument"("similarityScore");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_key_key" ON "Settings"("key");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_entityType_entityId_idx" ON "ActivityLog"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "DocumentPage" ADD CONSTRAINT "DocumentPage_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis" ADD CONSTRAINT "Analysis_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskAssessment" ADD CONSTRAINT "RiskAssessment_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimilarDocument" ADD CONSTRAINT "SimilarDocument_sourceDocumentId_fkey" FOREIGN KEY ("sourceDocumentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
