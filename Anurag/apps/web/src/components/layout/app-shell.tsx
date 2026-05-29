import { Outlet, NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Wallet, BarChart3, Settings } from "lucide-react";
import { BottomNav } from "./bottom-nav";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/budgets", icon: Wallet, label: "Budgets" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] md:block">
        <div className="flex h-16 items-center border-b border-[var(--color-border)] px-6">
          <span className="text-lg font-semibold tracking-tight">Expense Tracker</span>
        </div>
        <nav className="space-y-1 p-4">
          {sidebarLinks.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-[var(--color-accent)] font-medium"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-accent)] hover:text-[var(--color-foreground)]"
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="md:pl-64">
        <div className="mx-auto max-w-3xl px-4 pb-24 pt-6 md:pb-8 md:pt-8">
          <Outlet />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
