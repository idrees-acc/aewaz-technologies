import { readFileSync, writeFileSync, cpSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'dist');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const html = readFileSync(resolve(__dirname, 'index.html'), 'utf-8');
const resolved = html.replace(
  /<!--\s*include:\s*([\w/.-]+)\s*-->/g,
  (_, file) => readFileSync(resolve(__dirname, file), 'utf-8')
);
// Inline the stylesheet so first paint doesn't wait on a separate CSS request
const inlined = resolved.replace(
  '<link href="site.css" rel="stylesheet" />',
  () => `<style>${readFileSync(resolve(__dirname, 'site.css'), 'utf-8')}</style>`
);
writeFileSync(resolve(outDir, 'index.html'), inlined);

for (const f of ['site.css', 'favicon.ico', 'CNAME', 'robots.txt', 'sitemap.xml', 'privacy-policy.html', 'llms.txt', '404.html']) {
  cpSync(resolve(__dirname, f), resolve(outDir, f));
}
cpSync(resolve(__dirname, 'src'), resolve(outDir, 'src'), { recursive: true });

console.log('Build complete → dist/');
