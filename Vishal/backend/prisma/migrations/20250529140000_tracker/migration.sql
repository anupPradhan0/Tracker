-- CreateTable
CREATE TABLE "TrackerSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT '₹',
    "monthlyBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weeklyReportsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackerSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackerPage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Untitled Page',
    "icon" TEXT NOT NULL DEFAULT '📄',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackerPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackerDay" (
    "id" TEXT NOT NULL,
    "pageId" TEXT NOT NULL,
    "dayIndex" INTEGER NOT NULL,

    CONSTRAINT "TrackerDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackerEntry" (
    "id" TEXT NOT NULL,
    "dayId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "category" TEXT NOT NULL DEFAULT '',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrackerEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrackerSettings_userId_key" ON "TrackerSettings"("userId");

-- CreateIndex
CREATE INDEX "TrackerPage_userId_idx" ON "TrackerPage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackerDay_pageId_dayIndex_key" ON "TrackerDay"("pageId", "dayIndex");

-- CreateIndex
CREATE INDEX "TrackerEntry_dayId_idx" ON "TrackerEntry"("dayId");

-- AddForeignKey
ALTER TABLE "TrackerSettings" ADD CONSTRAINT "TrackerSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackerPage" ADD CONSTRAINT "TrackerPage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackerDay" ADD CONSTRAINT "TrackerDay_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "TrackerPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackerEntry" ADD CONSTRAINT "TrackerEntry_dayId_fkey" FOREIGN KEY ("dayId") REFERENCES "TrackerDay"("id") ON DELETE CASCADE ON UPDATE CASCADE;
