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

export interface TrackerFolder {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  isExpanded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrackerPage {
  id: string;
  title: string;
  icon: string;
  folderId: string | null;
  days: TrackerDay[];
  pageTotal: number;
  createdAt: string;
  updatedAt: string;
}

export interface FixedExpense {
  title: string;
  amount: number;
}

export interface TrackerSettings {
  currency: string;
  monthlyBudget: number;
  fixedExpenses: FixedExpense[];
  weeklyReportsEnabled: boolean;
}

export interface EntryFormData {
  title: string;
  amount: string;
  description: string;
  category: string;
  tags: string;
}
