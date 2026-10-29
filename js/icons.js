/* icons.js — 全アイコンのSVG定義(24x24, stroke)。[data-icon="名前"] に自動で描画する */
(function(A){
  const P = {
    'back':'<path d="M15 5l-7 7 7 7"/>',
    'close':'<path d="M6 6l12 12M18 6L6 18"/>',
    'image':'<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.6"/><path d="M3.5 17l5-5 4 4 3-3 5 5"/>',
    'image-plus':'<rect x="3" y="5" width="14" height="14" rx="3"/><circle cx="8" cy="10" r="1.3"/><path d="M3 16l4.5-4 3.5 3 2-1.5 3.5 3"/><path d="M19.5 3.5v5M17 6h5"/>',
    'pen':'<path d="M4 20l1.2-4.6L16.3 4.3a2.1 2.1 0 013 3L8.6 18.8 4 20z"/><path d="M14 6.6l3.4 3.4"/>',
    'eraser':'<path d="M7 21l-4.3-4.3a1 1 0 010-1.4l10-10a1 1 0 011.4 0l5.2 5.2a1 1 0 010 1.4L11 21"/><path d="M22 21H7"/><path d="M5 11l9 9"/>',
    'history':'<path d="M3 12a9 9 0 109-9 9.7 9.7 0 00-6.7 2.8L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l3 2"/>',
    'panel':'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 14h18"/>',
    'sliders':'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    'download':'<path d="M12 4v11M7.5 10.5L12 15l4.5-4.5"/><path d="M5 19h14"/>',
    'replace':'<path d="M4 8h12l-3-3"/><path d="M20 16H8l3 3"/>',
    'spark':'<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    'undo':'<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 010 12h-3"/>',
    'trash':'<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/>',
    'check':'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    'swap':'<path d="M8 7l-5 5 5 5"/><path d="M16 7l5 5-5 5"/>',
    'server':'<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/>',
    'key':'<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
    'lang':'<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>'
  };
  A.icons = {
    svg: n => '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (P[n] || '') + '</svg>',
    apply(root){ (root || document).querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = A.icons.svg(el.dataset.icon); }); }
  };
})(window.AI);
