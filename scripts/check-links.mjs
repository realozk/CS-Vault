import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'parse5';

const root = path.resolve(process.argv[2] ?? 'dist');
const base = '/CS-Vault/';
const origin = 'https://realozk.github.io';
const documents = new Map();
async function visit(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('._')) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await visit(file);
    else if (entry.name.endsWith('.html')) {
      const ids = new Set(), links = [];
      function walk(node) {
        const attrs = Object.fromEntries((node.attrs ?? []).map(a => [a.name, a.value]));
        if (attrs.id) ids.add(attrs.id);
        for (const attr of ['href', 'src', 'poster']) if (attrs[attr]) links.push(attrs[attr]);
        for (const child of node.childNodes ?? []) walk(child);
      }
      walk(parse(await readFile(file, 'utf8')));
      documents.set(file, { ids, links });
    }
  }
}
await visit(root);
const errors = [];
for (const [file, doc] of documents) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  const page = new URL(base + relative.replace(/index\.html$/, ''), origin);
  for (const link of doc.links) {
    const url = new URL(link, page);
    if (url.origin !== origin) continue;
    if (!url.pathname.startsWith(base)) {
      errors.push(`${relative}: missing deployment base in ${link}`);
      continue;
    }
    let target = path.resolve(root, decodeURIComponent(url.pathname.slice(base.length)));
    if (target !== root && !target.startsWith(root + path.sep)) {
      errors.push(`${relative}: invalid path ${link}`); continue;
    }
    try {
      let info;
      try { info = await stat(target); }
      catch { target = path.join(target, 'index.html'); info = await stat(target); }
      if (info.isDirectory()) target = path.join(target, 'index.html');
      await stat(target);
      if (url.hash && documents.has(target) && !documents.get(target).ids.has(decodeURIComponent(url.hash.slice(1)))) {
        errors.push(`${relative}: missing anchor ${link}`);
      }
    } catch { errors.push(`${relative}: missing file ${link}`); }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log(`Local links, anchors and assets checked across ${documents.size} pages.`);
