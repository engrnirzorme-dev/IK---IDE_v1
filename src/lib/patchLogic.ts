import JSZip from 'jszip';
import { FileNode } from './zipLogic';

export function extractFileUpdates(aiResponse: string): { path: string; code: string }[] {
  const updates: { path: string; code: string }[] = [];
  
  // Try to find JSON objects that match our contract format
  // We'll look for blocks that have "action": "update", "path": "...", "code": "..."
  // Since regex parsing of JSON is fragile, let's find potential JSON blocks and parse them.
  const jsonBlockPattern = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  
  let match;
  while ((match = jsonBlockPattern.exec(aiResponse)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.action === 'update' && typeof parsed.path === 'string' && typeof parsed.code === 'string') {
        updates.push({ path: parsed.path, code: parsed.code });
      }
    } catch (e) {
      console.warn("Found a code block but wasn't valid JSON match", e);
    }
  }

  // Fallback: If no markdown code block was found, try finding root-level objects
  if (updates.length === 0) {
    const rawPattern = /(\{\s*"action"\s*:\s*"update"[\s\S]*?\n\})/g;
    let rawMatch;
    while ((rawMatch = rawPattern.exec(aiResponse)) !== null) {
      try {
        const parsed = JSON.parse(rawMatch[1]);
        if (parsed.action === 'update' && typeof parsed.path === 'string' && typeof parsed.code === 'string') {
          updates.push({ path: parsed.path, code: parsed.code });
        }
      } catch (e) {}
    }
  }

  return updates;
}

/**
 * Takes the AI's JSON updates and the current files state.
 * Uses JSZip to modify the zipped project structure in memory,
 * resolving paths safely, and returns both the updated JSZip Blob and the newly synchronized files state.
 */
export async function applyAIUpdatesUsingJSZip(
   files: Record<string, FileNode>, 
   updates: { path: string, code: string }[]
): Promise<{ nextFiles: Record<string, FileNode> }> {
   const zip = new JSZip();
   
   // 1. Reconstruct JSZip structure in-memory from application's state
   for (const [path, node] of Object.entries(files)) {
      if (node.isText && node.content !== undefined) {
         zip.file(path, node.content);
      } else if (!node.isText && node.raw !== undefined) {
         zip.file(path, node.raw);
      }
   }
   
   // 2. Modify the zipped project structure in memory handling file path resolution correctly
   const nextFiles = { ...files };
   
   for (const u of updates) {
      // Safe path resolution: remove leading slashes and current-directory segments
      let safePath = u.path.replace(/^[\/\\]+/, '').trim();
      while (safePath.startsWith('./') || safePath.startsWith('.\\')) {
          safePath = safePath.substring(2);
      }
      
      // Update the JSZip structure directly in memory
      zip.file(safePath, u.code);
      
      // Sychnronize back to the application state representation
      const zipEntry = zip.file(safePath);
      if (zipEntry) {
         const existing = nextFiles[safePath];
         nextFiles[safePath] = {
            path: safePath,
            name: safePath.split(/[\/\\]/).pop() || '',
            content: await zipEntry.async('text'),
            isText: true,
            isAIExcluded: existing?.isAIExcluded 
         };
      }
   }
   
   return { nextFiles };
}

export function generateSystemPrompt(files: Record<string, any>) {
  const paths = Object.keys(files).sort();
  const tree = paths.join('\n');
  
  let fileContents = '';
  let totalChars = 0;
  const MAX_CHARS = 1200000; // ~300k-400k tokens max to prevent 1M token overflow
  let truncatedCount = 0;

  for (const path of paths) {
    if (files[path].isText && files[path].content) {
      const addition = `\n--- START FILE: ${path} ---\n${files[path].content}\n--- END FILE: ${path} ---\n`;
      if (totalChars + addition.length > MAX_CHARS) {
         fileContents += `\n--- START FILE: ${path} ---\n[CONTENT TRUNCATED DUE TO TOKEN LIMITS]\n--- END FILE: ${path} ---\n`;
         truncatedCount++;
      } else {
         fileContents += addition;
         totalChars += addition.length;
      }
    }
  }

  if (truncatedCount > 0) {
     fileContents += `\n\n[WARNING: ${truncatedCount} original files were NOT included in the context due to token limits. Please instruct the user to use the Sidebar to Exclude unneeded directories (var/, vendor/, build/) to ensure accurate code context.]`;
  }

  return `You are an Expert Full-Stack AI Application Architect & CodeIgniter 4 Developer.
You are helping the user build or modify their codebase.

CODEIGNITER 4 CONTEXT & RULES:
1. This is a CodeIgniter 4 application. Keep conventions in mind: MVC structure (Controllers in app/Controllers, Models in app/Models, Views in app/Views).
2. Use strict PHP types, PSR-12 coding standards, and correct namespaces (e.g., "namespace App\\Controllers;").
3. Spark CLI commands (e.g., "php spark make:controller Name") typically generate boilerplate classes. If the user invokes a CLI command, you must ACT as the CLI and generate the corresponding boilerplate files using the JSON patching mechanism.
4. Route management is in app/Config/Routes.php. Database configs are in app/Config/Database.php or .env. Helpers go in app/Helpers/. Update these files appropriately when requested.

CURRENT PROJECT STRUCTURE:
${tree}

CURRENT FILE CONTENTS (Context):
${fileContents}

CRITICAL RULES FOR FILE MODIFICATION:
If you need to change, create, or update any file, you MUST output a JSON block wrapped in \`\`\`json \`\`\` that strictly follows this exact schema:
\`\`\`json
{
  "action": "update",
  "path": "path/to/file.php",
  "code": "<?php\\n\\n// The full updated code here...\\n"
}
\`\`\`

- Do NOT truncate code. You MUST provide the FULL code for the file in the "code" field.
- Do NOT provide partial updates.
- If you need to update multiple files, output MULTIPLE separate \`\`\`json\`\`\` blocks (one for each file).
- Keep descriptions brief.
`;
}
