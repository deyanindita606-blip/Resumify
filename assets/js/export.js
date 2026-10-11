/* Downloads: PDF (print dialog), Word (.doc) and standalone HTML. */
(function () {
  'use strict';

  function fileName(name) {
    const base = String(name || '').trim().replace(/[^\p{L}\p{N}]+/gu, '_').replace(/^_+|_+$/g, '');
    return base || 'resume';
  }

  FC.download = function (kind, S) {
    if (kind === 'pdf') {
      const prev = document.title;
      document.title = (S.d.name || 'Resume') + ' - Resume';
      window.print();
      setTimeout(() => { document.title = prev; }, 600);
      return;
    }
    const word = kind === 'doc';
    /* Word cannot render CSS grid, so sidebar layouts fall back to Classic. */
    const tpl = word && FC.SIDEBAR.includes(S.tpl) ? 'classic' : S.tpl;
    const css = FC.resumeCSS
      .replace(/var\(--a\)/g, S.hc)
      .replace(/var\(--tx\)/g, S.tc)
      .replace(/var\(--b\)/g, FC.config.ruleColour);
    const fonts = word ? '' : '<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;700&family=Source+Serif+4:wght@400;700&display=swap" rel="stylesheet">';
    const html = `<!DOCTYPE html><html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>${FC.esc(S.d.name)}</title>${fonts}<style>@page{size:A4;margin:0}body{margin:0;background:#e9edf0}.paper{margin:0 auto}${css}@media print{body{background:#fff}}</style></head><body>${FC.renderResume(S.d, Object.assign({}, S, { tpl }))}</body></html>`;
    const blob = new Blob([word ? '\ufeff' + html : html], { type: word ? 'application/msword' : 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName(S.d.name) + (word ? '.doc' : '.html');
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
  };
})();
