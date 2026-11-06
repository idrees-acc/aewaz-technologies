import { readFileSync, writeFileSync, cpSync, mkdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { services } from './services.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, 'dist');
const read = (f) => readFileSync(resolve(__dirname, f), 'utf-8');
const SITE = 'https://aewaz.com';

rmSync(outDir, { recursive: true, force: true });
mkdirSync(resolve(outDir, 'services'), { recursive: true });

// Inline the stylesheet so first paint doesn't wait on a separate CSS request
// tokens.css and base.css are @imported for dev; the build inlines them in place
const css = read('site.css').replace(/@import url\("\.\/(tokens|base)\.css"\);/g, (_, f) => read(`${f}.css`));
const finish = (page) => page.replace('<link href="/site.css" rel="stylesheet" />', () => `<style>${css}</style>`);
const includes = (page) => page.replace(/<!--\s*include:\s*([\w/.-]+)\s*-->/g, (_, file) => read(file));

writeFileSync(resolve(outDir, 'index.html'), finish(includes(read('index.html'))));

// Service pages: /services/<slug>/ from services.js
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// On sub-pages, section links point back to the homepage (except ones that exist on the page)
const toHome = (h) => h.replace(/href="#(?!main|home|contact)/g, 'href="/#');
const header = toHome(read('sections/header.html'));
const footer = toHome(read('sections/footer.html'));
const scripts = read('sections/scripts.html');

function head(s, url) {
  const ld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Service', '@id': `${url}#service`, name: s.h1, serviceType: s.nav, description: s.description, url, provider: { '@type': 'ProfessionalService', '@id': `${SITE}/#organization`, name: 'Aewaz Technologies', url: `${SITE}/` }, areaServed: [{ '@type': 'City', name: 'Mumbai' }, { '@type': 'Country', name: 'India' }] },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: s.nav, item: url },
      ] },
    ],
  };
  const t = esc(s.title), d = esc(s.description);
  return read('sections/head.html')
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${t}</title>`)
    .replace(/(name="description"\s+content=")[^"]*/, `$1${d}`)
    .replace(/(rel="canonical" href=")[^"]*/, `$1${url}`)
    .replace(/((?:og|twitter):url" content=")[^"]*/g, `$1${url}`)
    .replace(/((?:og|twitter):title"\s+content=")[^"]*/g, `$1${t}`)
    .replace(/((?:og|twitter):description"\s+content=")[^"]*/g, `$1${d}`)
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, `<script type="application/ld+json">${JSON.stringify(ld)}</script>`);
}

function servicePage(s) {
  const url = `${SITE}/services/${s.slug}`;
  const facts = `<dl class="facts">${s.facts.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>`;
  const body = `
    <main id="main">
      <section class="svcp-hero" id="home" aria-labelledby="svc-title">
        <div class="container svcp-grid">
          <div class="svcp-intro">
            <nav class="crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><a href="/#services">Services</a><span aria-hidden="true">/</span><span aria-current="page">${esc(s.nav)}</span></nav>
            <h1 id="svc-title">${esc(s.h1)}</h1>
            <p class="lead">${esc(s.lede)}</p>
          </div>
          <aside class="svcp-card" aria-label="Quick facts">
            ${facts}
            <a class="btn btn-accent" href="#contact">Get a quote</a>
            <a class="btn btn-ghost" href="https://wa.me/917977578589" target="_blank" rel="noopener">WhatsApp us<span class="sr-only"> (opens in a new tab)</span></a>
          </aside>
        </div>
      </section>
      <section class="svcp-sec" aria-labelledby="inc"><div class="container"><h2 id="inc">What&rsquo;s included</h2><ul class="incl body">${s.includes.map(([h, p]) => `<li><b>${esc(h)}</b>: ${esc(p)}.</li>`).join('')}</ul></div></section>
      ${s.work ? `<section class="svcp-sec" aria-labelledby="work"><div class="container"><h2 id="work">Recent work</h2><ul class="wlist body">${s.work.map(([n, d, u]) => `<li><a href="${u}"${u.startsWith(SITE) ? '' : ' target="_blank" rel="noopener"'}>${esc(n)}${u.startsWith(SITE) ? '' : '<span class="sr-only"> (opens in a new tab)</span>'}</a><span>${esc(d)}</span></li>`).join('')}</ul></div></section>` : ''}
      <section class="svcp-sec" aria-labelledby="how"><div class="container"><h2 id="how">How it works</h2><ol class="plain-steps body">
        <li><span><b>Call.</b> A 30-minute call or WhatsApp chat about what you need.</span></li>
        <li><span><b>Quote.</b> A written scope, timeline and price before work starts.</span></li>
        <li><span><b>Build.</b> You see working software early and give feedback as we go.</span></li>
        <li><span><b>Launch.</b> We put it live and stay on for fixes and updates.</span></li>
      </ol></div></section>
      <section class="svcp-sec" aria-labelledby="faq"><div class="container"><h2 id="faq">Questions</h2><dl class="chat body">${s.faqs.map(([q, a]) => `<div><dt><span>You</span>${esc(q)}</dt><dd><img src="/src/images/logo/aewaz.svg" alt="" width="28" height="28" loading="lazy" /><p><span>Aewaz</span>${esc(a)}</p></dd></div>`).join('')}</dl></div></section>
      <section class="svcp-sec svcp-contact" id="contact" aria-labelledby="talk">
        <div class="container">
          <h2 id="talk">Talk to us</h2>
          <div class="body">
            <p class="lead">Tell us what you need. We reply with questions, a rough plan and a quote.</p>
            <p class="contact-lines"><a href="tel:+917977578589">+91 79775 78589</a><a href="mailto:aewaztechnologies@gmail.com">aewaztechnologies@gmail.com</a><a href="https://wa.me/917977578589" target="_blank" rel="noopener">WhatsApp<span class="sr-only"> (opens in a new tab)</span></a></p>
            <p class="muted">502, Corporate Arena, Sitaram Patkar Rd, Goregaon West, Mumbai 400104</p>
          </div>
        </div>
      </section>
    </main>`;
  return finish(`<!DOCTYPE html>\n<html lang="en">\n${head(s, url)}\n  <body>\n${header}${body}\n${footer}${scripts}  </body>\n</html>\n`);
}

// Served at /privacy-policy: GitHub Pages (and the preview server) resolve extensionless paths to .html
writeFileSync(resolve(outDir, 'privacy-policy.html'), toHome(includes(read('privacy-policy.html'))).replace(/href="#contact"/g, 'href="/#contact"'));

for (const s of services) {
  // served at /services/<slug> (no trailing slash): extensionless paths resolve to .html
  writeFileSync(resolve(outDir, 'services', `${s.slug}.html`), servicePage(s));
}

// Sitemap, always dated to this build
// lastmod = the last commit that touched a page's sources, so it only moves when the page does
const changed = (...files) => { try { return execSync(`git log -1 --format=%cs -- ${files.join(' ')}`, { cwd: __dirname }).toString().trim(); } catch { return ''; } };
const today = new Date().toISOString().slice(0, 10);
const shared = ['sections', 'site.css', 'tokens.css', 'base.css'];
const pages = [
  ['/', changed('index.html', ...shared)],
  ['/privacy-policy', changed('privacy-policy.html', 'sections/footer.html')],
  ...services.map((s) => [`/services/${s.slug}`, changed('services.js', 'build.js', ...shared)]),
];
writeFileSync(
  resolve(outDir, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map(([u, d]) => `  <url><loc>${SITE}${u}</loc><lastmod>${d || today}</lastmod></url>`).join('\n')}\n</urlset>\n`
);

for (const f of ['site.css', 'tokens.css', 'base.css', 'favicon.ico', 'CNAME', 'robots.txt', 'llms.txt', '404.html']) {
  cpSync(resolve(__dirname, f), resolve(outDir, f));
}
cpSync(resolve(__dirname, 'src'), resolve(outDir, 'src'), { recursive: true });

console.log(`Build complete → dist/ (${services.length} service pages)`);
