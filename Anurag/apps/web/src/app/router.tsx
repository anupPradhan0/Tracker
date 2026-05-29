import { lazy, Suspense, type ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageLoader } from "@/components/shared/page-loader";
import { ProtectedRoute } from "./protected-route";
import { LoginPage } from "@/features/auth/login-page";
import { SignupPage } from "@/features/auth/signup-page";
import { ForgotPasswordPage } from "@/features/auth/forgot-password-page";

const DashboardPage = lazy(() =>
  import("@/features/dashboard/dashboard-page").then((m) => ({ default: m.DashboardPage }))
);
const ExpensesPage = lazy(() =>
  import("@/features/expenses/expenses-page").then((m) => ({ default: m.ExpensesPage }))
);
const ExpenseFormPage = lazy(() =>
  import("@/features/expenses/expense-form-page").then((m) => ({ default: m.ExpenseFormPage }))
);
const BudgetsPage = lazy(() =>
  import("@/features/budgets/budgets-page").then((m) => ({ default: m.BudgetsPage }))
);
const AnalyticsPage = lazy(() =>
  import("@/features/analytics/analytics-page").then((m) => ({ default: m.AnalyticsPage }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/settings-page").then((m) => ({ default: m.SettingsPage }))
);

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <LazyPage>
                <DashboardPage />
              </LazyPage>
            }
          />
          <Route
            path="/expenses"
            element={
              <LazyPage>
                <ExpensesPage />
              </LazyPage>
            }
          />
          <Route
            path="/expenses/new"
            element={
              <LazyPage>
                <ExpenseFormPage />
              </LazyPage>
            }
          />
          <Route
            path="/expenses/:id/edit"
            element={
              <LazyPage>
                <ExpenseFormPage />
              </LazyPage>
            }
          />
          <Route
            path="/budgets"
            element={
              <LazyPage>
                <BudgetsPage />
              </LazyPage>
            }
          />
          <Route
            path="/analytics"
            element={
              <LazyPage>
                <AnalyticsPage />
              </LazyPage>
            }
          />
          <Route
            path="/settings"
            element={
              <LazyPage>
                <SettingsPage />
              </LazyPage>
            }
          />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
