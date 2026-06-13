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
writeFileSync(resolve(outDir, 'index.html'), resolved);

for (const f of ['bundle.min.js', 'style.min.css', 'favicon.ico', 'CNAME', 'robots.txt', 'sitemap.xml']) {
  cpSync(resolve(__dirname, f), resolve(outDir, f));
}
cpSync(resolve(__dirname, 'src'), resolve(outDir, 'src'), { recursive: true });

console.log('Build complete → dist/');
