import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { TrackerSettings } from "@/types/tracker";

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
  const [weeklyReports, setWeeklyReports] = useState(false);

  useEffect(() => {
    if (settings) {
      setCurrency(settings.currency);
      setMonthlyBudget(String(settings.monthlyBudget));
      setWeeklyReports(settings.weeklyReportsEnabled);
    }
  }, [settings, open]);

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
            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
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
