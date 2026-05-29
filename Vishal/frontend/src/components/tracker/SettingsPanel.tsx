import { useEffect, useState } from "react";
import { Plus, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { FixedExpense, TrackerSettings } from "@/types/tracker";

interface SettingsPanelProps {
  settings: TrackerSettings | undefined;
  emailConfigured: boolean;
  isSaving: boolean;
  onSave: (data: Partial<TrackerSettings>) => void;
}

export function SettingsPanel({
  settings,
  emailConfigured,
  isSaving,
  onSave,
}: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [currency, setCurrency] = useState("₹");
  const [monthlyBudget, setMonthlyBudget] = useState("0");
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [weeklyReports, setWeeklyReports] = useState(false);
  const [newExpenseTitle, setNewExpenseTitle] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState("");

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
      setMonthlyBudget(String(settings.monthlyBudget));
      setFixedExpenses(settings.fixedExpenses ?? []);
      setWeeklyReports(settings.weeklyReportsEnabled);
    }
  }, [settings, open]);

  const addFixedExpense = () => {
    const title = newExpenseTitle.trim();
    const amount = parseFloat(newExpenseAmount);
    if (!title || !Number.isFinite(amount) || amount < 0) return;
    setFixedExpenses((prev) => [...prev, { title, amount }]);
    setNewExpenseTitle("");
    setNewExpenseAmount("");
  };

  const removeFixedExpense = (index: number) => {
    setFixedExpenses((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <>
      <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Settings">
        <Settings className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent onClose={() => setOpen(false)} className="relative">
          <DialogHeader>
            <DialogTitle>Tracker settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Currency symbol</label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={5} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Monthly budget</label>
              <Input
                type="number"
                min="0"
                value={monthlyBudget}
                onChange={(e) => setMonthlyBudget(e.target.value)}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium">Fixed monthly expenses</label>
              <p className="mb-2 text-xs text-slate-500">
                Rent, subscriptions, etc. Weekly target uses budget minus these.
              </p>
              {fixedExpenses.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {fixedExpenses.map((expense, index) => (
                    <li
                      key={`${expense.title}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                    >
                      <span className="truncate">
                        {expense.title} — {currency}
                        {expense.amount.toFixed(2)}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={() => removeFixedExpense(index)}
                        aria-label="Remove expense"
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Title"
                  value={newExpenseTitle}
                  onChange={(e) => setNewExpenseTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Amount"
                    className="w-full sm:w-28"
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                  />
                  <Button type="button" variant="outline" size="icon" onClick={addFixedExpense}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3">
              <input
                type="checkbox"
                checked={weeklyReports}
                onChange={(e) => setWeeklyReports(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                disabled={!emailConfigured}
              />
              <div>
                <p className="text-sm font-medium">Weekly email reports</p>
                <p className="text-xs text-slate-500">
                  {emailConfigured
                    ? "Receive a summary with PDF attachment each week (via server cron)"
                    : "Email is not configured on the server"}
                </p>
              </div>
            </label>
          </div>

          <Button
            className="mt-6 w-full"
            disabled={isSaving}
            onClick={() => {
              onSave({
                currency,
                monthlyBudget: parseFloat(monthlyBudget) || 0,
                fixedExpenses,
                weeklyReportsEnabled: weeklyReports,
              });
              setOpen(false);
            }}
          >
            {isSaving ? "Saving…" : "Save settings"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
