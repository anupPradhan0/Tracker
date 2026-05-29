import { LogOut, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/providers/AuthProvider";

export function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-white">
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold text-blue-700">
            <Wallet className="h-5 w-5" />
            Finance Tracker
          </div>
          <Button
            variant="outline"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        <Card className="animate-fade-in border-white/40 bg-white/80 shadow-lg backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-700">
              {user?.name?.charAt(0) ?? "?"}
            </div>
            <div>
              <CardTitle>Welcome, {user?.name ?? "User"}</CardTitle>
              <p className="text-sm text-slate-500">{user?.email}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-dashed border-blue-200 bg-blue-50/50 p-8 text-center">
              <p className="text-lg font-medium text-slate-800">
                Expense tracking coming soon
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Your account is set up. Folders, pages, and finance entries will be
                available in the next phase.
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
