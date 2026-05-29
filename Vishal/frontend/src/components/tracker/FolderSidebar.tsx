import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderIcon,
  FolderPlus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { TrackerFolder, TrackerPage } from "@/types/tracker";

interface FolderSidebarProps {
  folders: TrackerFolder[];
  pages: TrackerPage[];
  activePageId: string | null;
  isCreatingFolder: boolean;
  isCreatingPage: boolean;
  isDeletingFolder: boolean;
  isDeletingPage: boolean;
  onSelectPage: (pageId: string) => void;
  onCreateFolder: (parentFolderId?: string | null) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderExpanded: (folderId: string, isExpanded: boolean) => void;
  onCreatePage: (folderId: string) => void;
  onDeletePage: (pageId: string) => void;
}

function PageRow({
  page,
  isActive,
  canDelete,
  isDeleting,
  onSelect,
  onDelete,
}: {
  page: TrackerPage;
  isActive: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const entryCount = page.days.reduce((n, d) => n + d.entries.length, 0);

  return (
    <div
      className={cn(
        "group flex min-h-10 items-center gap-1 rounded-lg border px-2 py-1.5 transition-colors",
        isActive
          ? "border-indigo-200 bg-indigo-50"
          : "border-transparent hover:border-slate-200 hover:bg-slate-50"
      )}
    >
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-1.5">
          <span className="text-base leading-none">{page.icon}</span>
          <span className="truncate text-sm font-medium text-slate-800">{page.title}</span>
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {entryCount} entries
        </span>
      </button>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
          disabled={isDeleting}
          onClick={onDelete}
          aria-label={`Delete ${page.title}`}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-500" />
        </Button>
      )}
    </div>
  );
}

function FolderTreeItem({
  folder,
  level,
  folders,
  pages,
  activePageId,
  totalPageCount,
  isDeletingFolder,
  isDeletingPage,
  onSelectPage,
  onCreateFolder,
  onDeleteFolder,
  onToggleFolderExpanded,
  onCreatePage,
  onDeletePage,
}: {
  folder: TrackerFolder;
  level: number;
  folders: TrackerFolder[];
  pages: TrackerPage[];
  activePageId: string | null;
  totalPageCount: number;
  isDeletingFolder: boolean;
  isDeletingPage: boolean;
  onSelectPage: (pageId: string) => void;
  onCreateFolder: (parentFolderId: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderExpanded: (folderId: string, isExpanded: boolean) => void;
  onCreatePage: (folderId: string) => void;
  onDeletePage: (pageId: string) => void;
}) {
  const childFolders = folders.filter((f) => f.parentFolderId === folder.id);
  const childPages = pages.filter((p) => p.folderId === folder.id);

  const handleDeleteFolder = () => {
    if (
      window.confirm(
        `Delete folder "${folder.name}"? All pages and subfolders inside will be permanently removed.`
      )
    ) {
      onDeleteFolder(folder.id);
    }
  };

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-lg py-1 pr-1 hover:bg-slate-50"
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        <button
          type="button"
          className="rounded p-0.5 hover:bg-slate-100"
          onClick={() => onToggleFolderExpanded(folder.id, !folder.isExpanded)}
          aria-label={folder.isExpanded ? "Collapse folder" : "Expand folder"}
        >
          {folder.isExpanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </button>
        <FolderIcon className="h-4 w-4 shrink-0 text-indigo-500" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">
          {folder.name}
        </span>
        <div className="flex shrink-0 items-center gap-0.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="New page in folder"
            onClick={() => onCreatePage(folder.id)}
          >
            <FilePlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="New subfolder"
            onClick={() => onCreateFolder(folder.id)}
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            disabled={isDeletingFolder}
            title="Delete folder"
            onClick={handleDeleteFolder}
          >
            <Trash2 className="h-3.5 w-3.5 text-red-500" />
          </Button>
        </div>
      </div>

      {folder.isExpanded && (
        <div className="space-y-1 pb-1">
          {childPages.map((page) => (
            <div key={page.id} style={{ paddingLeft: `${(level + 1) * 12 + 20}px` }}>
              <PageRow
                page={page}
                isActive={page.id === activePageId}
                canDelete={totalPageCount > 1}
                isDeleting={isDeletingPage}
                onSelect={() => onSelectPage(page.id)}
                onDelete={() => {
                  if (
                    window.confirm(
                      `Delete "${page.title}"? All entries on this page will be removed.`
                    )
                  ) {
                    onDeletePage(page.id);
                  }
                }}
              />
            </div>
          ))}
          {childFolders.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              folders={folders}
              pages={pages}
              activePageId={activePageId}
              totalPageCount={totalPageCount}
              isDeletingFolder={isDeletingFolder}
              isDeletingPage={isDeletingPage}
              onSelectPage={onSelectPage}
              onCreateFolder={onCreateFolder}
              onDeleteFolder={onDeleteFolder}
              onToggleFolderExpanded={onToggleFolderExpanded}
              onCreatePage={onCreatePage}
              onDeletePage={onDeletePage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function FolderSidebar({
  folders,
  pages,
  activePageId,
  isCreatingFolder,
  isCreatingPage,
  isDeletingFolder,
  isDeletingPage,
  onSelectPage,
  onCreateFolder,
  onDeleteFolder,
  onToggleFolderExpanded,
  onCreatePage,
  onDeletePage,
}: FolderSidebarProps) {
  const [folderPickOpen, setFolderPickOpen] = useState(false);
  const rootFolders = folders.filter((f) => f.parentFolderId === null);

  const handleNewPage = () => {
    if (folders.length === 0) {
      return;
    }
    if (folders.length === 1) {
      onCreatePage(folders[0]!.id);
      return;
    }
    setFolderPickOpen(true);
  };

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-indigo-100/80 bg-white/90 md:w-64 md:border-b-0 md:border-r lg:w-72">
      <div className="border-b border-slate-100 px-3 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Workspace
        </p>
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            className="h-9 w-full justify-start text-sm"
            disabled={isCreatingFolder}
            onClick={() => onCreateFolder(null)}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Folder
          </Button>
          <Button
            variant="default"
            className="h-9 w-full justify-start text-sm"
            disabled={isCreatingPage || folders.length === 0}
            onClick={handleNewPage}
          >
            <FilePlus className="mr-2 h-4 w-4" />
            New Page
          </Button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {rootFolders.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500">
            No folders yet.
            <br />
            Create a folder first, then add pages inside it.
          </p>
        ) : (
          <div className="space-y-1">
            {rootFolders.map((folder) => (
              <FolderTreeItem
                key={folder.id}
                folder={folder}
                level={0}
                folders={folders}
                pages={pages}
                activePageId={activePageId}
                totalPageCount={pages.length}
                isDeletingFolder={isDeletingFolder}
                isDeletingPage={isDeletingPage}
                onSelectPage={onSelectPage}
                onCreateFolder={onCreateFolder}
                onDeleteFolder={onDeleteFolder}
                onToggleFolderExpanded={onToggleFolderExpanded}
                onCreatePage={onCreatePage}
                onDeletePage={onDeletePage}
              />
            ))}
          </div>
        )}
      </nav>

      <Dialog open={folderPickOpen} onOpenChange={setFolderPickOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select a folder</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Pages must be created inside a folder. Choose where to add your new page:
          </p>
          <div className="max-h-64 space-y-1 overflow-y-auto">
            {folders.map((folder) => (
              <Button
                key={folder.id}
                variant="ghost"
                className="w-full justify-start"
                disabled={isCreatingPage}
                onClick={() => {
                  onCreatePage(folder.id);
                  setFolderPickOpen(false);
                }}
              >
                <FolderIcon className="mr-2 h-4 w-4" />
                {folder.name}
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFolderPickOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
