import { copyFile, mkdir } from 'node:fs/promises';

await mkdir('dist', { recursive: true });
await Promise.all([
  copyFile('src/stdio.js', 'dist/index.js'),
  copyFile('src/tools.js', 'dist/tools.js'),
]);
