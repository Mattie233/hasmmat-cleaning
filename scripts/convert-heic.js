const { promises: fs } = require('fs');
const path = require('path');
const { promisify } = require('util');
const { execFile } = require('child_process');
const execFileAsync = promisify(execFile);

async function findHeicFiles(dir) {
  let results = [];
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch (error) {
    return results;
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(await findHeicFiles(fullPath));
      continue;
    }

    if (/\.heic$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

async function convertFile(filePath) {
  const outPath = filePath.replace(/\.[^.]+$/, '.jpg');
  if (filePath === outPath) {
    return;
  }

  try {
    await execFileAsync('sips', ['-s', 'format', 'jpeg', filePath, '--out', outPath]);
    await fs.unlink(filePath);
    console.log(`Converted and removed: ${filePath} -> ${outPath}`);
  } catch (error) {
    console.error(`Failed to convert ${filePath}:`, error.message);
    process.exitCode = 1;
  }
}

(async () => {
  const publicDir = path.join(process.cwd(), 'public');
  const heicFiles = await findHeicFiles(publicDir);

  if (heicFiles.length === 0) {
    console.log('No HEIC files found in public/.');
    return;
  }

  for (const file of heicFiles) {
    await convertFile(file);
  }
})();
