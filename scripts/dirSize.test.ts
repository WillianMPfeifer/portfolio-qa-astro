import { describe, expect, it, afterEach, beforeEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { getDirectorySizeBytes } from './dirSize';

describe('getDirectorySizeBytes', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dirsize-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('sums the size of files at the top level', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'hello'); // 5 bytes
    fs.writeFileSync(path.join(tmpDir, 'b.txt'), 'world!'); // 6 bytes

    expect(getDirectorySizeBytes(tmpDir)).toBe(11);
  });

  it('sums files in nested subdirectories', () => {
    fs.writeFileSync(path.join(tmpDir, 'a.txt'), 'hello'); // 5 bytes
    const nested = path.join(tmpDir, 'nested', 'deeper');
    fs.mkdirSync(nested, { recursive: true });
    fs.writeFileSync(path.join(nested, 'b.txt'), 'world!'); // 6 bytes

    expect(getDirectorySizeBytes(tmpDir)).toBe(11);
  });

  it('returns 0 for an empty directory', () => {
    expect(getDirectorySizeBytes(tmpDir)).toBe(0);
  });
});
