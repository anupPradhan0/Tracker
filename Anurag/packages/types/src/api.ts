export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  user: UserPublic;
}

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: string;
  preferredAiProvider: string;
  currency: string;
  reportSenderEmail: string | null;
  reportReceiverEmail: string | null;
  createdAt: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  isDefault: boolean;
}

export interface ExpenseDto {
  id: string;
  amount: string;
  description: string | null;
  date: string;
  currency: string;
  categoryId: string;
  category?: CategoryDto;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetDto {
  id: string;
  year: number;
  month: number;
  amount: string;
  currency: string;
  spent?: string;
  remaining?: string;
  exceeded?: boolean;
}

export interface AnalyticsSummary {
  monthlyTotal: string;
  weeklyTotal: string;
  budgetAmount: string | null;
  remainingBudget: string | null;
  budgetExceeded: boolean;
  topCategories: { categoryId: string; name: string; total: string; color: string | null }[];
  recentExpenses: ExpenseDto[];
}

export interface AiInsightResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
}

export interface AiKeyStatus {
  provider: string;
  configured: boolean;
  keyHint: string | null;
}
