import { FilePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { TrackerPage } from "@/types/tracker";

interface PageSidebarProps {
  pages: TrackerPage[];
  activePageId: string | null;
  isCreating: boolean;
  isDeleting: boolean;
  onSelect: (pageId: string) => void;
  onCreate: () => void;
  onDelete: (pageId: string) => void;
}

export function PageSidebar({
  pages,
  activePageId,
  isCreating,
  isDeleting,
  onSelect,
  onCreate,
  onDelete,
}: PageSidebarProps) {
  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-indigo-100/80 bg-white/90 md:w-56 md:border-b-0 md:border-r lg:w-64">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pages</p>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={onCreate}
          disabled={isCreating}
          aria-label="New page"
          title="New weekly page"
        >
          <FilePlus className="h-4 w-4" />
        </Button>
      </div>

      <nav className="flex gap-2 overflow-x-auto p-2 md:flex-col md:overflow-x-visible md:overflow-y-auto md:p-2">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          const entryCount = page.days.reduce((n, d) => n + d.entries.length, 0);

          return (
            <div
              key={page.id}
              className={cn(
                "group flex min-w-[140px] shrink-0 items-center gap-1 rounded-xl border px-2 py-1.5 transition-colors md:min-w-0",
                isActive
                  ? "border-indigo-200 bg-indigo-50"
                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
              )}
            >
              <button
                type="button"
                onClick={() => onSelect(page.id)}
                className="min-w-0 flex-1 text-left"
              >
                <span className="flex items-center gap-1.5">
                  <span className="text-base leading-none">{page.icon}</span>
                  <span className="truncate text-sm font-medium text-slate-800">
                    {page.title}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-slate-500">
                  {entryCount} entries
                </span>
              </button>
              {pages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                  disabled={isDeleting}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete "${page.title}"? All entries on this page will be removed.`
                      )
                    ) {
                      onDelete(page.id);
                    }
                  }}
                  aria-label={`Delete ${page.title}`}
                >
                  <Trash2 className="h-3.5 w-3.5 text-red-500" />
                </Button>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
