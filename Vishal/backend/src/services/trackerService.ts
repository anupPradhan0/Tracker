import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import { calculatePageTotal, parseFixedExpenses } from "../utils/tracker.js";
import type {
  TrackerDayDto,
  TrackerEntryDto,
  TrackerPageDto,
  TrackerSettingsDto,
} from "../types/tracker.js";
import type {
  CreateEntryInput,
  CreatePageInput,
  UpdateEntryInput,
  UpdatePageInput,
  UpdateSettingsInput,
} from "../validators/tracker.validator.js";

const pageInclude = {
  days: {
    orderBy: { dayIndex: "asc" as const },
    include: {
      entries: {
        orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
      },
    },
  },
};

function mapEntry(entry: {
  id: string;
  title: string;
  amount: number;
  description: string;
  category: string;
  tags: string[];
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): TrackerEntryDto {
  return {
    id: entry.id,
    title: entry.title,
    amount: entry.amount,
    description: entry.description,
    category: entry.category,
    tags: entry.tags,
    sortOrder: entry.sortOrder,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

function mapPage(page: {
  id: string;
  title: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  days: Array<{
    id: string;
    dayIndex: number;
    entries: Array<{
      id: string;
      title: string;
      amount: number;
      description: string;
      category: string;
      tags: string[];
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }>;
}): TrackerPageDto {
  const days: TrackerDayDto[] = page.days.map((day) => ({
    id: day.id,
    dayIndex: day.dayIndex,
    entries: day.entries.map(mapEntry),
  }));

  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    days,
    pageTotal: calculatePageTotal(days),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}

export async function getOrCreateSettings(userId: string): Promise<TrackerSettingsDto> {
  const settings = await prisma.trackerSettings.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  return {
    currency: settings.currency,
    monthlyBudget: settings.monthlyBudget,
    fixedExpenses: parseFixedExpenses(settings.fixedExpenses),
    weeklyReportsEnabled: settings.weeklyReportsEnabled,
  };
}

export async function updateSettings(
  userId: string,
  data: UpdateSettingsInput
): Promise<TrackerSettingsDto> {
  const settings = await prisma.trackerSettings.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });

  return {
    currency: settings.currency,
    monthlyBudget: settings.monthlyBudget,
    fixedExpenses: parseFixedExpenses(settings.fixedExpenses),
    weeklyReportsEnabled: settings.weeklyReportsEnabled,
  };
}

export async function listPages(userId: string): Promise<TrackerPageDto[]> {
  const pages = await prisma.trackerPage.findMany({
    where: { userId },
    include: pageInclude,
    orderBy: { updatedAt: "desc" },
  });

  return pages.map(mapPage);
}

export async function getPage(userId: string, pageId: string): Promise<TrackerPageDto> {
  const page = await prisma.trackerPage.findFirst({
    where: { id: pageId, userId },
    include: pageInclude,
  });

  if (!page) {
    throw new ApiError(404, "PAGE_NOT_FOUND", "Tracker page not found");
  }

  return mapPage(page);
}

export async function getOrCreateDefaultPage(userId: string): Promise<TrackerPageDto> {
  const existing = await prisma.trackerPage.findFirst({
    where: { userId },
    include: pageInclude,
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return mapPage(existing);
  }

  return createPage(userId, {});
}

export async function createPage(
  userId: string,
  data: CreatePageInput
): Promise<TrackerPageDto> {
  const page = await prisma.trackerPage.create({
    data: {
      userId,
      title: data.title ?? "Untitled Page",
      icon: data.icon ?? "📄",
      days: {
        create: Array.from({ length: 7 }, (_, i) => ({
          dayIndex: i + 1,
        })),
      },
    },
    include: pageInclude,
  });

  return mapPage(page);
}

export async function updatePage(
  userId: string,
  pageId: string,
  data: UpdatePageInput
): Promise<TrackerPageDto> {
  const existing = await prisma.trackerPage.findFirst({
    where: { id: pageId, userId },
  });

  if (!existing) {
    throw new ApiError(404, "PAGE_NOT_FOUND", "Tracker page not found");
  }

  const page = await prisma.trackerPage.update({
    where: { id: pageId },
    data,
    include: pageInclude,
  });

  return mapPage(page);
}

export async function deletePage(userId: string, pageId: string): Promise<void> {
  const result = await prisma.trackerPage.deleteMany({
    where: { id: pageId, userId },
  });

  if (result.count === 0) {
    throw new ApiError(404, "PAGE_NOT_FOUND", "Tracker page not found");
  }
}

async function getDayForPage(userId: string, pageId: string, dayIndex: number) {
  const day = await prisma.trackerDay.findFirst({
    where: {
      dayIndex,
      page: { id: pageId, userId },
    },
  });

  if (!day) {
    throw new ApiError(404, "DAY_NOT_FOUND", "Day not found for this page");
  }

  return day;
}

export async function createEntry(
  userId: string,
  pageId: string,
  dayIndex: number,
  data: CreateEntryInput
): Promise<TrackerPageDto> {
  const day = await getDayForPage(userId, pageId, dayIndex);

  const maxOrder = await prisma.trackerEntry.aggregate({
    where: { dayId: day.id },
    _max: { sortOrder: true },
  });

  await prisma.trackerEntry.create({
    data: {
      dayId: day.id,
      title: data.title,
      amount: data.amount,
      description: data.description ?? "",
      category: data.category ?? "",
      tags: data.tags ?? [],
      sortOrder: (maxOrder._max.sortOrder ?? -1) + 1,
    },
  });

  await prisma.trackerPage.update({
    where: { id: pageId },
    data: { updatedAt: new Date() },
  });

  return getPage(userId, pageId);
}

export async function updateEntry(
  userId: string,
  pageId: string,
  dayIndex: number,
  entryId: string,
  data: UpdateEntryInput
): Promise<TrackerPageDto> {
  const day = await getDayForPage(userId, pageId, dayIndex);

  const existing = await prisma.trackerEntry.findFirst({
    where: { id: entryId, dayId: day.id },
  });

  if (!existing) {
    throw new ApiError(404, "ENTRY_NOT_FOUND", "Entry not found");
  }

  await prisma.trackerEntry.update({
    where: { id: entryId },
    data,
  });

  await prisma.trackerPage.update({
    where: { id: pageId },
    data: { updatedAt: new Date() },
  });

  return getPage(userId, pageId);
}

export async function deleteEntry(
  userId: string,
  pageId: string,
  dayIndex: number,
  entryId: string
): Promise<TrackerPageDto> {
  const day = await getDayForPage(userId, pageId, dayIndex);

  const result = await prisma.trackerEntry.deleteMany({
    where: { id: entryId, dayId: day.id },
  });

  if (result.count === 0) {
    throw new ApiError(404, "ENTRY_NOT_FOUND", "Entry not found");
  }

  await prisma.trackerPage.update({
    where: { id: pageId },
    data: { updatedAt: new Date() },
  });

  return getPage(userId, pageId);
}

export async function getPageForExport(userId: string, pageId: string) {
  const page = await prisma.trackerPage.findFirst({
    where: { id: pageId, userId },
    include: pageInclude,
  });

  if (!page) {
    throw new ApiError(404, "PAGE_NOT_FOUND", "Tracker page not found");
  }

  const settings = await getOrCreateSettings(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });

  return { page, settings, userName: user?.name ?? "User" };
}
