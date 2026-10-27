// Bonjourly extra pages: review (spaced repetition), stories, verbs, TEF Canada, pronunciation, placement, more.
// Loaded after core.js and before views.js (which owns the router).
'use strict';
const EX = window.BP_EXTRA || {};
const comingSoon = what => `<div class="card empty"><h3 style="margin-bottom:6px">${what} are being written</h3><p>Check back after the next content build.</p></div>`;

// ---------- Generated evaluations ----------
function mcqFrom(q, correct, pool, n = 3, extra = {}) {
  const wrong = sample([...new Set(pool.filter(x => x && x !== correct))], n);
  const options = shuffle([correct, ...wrong]);
  return Object.assign({ t: 'mcq', q, options, a: options.indexOf(correct) }, extra);
}
function learnCheck(c) {
  const ens = c.examples.map(e => e.en);
  const ex = sample(c.examples, 4).map(e => mcqFrom(`What does this mean? *${e.fr}*`, e.en, ens, 3, { why: e.note || '' }));
  const stds = c.quebec.items.map(x => x.std);
  const qc = sample(c.quebec.items, 2).map(x => mcqFrom(`In Canadian speech you hear *${x.qc}*. What is the standard French?`, x.std, stds, 2, { why: x.en }));
  return shuffle([...ex, ...qc]);
}
function vocabTest(c) {
  const ens = c.vocab.map(v => v.en), frs = c.vocab.map(v => v.fr);
  return shuffle(c.vocab).slice(0, 8).map((v, i) => i % 2
    ? mcqFrom(`How do you say “${v.en}” in French?`, v.fr, frs, 3, { why: v.ex || '' })
    : mcqFrom(`What does *${v.fr}* mean?`, v.en, ens, 3, { why: v.ex || '', audio: v.fr }));
}
function listenTest(c) {
  const qs = c.listen.questions.map(q => Object.assign({ t: 'mcq' }, q));
  const lines = sample(c.listen.dialogue.filter(l => l.fr.split(' ').length <= 12), 2).map(l => ({ t: 'dict', fr: l.fr, en: l.en, why: l.en }));
  return [...qs, ...lines];
}

// ---------- Review (spaced repetition) ----------
function viewReview() {
  if (isGuest()) return `<div class="page-head"><div><h1>Review</h1></div></div>${registerPanel('Review needs a free profile', 'Spaced repetition tracks every word over weeks, so it needs your progress saved.')}`;
  const due = srsDue(), total = Object.keys(state.srs).length;
  const boxes = [1, 2, 3, 4, 5].map(b => Object.values(state.srs).filter(s => s.box === b).length);
  later(() => {
    const host = $('#rv-host');
    const start = list => flashcards(host, list, { srs: true, onDone: (k, n) => { markDaily('review'); log(`Reviewed ${n} words, ${k} remembered`, 'refresh'); save(); } });
    if (due.length) start(shuffle(due).slice(0, 30));
    const any = $('#rv-any');
    if (any) any.onclick = () => {
      const all = [];
      RM.forEach(r => WK[r.w] && WK[r.w].vocab.forEach(v => { if (state.srs[vkey(v)]) all.push(Object.assign({ _w: r.w }, v)); }));
      start(sample(all, 20));
    };
  });
  return `<div class="page-head"><div><h1>Review</h1><p>Spaced repetition: words come back just before you'd forget them. Words join the queue when you pass a lesson's vocabulary step.</p></div></div>
  <div class="stack">
    <section class="card"><div class="row" style="gap:18px">
      <div><b style="font-size:26px">${due.length}</b><div class="sub">due today</div></div>
      <div><b style="font-size:26px">${total}</b><div class="sub">words in rotation</div></div>
      <div style="flex:1;min-width:220px"><div class="sub" style="margin-bottom:6px">Memory boxes (1 = new, 5 = long-term)</div>
        <div class="boxes">${boxes.map((n, i) => `<div><span style="height:${total ? Math.max(4, n / total * 60) : 4}px"></span><small>${i + 1}</small><b>${n}</b></div>`).join('')}</div></div>
    </div></section>
    <div id="rv-host">${due.length ? '' : `<div class="card empty"><h3 style="margin-bottom:6px">Nothing due right now</h3><p>${total ? 'Come back tomorrow, or practise anyway.' : 'Pass a vocabulary step (step 3) to start your review queue.'}</p>
      ${total ? `<button class="btn" id="rv-any" style="margin-top:12px">${ic('refresh')} Practise 20 words anyway</button>` : ''}</div>`}</div>
  </div>`;
}

// ---------- Stories ----------
const storyOpen = s => !state.settings.lock || s.week <= currentWeek();
function viewStories() {
  const st = EX.stories || [];
  if (!st.length) return `<div class="page-head"><div><h1>Stories</h1></div></div>${comingSoon('Stories')}`;
  return `<div class="page-head"><div><h1>Stories</h1><p>Graded short stories set in Quebec, the heart of French Canada. Each one unlocks when your lessons reach its grammar.</p></div></div>
  <div class="stack">${PHASES.map(p => {
    const list = st.filter(s => s.level === p.id);
    if (!list.length) return '';
    return `<section><div class="phase-title"><h2>${p.id} · ${p.name}</h2><span class="sub">${list.filter(s => state.stories[s.id]).length}/${list.length} read</span></div>
      <div class="weeks">${list.map(s => {
        const open = storyOpen(s), read = state.stories[s.id];
        return `<a class="wk story ${read ? 'done' : ''} ${open ? '' : 'locked'}" href="#story-${s.id}"><span class="n">${read ? ic('check') : open ? ic('book') : ic('lock')}</span>
          <span style="min-width:0"><b>${esc(s.title)}</b><small>${esc(s.place || '')} · ${esc(s.summary || '')}</small>
          <span class="chip ${open ? 'grey' : 'amber'}" style="margin-top:6px">${open ? `${s.text.join(' ').split(/\s+/).length} words` : `Unlocks at lesson ${s.week}`}</span>${read ? `<span class="chip green" style="margin:6px 0 0 4px">${read}%</span>` : ''}</span></a>`;
      }).join('')}</div></section>`;
  }).join('')}</div>`;
}
function viewStory(id) {
  const s = (EX.stories || []).find(x => x.id === id);
  if (!s) return comingSoon('Stories');
  if (isGuest() && s.week > GUEST_LESSONS) return registerPanel();
  if (!storyOpen(s)) return lockedPanel(`This story unlocks at lesson ${s.week}`, `It uses grammar from lesson ${s.week}. You're on lesson ${currentWeek()}.`, '#stories', 'All stories');
  later(() => {
    $('[data-act="play-story"]').onclick = () => {
      const ps = $$('#story-text p');
      TTS.sequence(s.text.map(t => ({ text: t })), i => ps.forEach((p, k) => p.classList.toggle('playing', k === i)));
    };
    runner($('#st-q'), s.questions.map(q => Object.assign({ t: 'mcq' }, q)), {
      onFinish: pct => {
        recordScore('story', pct);
        if (pct >= 60) { state.stories[s.id] = Math.max(pct, state.stories[s.id] || 0); markDaily('story'); log(`Read “${s.title}”`, 'book'); save(); return 'Story complete.'; }
        return 'Score 60% or more to count the story as read. Reread and try again.';
      },
    });
  });
  return `<div class="crumbs"><a href="#stories">Stories</a>${ic('chev')}<span>${s.level}</span></div>
  <div class="lesson-grid">
    <div class="stack">
      <section class="card"><div class="card-h"><div><h1 style="font-size:24px">${esc(s.title)}</h1><div class="sub">${esc(s.place || '')} · ${s.level} · from lesson ${s.week}</div></div>
        <button class="btn sm" style="margin-left:auto" data-act="play-story">${ic('play')} Listen</button></div>
        <div class="story-text" id="story-text">${s.text.map(p => `<p>${esc(p)} <button class="say" style="width:24px;height:24px" data-say="${esc(p)}" aria-label="Listen to paragraph">${ic('volume')}</button></p>`).join('')}</div></section>
      ${s.quebec_note ? `<div class="tip">${ic('chat')}<span><b>Canadian French note.</b> ${md(s.quebec_note)}</span></div>` : ''}
      <div><h3 style="font-size:16px;margin:4px 0 10px">Comprehension</h3><div id="st-q"></div></div>
    </div>
    <aside class="card side-note"><div class="card-h"><h3>Glossary</h3></div>
      ${s.glossary.map(g => `<div class="sn"><div class="row" style="gap:6px"><b>${esc(g.fr)}</b>${g.qc ? '<span class="chip qc">QC</span>' : ''}<span style="margin-left:auto">${sayBtn(g.fr)}</span></div>${esc(g.en)}</div>`).join('')}</aside>
  </div>`;
}

// ---------- Verbs ----------
const TENSES = [
  ['present', 'Présent', 10], ['passe_compose', 'Passé composé', 34], ['imparfait', 'Imparfait', 41], ['futur', 'Futur simple', 54],
  ['conditionnel', 'Conditionnel', 71], ['plus_que_parfait', 'Plus-que-parfait', 68], ['subjonctif', 'Subjonctif', 85], ['imperatif', 'Impératif', 31],
];
const PRON = ["que je ", "que j'", "que tu ", "qu'il/elle/on ", "que nous ", "que vous ", "qu'ils/elles ", "je ", "j'", "tu ", "il/elle/on ", "nous ", "vous ", "ils/elles ", "il "];
function splitForm(f) { for (const p of PRON) if (f.startsWith(p)) return [p.trim(), f.slice(p.length)]; return ['', f]; }
function genderVariants(a) {
  if (!/\(e\)/.test(a)) return [a];
  return [a, a.replace(/\(e\)s/g, 's').replace(/\(e\)/g, ''), a.replace(/\(e\)s/g, 'es').replace(/\(e\)/g, 'e')];
}
function verbItems(verbs, n, allTenses = false) {
  const cw = currentWeek(), items = [];
  verbs.forEach(v => TENSES.forEach(([k, name, wk]) => {
    if (!allTenses && state.settings.lock && wk > cw) return;
    (v.t[k] || []).forEach((form, i) => {
      if (k === 'imperatif') { const who = ['tu', 'nous', 'vous'][i]; items.push({ t: 'fill', q: `___ ! (${v.inf} · impératif, ${who})`, a: [form], why: `${v.inf}: ${v.en}`, _w: v.week }); return; }
      const [p, rest] = splitForm(form);
      items.push({ t: 'fill', q: p ? (p.endsWith("'") ? `${p}___` : `${p} ___`) + ` (${v.inf} · ${name.toLowerCase()})` : `___ (${v.inf} · ${name.toLowerCase()})`, a: genderVariants(rest), why: `${v.inf}: ${v.en}`, _w: v.week });
    });
  }));
  return sample(items, n);
}
const verbsNotYet = () => `<div class="card empty">Conjugation drills open at lesson 10, when the present tense is taught. Until then, open any verb to study and drill its full table.</div>`;
let verbQ = '';
function viewVerbs() {
  const vs = EX.verbs || [];
  if (!vs.length) return `<div class="page-head"><div><h1>Verbs</h1></div></div>${comingSoon('Verb tables')}`;
  const draw = () => {
    const q = loose(verbQ);
    $('#vb-list').innerHTML = vs.filter(v => !q || loose(v.inf + ' ' + v.en).includes(q)).map(v =>
      `<a class="wk" href="#verb-${encodeURIComponent(v.inf).replace(/[^A-Za-z0-9_-]/g, '_')}" data-inf="${esc(v.inf)}"><span class="n" style="font-size:11px">${v.group}<sup>e</sup></span>
        <span style="min-width:0"><b>${esc(v.inf)}</b><small>${esc(v.en)} · ${v.aux}${v.qc ? ' · Canadian' : ''}</small></span></a>`).join('') || '<div class="empty">No verbs match.</div>';
  };
  later(() => {
    draw();
    $('#vb-q').oninput = e => { verbQ = e.target.value; draw(); };
    $('#vb-drill').onclick = () => {
      const host = $('#vb-host'); host.hidden = false;
      const items = verbItems(vs.filter(v => !state.settings.lock || v.week <= currentWeek()), 12);
      if (!items.length) host.innerHTML = verbsNotYet();
      else runner(host, items, { onFinish: pct => { recordScore('verbs', pct); markDaily('practice'); save(); return ''; } });
      host.scrollIntoView({ behavior: 'smooth' });
    };
  });
  return `<div class="page-head"><div><h1>Verbs</h1><p>${vs.length} essential verbs in every tense, with the forms you'll hear in Canada.</p></div>
    <button class="btn" id="vb-drill" style="margin-left:auto">${ic('target')} Conjugation drill</button></div>
    <div id="vb-host" hidden style="margin-bottom:18px"></div>
    <div class="card" style="margin-bottom:16px"><input class="input" id="vb-q" type="search" placeholder="Search: aller, to take…" value="${esc(verbQ)}" style="max-width:320px" aria-label="Search verbs"></div>
    <div class="weeks" id="vb-list"></div>
    <p class="sub" style="margin-top:12px">The drill only uses tenses you've reached in the roadmap while section locks are on.</p>`;
}
function viewVerb(slug) {
  const v = (EX.verbs || []).find(x => encodeURIComponent(x.inf).replace(/[^A-Za-z0-9_-]/g, '_') === slug);
  if (!v) return comingSoon('Verb tables');
  later(() => { $('#vb-one').onclick = () => runner($('#vb-host'), verbItems([v], 10, true), { onFinish: pct => { recordScore('verbs', pct); save(); return ''; } }); });
  return `<div class="crumbs"><a href="#verbs">Verbs</a>${ic('chev')}<span>${esc(v.inf)}</span></div>
  <section class="card" style="margin-bottom:18px"><div class="lesson-head"><div style="flex:1"><h1>${esc(v.inf)} ${sayBtn(v.inf)}</h1>
    <p class="goal-line">${esc(v.en)} · group ${v.group} · auxiliary <b>${esc(v.aux)}</b> · past participle <b>${esc(v.pp)}</b>${v.ppr ? ` · present participle <b>${esc(v.ppr)}</b>` : ''}</p>
    ${v.spoken_qc ? `<div class="tip" style="margin-top:10px">${ic('chat')}<span>${md(v.spoken_qc)}</span></div>` : ''}</div>
    <button class="btn" id="vb-one">${ic('target')} Drill ${esc(v.inf)}</button></div></section>
  <div id="vb-host" style="margin-bottom:18px"></div>
  <div class="tense-grid">${TENSES.filter(([k]) => (v.t[k] || []).length).map(([k, name, wk]) => `<section class="card"><div class="card-h"><h3>${name}</h3><span class="sub" style="margin-left:auto">lesson ${wk}</span></div>
    ${v.t[k].map(f => `<div class="form-row"><span>${esc(f)}</span>${sayBtn(f.replace(/\(e\)s?/g, ''))}</div>`).join('')}</section>`).join('')}</div>
  ${(v.examples || []).length ? `<section class="card" style="margin-top:18px"><div class="card-h"><h3>Examples</h3></div><div class="ex-list">${v.examples.map(e => `<div class="ex"><div><div class="fr">${esc(e.fr)}</div><div class="en">${esc(e.en)}</div></div><div class="acts">${sayBtn(e.fr, true)}</div></div>`).join('')}</div></section>` : ''}`;
}

// ---------- TEF Canada ----------
function viewExam(code, setIdx) {
  const ex = EX.exam;
  if (!ex) return `<div class="page-head"><div><h1>TEF Canada</h1></div></div>${comingSoon('TEF Canada practice sets')}`;
  const sec = ex.sections.find(s => s.code === code);
  const tabs = `<div class="seg" style="margin-bottom:16px"><a class="segl ${!sec ? 'on' : ''}" href="#exam">Overview</a>${ex.sections.map(s => `<a class="segl ${sec && sec.code === s.code ? 'on' : ''}" href="#exam-${s.code}">${s.code} · ${esc(s.en)}</a>`).join('')}</div>`;
  const head = `<div class="page-head"><div><h1>TEF Canada</h1><p>Practice for the test used for Canadian immigration (Express Entry) and citizenship, anywhere in Canada. Recommended from B1 (lesson 85, month 4).</p></div></div>`;
  if (isGuest()) return head + registerPanel('TEF Canada prep needs a free profile', 'Register to unlock all practice sets and keep your scores.');
  if (!sec) {
    return head + tabs + `<div class="stack"><section class="card learn-sec">${ex.intro.map(p => `<p>${md(p)}</p>`).join('')}<p class="sub">Format checked: ${esc(ex.format_checked || '')}</p></section>
      ${ex.nclc ? `<section class="card"><div class="card-h"><h3>Scores and NCLC levels</h3></div><div class="table-wrap"><table class="t"><thead><tr>${ex.nclc.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${ex.nclc.rows.map(r => `<tr>${r.map(x => `<td>${esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>` : ''}
      <div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${ex.sections.map((s, i) => `<a class="tile ${['blue', 'violet', 'green', 'red'][i % 4]}" href="#exam-${s.code}">${ic(['headphones', 'book', 'pen', 'mic'][i % 4])}${esc(s.name)}<small>${esc(s.en)} · ${s.sets.length} practice sets</small></a>`).join('')}</div></div>`;
  }
  const set = setIdx !== undefined ? sec.sets[setIdx] : null;
  if (!set) {
    return head + tabs + `<div class="lesson-grid"><div class="stack">
      <section class="card learn-sec"><h3>${esc(sec.name)} (${esc(sec.en)})</h3><p>${md(sec.format)}</p></section>
      <section class="card"><div class="card-h"><h3>Practice sets</h3></div><div class="weeks">${sec.sets.map((st, i) => {
        const best = Math.max(-1, ...state.scores.filter(s => s.kind === `tef-${sec.code}-${i}`).map(s => s.pct));
        return `<a class="wk ${best >= 70 ? 'done' : ''}" href="#exam-${sec.code}-${i + 1}"><span class="n">${best >= 70 ? ic('check') : i + 1}</span><span><b>${esc(st.title)}</b><small>${esc(st.level || '')}${best >= 0 ? ` · best ${best}%` : ''}</small></span></a>`;
      }).join('')}</div></section></div>
      <aside class="stack"><section class="card side-note"><div class="card-h"><h3>Strategy</h3></div>${sec.tips.map(t => `<div class="sn">${md(t)}</div>`).join('')}</section>
      ${(sec.phrases || []).length ? `<section class="card side-note"><div class="card-h"><h3>Useful phrases</h3></div>${sec.phrases.map(p => `<div class="sn row" style="gap:6px"><span style="flex:1">${md(typeof p === 'string' ? p : `${p.fr} · ${p.en || ''}`)}</span>${sayBtn(typeof p === 'string' ? p : p.fr)}</div>`).join('')}</section>` : ''}</aside></div>`;
  }
  const back = `<div class="crumbs"><a href="#exam">TEF Canada</a>${ic('chev')}<a href="#exam-${sec.code}">${esc(sec.name)}</a>${ic('chev')}<span>${esc(set.title)}</span></div>`;
  if ((set.items || []).length) {
    const items = set.items.flatMap(it => (it.questions || []).map(q => Object.assign({ t: 'mcq' }, q, sec.code === 'CO' ? { audio: it.script } : { passage: it.script })));
    later(() => runner($('#ex-host'), items, { nextHref: `#exam-${sec.code}`, nextLabel: 'Back to sets', onFinish: pct => { recordScore(`tef-${sec.code}-${setIdx}`, pct); markDaily('practice'); save(); return sec.code === 'CO' ? 'Open the set again to read the scripts you missed.' : ''; } }));
    return back + `<h1 style="font-size:22px;margin:6px 0 14px">${esc(set.title)}</h1>${sec.code === 'CO' ? '<p class="sub" style="margin-bottom:12px">Each recording plays automatically. For exam realism, try to answer after one listen before replaying.</p>' : ''}<div id="ex-host"></div>`;
  }
  const oral = sec.code === 'EO';
  later(() => {
    mountRecorders(page, { max: 600 });
    $$('[data-wcheck]').forEach(btn => btn.onclick = () => {
      const k = +btn.dataset.wcheck, t = set.tasks[k], ta = btn.closest('.ex-task').querySelector('textarea');
      const min = +((String(t.words || '').match(/\d+/) || [0])[0]);
      $(`#tef-fb-${k}`).innerHTML = writingFeedback(checkWriting(ta.value, { min }));
    });
    $$('.ex-task textarea').forEach(ta => { const out = ta.parentElement.querySelector('.wc'); ta.oninput = () => { out.textContent = `${wordCount(ta.value)} words`; state.writes[ta.id] = ta.value; save(); }; ta.oninput(); });
  });
  return back + `<h1 style="font-size:22px;margin:6px 0 14px">${esc(set.title)}</h1><div class="stack">${(set.tasks || []).map((t, i) => `<section class="card ex-task">
    <div class="card-h"><h3>Task ${i + 1}</h3><span class="chip grey" style="margin-left:auto">${esc(t.time || '')}</span>${t.words ? `<span class="chip grey">${esc(t.words)}</span>` : ''}</div>
    <p style="margin-bottom:12px">${md(t.prompt)}</p>
    ${oral ? `<p class="sub">Answer out loud and record yourself (up to 10 minutes). Then compare your recording with the model.</p>${recorderUI(t.model, 'Record your answer')}` : `<textarea class="input" id="tef-${sec.code}-${setIdx}-${i}" rows="8" placeholder="Rédigez votre réponse…">${esc(state.writes[`tef-${sec.code}-${setIdx}-${i}`] || '')}</textarea><div class="row" style="margin-top:6px"><span class="sub wc"></span><button class="btn sm" type="button" data-wcheck="${i}" style="margin-left:auto">${ic('check')} Check my writing</button></div><div class="wfb-host" id="tef-fb-${i}"></div>`}
    <div class="row" style="margin-top:10px"><button class="btn sm soft" data-act="reveal" data-target="tm-${i}">${ic('eye')} Model answer</button><button class="btn sm ghost" data-act="reveal" data-target="tc-${i}">${ic('check')} Grader checklist</button></div>
    <div class="prompt" style="border:0;padding:0"><div class="model" id="tm-${i}" hidden><span style="flex:1;white-space:pre-line">${esc(t.model)}</span>${sayBtn(t.model)}</div></div>
    <ul class="checklist" id="tc-${i}" hidden>${(t.checklist || []).map(c => `<li>${md(c)}</li>`).join('')}</ul></section>`).join('')}</div>`;
}

// ---------- Pronunciation ----------
let soundsTab = 'sounds';
function viewSounds() {
  const p = EX.pronunciation;
  if (!p) return `<div class="page-head"><div><h1>Pronunciation</h1></div></div>${comingSoon('Pronunciation guides')}`;
  later(() => {
    $$('[data-st]').forEach(b => b.onclick = () => { soundsTab = b.dataset.st; render(); });
    if (soundsTab === 'ear') runner($('#ear-host'), sample(p.minimal_pairs, 10).map(m => {
      const said = Math.random() < 0.5 ? m.a : m.b;
      return { t: 'mcq', q: 'Which word do you hear?', audio: said, options: [m.a, m.b], a: said === m.a ? 0 : 1, why: m.focus };
    }), { onFinish: pct => { recordScore('ear', pct); markDaily('practice'); save(); return ''; } });
  });
  const tabs = [['sounds', 'French sounds'], ['quebec', 'Canadian accent'], ['twisters', 'Tongue twisters'], ['ear', 'Ear training']];
  let body = '';
  if (soundsTab === 'sounds') body = `<div class="vgrid">${p.sounds.map(s => `<div class="vcard"><div class="top"><b>${esc(s.label)}</b>${s.ipa ? `<span class="chip grey">/${esc(s.ipa)}/</span>` : ''}</div>
    <div class="en">${md(s.how)}</div><div class="row" style="gap:6px;margin-top:6px">${(s.words || []).map(w => `<button class="chip" data-say="${esc(w)}">${ic('volume')} ${esc(w)}</button>`).join('')}</div>
    ${(s.pairs || []).length ? `<div class="row" style="gap:6px;margin-top:4px">${s.pairs.map(([a, b]) => `<span class="pair"><button class="chip grey" data-say="${esc(a)}">${esc(a)}</button>vs<button class="chip grey" data-say="${esc(b)}">${esc(b)}</button></span>`).join('')}</div>` : ''}
    ${s.sentence ? `<div class="ex">${esc(s.sentence)} <button class="say" style="width:22px;height:22px" data-say="${esc(s.sentence)}" aria-label="Listen">${ic('volume')}</button></div>` : ''}</div>`).join('')}</div>`;
  else if (soundsTab === 'quebec') body = `<div class="stack">${p.quebec.map(q => `<section class="card"><div class="card-h"><h3>${esc(q.label)}</h3></div><p>${md(q.how)}</p>
    ${q.std ? `<div class="table-wrap" style="margin-top:10px"><table class="t"><thead><tr><th>Standard</th><th>Canadian</th></tr></thead><tbody><tr><td>${esc(q.std)}</td><td class="qc-cell">${esc(q.qc)}</td></tr></tbody></table></div>` : ''}
    ${(q.examples || []).length ? `<div class="ex-list" style="margin-top:6px">${q.examples.map(e => `<div class="ex"><div class="fr">${esc(e)}</div><div class="acts">${sayBtn(e, true)}</div></div>`).join('')}</div>` : ''}</section>`).join('')}
    <div class="tip">${ic('volume')}<span>${voiceTip()} Listen to real Canadian French on Radio-Canada, Ohdio podcasts, TFO and Télé-Québec.</span></div></div>`;
  else if (soundsTab === 'twisters') body = `<section class="card"><div class="ex-list">${p.twisters.map(t => `<div class="ex"><div style="min-width:0"><div class="fr">${esc(t.fr)}</div><div class="en">${esc(t.en)}</div><div class="note">${esc(t.focus || '')}</div></div><div class="acts">${sayBtn(t.fr, true)}</div></div>`).join('')}</div></section>`;
  else body = `<p class="sub" style="margin-bottom:12px">Ten pairs of words that differ by one sound. Listen and pick the one you hear.</p><div id="ear-host"></div>`;
  return `<div class="page-head"><div><h1>Pronunciation</h1><p>The sounds of French, the features of the Canadian (Quebec) accent you'll hear across Canada, and ear training.</p></div></div>
    <div class="seg" style="margin-bottom:16px">${tabs.map(([k, l]) => `<button data-st="${k}" class="${soundsTab === k ? 'on' : ''}">${l}</button>`).join('')}</div>${body}`;
}

// ---------- Placement test ----------
const STAGE = 12;
function viewPlacement() {
  const stages = [];
  for (let a = 1; a <= 168; a += STAGE) {
    const ws = weeksWith(a, Math.min(168, a + STAGE - 1)).filter(c => !isCheckpoint(RM[c.w - 1]));
    if (ws.length) stages.push({ from: a, to: Math.min(168, a + STAGE - 1), pool: ws.flatMap(c => tag(c.quiz, c.w)) });
  }
  later(() => {
    const host = $('#pl-host');
    let si = 0, qi = 0, right = 0, qs = [];
    const startStage = () => { qs = sample(stages[si].pool, 3).map(q => Object.assign({ t: 'mcq' }, q)); qi = 0; right = 0; ask(); };
    const finish = placedAt => {
      const upto = placedAt - 1;
      host.innerHTML = `<div class="card result"><div class="big">Lesson ${placedAt}</div><div class="sub">is where you should start${upto ? ` · lessons 1–${upto} can be unlocked` : ''}</div>
        <p style="margin-top:10px">${upto ? `You answered most questions correctly up to lesson ${upto}. Unlocking skips ahead without marking those lessons as done, so you can still go back to them.${isGuest() ? ' Lessons after 7 need a free profile.' : ''}` : 'Start from the beginning with lesson 1.'}</p>
        <div class="runner-actions" style="justify-content:center">${upto ? `<button class="btn" id="pl-apply">Unlock lessons 1–${upto}</button>` : ''}<a class="btn ghost" href="#w${Math.max(1, placedAt)}">Open lesson ${placedAt}</a></div></div>`;
      state.placedAt = Date.now(); save();
      const ap = $('#pl-apply');
      if (ap) ap.onclick = () => { state.placed = Math.max(state.placed, upto); log(`Placement: unlocked lessons 1–${upto}`, 'target'); save(); toast(`Lessons 1–${upto} unlocked.`); location.hash = `#w${placedAt}`; };
    };
    function ask() {
      const st = stages[si], it = qs[qi];
      host.innerHTML = `<div class="runner card"><div class="runner-top"><div class="bar"><span style="width:${Math.round(si / stages.length * 100)}%"></span></div><span>Lessons ${st.from}–${st.to}</span></div>
        <div class="q-kind">Question ${qi + 1} of 3 for this level</div><div class="q-text">${md(it.q)}</div>
        <div class="opts">${it.options.map((o, k) => `<button class="opt" data-pl="${k}"><span class="k">${k + 1}</span><span>${md(o)}</span></button>`).join('')}</div>
        <div class="runner-actions"><button class="btn ghost sm" data-pl="-1">I don't know</button></div></div>`;
    }
    host.onclick = e => {
      const b = e.target.closest('[data-pl]'); if (!b || !qs.length) return;
      if (+b.dataset.pl === qs[qi].a) right++;
      qi++;
      if (qi < 3) return ask();
      if (right >= 2 && si + 1 < stages.length) { si++; return startStage(); }
      finish(right >= 2 ? Math.min(168, stages[si].to + 1) : stages[si].from);
    };
    $('#pl-start').onclick = () => { if (!stages.length) return; $('#pl-intro').hidden = true; startStage(); };
  });
  return `<div class="page-head"><div><h1>Placement test</h1><p>Find your level and skip what you already know.</p></div></div>
    <section class="card" id="pl-intro"><p>You'll get 3 questions per block of ${STAGE} lessons, starting with the basics. Get 2 of 3 right and you move up a block. The test stops at the first block you don't pass, so it takes 3 to 10 minutes.</p>
      <p class="sub" style="margin-top:8px">${stages.length} blocks available. Choose “I don't know” rather than guessing; a guess places you too high.</p>
      <button class="btn" id="pl-start" style="margin-top:14px">${ic('play')} Start the test</button></section>
    <div id="pl-host"></div>`;
}

// ---------- More (mobile menu) ----------
function viewMore() {
  return `<div class="page-head"><div><h1>All sections</h1></div></div>
    <div class="stack">${NAV_GROUPS.map(([g, items]) => `<section><div class="sub" style="font-weight:700;text-transform:uppercase;letter-spacing:.06em;font-size:11.5px;margin-bottom:8px">${g}</div>
      <div class="resources">${items.map(([id, label, icon]) => `<a class="res" href="#${id}"><span class="ri" style="background:var(--primary-soft);color:var(--primary)">${ic(icon)}</span><span><b>${label}</b></span>${ic('chev')}</a>`).join('')}</div></section>`).join('')}</div>`;
}

// ---------- Shared ----------
function lockedPanel(title, text, href, label) {
  return `<section class="card empty locked-panel"><span class="lock-ico">${ic('lock')}</span><h3>${esc(title)}</h3><p>${esc(text)}</p>
    <div class="row" style="justify-content:center;margin-top:14px">${href ? `<a class="btn" href="${href}">${esc(label)}</a>` : ''}<a class="btn ghost" href="#placement">${ic('target')} Placement test</a></div></section>`;
}
function certificate(p) {
  const w = state.weeks[p.to] || {};
  const date = new Date(w.at || Date.now()).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  return `<div class="cert"><div class="cert-in"><small>Bonjourly · Certificat de réussite</small><h3>${p.id} · ${p.name}</h3>
    <p>Ce certificat atteste que</p><b class="cert-name">${esc(state.name)}</b><p>a terminé les leçons ${p.from} à ${p.to} et réussi l'examen d'étape.</p>
    <div class="cert-foot"><span>${esc(date)}</span><span class="seal">${ic('trophy')}</span></div></div></div>`;
}

// ---------- Registration (free profile) ----------
const monthRange = p => monthOf(p.from) === monthOf(p.to) ? `${monthOf(p.from)}` : `${monthOf(p.from)}–${monthOf(p.to)}`;
function registerPanel(title, text) {
  return `<section class="card empty locked-panel"><span class="lock-ico">${ic('users')}</span>
    <h3>${esc(title || 'Register free to keep going')}</h3>
    <p>${esc(text || `The first week of the plan (lessons 1–${GUEST_LESSONS}) is free to try. Create a free profile to unlock all 168 lessons and save your progress.`)}</p>
    <div class="row" style="justify-content:center;margin-top:14px"><a class="btn" href="#register">${ic('users')} Register free</a><a class="btn ghost" href="#w1">Try lesson 1</a></div></section>`;
}
function viewRegister() {
  if (!isGuest()) {
    return `<div class="page-head"><div><h1>You're registered</h1><p>Bonjour, ${esc(state.name)}! All 168 lessons are unlocked and your progress is saved in this browser.</p></div></div>
      <a class="btn" href="#w${currentWeek()}">${ic('play')} Continue with lesson ${currentWeek()}</a>`;
  }
  later(() => {
    $('#reg-form').onsubmit = e => {
      e.preventDefault();
      const name = $('#reg-name').value.trim(), email = $('#reg-email').value.trim();
      if (!name) { $('#reg-name').focus(); return; }
      const same = profiles().find(p => p.name.trim().toLowerCase() === name.toLowerCase());
      if (same) {
        $('#reg-dup').hidden = false;
        $('#reg-dup').innerHTML = `<b>${esc(same.name)}</b> already learns on this device. <button type="button" class="btn sm" id="reg-resume">Continue as ${esc(same.name)}</button> or pick a different name.`;
        $('#reg-resume').onclick = () => { signIn(same.id); toast(`Welcome back, ${same.name}!`); location.hash = '#home'; render(); };
        return;
      }
      createProfile(name, email);
      log('Created your Bonjourly profile', 'users');
      save();
      toast(`Bienvenue, ${name}! Everything is unlocked.`);
      location.hash = `#w${currentWeek()}`;
    };
  });
  return `<div class="register">
    <section class="card reg-card">
      <img src="logo.svg" alt="" width="56" height="56" onerror="this.remove()">
      <h1>Create your free profile</h1>
      <p class="sub">Bonjour Today. Fluent Tomorrow.</p>
      <form id="reg-form" class="stack" style="gap:14px;margin-top:18px">
        <label class="field">Your first name<input class="input" id="reg-name" autocomplete="given-name" required maxlength="40" placeholder="e.g. Alex"></label>
        <label class="field">Email <span class="sub" style="font-weight:500">optional, for account sync when it launches</span><input class="input" id="reg-email" type="email" autocomplete="email" maxlength="120" placeholder="you@example.com"></label>
        <div class="tip" id="reg-dup" hidden></div>
        <button class="btn" type="submit">${ic('check')} Register and unlock all lessons</button>
        ${profiles().length ? `<a href="#welcome" class="sub" style="text-align:center">Already registered on this device? Pick your name</a>` : ''}
      </form>
      <p class="sub" style="margin-top:14px">Your profile and progress are stored on this device only. Nothing is sent anywhere yet. Use <b>Progress → Save backup file</b> to move to another device.</p>
    </section>
    <section class="card">
      <div class="card-h"><h3>What you get</h3></div>
      <div class="stack" style="gap:10px">
        <div class="req met">${ic('check')} All 168 lessons: A1 to B2 in about 6 months at one lesson a day</div>
        <div class="req met">${ic('check')} Progress saved: steps, scores, streaks, badges and certificates</div>
        <div class="req met">${ic('check')} Spaced-repetition review of every word you learn</div>
        <div class="req met">${ic('check')} 40 graded stories and full TEF Canada practice</div>
        <div class="req">${ic('x')} <span>Without a profile: lessons 1–${GUEST_LESSONS} only, and progress is lost when you close the browser</span></div>
      </div>
    </section></div>`;
}

// ---------- Who's learning? (learners on this device) ----------
function viewWelcome() {
  const list = profiles().sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  const cur = state.profile && state.profile.id;
  let armed = null;
  later(() => {
    $$('[data-learner]').forEach(b => b.onclick = () => {
      const pr = profiles().find(x => x.id === b.dataset.learner);
      if (pr && pr.cloud && !(Account.user && Account.user.id === pr.id)) { location.hash = '#signin'; return; }
      if (signIn(b.dataset.learner)) { toast(`Welcome back, ${state.name}!`); location.hash = '#home'; render(); }
      else toast('That learner\'s progress could not be found on this device.');
    });
    $$('[data-remove]').forEach(b => b.onclick = () => {
      if (armed !== b.dataset.remove) { armed = b.dataset.remove; b.textContent = 'Click again to delete this learner\'s progress'; return; }
      deleteProfile(b.dataset.remove); toast('Learner removed.'); render();
    });
    $$('[data-act-new]').forEach(b => b.onclick = () => { signOut(); location.hash = b.dataset.actNew; render(); });
  });
  const card = p => {
    const initials = p.name.trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const pct = Math.round((p.done || 0) / 168 * 100);
    return `<div class="learner ${p.id === cur ? 'cur' : ''}">
      <span class="avatar">${esc(initials)}</span>
      <div class="who-l"><b>${esc(p.name)}</b><small>Lesson ${p.lesson || 1} · ${p.done || 0}/168 done · ${p.lastSeen ? `last practice ${ago(p.lastSeen).toLowerCase()}` : 'new'}</small>
        <span class="bar"><span style="width:${pct}%"></span></span></div>
      <button class="btn" data-learner="${esc(p.id)}">${p.id === cur ? 'Continue' : p.cloud && !(Account.user && Account.user.id === p.id) ? 'Sign in' : 'This is me'} ${ic('arrow')}</button>
      <button class="link-btn" data-remove="${esc(p.id)}">Remove</button></div>`;
  };
  return `<div class="welcome">
    <img src="logo.svg" alt="" width="64" height="64" onerror="this.remove()">
    <h1>${list.length ? 'Who\'s learning?' : 'Bienvenue sur Bonjourly'}</h1>
    <p class="sub">${list.length ? 'Pick your name to see your progress and continue where you left off.' : 'Create a free profile to save your progress, or try the free week first.'}</p>
    <div class="learners">${list.map(card).join('')}</div>
    <div class="row" style="justify-content:center;margin-top:18px">
      ${Account.enabled ? `<a class="btn" href="#signin">${ic('lock')} Sign in</a>` : ''}
      <button class="btn ghost" data-act-new="#register">${ic('users')} New learner</button>
      <button class="btn ghost" data-act-new="#home">Try the free week as a guest</button>
    </div>
    <p class="sub" style="margin-top:18px;max-width:520px">Names and progress are saved in this browser on this device. On a new device, use Progress → Save backup file here and Load backup file there.</p>
  </div>`;
}

// ---------- Voice advice ----------
// Which device is this, and how does its owner get a Canadian French voice?
function voiceTip() {
  if (!TTS.ok) return 'This browser has no speech engine. Use Chrome, Edge or Safari for audio.';
  const v = TTS.voice(), ua = navigator.userAgent;
  if (v && TTS.isCanadian()) return `${ic('check')} Using <b>${esc(v.name)}</b>, a Canadian French voice.`;
  const how = /iPhone|iPad|iPod|Macintosh/.test(ua) && 'ontouchend' in document
    ? 'iPhone/iPad: Settings → Accessibility → Spoken Content → Voices → French → <b>French (Canada)</b>, download Amélie, then reopen Bonjourly.'
    : /Android/.test(ua)
      ? 'Android: Settings → System → Languages → Text-to-speech → Google speech engine → Install voice data → <b>French (Canada)</b>, then reopen Bonjourly.'
      : /Edg\//.test(ua)
        ? 'Edge on Windows: Settings → Time &amp; language → Speech → Add voices → <b>French (Canada)</b>, then reopen Bonjourly.'
        : /Mac/.test(ua)
          ? 'Mac: System Settings → Accessibility → Spoken Content → System voice → Manage voices → <b>French (Canada)</b>.'
          : 'Windows: open Bonjourly in <b>Microsoft Edge</b>, which includes natural Canadian voices (Sylvie, Antoine), or add French (Canada) under Settings → Time &amp; language → Speech.';
  return `${v ? `Using <b>${esc(v.name)}</b> (${esc(v.lang)}), which is not a Canadian voice.` : 'No French voice is installed yet.'} For a Canadian accent: ${how}`;
}
