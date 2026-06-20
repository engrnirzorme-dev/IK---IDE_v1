import { get, set } from 'idb-keyval';
import { FileNode } from './zipLogic';

// Project Container defined inside App, but we can type it roughly or import it
// We will just use 'any' or redeclare to decouple loosely.
export type ProjectContainer = {
  id: string;
  name: string;
  isOpen: boolean;
  isActive: boolean;
  files: Record<string, FileNode>;
};

const BACKUP_KEY = 'project_backup';
const CURRENT_KEY = 'project_current';
const FILE_BACKUP_PREFIX = 'file_backup_';

export async function saveBackup(files: Record<string, FileNode>) {
  await set(BACKUP_KEY, files);
}

export async function loadBackup(): Promise<Record<string, FileNode> | undefined> {
  return await get(BACKUP_KEY);
}

// Current local working copy
export async function saveCurrentProject(projects: ProjectContainer[]) {
  await set(CURRENT_KEY, projects);
}

export async function loadCurrentProject(): Promise<ProjectContainer[] | undefined> {
  return await get(CURRENT_KEY);
}

// Store a specific file's backup before modification
export async function saveFileBackup(path: string, content: string) {
  await set(FILE_BACKUP_PREFIX + path, content);
}

export async function loadFileBackup(path: string): Promise<string | undefined> {
  return await get(FILE_BACKUP_PREFIX + path);
}
