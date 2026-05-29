import { api } from "@/services/api";
import type { ApiSuccess } from "@/types/api";
import type {
  CreateFolderResult,
  EntryFormData,
  TrackerFolder,
  TrackerPage,
  TrackerSettings,
} from "@/types/tracker";
import { parseTagsInput } from "@/lib/trackerUtils";

function unwrap<T>(data: ApiSuccess<T>): T {
  return data.data;
}

export const trackerApi = {
  async getSettings(): Promise<TrackerSettings> {
    const { data } = await api.get<ApiSuccess<TrackerSettings>>("/api/tracker/settings");
    return unwrap(data);
  },

  async updateSettings(payload: Partial<TrackerSettings>): Promise<TrackerSettings> {
    const { data } = await api.patch<ApiSuccess<TrackerSettings>>(
      "/api/tracker/settings",
      payload
    );
    return unwrap(data);
  },

  async listFolders(): Promise<TrackerFolder[]> {
    const { data } = await api.get<ApiSuccess<TrackerFolder[]>>("/api/tracker/folders");
    return unwrap(data);
  },

  async createFolder(payload?: {
    name?: string;
    pageTitle?: string;
    parentFolderId?: string | null;
  }): Promise<CreateFolderResult> {
    const { data } = await api.post<ApiSuccess<CreateFolderResult>>(
      "/api/tracker/folders",
      payload ?? {}
    );
    return unwrap(data);
  },

  async updateFolder(
    folderId: string,
    payload: { name?: string; isExpanded?: boolean; parentFolderId?: string | null }
  ): Promise<TrackerFolder> {
    const { data } = await api.patch<ApiSuccess<TrackerFolder>>(
      `/api/tracker/folders/${folderId}`,
      payload
    );
    return unwrap(data);
  },

  async deleteFolder(folderId: string): Promise<void> {
    await api.delete(`/api/tracker/folders/${folderId}`);
  },

  async listPages(): Promise<TrackerPage[]> {
    const { data } = await api.get<ApiSuccess<TrackerPage[]>>("/api/tracker/pages");
    return unwrap(data);
  },

  async getPage(pageId: string): Promise<TrackerPage> {
    const { data } = await api.get<ApiSuccess<TrackerPage>>(`/api/tracker/pages/${pageId}`);
    return unwrap(data);
  },

  async getDefaultPage(): Promise<TrackerPage> {
    const { data } = await api.get<ApiSuccess<TrackerPage>>("/api/tracker/pages/default");
    return unwrap(data);
  },

  async createPage(payload?: {
    title?: string;
    icon?: string;
    folderId?: string;
  }): Promise<TrackerPage> {
    const { data } = await api.post<ApiSuccess<TrackerPage>>("/api/tracker/pages", payload ?? {});
    return unwrap(data);
  },

  async deletePage(pageId: string): Promise<void> {
    await api.delete(`/api/tracker/pages/${pageId}`);
  },

  async updatePage(
    pageId: string,
    payload: { title?: string; icon?: string }
  ): Promise<TrackerPage> {
    const { data } = await api.patch<ApiSuccess<TrackerPage>>(
      `/api/tracker/pages/${pageId}`,
      payload
    );
    return unwrap(data);
  },

  async createEntry(
    pageId: string,
    dayIndex: number,
    form: EntryFormData
  ): Promise<TrackerPage> {
    const { data } = await api.post<ApiSuccess<TrackerPage>>(
      `/api/tracker/pages/${pageId}/days/${dayIndex}/entries`,
      {
        title: form.title,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        tags: parseTagsInput(form.tags),
      }
    );
    return unwrap(data);
  },

  async updateEntry(
    pageId: string,
    dayIndex: number,
    entryId: string,
    form: EntryFormData
  ): Promise<TrackerPage> {
    const { data } = await api.patch<ApiSuccess<TrackerPage>>(
      `/api/tracker/pages/${pageId}/days/${dayIndex}/entries/${entryId}`,
      {
        title: form.title,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category,
        tags: parseTagsInput(form.tags),
      }
    );
    return unwrap(data);
  },

  async deleteEntry(
    pageId: string,
    dayIndex: number,
    entryId: string
  ): Promise<TrackerPage> {
    const { data } = await api.delete<ApiSuccess<TrackerPage>>(
      `/api/tracker/pages/${pageId}/days/${dayIndex}/entries/${entryId}`
    );
    return unwrap(data);
  },

  async exportPdf(pageId: string): Promise<Blob> {
    const { data } = await api.post(
      "/api/tracker/export/pdf",
      { pageId },
      { responseType: "blob" }
    );
    return data as Blob;
  },

  async sendWeeklyEmail(pageId?: string): Promise<{ sent: boolean; to: string }> {
    const { data } = await api.post<ApiSuccess<{ sent: boolean; to: string }>>(
      "/api/tracker/email/send",
      pageId ? { pageId } : {}
    );
    return unwrap(data);
  },

  async getEmailStatus(): Promise<{
    configured: boolean;
    ready: boolean;
    canSend?: boolean;
  }> {
    const { data } = await api.get<
      ApiSuccess<{
        configured: boolean;
        ready: boolean;
        canSend?: boolean;
      }>
    >("/api/tracker/email/status");
    return unwrap(data);
  },
};
