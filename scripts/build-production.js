'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
const sourceRoot = path.join(projectRoot, 'awn');
const outputRoot = path.join(projectRoot, 'dist', 'awn');
const pages = [
  'index.html',
  'admin-dashboard.html',
  'teacher-dashboard.html',
  'parent-dashboard.html',
  'principal-dashboard.html',
  'supervisor-dashboard.html',
  'student-dashboard.html',
];
const excludedDemoFiles = new Set([
  'assets/data/users.json',
  'assets/data/assignments.json',
]);

function getApiBaseUrl() {
  const value = String(process.env.AWN_API_BASE_URL ?? '/').trim();
  if (!value || value.startsWith('//')) throw new Error('AWN_API_BASE_URL must be a same-origin path or an HTTP(S) URL.');
  const resolved = new URL(value, 'https://awn-build.invalid');
  if (!['https:', 'http:'].includes(resolved.protocol) || resolved.username || resolved.password || resolved.search || resolved.hash) {
    throw new Error('AWN_API_BASE_URL must not contain credentials, a query, or a fragment and must use HTTP(S).');
  }
  return value;
}

function escapeAttribute(value) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function verifyProductionDefaults() {
  for (const page of pages) {
    const html = await fs.readFile(path.join(sourceRoot, page), 'utf8');
    if (!/<meta\s+name=["']awn-demo-mode["']\s+content=["']false["']\s*>/i.test(html)) {
      throw new Error(`${page} must explicitly disable demo mode before production packaging.`);
    }
    if (!/<meta\s+name=["']awn-api-base-url["']\s+content=["'][^"']*["']\s*>/i.test(html)) {
      throw new Error(`${page} is missing the API base URL metadata.`);
    }
  }
}

async function injectApiBaseUrl(apiBaseUrl) {
  const tag = `<meta name="awn-api-base-url" content="${escapeAttribute(apiBaseUrl)}">`;
  const pattern = /<meta\s+name=["']awn-api-base-url["']\s+content=["'][^"']*["']\s*>/i;
  for (const page of pages) {
    const pagePath = path.join(outputRoot, page);
    const html = await fs.readFile(pagePath, 'utf8');
    if (!pattern.test(html)) throw new Error(`${page} is missing the API base URL metadata in the output.`);
    await fs.writeFile(pagePath, html.replace(pattern, tag), 'utf8');
  }
}

async function main() {
  const apiBaseUrl = getApiBaseUrl();
  await verifyProductionDefaults();
  try {
    await fs.access(outputRoot);
    throw new Error(`Output already exists at ${outputRoot}. Remove that folder explicitly before rebuilding.`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  await fs.mkdir(path.dirname(outputRoot), { recursive: true });
  await fs.mkdir(outputRoot);
  await fs.cp(sourceRoot, outputRoot, {
    recursive: true,
    filter: (sourcePath) => {
      const relativePath = path.relative(sourceRoot, sourcePath).split(path.sep).join('/');
      return !excludedDemoFiles.has(relativePath);
    },
  });
  await injectApiBaseUrl(apiBaseUrl);
  console.log(`Production frontend prepared at ${path.relative(projectRoot, outputRoot)} (demo JSON fixtures excluded; API base: ${apiBaseUrl}).`);
}

main().catch((error) => {
  console.error(`Production build failed: ${error.message}`);
  process.exitCode = 1;
});