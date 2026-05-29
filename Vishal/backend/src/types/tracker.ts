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

export interface TrackerPageDto {
  id: string;
  title: string;
  icon: string;
  days: TrackerDayDto[];
  pageTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerSettingsDto {
  currency: string;
  monthlyBudget: number;
  weeklyReportsEnabled: boolean;
}
