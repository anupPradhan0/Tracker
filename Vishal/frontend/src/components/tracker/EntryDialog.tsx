import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ENTRY_CATEGORIES, QUICK_TAGS, emptyEntryForm } from "@/lib/trackerUtils";
import { cn } from "@/lib/utils";
import type { EntryFormData, TrackerEntry } from "@/types/tracker";

interface EntryDialogProps {
  open: boolean;
  dayLabel: string;
  entry: TrackerEntry | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (form: EntryFormData) => void;
}

export function EntryDialog({
  open,
  dayLabel,
  entry,
  isSaving,
  onClose,
  onSave,
}: EntryDialogProps) {
  const [form, setForm] = useState<EntryFormData>(emptyEntryForm());
  const [showCategories, setShowCategories] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        title: entry.title,
        amount: String(entry.amount),
        description: entry.description,
        category: entry.category,
        tags: entry.tags.join(", "),
      });
    } else {
      setForm(emptyEntryForm());
    }
  }, [entry, open]);

  const filteredCategories = ENTRY_CATEGORIES.filter((c) =>
    c.toLowerCase().includes(form.category.toLowerCase())
  );

  const tagsArr = form.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const isValid = form.title.trim().length > 0 && parseFloat(form.amount) > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent onClose={onClose} className="relative">
        <DialogHeader>
          <DialogTitle>{entry ? "Edit entry" : "Add entry"}</DialogTitle>
          <p className="text-sm text-slate-500">{dayLabel}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Title *
            </label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Groceries"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Amount *
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Description
            </label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <div className="relative">
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Category
            </label>
            <Input
              value={form.category}
              onChange={(e) => {
                setForm({ ...form, category: e.target.value });
                setShowCategories(true);
              }}
              onFocus={() => setShowCategories(true)}
              onBlur={() => setTimeout(() => setShowCategories(false), 150)}
              placeholder="Food, Transport…"
              autoComplete="off"
            />
            {showCategories && filteredCategories.length > 0 && (
              <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                {filteredCategories.map((cat) => (
                  <li key={cat}>
                    <button
                      type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-indigo-50"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setForm({ ...form, category: cat });
                        setShowCategories(false);
                      }}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Tags
            </label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="comma separated"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_TAGS.map((tag) => {
                const active = tagsArr.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs transition-colors",
                      active
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-200 text-slate-600 hover:border-indigo-300"
                    )}
                    onClick={() => {
                      const next = active
                        ? tagsArr.filter((t) => t !== tag)
                        : [...tagsArr, tag];
                      setForm({ ...form, tags: next.join(", ") });
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button className="flex-1" disabled={!isValid || isSaving} onClick={() => onSave(form)}>
            {isSaving ? "Saving…" : entry ? "Update" : "Add entry"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
