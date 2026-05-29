import { prisma } from "../lib/prisma.js";
import { ApiError } from "../utils/ApiError.js";
import type { TrackerFolderDto } from "../types/tracker.js";
import type { CreateFolderInput, UpdateFolderInput } from "../validators/folder.validator.js";

function mapFolder(folder: {
  id: string;
  name: string;
  parentFolderId: string | null;
  order: number;
  isExpanded: boolean;
  createdAt: Date;
  updatedAt: Date;
}): TrackerFolderDto {
  return {
    id: folder.id,
    name: folder.name,
    parentFolderId: folder.parentFolderId,
    order: folder.order,
    isExpanded: folder.isExpanded,
    createdAt: folder.createdAt.toISOString(),
    updatedAt: folder.updatedAt.toISOString(),
  };
}

/** Idempotent: assign orphan pages to a default root folder per user. */
export async function ensureDefaultFolderMigration(userId: string): Promise<void> {
  const orphanCount = await prisma.trackerPage.count({
    where: { userId, folderId: null },
  });

  if (orphanCount === 0) {
    return;
  }

  let folder = await prisma.trackerFolder.findFirst({
    where: { userId, parentFolderId: null },
    orderBy: { order: "asc" },
  });

  if (!folder) {
    folder = await prisma.trackerFolder.create({
      data: {
        userId,
        name: "My Folder",
        parentFolderId: null,
        order: 0,
        isExpanded: true,
      },
    });
  }

  await prisma.trackerPage.updateMany({
    where: { userId, folderId: null },
    data: { folderId: folder.id },
  });
}

async function getSiblingMaxOrder(
  userId: string,
  parentFolderId: string | null
): Promise<number> {
  const last = await prisma.trackerFolder.findFirst({
    where: { userId, parentFolderId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  return last ? last.order + 1 : 0;
}

async function assertFolderOwned(userId: string, folderId: string) {
  const folder = await prisma.trackerFolder.findFirst({
    where: { id: folderId, userId },
  });
  if (!folder) {
    throw new ApiError(404, "FOLDER_NOT_FOUND", "Folder not found");
  }
  return folder;
}

export async function listFolders(userId: string): Promise<TrackerFolderDto[]> {
  await ensureDefaultFolderMigration(userId);

  const folders = await prisma.trackerFolder.findMany({
    where: { userId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return folders.map(mapFolder);
}

export async function createFolder(
  userId: string,
  data: CreateFolderInput
): Promise<TrackerFolderDto> {
  const parentFolderId = data.parentFolderId ?? null;

  if (parentFolderId) {
    await assertFolderOwned(userId, parentFolderId);
  }

  const order = await getSiblingMaxOrder(userId, parentFolderId);

  const folder = await prisma.trackerFolder.create({
    data: {
      userId,
      name: data.name ?? "New Folder",
      parentFolderId,
      order,
      isExpanded: true,
    },
  });

  return mapFolder(folder);
}

export async function updateFolder(
  userId: string,
  folderId: string,
  data: UpdateFolderInput
): Promise<TrackerFolderDto> {
  await assertFolderOwned(userId, folderId);

  if (data.parentFolderId !== undefined && data.parentFolderId !== null) {
    if (data.parentFolderId === folderId) {
      throw new ApiError(400, "INVALID_PARENT", "Folder cannot be its own parent");
    }
    await assertFolderOwned(userId, data.parentFolderId);
  }

  const folder = await prisma.trackerFolder.update({
    where: { id: folderId },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.parentFolderId !== undefined ? { parentFolderId: data.parentFolderId } : {}),
      ...(data.isExpanded !== undefined ? { isExpanded: data.isExpanded } : {}),
    },
  });

  return mapFolder(folder);
}

async function deleteFolderRecursive(userId: string, folderId: string): Promise<void> {
  const childFolders = await prisma.trackerFolder.findMany({
    where: { userId, parentFolderId: folderId },
    select: { id: true },
  });

  for (const child of childFolders) {
    await deleteFolderRecursive(userId, child.id);
  }

  await prisma.trackerPage.deleteMany({
    where: { userId, folderId },
  });

  await prisma.trackerFolder.deleteMany({
    where: { id: folderId, userId },
  });
}

export async function deleteFolder(userId: string, folderId: string): Promise<void> {
  await assertFolderOwned(userId, folderId);
  await deleteFolderRecursive(userId, folderId);
}

export async function resolveFolderIdForNewPage(
  userId: string,
  folderId?: string
): Promise<string> {
  await ensureDefaultFolderMigration(userId);

  if (folderId) {
    await assertFolderOwned(userId, folderId);
    return folderId;
  }

  const folder = await prisma.trackerFolder.findFirst({
    where: { userId, parentFolderId: null },
    orderBy: { order: "asc" },
  });

  if (!folder) {
    throw new ApiError(
      400,
      "FOLDER_REQUIRED",
      "A page cannot exist without a folder. Please create a folder first."
    );
  }

  return folder.id;
}
