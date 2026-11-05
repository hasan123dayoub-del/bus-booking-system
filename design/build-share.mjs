// Builds single-file copies of the screens (CSS and JS inlined) into design/share/,
// so a page still works when it is sent alone (WhatsApp, email) without the assets folder.
// Run: node build-share.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const css = fs.readFileSync(path.join(dir, 'assets/style.css'), 'utf8');
const js = fs.readFileSync(path.join(dir, 'assets/ui.js'), 'utf8');
fs.mkdirSync(path.join(dir, 'share'), { recursive: true });

for (const page of ['mobile.html', 'web.html']) {
  const html = fs.readFileSync(path.join(dir, page), 'utf8')
    .replace('<link rel="stylesheet" href="assets/style.css">', () => `<style>\n${css}\n</style>`)
    .replace('<script src="assets/ui.js"></script>', () => `<script>\n${js}\n</script>`);
  if (html.includes('assets/')) throw new Error(`${page} still links to assets/`);
  fs.writeFileSync(path.join(dir, 'share', page), html);
  console.log(`share/${page}`);
}
