-- AlterTable
ALTER TABLE "ComplianceItem" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "TenderLineItem" ADD COLUMN     "isManual" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "BiddingConfig" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "riskPremiumPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "profitMarginPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "adminFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "otherFees" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAdjustedBid" DOUBLE PRECISION,
    "notes" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiddingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BiddingConfig_documentId_key" ON "BiddingConfig"("documentId");

-- AddForeignKey
ALTER TABLE "BiddingConfig" ADD CONSTRAINT "BiddingConfig_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
