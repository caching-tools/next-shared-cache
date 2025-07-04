import { cp, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Set common paths
const STANDALONE_DIR = path.join(currentDir, '.next/standalone');
const APP_DIR = path.join(STANDALONE_DIR, 'apps/cache-testing');
const PUBLIC_DIR = path.join(currentDir, 'public');
const STATIC_DIR = path.join(currentDir, '.next/static');
const FETCH_CACHE_DIR = path.join(currentDir, '.next/cache/fetch-cache');
const INSTANCES_DIR = path.join(currentDir, '.next/__instances');

async function copyDir(src: string, dest: string) {
  try {
    await cp(src, dest, { recursive: true });
  } catch (error) {
    console.error(`Failed to copy from ${src} to ${dest}:`, error);
    process.exit(1);
  }
}

async function createInstanceDir(port: string) {
  try {
    await mkdir(path.join(INSTANCES_DIR, port), { recursive: true });
  } catch (error) {
    console.error(
      `Failed to create ${path.join(INSTANCES_DIR, port)} directory:`,
      error,
    );
    process.exit(1);
  }
}

// Copy public directory to standalone app directory
await copyDir(PUBLIC_DIR, path.join(APP_DIR, 'public'));

// Copy static directory to standalone app/.next directory
await copyDir(STATIC_DIR, path.join(APP_DIR, '.next/static'));

try {
  // Copy fetch cache directory to standalone app/.next directory
  await mkdir(path.join(APP_DIR, '.next/cache/fetch-cache'), {
    recursive: true,
  });

  const files = await readdir(FETCH_CACHE_DIR);

  if (files.length > 0) {
    await copyDir(
      FETCH_CACHE_DIR,
      path.join(APP_DIR, '.next/cache/fetch-cache'),
    );
  }
} catch (_error) {
  // Ignore errors - directory might not exist or be empty
  console.error('No fetch cache files to copy');
}

// Create instance directories
await createInstanceDir('3000');
await createInstanceDir('3001');

// Copy files from standalone directory to instance directories
await copyDir(path.join(STANDALONE_DIR, '.'), path.join(INSTANCES_DIR, '3000'));
await copyDir(path.join(STANDALONE_DIR, '.'), path.join(INSTANCES_DIR, '3001'));
