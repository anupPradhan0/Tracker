import { calculatePageTotal } from "../utils/tracker.js";
import type { TrackerDayDto, TrackerEntryDto, TrackerPageDto } from "../types/tracker.js";

export const pageInclude = {
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

export function mapPage(page: {
  id: string;
  title: string;
  icon: string;
  folderId: string | null;
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
    folderId: page.folderId,
    days,
    pageTotal: calculatePageTotal(days),
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
  };
}
