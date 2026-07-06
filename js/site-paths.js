(function () {
  'use strict';

  var SITE_BASE = '/wilna-site';

  function hasBasePrefix(value) {
    return value === SITE_BASE || value.indexOf(SITE_BASE + '/') === 0;
  }

  function shouldPrefix(value) {
    if (!value || typeof value !== 'string') return false;
    if (value[0] !== '/') return false;
    if (value.indexOf('//') === 0) return false;
    if (hasBasePrefix(value)) return false;
    return true;
  }

  function prefix(value) {
    if (value === '/') return SITE_BASE + '/';
    return SITE_BASE + value;
  }

  function normalizeAttr(el, attr) {
    var value = el.getAttribute(attr);
    if (shouldPrefix(value)) {
      el.setAttribute(attr, prefix(value));
    }
  }

  function normalizeSrcset(el) {
    var value = el.getAttribute('srcset');
    if (!value) return;
    var next = value.split(',').map(function (candidate) {
      var parts = candidate.trim().split(/\s+/);
      if (parts[0] && shouldPrefix(parts[0])) {
        parts[0] = prefix(parts[0]);
      }
      return parts.join(' ');
    }).join(', ');
    if (next !== value) el.setAttribute('srcset', next);
  }

  function normalizeElement(el) {
    if (!el || el.nodeType !== 1) return;
    ['href', 'src', 'action', 'poster'].forEach(function (attr) {
      if (el.hasAttribute(attr)) normalizeAttr(el, attr);
    });
    if (el.hasAttribute('srcset')) normalizeSrcset(el);
  }

  function normalizeTree(root) {
    if (!root) return;
    if (root.nodeType === 1) normalizeElement(root);
    var nodes = root.querySelectorAll ? root.querySelectorAll('[href], [src], [action], [poster], [srcset]') : [];
    for (var i = 0; i < nodes.length; i += 1) normalizeElement(nodes[i]);
  }

  // Add a base element for relative URLs such as `Dut.png` or `intro/1.jpg` on nested pages.
  // Root-relative URLs such as `/intro/1.jpg` are handled by normalizeTree.
  if (!document.querySelector('base[href]')) {
    var base = document.createElement('base');
    base.setAttribute('href', SITE_BASE + '/');
    var head = document.head || document.getElementsByTagName('head')[0];
    if (head) head.insertBefore(base, head.firstChild);
  }

  if (document.documentElement) normalizeTree(document.documentElement);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { normalizeTree(document); });
  } else {
    normalizeTree(document);
  }

  if (window.MutationObserver) {
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        for (var i = 0; i < mutation.addedNodes.length; i += 1) {
          normalizeTree(mutation.addedNodes[i]);
        }
        if (mutation.type === 'attributes') normalizeElement(mutation.target);
      });
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['href', 'src', 'action', 'poster', 'srcset']
    });
  }
}());
