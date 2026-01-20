-- CreateTable
CREATE TABLE "ComplianceItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requirement" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "ComplianceItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComplianceItem_documentId_idx" ON "ComplianceItem"("documentId");

-- AddForeignKey
ALTER TABLE "ComplianceItem" ADD CONSTRAINT "ComplianceItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
