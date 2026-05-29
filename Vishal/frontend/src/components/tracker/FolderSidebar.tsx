import { useState } from "react";
import {
  ChevronRight,
  FolderIcon,
  FolderPlus,
  Pencil,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TrackerFolder, TrackerPage } from "@/types/tracker";

interface CreateFolderPayload {
  name: string;
  pageTitle: string;
  parentFolderId?: string | null;
}

interface FolderSidebarProps {
  folders: TrackerFolder[];
  pages: TrackerPage[];
  activePageId: string | null;
  isCreatingFolder: boolean;
  isRenamingFolder: boolean;
  isRenamingPage: boolean;
  isDeletingFolder: boolean;
  isDeletingPage: boolean;
  onSelectPage: (pageId: string) => void;
  onCreateFolder: (payload: CreateFolderPayload) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderExpanded: (folderId: string, isExpanded: boolean) => void;
  onDeletePage: (pageId: string) => void;
}

type RenameTarget = { type: "folder"; id: string; name: string } | { type: "page"; id: string; name: string };

function PageRow({
  page,
  isActive,
  canDelete,
  isDeleting,
  onSelect,
  onRename,
  onDelete,
}: {
  page: TrackerPage;
  isActive: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  const entryCount = page.days.reduce((n, d) => n + d.entries.length, 0);

  return (
    <div
      className={cn(
        "group flex min-h-10 items-center gap-1 rounded-xl px-2 py-1.5 transition-all duration-200",
        isActive
          ? "pill-3d-active"
          : "border border-transparent hover:border-indigo-100/60 hover:bg-indigo-50/40 hover:shadow-[var(--shadow-3d-sm)]"
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
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
        onClick={onRename}
        aria-label={`Rename ${page.title}`}
        title="Rename page"
      >
        <Pencil className="h-3.5 w-3.5 text-slate-500" />
      </Button>
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
  onOpenCreateFolder,
  onRenameFolder,
  onRenamePage,
  onDeleteFolder,
  onToggleFolderExpanded,
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
  onOpenCreateFolder: (parentFolderId: string) => void;
  onRenameFolder: (folderId: string, name: string) => void;
  onRenamePage: (pageId: string, title: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onToggleFolderExpanded: (folderId: string, isExpanded: boolean) => void;
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
        className="group flex items-center gap-1 rounded-xl py-1 pr-1 transition-colors hover:bg-indigo-50/40"
        style={{ paddingLeft: `${level * 12 + 4}px` }}
      >
        <button
          type="button"
          className="rounded-lg p-0.5 transition-colors hover:bg-indigo-100/60"
          onClick={() => onToggleFolderExpanded(folder.id, !folder.isExpanded)}
          aria-label={folder.isExpanded ? "Collapse folder" : "Expand folder"}
        >
          <ChevronRight
            className={cn(
              "h-4 w-4 text-slate-500",
              folder.isExpanded ? "chevron-expanded" : "chevron-collapsed"
            )}
          />
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
            title="Rename folder"
            onClick={() => onRenameFolder(folder.id, folder.name)}
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="New subfolder"
            onClick={() => onOpenCreateFolder(folder.id)}
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
                onRename={() => onRenamePage(page.id, page.title)}
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
              onOpenCreateFolder={onOpenCreateFolder}
              onRenameFolder={onRenameFolder}
              onRenamePage={onRenamePage}
              onDeleteFolder={onDeleteFolder}
              onToggleFolderExpanded={onToggleFolderExpanded}
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
  isRenamingFolder,
  isRenamingPage,
  isDeletingFolder,
  isDeletingPage,
  onSelectPage,
  onCreateFolder,
  onRenameFolder,
  onRenamePage,
  onDeleteFolder,
  onToggleFolderExpanded,
  onDeletePage,
}: FolderSidebarProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createParentFolderId, setCreateParentFolderId] = useState<string | null>(null);
  const [folderName, setFolderName] = useState("New Folder");
  const [pageTitle, setPageTitle] = useState("Untitled Page");

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const rootFolders = folders.filter((f) => f.parentFolderId === null);

  const openCreateDialog = (parentFolderId: string | null) => {
    setCreateParentFolderId(parentFolderId);
    setFolderName("New Folder");
    setPageTitle("Untitled Page");
    setCreateDialogOpen(true);
  };

  const handleCreateSubmit = () => {
    const trimmedFolder = folderName.trim();
    const trimmedPage = pageTitle.trim();
    if (!trimmedFolder || !trimmedPage) return;

    onCreateFolder({
      name: trimmedFolder,
      pageTitle: trimmedPage,
      ...(createParentFolderId != null ? { parentFolderId: createParentFolderId } : {}),
    });
    setCreateDialogOpen(false);
  };

  const openRenameDialog = (target: RenameTarget) => {
    setRenameTarget(target);
    setRenameValue(target.name);
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = () => {
    const trimmed = renameValue.trim();
    if (!renameTarget || !trimmed) return;

    if (renameTarget.type === "folder") {
      onRenameFolder(renameTarget.id, trimmed);
    } else {
      onRenamePage(renameTarget.id, trimmed);
    }
    setRenameDialogOpen(false);
    setRenameTarget(null);
    setRenameValue("");
  };

  return (
    <aside className="glass-panel flex w-full shrink-0 flex-col border-b border-white/60 md:w-64 md:border-b-0 md:border-r lg:w-72">
      <div className="border-b border-indigo-100/60 px-3 py-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500/80">
          Workspace
        </p>
        <Button
          variant="outline"
          className="h-9 w-full justify-start text-sm"
          disabled={isCreatingFolder}
          onClick={() => openCreateDialog(null)}
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {rootFolders.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500">
            No folders yet.
            <br />
            Create a folder to start your 7-day plan.
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
                onOpenCreateFolder={openCreateDialog}
                onRenameFolder={(id, name) => openRenameDialog({ type: "folder", id, name })}
                onRenamePage={(id, name) => openRenameDialog({ type: "page", id, name })}
                onDeleteFolder={onDeleteFolder}
                onToggleFolderExpanded={onToggleFolderExpanded}
                onDeletePage={onDeletePage}
              />
            ))}
          </div>
        )}
      </nav>

      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New folder &amp; weekly plan</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            Each folder includes one 7-day plan page. Name both before creating.
          </p>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="folder-name">Folder name</Label>
              <Input
                id="folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="New Folder"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSubmit()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="page-title">Page name</Label>
              <Input
                id="page-title"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
                placeholder="Untitled Page"
                onKeyDown={(e) => e.key === "Enter" && handleCreateSubmit()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={isCreatingFolder || !folderName.trim() || !pageTitle.trim()}
              onClick={handleCreateSubmit}
            >
              {isCreatingFolder ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Rename {renameTarget?.type === "folder" ? "folder" : "page"}
            </DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Enter new name"
            onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                !renameValue.trim() ||
                (renameTarget?.type === "folder" ? isRenamingFolder : isRenamingPage)
              }
              onClick={handleRenameSubmit}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
