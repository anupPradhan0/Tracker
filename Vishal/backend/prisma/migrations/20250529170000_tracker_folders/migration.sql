-- CreateTable
CREATE TABLE "TrackerFolder" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'New Folder',
    "parentFolderId" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isExpanded" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackerFolder_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "TrackerPage" ADD COLUMN "folderId" TEXT;

-- CreateIndex
CREATE INDEX "TrackerFolder_userId_parentFolderId_idx" ON "TrackerFolder"("userId", "parentFolderId");

-- CreateIndex
CREATE INDEX "TrackerFolder_userId_order_idx" ON "TrackerFolder"("userId", "order");

-- CreateIndex
CREATE INDEX "TrackerPage_userId_folderId_idx" ON "TrackerPage"("userId", "folderId");

-- AddForeignKey
ALTER TABLE "TrackerFolder" ADD CONSTRAINT "TrackerFolder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackerFolder" ADD CONSTRAINT "TrackerFolder_parentFolderId_fkey" FOREIGN KEY ("parentFolderId") REFERENCES "TrackerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackerPage" ADD CONSTRAINT "TrackerPage_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "TrackerFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
