import fs from 'node:fs';
import path from 'node:path';

export function getDirectorySizeBytes(dirPath: string): number {
  let total = 0;

  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const entryPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      total += getDirectorySizeBytes(entryPath);
    } else if (entry.isFile()) {
      total += fs.statSync(entryPath).size;
    }
  }

  return total;
}
