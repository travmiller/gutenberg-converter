import { existsSync, mkdirSync, copyFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Ensure the public directory exists
if (!existsSync('public')) {
  mkdirSync('public', { recursive: true });
}

// Copy all files from static to public for redundancy
const staticDir = 'static';
if (existsSync(staticDir)) {
  const files = readdirSync(staticDir);

  for (const file of files) {
    const sourcePath = join(staticDir, file);
    const destPath = join('public', file);

    try {
      copyFileSync(sourcePath, destPath);
      console.log(`Copied ${sourcePath} to ${destPath}`);
    } catch (error) {
      console.error(`Error copying ${sourcePath}:`, error);
    }
  }
}

console.log('Static files prepared for deployment'); 