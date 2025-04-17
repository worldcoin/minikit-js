#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const copyDir = async (src: string, dest: string, exclude: string[]) => {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (exclude.includes(entry.name)) {
      continue; // Skip excluded files/dirs
    }

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, exclude);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
};

const main = async () => {
  const targetArg = process.argv[2];

  if (!targetArg) {
    console.error('Error: Missing project name.');
    console.error('Usage: npx @worldcoin/create-mini-app <project-name>');
    process.exit(1);
  }

  const projectName = path.basename(targetArg);
  const targetDir = path.resolve(process.cwd(), targetArg);

  try {
    await fs.access(targetDir);
    console.error(`Error: Directory "${projectName}" already exists at ${targetDir}`);
    process.exit(1);
  } catch (e: any) {
    if (e.code !== 'ENOENT') {
      console.error('An unexpected error occurred:', e);
      process.exit(1);
    }
  }

  // Determine the source template directory (root of the package)
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // Assuming cli.js is in dist/cli/, the package root is two levels up
  const sourcePackageDir = path.resolve(__dirname, '../../');

  console.log(`Creating a new Mini App in ${targetDir} from ${sourcePackageDir}...`);

  const excludeItems = ['cli', 'dist', 'node_modules', '.git', '.DS_Store'];

  try {
    await copyDir(sourcePackageDir, targetDir, excludeItems);

    // Clean up the copied package.json
    const targetPackageJsonPath = path.join(targetDir, 'package.json');
    try {
      const pkgJsonString = await fs.readFile(targetPackageJsonPath, 'utf-8');
      const pkgJson = JSON.parse(pkgJsonString);

      // Remove tool-specific fields
      delete pkgJson.bin;
      delete pkgJson.scripts.prepublishOnly;
      // Optionally remove specific devDependencies if they are only for the tool
      if (pkgJson.devDependencies) {
         delete pkgJson.devDependencies['typescript']; // Example
         // Add others if needed
         if (Object.keys(pkgJson.devDependencies).length === 0) {
            delete pkgJson.devDependencies;
         }
      }
      // Optional: remove the private field if it exists and is false
      // if (pkgJson.private === false) { 
      //   delete pkgJson.private; 
      // }

      await fs.writeFile(targetPackageJsonPath, JSON.stringify(pkgJson, null, 2) + '\n');

    } catch (pkgError) {
      console.warn('Warning: Could not read or clean the package.json in the new project.', pkgError);
    }


    console.log(`
Success! Created ${projectName} at ${targetDir}
`);
    console.log('Inside that directory, you can run several commands:
');
    console.log('  pnpm install (or npm install / yarn install)');
    console.log('    Installs dependencies.
');
    console.log('  pnpm dev (or npm run dev / yarn dev)');
    console.log('    Starts the development server.
');
    console.log('We suggest that you begin by typing:
');
    console.log(`  cd ${targetArg}`);
    console.log('  pnpm install');
    console.log('  pnpm dev
');

  } catch (error) {
    console.error('Error copying template files:', error);
    try {
      await fs.rm(targetDir, { recursive: true, force: true });
    } catch (cleanupError) {
      console.error('Error cleaning up directory:', cleanupError);
    }
    process.exit(1);
  }
};

main().catch((err) => {
  console.error('An unexpected error occurred:', err);
  process.exit(1);
}); 