import { useCallback, useEffect, useRef, useState } from "react";
import { FileDown, LogOut, Mail, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DayCard } from "@/components/tracker/DayCard";
import { EntryDialog } from "@/components/tracker/EntryDialog";
import { AiAssistantPanel } from "@/components/tracker/AiAssistantPanel";
import { SettingsPanel } from "@/components/tracker/SettingsPanel";
import { PageSidebar } from "@/components/tracker/PageSidebar";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCreatePage,
  useDeleteEntry,
  useDeletePage,
  useEmailStatus,
  useExportPdf,
  useSaveEntry,
  useSendWeeklyEmail,
  useTrackerPage,
  useTrackerPages,
  useTrackerSettings,
  useUpdatePageTitle,
  useUpdateSettings,
} from "@/hooks/useTracker";
import { formatCurrency, getBudgetStatus, getDayLabel } from "@/lib/trackerUtils";
import type { EntryFormData, TrackerEntry } from "@/types/tracker";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: pages = [], isLoading: pagesLoading, refetch: refetchPages } =
    useTrackerPages();
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);

  const {
    data: page,
    isLoading: pageLoading,
    isError,
    refetch: refetchPage,
  } = useTrackerPage(selectedPageId);
  const { data: settings } = useTrackerSettings();
  const { data: emailStatus } = useEmailStatus();

  const createPage = useCreatePage();
  const deletePage = useDeletePage();
  const updateTitle = useUpdatePageTitle();
  const saveEntry = useSaveEntry();
  const deleteEntry = useDeleteEntry();
  const exportPdf = useExportPdf();
  const sendEmail = useSendWeeklyEmail();
  const updateSettings = useUpdateSettings();

  const [title, setTitle] = useState("");
  const [expandedDays, setExpandedDays] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState<{
    dayIndex: number;
    entry: TrackerEntry | null;
  } | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const currency = settings?.currency ?? "₹";
  const fixedExpenses = settings?.fixedExpenses ?? [];
  const didSeedPage = useRef(false);

  useEffect(() => {
    if (pagesLoading) return;
    if (pages.length === 0) {
      if (!didSeedPage.current) {
        didSeedPage.current = true;
        createPage.mutate(undefined, {
          onSuccess: (newPage) => setSelectedPageId(newPage.id),
        });
      }
      return;
    }
    if (!selectedPageId || !pages.some((p) => p.id === selectedPageId)) {
      setSelectedPageId(pages[0]!.id);
    }
  }, [pages, pagesLoading, selectedPageId, createPage.mutate]);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setExpandedDays((prev) => {
        const next = { ...prev };
        for (const day of page.days) {
          if (next[day.dayIndex] === undefined) next[day.dayIndex] = false;
        }
        return next;
      });
    }
  }, [page?.id]);

  const saveTitleDebounced = useCallback(() => {
    if (!page || title === page.title) return;
    updateTitle.mutate({ pageId: page.id, title });
  }, [page, title, updateTitle]);

  useEffect(() => {
    const t = setTimeout(saveTitleDebounced, 800);
    return () => clearTimeout(t);
  }, [title, saveTitleDebounced]);

  const isLoading = pagesLoading || pageLoading || (pages.length === 0 && createPage.isPending);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-white">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6">
        <p className="text-slate-600">Could not load your tracker.</p>
        <Button
          onClick={() => {
            void refetchPages();
            void refetchPage();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  const budgetStatus = getBudgetStatus(
    page.pageTotal,
    settings?.monthlyBudget ?? 0,
    fixedExpenses
  );
  const editingDayLabel = editing != null ? getDayLabel(editing.dayIndex) : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/30">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 font-semibold text-indigo-700">
            <Wallet className="h-5 w-5 shrink-0" />
            <span className="truncate text-sm sm:text-base">Finance Tracker</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setAiOpen(true)}
              aria-label="AI Assistant"
              title="AI spending insights"
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
            </Button>
            <SettingsPanel
              settings={settings}
              emailConfigured={emailStatus?.configured ?? false}
              isSaving={updateSettings.isPending}
              onSave={(data) => updateSettings.mutate(data)}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl flex-col md:flex-row">
        <PageSidebar
          pages={pages}
          activePageId={selectedPageId}
          isCreating={createPage.isPending}
          isDeleting={deletePage.isPending}
          onSelect={setSelectedPageId}
          onCreate={() =>
            createPage.mutate(undefined, {
              onSuccess: (newPage) => setSelectedPageId(newPage.id),
            })
          }
          onDelete={(pageId) =>
            deletePage.mutate(pageId, {
              onSuccess: () => {
                const remaining = pages.filter((p) => p.id !== pageId);
                if (remaining[0]) setSelectedPageId(remaining[0].id);
              },
            })
          }
        />

        <main className="min-w-0 flex-1 px-3 py-4 pb-safe sm:px-6 sm:py-8">
          <section
            className={cn(
              "mb-6 rounded-2xl border p-4 shadow-lg transition-shadow sm:mb-8 sm:p-6",
              "border-indigo-100/80 bg-white/90",
              "hover:shadow-xl"
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-full flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="shrink-0 text-2xl sm:text-3xl">{page.icon}</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="min-w-0 flex-1 truncate border-none bg-transparent text-lg font-bold text-slate-900 outline-none focus:ring-0 sm:text-2xl"
                    placeholder="Untitled Page"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                  <span>
                    Total:{" "}
                    <strong className="text-indigo-700">
                      {formatCurrency(page.pageTotal, currency)}
                    </strong>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      budgetStatus.isOverBudget
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    Status: {budgetStatus.label}
                  </span>
                  {updateTitle.isPending && (
                    <span className="text-xs text-slate-400">Saving title…</span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-slate-500">
                  Signed in as {user?.name} · {user?.email}
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  disabled={exportPdf.isPending}
                  onClick={() =>
                    exportPdf.mutate({ pageId: page.id, title: page.title })
                  }
                >
                  <FileDown className="h-4 w-4" />
                  {exportPdf.isPending ? "Exporting…" : "Export PDF"}
                </Button>
                <Button
                  variant="default"
                  className="w-full sm:w-auto"
                  disabled={sendEmail.isPending || !emailStatus?.configured}
                  onClick={() => sendEmail.mutate(page.id)}
                  title={
                    emailStatus?.configured
                      ? "Email weekly report with PDF"
                      : "Configure MAIL_* env vars on server"
                  }
                >
                  <Mail className="h-4 w-4" />
                  {sendEmail.isPending ? "Sending…" : "Email report"}
                </Button>
              </div>
            </div>

            {(settings?.monthlyBudget ?? 0) > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-slate-500">Monthly budget</p>
                  <p className="font-semibold">
                    {formatCurrency(settings!.monthlyBudget, currency)}
                  </p>
                </div>
                {budgetStatus.fixedExpensesTotal > 0 && (
                  <div>
                    <p className="text-slate-500">Fixed expenses</p>
                    <p className="font-semibold">
                      {formatCurrency(budgetStatus.fixedExpensesTotal, currency)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-slate-500">Weekly target</p>
                  <p className="font-semibold">
                    {formatCurrency(budgetStatus.weeklyBudget, currency)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Entries this week</p>
                  <p className="font-semibold">
                    {page.days.reduce((n, d) => n + d.entries.length, 0)}
                  </p>
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {page.days.map((day) => (
              <DayCard
                key={day.id}
                day={day}
                currency={currency}
                expanded={expandedDays[day.dayIndex] ?? false}
                onToggle={() =>
                  setExpandedDays((prev) => ({
                    ...prev,
                    [day.dayIndex]: !prev[day.dayIndex],
                  }))
                }
                onAdd={() => setEditing({ dayIndex: day.dayIndex, entry: null })}
                onEdit={(entry) => setEditing({ dayIndex: day.dayIndex, entry })}
                onDelete={(entryId) =>
                  deleteEntry.mutate({
                    pageId: page.id,
                    dayIndex: day.dayIndex,
                    entryId,
                  })
                }
                isDeleting={deleteEntry.isPending}
              />
            ))}
          </div>
        </main>
      </div>

      <AiAssistantPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        pageId={page.id}
        currency={currency}
      />

      <EntryDialog
        open={editing !== null}
        dayLabel={editingDayLabel}
        entry={editing?.entry ?? null}
        isSaving={saveEntry.isPending}
        onClose={() => setEditing(null)}
        onSave={(form: EntryFormData) => {
          if (!editing) return;
          saveEntry.mutate(
            {
              pageId: page.id,
              dayIndex: editing.dayIndex,
              entryId: editing.entry?.id,
              form,
            },
            { onSuccess: () => setEditing(null) }
          );
        }}
      />

    </div>
  );
}
