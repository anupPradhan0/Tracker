import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { trackerApi } from "@/services/trackerService";
import { getApiErrorMessage } from "@/services/api";
import type { EntryFormData } from "@/types/tracker";
import { downloadBlob } from "@/lib/trackerUtils";

const PAGES_KEY = ["tracker", "pages"] as const;
const SETTINGS_KEY = ["tracker", "settings"] as const;

export function pageQueryKey(pageId: string) {
  return ["tracker", "page", pageId] as const;
}

export function useTrackerSettings() {
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: trackerApi.getSettings,
  });
}

export function useTrackerPages() {
  return useQuery({
    queryKey: PAGES_KEY,
    queryFn: trackerApi.listPages,
  });
}

export function useTrackerPage(pageId: string | null) {
  return useQuery({
    queryKey: pageId ? pageQueryKey(pageId) : ["tracker", "page", "none"],
    queryFn: () => trackerApi.getPage(pageId!),
    enabled: Boolean(pageId),
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => trackerApi.createPage(),
    onSuccess: (page) => {
      queryClient.setQueryData(pageQueryKey(page.id), page);
      void queryClient.invalidateQueries({ queryKey: PAGES_KEY });
      toast.success("Page created");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pageId: string) => trackerApi.deletePage(pageId),
    onSuccess: (_data, pageId) => {
      queryClient.removeQueries({ queryKey: pageQueryKey(pageId) });
      void queryClient.invalidateQueries({ queryKey: PAGES_KEY });
      toast.success("Page deleted");
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });
}

export function useUpdatePageTitle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ pageId, title }: { pageId: string; title: string }) =>
      trackerApi.updatePage(pageId, { title }),
    onSuccess: (page) => {
      queryClient.setQueryData(pageQueryKey(page.id), page);
      void queryClient.invalidateQueries({ queryKey: PAGES_KEY });
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
      queryClient.setQueryData(pageQueryKey(page.id), page);
      void queryClient.invalidateQueries({ queryKey: PAGES_KEY });
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
      queryClient.setQueryData(pageQueryKey(page.id), page);
      void queryClient.invalidateQueries({ queryKey: PAGES_KEY });
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
