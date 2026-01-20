-- CreateTable
CREATE TABLE "TenderLineItem" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "quantity" DOUBLE PRECISION,
    "estimatedPrice" DOUBLE PRECISION,
    "totalPrice" DOUBLE PRECISION,
    "notes" TEXT,

    CONSTRAINT "TenderLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TenderLineItem_documentId_idx" ON "TenderLineItem"("documentId");

-- AddForeignKey
ALTER TABLE "TenderLineItem" ADD CONSTRAINT "TenderLineItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "TenderDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
