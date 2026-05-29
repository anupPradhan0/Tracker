import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { calculateDayTotal, formatCurrency, getDayLabel } from "@/lib/trackerUtils";
import type { TrackerDay, TrackerEntry } from "@/types/tracker";

interface DayCardProps {
  day: TrackerDay;
  currency: string;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (entryId: string) => void;
  isDeleting?: boolean;
}

export function DayCard({
  day,
  currency,
  expanded,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  isDeleting,
}: DayCardProps) {
  const dayTotal = calculateDayTotal(day);
  const entryCount = day.entries.length;

  return (
    <article
      className={cn(
        "group flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 shadow-sm transition-all duration-200",
        "hover:border-indigo-200 hover:shadow-md"
      )}
    >
      <header
        className="flex cursor-pointer items-center justify-between gap-2 p-4"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-indigo-500" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          )}
          <div className="min-w-0">
            <h3 className="truncate font-semibold text-slate-900">
              {getDayLabel(day.dayIndex)}
            </h3>
            <p className="text-xs text-slate-500">
              {entryCount} {entryCount === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="text-sm font-bold text-indigo-700">
            {formatCurrency(dayTotal, currency)}
          </span>
          <Button
            variant="outline"
            size="default"
            className="h-8 px-2 text-xs sm:px-3"
            onClick={(e) => {
              e.stopPropagation();
              onAdd();
            }}
          >
            <Plus className="h-3.5 w-3.5 sm:mr-1" />
            <span className="hidden sm:inline">Add</span>
          </Button>
        </div>
      </header>

      {expanded && (
        <div className="border-t border-slate-100 px-3 pb-3 pt-1">
          {day.entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No entries yet</p>
          ) : (
            <ul className="space-y-2">
              {day.entries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-start justify-between gap-2 rounded-xl bg-slate-50/80 px-3 py-2.5 transition-colors hover:bg-indigo-50/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-slate-800">
                        {entry.title}
                      </span>
                      {entry.category && (
                        <span className="shrink-0 rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                          {entry.category}
                        </span>
                      )}
                    </div>
                    {entry.description && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
                        {entry.description}
                      </p>
                    )}
                    {entry.tags.length > 0 && (
                      <p className="mt-1 text-xs text-slate-400">
                        {entry.tags.map((t) => `#${t}`).join(" ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-sm font-semibold text-slate-900">
                      {formatCurrency(entry.amount, currency)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(entry)}
                      aria-label="Edit entry"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-600"
                      disabled={isDeleting}
                      onClick={() => onDelete(entry.id)}
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}
