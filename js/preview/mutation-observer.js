// ─────────────────────────────────────────────
// MUTATION OBSERVER — strip injected attrs IN REAL TIME
// ─────────────────────────────────────────────

import { getFd } from '../core/refs.js';
import { INJECTED_ATTR_RE, sanitizeDOMAttrs } from '../core/sanitizer.js';

let _frameObserver = null;

export function attachMutationObserver() {
  const fd = getFd();
  if (!fd || !fd.body) return;
  if (_frameObserver) { _frameObserver.disconnect(); }

  _frameObserver = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      if (mut.type === 'attributes') {
        const name = mut.attributeName ? mut.attributeName.toLowerCase() : '';
        if (INJECTED_ATTR_RE.test(name)) {
          try { mut.target.removeAttribute(mut.attributeName); } catch(e) {}
        }
      } else if (mut.type === 'childList') {
        mut.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            sanitizeDOMAttrs(node);
          }
        });
      }
    }
  });

  _frameObserver.observe(fd.body, {
    attributes: true,
    attributeOldValue: false,
    childList: true,
    subtree: true,
  });
}
