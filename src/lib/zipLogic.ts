import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export type FileNode = {
  path: string;
  name: string;
  content?: string;
  isText: boolean;
  raw?: any; // The original JSZip object or Uint8Array for binary
  isAIExcluded?: boolean;
};

export async function unzipProject(file: File): Promise<Record<string, FileNode>> {
  const zip = new JSZip();
  const loadedZip = await zip.loadAsync(file);
  const files: Record<string, FileNode> = {};

  const filePromises: Promise<void>[] = [];

  loadedZip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return; // Skip directories

    const promise = async () => {
      // Guess if it's text by extension
      const ext = relativePath.split('.').pop()?.toLowerCase() || '';
      const textExtensions = ['php', 'html', 'css', 'js', 'ts', 'json', 'md', 'xml', 'csv', 'txt', 'env', 'htaccess'];
      const isText = textExtensions.includes(ext);

      if (isText) {
        const content = await zipEntry.async('text');
        files[relativePath] = {
          path: relativePath,
          name: zipEntry.name.split('/').pop() || '',
          content,
          isText: true,
          isAIExcluded: relativePath.includes('node_modules/') || relativePath.includes('vendor/') || relativePath.includes('.git/') || relativePath.includes('build/') || relativePath.includes('dist/')
        };
      } else {
        const raw = await zipEntry.async('uint8array');
        files[relativePath] = {
          path: relativePath,
          name: zipEntry.name.split('/').pop() || '',
          isText: false,
          raw,
          isAIExcluded: true
        };
      }
    };
    filePromises.push(promise());
  });

  await Promise.all(filePromises);
  return files;
}

export async function zipProject(files: Record<string, FileNode>, projectName: string = 'project'): Promise<Blob> {
  const zip = new JSZip();
  
  for (const [path, node] of Object.entries(files)) {
    if (node.isText && node.content !== undefined) {
      zip.file(path, node.content);
    } else if (!node.isText && node.raw !== undefined) {
      zip.file(path, node.raw);
    } else if (!node.isText && node.content === undefined && node.raw === undefined) {
      zip.folder(path);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}
