export interface TrackerEntry {
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

export interface TrackerDay {
  id: string;
  dayIndex: number;
  entries: TrackerEntry[];
}

export interface TrackerPage {
  id: string;
  title: string;
  icon: string;
  days: TrackerDay[];
  pageTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerSettings {
  currency: string;
  monthlyBudget: number;
  weeklyReportsEnabled: boolean;
}

export interface EntryFormData {
  title: string;
  amount: string;
  description: string;
  category: string;
  tags: string;
}
