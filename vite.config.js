import { defineConfig } from 'vite';
import { readFileSync } from 'fs';
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

export default defineConfig({
  plugins: [htmlIncludes()],
});
