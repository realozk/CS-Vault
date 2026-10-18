import { rehypeHeadingIds } from '@astrojs/markdown-remark';
import rehypeRaw from 'rehype-raw';

// Each summary shares its subject page with other summaries. Give every anchor
// its own namespace and keep prose headings below the summary's h2 title.
export default function summaryMarkdown() {
  const assignHeadingIds = rehypeHeadingIds();
  const parseRaw = rehypeRaw();
  return (tree, file) => {
    const filename = String(file.path ?? '').replaceAll('\\', '/');
    const match = filename.match(/\/src\/content\/summaries\/[^/]+\/[^/]+\/(.+)\.md$/);
    if (!match) return;
    tree = parseRaw(tree, file);
    assignHeadingIds(tree, file);
    const prefix = `summary-content-${match[1].replaceAll('/', '-')}--`;
    const elements = [];
    const visit = node => {
      if (node.type === 'element') elements.push(node);
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
    const headings = elements.filter(node => /^h[1-6]$/.test(node.tagName));
    const shallowest = Math.min(3, ...headings.map(node => Number(node.tagName[1])));
    const ids = new Map();
    for (const node of elements) {
      if (typeof node.properties?.id === 'string') {
        const id = node.properties.id;
        ids.set(id, prefix + id);
        node.properties.id = prefix + id;
      }
    }
    for (const node of headings) {
      const original = Number(node.tagName[1]);
      node.properties['data-summary-level'] = String(original);
      node.tagName = `h${Math.min(6, original + 3 - shallowest)}`;
    }
    for (const node of elements) {
      const href = node.properties?.href;
      if (typeof href === 'string' && href.startsWith('#')) {
        let id;
        try { id = decodeURIComponent(href.slice(1)); } catch { continue; }
        if (ids.has(id)) node.properties.href = `#${ids.get(id)}`;
      }
      for (const attribute of ['ariaDescribedBy', 'ariaLabelledBy']) {
        const values = node.properties?.[attribute];
        if (Array.isArray(values)) node.properties[attribute] = values.map(id => ids.get(id) ?? id);
      }
    }
    return tree;
  };
}
