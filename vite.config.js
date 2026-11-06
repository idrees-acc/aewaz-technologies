import { defineConfig } from 'vite';
import { readFileSync, existsSync, statSync } from 'fs';
import { resolve } from 'path';

function htmlIncludes() {
  return {
    name: 'html-includes',
    transformIndexHtml(html) {
      return html.replace(
        /<!--\s*include:\s*([\w/.-]+)\s*-->/g,
        (_, file) => readFileSync(resolve(__dirname, file), 'utf-8')
      );
    },
  };
}

// Unknown paths get dist/404.html with a 404 status, like GitHub Pages (not the SPA fallback to index.html)
function notFoundPage() {
  return {
    name: 'not-found-page',
    configurePreviewServer(server) {
      const dist = resolve(__dirname, 'dist');
      server.middlewares.use((req, res, next) => {
        const path = decodeURIComponent(req.url.split('?')[0]);
        const file = resolve(dist, '.' + path);
        if (file.startsWith(dist) && (existsSync(resolve(file, 'index.html')) || (existsSync(file) && statSync(file).isFile()) || (!path.endsWith('/') && existsSync(file + '.html')))) return next();
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/html');
        res.end(readFileSync(resolve(dist, '404.html')));
      });
    },
  };
}

export default defineConfig({
  plugins: [htmlIncludes(), notFoundPage()],
});
