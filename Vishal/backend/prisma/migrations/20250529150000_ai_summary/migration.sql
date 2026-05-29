-- CreateTable
CREATE TABLE "AISummary" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pageId" TEXT,
    "dayIndex" INTEGER,
    "summary" TEXT NOT NULL,
    "totalSpent" DOUBLE PRECISION NOT NULL,
    "insights" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISummary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AISummary_userId_type_idx" ON "AISummary"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "AISummary_userId_scopeKey_key" ON "AISummary"("userId", "scopeKey");

-- AddForeignKey
ALTER TABLE "AISummary" ADD CONSTRAINT "AISummary_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
