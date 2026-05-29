import { NavLink } from "react-router-dom";
import { LayoutDashboard, Receipt, Wallet, BarChart3, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/expenses", icon: Receipt, label: "Spend" },
  { to: "/budgets", icon: Wallet, label: "Budget" },
  { to: "/analytics", icon: BarChart3, label: "Stats" },
  { to: "/settings", icon: Settings, label: "More" },
];

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--color-border)] bg-[var(--color-card)]/95 backdrop-blur-md safe-area-pb md:hidden"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around gap-0.5 px-1 pt-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            aria-label={label}
            className={({ isActive }) =>
              cn(
                "flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[11px] leading-tight transition-colors",
                isActive
                  ? "text-[var(--color-foreground)] font-semibold"
                  : "text-[var(--color-muted-foreground)]"
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="max-w-full truncate">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
