// ─────────────────────────────────────────────
// HTML SANITIZER
// DOM-level + String-level + Deep Normalizer
// ─────────────────────────────────────────────

// ── Allowed attributes whitelist ──
export const ALLOWED_ATTRS = new Set([
  'href','src','alt','title','target','rel','id','class','style',
  'width','height','colspan','rowspan','type','value','placeholder',
  'name','controls','autoplay','loop','muted','preload','loading',
  'contenteditable','spellcheck','tabindex','lang','dir',
  'data-src','data-href','data-id','data-type',
  'border','cellpadding','cellspacing','align','valign',
  'action','method','enctype','for','checked','selected','disabled','readonly',
  'poster','srcset','sizes','media','crossorigin',
  'open','reversed','start','cite','datetime','download','hreflang',
  'accesskey','draggable','hidden','translate',
]);

// Pattern for browser-injected data attributes to ALWAYS strip
export const INJECTED_ATTR_RE = /^(bis_size|bis_href_counter|data-form-recovery|data-recovery|data-ms-editor|data-gramm|data-lt-|data-selectioncurrent|data-mce-|data-cke-|_bis_|grammarly|__ga|data-ogsc|data-path-to-node|data-index-in-node)/i;

/**
 * DOM-level sanitizer: walks all elements in a subtree
 * and removes any attributes that are browser/extension-injected.
 */
export function sanitizeDOMAttrs(root) {
  if (!root) return;
  const walker = root.ownerDocument
    ? root.ownerDocument.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
    : document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);

  const process = (el) => {
    const toRemove = [];
    for (let i = 0; i < el.attributes.length; i++) {
      const attr = el.attributes[i];
      const name = attr.name.toLowerCase();
      if (INJECTED_ATTR_RE.test(name)) {
        toRemove.push(attr.name);
        continue;
      }
      if (name.startsWith('data-') && !ALLOWED_ATTRS.has(name)) {
        toRemove.push(attr.name);
      }
    }
    toRemove.forEach(n => el.removeAttribute(n));
  };

  if (root.nodeType === Node.ELEMENT_NODE) process(root);
  let node;
  while ((node = walker.nextNode())) process(node);
}

/**
 * String-level cleaner — strips browser-injected attrs from serialized HTML
 */
export function cleanHTML(html) {
  return html
    .replace(/\s+data-[\w-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/\s+_?bis_[\w-]*\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]*)/gi, '')
    .replace(/\s+style=""/gi, '')
    .replace(/(<\w[^>]*?)(\s{2,})(?=[a-zA-Z/>])/g, (_, tag, sp) => tag + ' ');
}

// ── Deep HTML Normalizer — paste from any source ──

const KEEP_TAGS = new Set([
  'p','h1','h2','h3','h4','h5','h6',
  'a','strong','em','b','i','u','s','del','ins','mark','small','sup','sub',
  'ul','ol','li','dl','dt','dd',
  'table','thead','tbody','tfoot','tr','th','td','caption','colgroup','col',
  'img','figure','figcaption','picture','source',
  'blockquote','pre','code','br','hr',
  'div','span','section','article','header','footer','nav','aside','main',
  'video','audio','iframe',
]);

const TAG_ATTRS = {
  'a':        ['href','title','target','rel'],
  'img':      ['src','alt','title','loading','width','height','srcset','sizes'],
  'source':   ['src','srcset','type','media'],
  'video':    ['src','controls','autoplay','loop','muted','preload','poster','width','height'],
  'audio':    ['src','controls','autoplay','loop','muted','preload'],
  'iframe':   ['src','width','height','title','allowfullscreen','frameborder','allow'],
  'td':       ['colspan','rowspan'],
  'th':       ['colspan','rowspan'],
  'col':      ['span'],
  'colgroup': ['span'],
  'ol':       ['start','reversed','type'],
  'li':       ['value'],
  'blockquote':['cite'],
  'del':      ['datetime'],
  'ins':      ['datetime'],
  'figure':   ['class'],
};

const SAFE_STYLE_PROPS = ['text-align','vertical-align'];

function filterStyle(styleStr) {
  if (!styleStr) return '';
  return (styleStr.split(';')
    .map(s => s.trim())
    .filter(s => {
      const p = s.split(':')[0].trim().toLowerCase();
      return SAFE_STYLE_PROPS.some(safe => p === safe);
    })
    .join(';'));
}

function processCleanNode(node) {
  if (node.nodeType === 3) return;
  if (node.nodeType !== 1) { node.remove(); return; }

  const tag = node.tagName.toLowerCase();
  Array.from(node.childNodes).forEach(processCleanNode);

  if (!KEEP_TAGS.has(tag)) {
    const parent = node.parentNode;
    if (parent) {
      while (node.firstChild) parent.insertBefore(node.firstChild, node);
      node.remove();
    }
    return;
  }

  const allowed = new Set(TAG_ATTRS[tag] || []);
  const toRemove = [];
  for (let i = 0; i < node.attributes.length; i++) {
    const attr = node.attributes[i];
    const aname = attr.name.toLowerCase();
    if (allowed.has(aname)) continue;
    if (aname === 'style') {
      const safe = filterStyle(attr.value);
      if (safe) { node.setAttribute('style', safe); continue; }
    }
    toRemove.push(attr.name);
  }
  toRemove.forEach(n => node.removeAttribute(n));

  if (tag === 'figure') {
    node.setAttribute('class', 'image');
  }

  if ((tag === 'span' || tag === 'div') &&
      node.attributes.length === 0 &&
      !node.textContent.trim() &&
      !node.querySelector('img,br,hr')) {
    node.remove();
  }
}

export function deepCleanHTML(raw) {
  const doc = (new DOMParser()).parseFromString(
    '<!DOCTYPE html><html><body>' + raw + '<\/body><\/html>', 'text/html'
  );
  const body = doc.body;
  Array.from(body.childNodes).forEach(processCleanNode);
  return body.innerHTML
    .replace(/[ \t\r\n]+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/<\s+/g, '<')
    .trim();
}
