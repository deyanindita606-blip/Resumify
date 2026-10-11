/* Resumify application: state, wizard form, live preview, privacy gate. */
(function () {
  'use strict';

  const { config: C, esc, TEMPLATES, renderResume } = FC;
  const $ = (s, r = document) => r.querySelector(s);
  const clone = o => JSON.parse(JSON.stringify(o));

  const STEPS = ['Personal', 'Experience', 'Education', 'Skills', 'Style and download'];
  const PRESETS = [
    ['#2E4A62', 'Slate blue'], ['#2B2F36', 'Charcoal'], ['#6B2D3A', 'Burgundy'],
    ['#2F5D55', 'Pine'], ['#6F4E37', 'Umber']
  ];
  const blank = () => ({
    name: '', title: '', email: '', phone: '', location: '', links: '', photo: '', summary: '',
    exp: [{}], edu: [{}], proj: [{}], skills: '', langs: '', certs: ''
  });
  const fresh = () => ({ v: 1, mode: 'nophoto', tpl: 'classic', hc: C.defaultHeading, tc: C.defaultText, step: 0, d: clone(FC.sample) });

  /* ---------- State ---------- */
  let S = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(C.storageKey) || 'null');
    if (saved && saved.v === 1 && saved.d) {
      S = Object.assign(fresh(), saved);
      S.d = Object.assign(blank(), saved.d);
      ['exp', 'edu', 'proj'].forEach(k => { if (!Array.isArray(S.d[k])) S.d[k] = [{}]; });
      S.step = Math.min(Math.max(+S.step || 0, 0), STEPS.length - 1);
    }
  } catch (e) { /* storage unavailable or corrupt: start fresh */ }

  let saveTimer;
  const save = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(C.storageKey, JSON.stringify(S)); } catch (e) { /* ignore quota or privacy mode */ }
    }, 200);
  };

  /* ---------- Preview ---------- */
  function scaleTo(box, inner, setHeight) {
    if (!box || !box.clientWidth) return;
    const k = Math.min(1, box.clientWidth / 794);
    inner.style.transform = `scale(${k})`;
    if (setHeight) box.style.height = Math.round(inner.offsetHeight * k) + 'px';
  }
  const fitAll = () => { scaleTo($('#fit'), $('#pv'), true); scaleTo($('#sheet'), $('#sheetIn'), false); };

  let raf;
  function renderPreview() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      $('#pv').innerHTML = renderResume(S.d, S);
      const t = TEMPLATES.find(x => x[0] === S.tpl);
      $('#tplName').textContent = t ? t[1] : '';
      fitAll();
    });
    save();
  }

  /* ---------- Form builders ---------- */
  const field = (label, key, type = 'text') =>
    `<label class="fld"><span>${label}</span><input type="${type}" data-k="${key}" value="${esc(S.d[key])}"></label>`;
  const area = (label, key) =>
    `<label class="fld"><span>${label}</span><textarea data-k="${key}">${esc(S.d[key])}</textarea></label>`;

  function group(name, title, fields, noun, hint) {
    const items = S.d[name].map((it, i) => `
      <div class="item">
        <div class="item-head"><b>${noun} ${i + 1}</b><button class="rm" type="button" data-rm="${name}:${i}">Remove</button></div>
        ${fields.map(([k, l, big]) => big
          ? `<label class="fld"><span>${l}</span><textarea data-l="${name}" data-i="${i}" data-k="${k}">${esc(it[k])}</textarea></label>`
          : `<label class="fld"><span>${l}</span><input data-l="${name}" data-i="${i}" data-k="${k}" value="${esc(it[k])}"></label>`).join('')}
      </div>`).join('');
    return `<h2 class="${hint === 'sub' ? 'sub' : ''}">${title}</h2>${hint && hint !== 'sub' ? `<p class="hint">${hint}</p>` : ''}${items}
      <button class="btn sm" type="button" data-add="${name}">Add ${noun.toLowerCase()}</button>`;
  }

  function renderForm() {
    const s = S.step;
    let h = '';
    if (s === 0) {
      h = `<h2>Personal details</h2><p class="hint">This is the header of your resume.</p>
        ${S.mode === 'photo' ? `<label class="fld"><span>Photo</span><input type="file" accept="image/*" id="pic"></label>
          ${S.d.photo ? '<div class="photo-row"><span class="small">Photo added.</span><button class="linkbtn" type="button" data-act="rmpic">Remove photo</button></div>' : ''}` : ''}
        ${field('Full name', 'name')}${field('Professional title', 'title')}
        <div class="row2">${field('Email', 'email', 'email')}${field('Phone', 'phone', 'tel')}</div>
        ${field('City, country', 'location')}
        ${field('Links (LinkedIn, GitHub, portfolio), separated by commas', 'links')}
        ${area('Professional summary', 'summary')}`;
    }
    if (s === 1) {
      h = group('exp', 'Work experience and internships',
        [['role', 'Role'], ['company', 'Company'], ['period', 'Duration'], ['points', 'Achievements (one per line)', 1]],
        'Experience', 'Start with your most recent role. Lead each line with what you achieved.');
    }
    if (s === 2) {
      h = group('edu', 'Education',
        [['degree', 'Degree'], ['school', 'University or college'], ['year', 'Year'], ['score', 'CGPA or percentage']], 'Education') +
        group('proj', 'Projects',
        [['name', 'Title'], ['tech', 'Tech used'], ['desc', 'Description', 1]], 'Project', 'sub');
    }
    if (s === 3) {
      h = `<h2>Skills and extras</h2><p class="hint">Use the words that appear in the job description where they are true for you.</p>
        ${area('Skills (comma separated)', 'skills')}${area('Languages known', 'langs')}${area('Certifications (one per line)', 'certs')}`;
    }
    if (s === 4) {
      h = `<h2>Template</h2>
        <div class="chips">${TEMPLATES.map(([k, n]) => `<button class="chip ${S.tpl === k ? 'on' : ''}" type="button" data-tpl="${k}" aria-pressed="${S.tpl === k}">${n}</button>`).join('')}</div>
        <h2 class="sub">Colours</h2>
        <div class="row2"><label class="fld"><span>Heading colour</span><input type="color" data-c="hc" value="${S.hc}"></label>
        <label class="fld"><span>Text colour</span><input type="color" data-c="tc" value="${S.tc}"></label></div>
        <div class="swatches">${PRESETS.map(([c, n]) => `<button class="sw ${S.hc.toLowerCase() === c.toLowerCase() ? 'on' : ''}" type="button" data-p="${c}" style="background:${c}" aria-label="Heading colour: ${n}"></button>`).join('')}</div>
        <h2 class="sub">Download</h2>
        <div class="dl"><button class="btn primary" type="button" data-dl="pdf">PDF</button>
        <button class="btn" type="button" data-dl="doc">Word</button><button class="btn" type="button" data-dl="html">HTML</button></div>
        <p class="small">For PDF, choose <b>Save as PDF</b> in the print dialog, with paper size A4 and margins set to none. Word opens as an editable .doc in a single-column layout.</p>
        <p class="small"><button class="linkbtn" type="button" data-act="clear">Clear my data</button> removes everything saved in this browser.</p>`;
    }
    $('#fm').innerHTML = h;
    $('#stepper').innerHTML = STEPS.map((x, i) => `<li><button type="button" data-step="${i}" class="${i === s ? 'on' : i < s ? 'done' : ''}" ${i === s ? 'aria-current="step"' : ''}><span class="n">${i < s ? '&#10003;' : i + 1}</span><span class="lb">${x}</span></button></li>`).join('');
    $('#bk').style.visibility = s ? 'visible' : 'hidden';
    $('#nx').style.display = s === STEPS.length - 1 ? 'none' : 'inline-flex';
  }

  function goStep(n) {
    S.step = Math.min(Math.max(n, 0), STEPS.length - 1);
    renderForm();
    save();
    const p = $('.panel');
    if (p && p.getBoundingClientRect().top < 0) p.scrollIntoView({ block: 'start' });
  }

  /* ---------- Views ---------- */
  function show(name) {
    ['home', 'format', 'app'].forEach(k => { $('#v-' + k).hidden = k !== name; });
    if (name === 'app') { renderForm(); renderPreview(); }
    window.scrollTo(0, 0);
    fitAll();
  }

  /* ---------- Events ---------- */
  document.addEventListener('click', e => {
    const t = e.target.closest('button,a');
    if (!t) return;
    const d = t.dataset;

    if (d.go) show(d.go);
    if (d.mode) { S.mode = d.mode; S.step = 0; show('app'); }
    if (t.id === 'home') show('home');
    if (t.id === 'nx') goStep(S.step + 1);
    if (t.id === 'bk') goStep(S.step - 1);
    if (d.step !== undefined) goStep(+d.step);

    if (d.add) { S.d[d.add].push({}); renderForm(); renderPreview(); }
    if (d.rm) {
      const [n, i] = d.rm.split(':');
      S.d[n].splice(+i, 1);
      if (!S.d[n].length) S.d[n].push({});
      renderForm(); renderPreview();
    }
    if (d.tpl) { S.tpl = d.tpl; renderForm(); renderPreview(); }
    if (d.p) { S.hc = d.p; renderForm(); renderPreview(); }
    if (d.dl) FC.download(d.dl, S);
    if (d.act === 'rmpic') { S.d.photo = ''; renderForm(); renderPreview(); }
    if (d.act === 'clear' && confirm('Clear everything you entered in this browser? This cannot be undone.')) {
      S = fresh(); S.d = blank(); S.step = 0;
      try { localStorage.removeItem(C.storageKey); } catch (x) { /* ignore */ }
      renderForm(); renderPreview();
    }

    /* Privacy gate */
    if (t.id === 'acc') {
      try { localStorage.setItem(C.consentKey, '1'); } catch (x) { /* ignore */ }
      document.body.classList.remove('lock');
      gate.hidden = true;
      fitAll();
    }
    if (t.id === 'deny') {
      gate.innerHTML = `<div class="dlg" role="alertdialog" aria-modal="true" aria-labelledby="dt"><h2 id="dt">Access denied</h2>
        <p style="margin:12px 0 18px">You chose not to accept the Privacy Policy, so ${C.brand} cannot be opened. You can review the policy again if you change your mind.</p>
        <div class="btns"><button class="btn primary" id="again" type="button">Review policy</button></div></div>`;
      $('#again').focus();
    }
    if (t.id === 'again') openPolicy('consent');
    if (t.id === 'cls') gate.hidden = true;
    if (t.id === 'pp') { e.preventDefault(); openPolicy('view'); }
  });

  document.addEventListener('input', e => {
    const t = e.target, d = t.dataset;
    if (d.c) { S[d.c] = t.value; renderPreview(); return; }
    if (!d.k) return;
    if (d.l) S.d[d.l][+d.i][d.k] = t.value; else S.d[d.k] = t.value;
    renderPreview();
  });

  document.addEventListener('change', e => {
    const f = e.target.id === 'pic' && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'), z = Math.min(im.width, im.height);
        c.width = c.height = 320;
        c.getContext('2d').drawImage(im, (im.width - z) / 2, (im.height - z) / 2, z, z, 0, 0, 320, 320);
        S.d.photo = c.toDataURL('image/jpeg', 0.85);
        renderForm(); renderPreview();
      };
      im.src = r.result;
    };
    r.readAsDataURL(f);
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !gate.hidden && !document.body.classList.contains('lock')) gate.hidden = true;
  });
  addEventListener('resize', fitAll);

  /* ---------- Privacy policy ---------- */
  const gate = $('#gate');
  function openPolicy(mode) {
    gate.hidden = false;
    gate.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="gt"><h2 id="gt">Privacy Policy</h2>
      <p class="sm">Effective ${C.policyEffective}</p><div class="pt">${FC.policyHTML()}</div>
      <div class="btns">${mode === 'consent'
        ? '<button class="btn" id="deny" type="button">Deny</button><button class="btn primary" id="acc" type="button">Accept and continue</button>'
        : '<button class="btn primary" id="cls" type="button">Close</button>'}</div></div>`;
    const first = $(mode === 'consent' ? '#acc' : '#cls');
    if (first) first.focus();
  }

  /* ---------- Init ---------- */
  $('#yr').textContent = new Date().getFullYear();
  $('#owner').textContent = C.owner;
  $('#mail').textContent = C.email;
  $('#mail').href = 'mailto:' + C.email;
  $('#sheetIn').innerHTML = renderResume(FC.sample, { tpl: 'classic', hc: C.defaultHeading, tc: C.defaultText, mode: 'nophoto' });

  let consented = false;
  try { consented = localStorage.getItem(C.consentKey) === '1'; } catch (x) { /* ignore */ }
  if (consented) { document.body.classList.remove('lock'); fitAll(); } else openPolicy('consent');
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitAll);
})();
