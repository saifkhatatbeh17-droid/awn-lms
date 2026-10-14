'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(projectRoot, 'awn');
const outputRoot = path.join(projectRoot, 'dist', 'awn-demo');
const pages = [
  'index.html',
  'admin-dashboard.html',
  'teacher-dashboard.html',
  'parent-dashboard.html',
  'principal-dashboard.html',
  'supervisor-dashboard.html',
  'student-dashboard.html',
];

async function preparePage(page) {
  const pagePath = path.join(sourceRoot, page);
  let html = await fs.readFile(pagePath, 'utf8');
  const demoMeta = /<meta\s+name=["']awn-demo-mode["']\s+content=["']false["']\s*>/i;
  const apiMeta = /<meta\s+name=["']awn-api-base-url["']\s+content=["'][^"']*["']\s*>/i;
  if (!demoMeta.test(html) || !apiMeta.test(html)) {
    throw new Error(`${page} is missing the expected safe runtime metadata.`);
  }
  html = html.replace(demoMeta, '<meta name="awn-demo-mode" content="true">');
  html = html.replace(apiMeta, '<meta name="awn-api-base-url" content="">');
  return html;
}

async function main() {
  for (const page of pages) await preparePage(page);
  try {
    await fs.access(outputRoot);
    throw new Error(`Output already exists at ${outputRoot}. Remove that folder explicitly before rebuilding.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.mkdir(path.dirname(outputRoot), { recursive: true });
  await fs.mkdir(outputRoot);
  await fs.cp(sourceRoot, outputRoot, { recursive: true });
  for (const page of pages) {
    await fs.writeFile(path.join(outputRoot, page), await preparePage(page), 'utf8');
  }
  console.log(`Local demo prepared at ${path.relative(projectRoot, outputRoot)}. Never deploy this folder.`);
}

main().catch((error) => {
  console.error(`Demo build failed: ${error.message}`);
  process.exitCode = 1;
});