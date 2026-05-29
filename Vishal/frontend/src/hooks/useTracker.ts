import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackerApi } from "@/services/trackerService";
import { getApiErrorMessage } from "@/services/api";
import type { EntryFormData } from "@/types/tracker";
import { downloadBlob } from "@/lib/trackerUtils";

const PAGE_KEY = ["tracker", "page"] as const;
const SETTINGS_KEY = ["tracker", "settings"] as const;

export function useTrackerSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: trackerApi.getSettings,
  });
}

export function useTrackerPage() {
  return useQuery({
    queryKey: PAGE_KEY,
    queryFn: trackerApi.getDefaultPage,
  });
}

export function useUpdatePageTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, title }: { pageId: string; title: string }) =>
      trackerApi.updatePage(pageId, { title }),
    onSuccess: (page) => {
      queryClient.setQueryData(PAGE_KEY, page);
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useSaveEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageId,
      dayIndex,
      entryId,
      form,
    }: {
      pageId: string;
      dayIndex: number;
      entryId?: string;
      form: EntryFormData;
    }) =>
      entryId
        ? trackerApi.updateEntry(pageId, dayIndex, entryId, form)
        : trackerApi.createEntry(pageId, dayIndex, form),
    onSuccess: (page) => {
      queryClient.setQueryData(PAGE_KEY, page);
      toast.success("Entry saved");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeleteEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      pageId,
      dayIndex,
      entryId,
    }: {
      pageId: string;
      dayIndex: number;
      entryId: string;
    }) => trackerApi.deleteEntry(pageId, dayIndex, entryId),
    onSuccess: (page) => {
      queryClient.setQueryData(PAGE_KEY, page);
      toast.success("Entry deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useExportPdf() {
  return useMutation({
    mutationFn: async ({ pageId, title }: { pageId: string; title: string }) => {
      const blob = await trackerApi.exportPdf(pageId);
      downloadBlob(blob, `${title.replace(/[^a-z0-9]/gi, "_")}_weekly_report.pdf`);
    },
    onSuccess: () => toast.success("PDF downloaded"),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useSendWeeklyEmail() {
  return useMutation({
    mutationFn: (pageId?: string) => trackerApi.sendWeeklyEmail(pageId),
    onSuccess: (result) => toast.success(`Report sent to ${result.to}`),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: trackerApi.updateSettings,
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
      toast.success("Settings saved");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useEmailStatus() {
  return useQuery({
    queryKey: ["tracker", "email-status"],
    queryFn: trackerApi.getEmailStatus,
    staleTime: 60_000,
  });
}
