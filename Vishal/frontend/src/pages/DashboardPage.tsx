import { useCallback, useEffect, useRef, useState } from "react";
import { FileDown, LogOut, Mail, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DayCard } from "@/components/tracker/DayCard";
import { EntryDialog } from "@/components/tracker/EntryDialog";
import { AiAssistantPanel } from "@/components/tracker/AiAssistantPanel";
import { SettingsPanel } from "@/components/tracker/SettingsPanel";
import { FolderSidebar } from "@/components/tracker/FolderSidebar";
import { useAuth } from "@/providers/AuthProvider";
import {
  useCreateFolder,
  useDeleteEntry,
  useDeleteFolder,
  useDeletePage,
  useEmailStatus,
  useExportPdf,
  useSaveEntry,
  useSendWeeklyEmail,
  useTrackerFolders,
  useTrackerPage,
  useTrackerPages,
  useTrackerSettings,
  useUpdateFolderExpanded,
  useUpdateFolderName,
  useUpdatePageTitle,
  useUpdateSettings,
} from "@/hooks/useTracker";
import { formatCurrency, getBudgetStatus, getDayLabel } from "@/lib/trackerUtils";
import type { EntryFormData, TrackerEntry } from "@/types/tracker";
import { cn } from "@/lib/utils";

const dayStaggerClasses = [
  "stagger-1",
  "stagger-2",
  "stagger-3",
  "stagger-4",
  "stagger-5",
  "stagger-6",
  "stagger-7",
] as const;

export function DashboardPage() {
  const { user, logout } = useAuth();
  const { data: folders = [], isLoading: foldersLoading, refetch: refetchFolders } =
    useTrackerFolders();
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

  const createFolder = useCreateFolder();
  const deleteFolder = useDeleteFolder();
  const updateFolderExpanded = useUpdateFolderExpanded();
  const updateFolderName = useUpdateFolderName();
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
  const expandAllDaysPageId = useRef<string | null>(null);

  useEffect(() => {
    if (pagesLoading || foldersLoading) return;
    if (pages.length === 0) {
      if (!didSeedPage.current) {
        didSeedPage.current = true;
        createFolder.mutate(
          { name: "My Folder", pageTitle: "Untitled Page" },
          {
            onSuccess: (result) => {
              expandAllDaysPageId.current = result.page.id;
              setSelectedPageId(result.page.id);
            },
          }
        );
      }
      return;
    }
    if (!selectedPageId || !pages.some((p) => p.id === selectedPageId)) {
      setSelectedPageId(pages[0]!.id);
    }
  }, [
    pages,
    pagesLoading,
    foldersLoading,
    selectedPageId,
    createFolder.mutate,
  ]);

  useEffect(() => {
    if (page) {
      setTitle(page.title);
      setExpandedDays((prev) => {
        const next = { ...prev };
        const expandAll = expandAllDaysPageId.current === page.id;
        if (expandAll) {
          expandAllDaysPageId.current = null;
          for (const day of page.days) {
            next[day.dayIndex] = true;
          }
        } else {
          for (const day of page.days) {
            if (next[day.dayIndex] === undefined) {
              next[day.dayIndex] = day.dayIndex === 1;
            }
          }
        }
        return next;
      });
    }
  }, [page?.id, page?.title]);

  const saveTitleDebounced = useCallback(() => {
    if (!page || title === page.title) return;
    updateTitle.mutate({ pageId: page.id, title });
  }, [page, title, updateTitle]);

  useEffect(() => {
    const t = setTimeout(saveTitleDebounced, 800);
    return () => clearTimeout(t);
  }, [title, saveTitleDebounced]);

  const isLoading =
    pagesLoading ||
    foldersLoading ||
    pageLoading ||
    (pages.length === 0 && createFolder.isPending);

  if (isLoading) {
    return (
      <div className="bg-mesh flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  if (isError || !page) {
    return (
      <div className="bg-mesh flex min-h-screen flex-col items-center justify-center gap-4 p-6">
        <p className="text-slate-600">Could not load your tracker.</p>
        <Button
          onClick={() => {
            void refetchFolders();
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
    <div className="bg-mesh relative min-h-screen overflow-hidden">
      <div className="float-orb float-orb-indigo pointer-events-none absolute -left-32 top-0 h-96 w-96" />
      <div className="float-orb float-orb-violet pointer-events-none absolute -right-24 bottom-0 h-80 w-80" />

      <header className="glass-panel sticky top-0 z-40 border-b border-white/60 shadow-[var(--shadow-3d-sm)]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 font-semibold text-indigo-700">
            <div className="icon-badge-3d flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white">
              <Wallet className="h-4 w-4" />
            </div>
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
              emailConfigured={emailStatus?.ready ?? emailStatus?.configured ?? false}
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

      <div className="relative z-10 mx-auto flex max-w-7xl flex-col md:flex-row">
        <FolderSidebar
          folders={folders}
          pages={pages}
          activePageId={selectedPageId}
          isCreatingFolder={createFolder.isPending}
          isRenamingFolder={updateFolderName.isPending}
          isRenamingPage={updateTitle.isPending}
          isDeletingFolder={deleteFolder.isPending}
          isDeletingPage={deletePage.isPending}
          onSelectPage={setSelectedPageId}
          onCreateFolder={(payload) =>
            createFolder.mutate(payload, {
              onSuccess: (result) => {
                expandAllDaysPageId.current = result.page.id;
                setSelectedPageId(result.page.id);
              },
            })
          }
          onRenameFolder={(folderId, name) =>
            updateFolderName.mutate({ folderId, name })
          }
          onRenamePage={(pageId, title) =>
            updateTitle.mutate(
              { pageId, title },
              {
                onSuccess: () => {
                  if (pageId === selectedPageId) setTitle(title);
                },
              }
            )
          }
          onDeleteFolder={(folderId) =>
            deleteFolder.mutate(folderId, {
              onSuccess: async () => {
                const { data: freshPages } = await refetchPages();
                if (!freshPages?.some((p) => p.id === selectedPageId)) {
                  setSelectedPageId(freshPages?.[0]?.id ?? null);
                }
              },
            })
          }
          onToggleFolderExpanded={(folderId, isExpanded) =>
            updateFolderExpanded.mutate({ folderId, isExpanded })
          }
          onDeletePage={(pageId) =>
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
              "card-3d glass-panel mb-6 rounded-2xl p-4 sm:mb-8 sm:p-6"
            )}
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 max-w-full flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <span className="shrink-0 text-2xl sm:text-3xl">{page.icon}</span>
                  <div className="min-w-0 flex-1">
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full truncate border-none bg-transparent text-lg font-bold text-slate-900 outline-none focus:ring-0 sm:text-2xl"
                      placeholder="Untitled Page"
                    />
                    <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 sm:text-sm">
                      7-day plan
                    </p>
                  </div>
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
                      "pill-3d rounded-full px-2.5 py-0.5 text-xs font-medium",
                      budgetStatus.isOverBudget
                        ? "bg-red-100 text-red-700 shadow-[0_1px_2px_oklch(0%_0_0/0.06)_inset]"
                        : "bg-emerald-100 text-emerald-700 shadow-[0_1px_2px_oklch(0%_0_0/0.06)_inset]"
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
                  disabled={sendEmail.isPending}
                  onClick={() => sendEmail.mutate(page.id)}
                  title="Email weekly report with PDF attachment"
                >
                  <Mail className="h-4 w-4" />
                  {sendEmail.isPending ? "Sending…" : "Email report"}
                </Button>
              </div>
            </div>

            {(settings?.monthlyBudget ?? 0) > 0 && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-indigo-100/60 pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="chip-inset rounded-xl p-3">
                  <p className="text-slate-500">Monthly budget</p>
                  <p className="font-semibold">
                    {formatCurrency(settings!.monthlyBudget, currency)}
                  </p>
                </div>
                {budgetStatus.fixedExpensesTotal > 0 && (
                  <div className="chip-inset rounded-xl p-3">
                    <p className="text-slate-500">Fixed expenses</p>
                    <p className="font-semibold">
                      {formatCurrency(budgetStatus.fixedExpensesTotal, currency)}
                    </p>
                  </div>
                )}
                <div className="chip-inset rounded-xl p-3">
                  <p className="text-slate-500">Weekly target</p>
                  <p className="font-semibold">
                    {formatCurrency(budgetStatus.weeklyBudget, currency)}
                  </p>
                </div>
                <div className="chip-inset rounded-xl p-3">
                  <p className="text-slate-500">Entries this week</p>
                  <p className="font-semibold">
                    {page.days.reduce((n, d) => n + d.entries.length, 0)}
                  </p>
                </div>
              </div>
            )}
          </section>

          <p className="mb-3 text-sm text-slate-600">
            Add expenses for each day below. Changes save automatically when you edit entries.
          </p>

          <div className="grid gap-3 lg:grid-cols-2 lg:gap-4">
            {page.days.map((day, index) => (
              <DayCard
                key={day.id}
                className={cn("animate-fade-in", dayStaggerClasses[index])}
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
