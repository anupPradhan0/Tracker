export interface TrackerEntryDto {
  id: string;
  title: string;
  amount: number;
  description: string;
  category: string;
  tags: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerDayDto {
  id: string;
  dayIndex: number;
  entries: TrackerEntryDto[];
}

export interface TrackerFolderDto {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerPageDto {
  id: string;
  title: string;
  icon: string;
  folderId: string | null;
  days: TrackerDayDto[];
  pageTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderResultDto {
  folder: TrackerFolderDto;
  page: TrackerPageDto;
}

export interface FixedExpenseDto {
  title: string;
  amount: number;
}

export interface TrackerSettingsDto {
  currency: string;
  monthlyBudget: number;
  fixedExpenses: FixedExpenseDto[];
  weeklyReportsEnabled: boolean;
}
