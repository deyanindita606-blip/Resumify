/* Resume renderer: one source of truth for the preview, print, HTML and Word export. */
(function () {
  'use strict';

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const list = t => String(t || '').split(/[,\n]/).map(x => x.trim()).filter(Boolean);
  const sec = (title, body) => body ? `<section><h3>${title}</h3>${body}</section>` : '';

  FC.TEMPLATES = [
    ['classic', 'Classic'],
    ['side', 'Light sidebar'],
    ['dark', 'Colour sidebar'],
    ['right', 'Right sidebar'],
    ['exec', 'Minimal executive'],
    ['banner', 'Banner header'],
    ['bold', 'Bold headings']
  ];
  FC.SIDEBAR = ['side', 'dark', 'right'];

  /* Stylesheet for the resume paper. Injected into the page and embedded in exports. */
  FC.resumeCSS = `
.paper{width:794px;min-height:1123px;background:#fff;color:var(--tx);font:13px/1.5 'Source Sans 3',Arial,sans-serif;padding:48px 52px;box-sizing:border-box;text-align:left}
.paper *{box-sizing:border-box}
.paper h1{font:700 34px/1.15 'Source Serif 4',Georgia,serif;color:var(--a);margin:0}
.paper .t{font-size:16px;opacity:.78;margin:4px 0 8px;font-weight:500}
.paper .ct{font-size:12px;opacity:.85;display:flex;flex-wrap:wrap;gap:4px 16px}
.paper h3{font:700 12px 'Source Sans 3',Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:var(--a);border-bottom:1.5px solid var(--b);padding-bottom:3px;margin:20px 0 9px}
.paper .e{margin-bottom:9px}.paper .e b{font-weight:700}.paper .m{opacity:.78;font-size:12px}
.paper ul{margin:3px 0 0;padding-left:18px}.paper p{margin:0}
.paper .hd{display:flex;gap:22px;align-items:center;border-bottom:3px solid var(--a);padding-bottom:16px}
.paper .ph{width:104px;height:104px;border-radius:50%;object-fit:cover;flex:none;background:#E6EAEE;border:2px solid var(--b)}
.paper.side,.paper.dark,.paper.right{padding:0;display:grid;grid-template-columns:250px 1fr}
.paper.right{grid-template-columns:1fr 250px}.paper.right aside{order:2}
.paper aside{padding:40px 24px;background:#EEF1F3}.paper .mn{padding:40px 34px}
.paper.dark aside{background:var(--a);color:#fff}.paper.dark aside h3{color:#fff;border-color:rgba(255,255,255,.4)}
.paper aside .ct{display:block}.paper aside .ph{display:block;margin:0 auto 22px}
.paper.exec{font-family:'Source Serif 4',Georgia,serif;font-size:12px}.paper.exec .hd{flex-direction:column;text-align:center;border:0}.paper.exec .ct{justify-content:center}
.paper.banner .hd{background:var(--a);margin:-48px -52px 0;padding:36px 52px;border:0}.paper.banner .hd *{color:#fff}
.paper.bold h1{font-size:42px}.paper.bold h3{border:0;border-left:5px solid var(--a);padding:3px 0 3px 10px;background:#EEF1F3}
`;

  function injectCSS() {
    if (document.getElementById('resume-css')) return;
    const s = document.createElement('style');
    s.id = 'resume-css';
    s.textContent = FC.resumeCSS;
    document.head.appendChild(s);
  }

  FC.renderResume = function (d, o) {
    const a = o.hc, tx = o.tc;
    const ph = o.mode === 'photo'
      ? (d.photo ? `<img class="ph" src="${d.photo}" alt="">` : '<div class="ph"></div>')
      : '';
    const contactItems = [d.email, d.phone, d.location, ...list(d.links)].filter(Boolean);
    const contact = contactItems.map(x => `<span>${esc(x)}</span>`).join('');

    const exp = (d.exp || []).filter(e => e.role || e.company).map(e => `
      <div class="e"><b>${esc(e.role)}</b>${e.company ? ', ' + esc(e.company) : ''}
      <div class="m">${esc(e.period)}</div>
      <ul>${String(e.points || '').split('\n').filter(x => x.trim()).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>`).join('');

    const edu = (d.edu || []).filter(e => e.degree || e.school).map(e => `
      <div class="e"><b>${esc(e.degree)}</b>
      <div class="m">${[e.school, e.year, e.score].filter(Boolean).map(esc).join(' | ')}</div></div>`).join('');

    const proj = (d.proj || []).filter(e => e.name).map(e => `
      <div class="e"><b>${esc(e.name)}</b> <span class="m">${esc(e.tech)}</span><p>${esc(e.desc)}</p></div>`).join('');

    const skills = list(d.skills), langs = list(d.langs);
    const skHtml = skills.length ? skills.map(esc).join(', ') : '';
    const lgHtml = langs.length ? langs.map(esc).join(', ') : '';
    const certs = list(d.certs).map(x => `<p>${esc(x)}</p>`).join('');
    const summary = d.summary ? `<p>${esc(d.summary)}</p>` : '';
    const style = `style="--a:${a};--tx:${tx};--b:${FC.config.ruleColour}"`;

    if (FC.SIDEBAR.includes(o.tpl)) {
      return `<div class="paper ${o.tpl}" ${style}><aside>${ph}
        <h3 style="margin-top:0">Contact</h3><div class="ct">${contactItems.map(x => `<span>${esc(x)}</span>`).join('<br>')}</div>
        ${sec('Skills', skills.length ? `<p>${skills.map(esc).join('<br>')}</p>` : '')}
        ${sec('Languages', lgHtml ? `<p>${lgHtml}</p>` : '')}</aside>
        <div class="mn"><h1>${esc(d.name)}</h1><div class="t">${esc(d.title)}</div>
        ${sec('Profile', summary)}${sec('Experience', exp)}${sec('Projects', proj)}${sec('Education', edu)}${sec('Certifications', certs)}</div></div>`;
    }
    return `<div class="paper ${o.tpl}" ${style}><div class="hd">${ph}<div><h1>${esc(d.name)}</h1>
      <div class="t">${esc(d.title)}</div><div class="ct">${contact}</div></div></div>
      ${sec('Professional Summary', summary)}${sec('Experience', exp)}${sec('Projects', proj)}${sec('Education', edu)}
      ${sec('Skills', skHtml ? `<p>${skHtml}</p>` : '')}${sec('Certifications', certs)}${sec('Languages', lgHtml ? `<p>${lgHtml}</p>` : '')}</div>`;
  };

  FC.esc = esc;
  FC.list = list;
  injectCSS();
})();
