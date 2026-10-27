// Bonjourly practice hub: exercise generators built from lesson content, a personal mistake bank,
// daily and weak-spot mixes, level packs, and per-skill stats. The pool only covers lessons the
// learner has reached, so it grows with every lesson.
'use strict';

const SKILLS = [['vocabulary', 'Vocabulary', 'cards'], ['grammar', 'Grammar', 'file'], ['listening', 'Listening', 'headphones'], ['speaking', 'Speaking', 'mic']];
const firstSense = en => String(en).split(/[,;(]/)[0].trim();
const stripArticle = s => s.replace(/^(le|la|les|un|une|des)\s+/i, '').replace(/^l['’]/i, '').trim();
const frVariants = fr => fr.split('/').map(s => s.replace(/\(.*?\)/g, '').trim()).filter(Boolean);

// ---------- Generators: each returns up to n exercises from a set of lessons ----------
const vocabOf = pool => pool.flatMap(c => tag(c.vocab, c.w));
const examplesOf = pool => pool.flatMap(c => tag(c.examples, c.w)).filter(e => !/ \/ /.test(e.fr));
const GEN = {
  typeWord(pool, n) {
    return sample(vocabOf(pool), n).map(v => {
      const forms = frVariants(v.fr);
      return { t: 'translate', label: 'Type the word', skill: 'vocabulary', en: v.en, a: [...new Set(forms.concat(forms.map(stripArticle)))], why: v.ex || '', _w: v._w };
    });
  },
  gender(pool, n) {
    const nouns = vocabOf(pool).filter(v => v.g && /^(le|la|l['’])\s?/i.test(v.fr) && !/\//.test(v.fr));
    return sample(nouns, n).map(v => ({
      t: 'mcq', label: 'Le or la?', skill: 'vocabulary', q: `Is *${stripArticle(v.fr)}* masculine or feminine?`,
      options: ['masculine (le, un)', 'feminine (la, une)'], a: v.g === 'm' ? 0 : 1, why: `*${v.fr}*: ${v.en}${v.ex ? ` · ${v.ex}` : ''}`, _w: v._w,
    }));
  },
  match(pool, n) {
    const out = [], words = shuffle(vocabOf(pool));
    for (let i = 0; out.length < n && i + 5 <= words.length; i += 5) {
      const seen = new Set(), pairs = [];
      words.slice(i, i + 9).forEach(v => { const en = firstSense(v.en); if (pairs.length < 5 && !seen.has(en)) { seen.add(en); pairs.push({ fr: v.fr, en }); } });
      if (pairs.length === 5) out.push({ t: 'match', skill: 'vocabulary', pairs, _w: words[i]._w });
    }
    return out;
  },
  unscramble(pool, n) {
    return sample(examplesOf(pool).filter(e => { const k = e.fr.trim().split(/\s+/).length; return k >= 3 && k <= 9; }), n)
      .map(e => ({ t: 'build', label: 'Unscramble', skill: 'grammar', en: e.en, a: e.fr.trim().replace(/\s+/g, ' '), why: e.note || '', _w: e._w }));
  },
  gap(pool, n) {
    const out = [];
    for (const e of shuffle(examplesOf(pool))) {
      if (out.length >= n) break;
      const toks = e.fr.trim().split(/\s+/);
      const cand = toks.map((t, i) => ({ i, core: (t.match(/^[«"(]*([\p{L}-]+)/u) || [])[1] })).filter(x => x.core && x.core.length >= 3 && x.i > 0 && !/['’]/.test(toks[x.i]));
      if (!cand.length) continue;
      const pick = cand[Math.floor(Math.random() * cand.length)];
      toks[pick.i] = toks[pick.i].replace(pick.core, '___');
      out.push({ t: 'fill', label: 'Fill the gap', skill: 'grammar', q: toks.join(' '), a: [pick.core], en: e.en, why: e.fr, _w: e._w });
    }
    return out;
  },
  heard(pool, n) {
    const ex = examplesOf(pool), ens = ex.map(e => e.en);
    return sample(ex, n).map(e => mcqFrom('What did you hear?', e.en, ens, 3, { label: 'What did you hear?', skill: 'listening', audio: e.fr, why: `*${e.fr}*`, _w: e._w }));
  },
  dictation(pool, n) {
    return sample(examplesOf(pool).filter(e => e.fr.split(' ').length <= 10), n).map(e => ({ t: 'dict', skill: 'listening', fr: e.fr, en: e.en, why: e.en, _w: e._w }));
  },
  speak(pool, n) { return sample(examplesOf(pool), n).map(e => ({ t: 'shadow', skill: 'speaking', fr: e.fr, en: e.en, _w: e._w })); },
  drills(pool, n) { return sample(pool.flatMap(c => tag(c.drills, c.w)), n).map(d => Object.assign({ skill: 'grammar' }, d)); },
  quiz(pool, n) { return sample(pool.flatMap(c => tag(c.quiz, c.w)), n).map(q => Object.assign({ t: 'mcq', skill: 'grammar' }, q)); },
  canadian(pool, n) {
    const items = pool.flatMap(c => tag((c.quebec || {}).items || [], c.w));
    return sample(items, n).map(x => {
      const options = shuffle([x.qc, ...sample(items.filter(y => y.qc !== x.qc), 3).map(y => y.qc)]);
      return { t: 'mcq', label: 'Canadian ear', skill: 'listening', q: `How might you hear this in casual Canadian French? *${x.std}*`, options, a: options.indexOf(x.qc), why: `${x.en}${x.note ? ` · ${x.note}` : ''}`, _w: x._w };
    });
  },
};

// A balanced session: vocabulary, grammar, listening and speaking, newest lessons weighted up.
function mix(pool, len) {
  const recent = pool.slice(-5), biased = pool.concat(recent, recent);
  const plan = [['typeWord', .12], ['gender', .06], ['match', .07], ['drills', .15], ['gap', .12], ['unscramble', .08], ['quiz', .08], ['heard', .14], ['dictation', .08], ['speak', .1]];
  let items = [];
  plan.forEach(([g, share]) => { items = items.concat(GEN[g](biased, Math.max(1, Math.round(len * share)))); });
  const seen = new Set();
  return shuffle(items.filter(it => { const k = itemKey(it); if (seen.has(k)) return false; seen.add(k); return true; })).slice(0, len);
}

// ---------- Mistake bank and stats ----------
const itemKey = it => [it.t, it.q, it.en, it.fr, it.audio, it.pairs && it.pairs.map(p => p.fr).join()].filter(Boolean).join('|').slice(0, 240);
const cleanItem = it => { const c = Object.assign({}, it); delete c._words; delete c._f; delete c._e; return c; };
const skillOf = it => it.skill || (it.t === 'dict' || it.audio ? 'listening' : it.t === 'shadow' ? 'speaking' : it.t === 'match' ? 'vocabulary' : 'grammar');
function recordAnswer(it, ok) {
  const sk = skillOf(it), s = state.skill[sk] || (state.skill[sk] = { n: 0, ok: 0 });
  s.n++; if (ok) s.ok++;
  if (it._w) { const l = state.lessonStats[it._w] || (state.lessonStats[it._w] = { n: 0, ok: 0 }); l.n++; if (ok) l.ok++; }
  if (it.t !== 'shadow') {
    const k = itemKey(it), m = state.mistakes[k];
    if (!ok) state.mistakes[k] = { it: cleanItem(it), right: 0, at: Date.now() };
    else if (m && ++m.right >= 2) delete state.mistakes[k]; // fixed: answered right twice
    const keys = Object.keys(state.mistakes);
    if (keys.length > 400) keys.sort((a, b) => state.mistakes[a].at - state.mistakes[b].at).slice(0, keys.length - 400).forEach(x => delete state.mistakes[x]);
  }
  save();
}
const mistakeCount = () => Object.keys(state.mistakes || {}).length;
function weakLessons(pool) {
  const rated = pool.map(c => ({ c, s: state.lessonStats[c.w] })).filter(x => x.s && x.s.n >= 4).sort((a, b) => a.s.ok / a.s.n - b.s.ok / b.s.n);
  return rated.slice(0, 3).filter(x => x.s.ok / x.s.n < .85).map(x => x.c);
}

// ---------- Level packs ----------
const PACK_SIZE = 50;
const packOpen = p => isDone(p.to) && !(isGuest() && p.to > GUEST_LESSONS);

// ---------- Modes ----------
const PMODES = [
  { id: 'flashcards', name: 'Flashcards', icon: 'cards', tone: 'red', skill: 'vocabulary', desc: 'Flip through your words', cards: true },
  { id: 'match', name: 'Match the pairs', icon: 'cards', tone: 'red', skill: 'vocabulary', desc: 'French to English, against your memory', gen: 'match', per: 5 },
  { id: 'typeword', name: 'Type the word', icon: 'pen', tone: 'red', skill: 'vocabulary', desc: 'See the English, type the French', gen: 'typeWord' },
  { id: 'gender', name: 'Le or la?', icon: 'zap', tone: 'red', skill: 'vocabulary', desc: 'Masculine or feminine nouns', gen: 'gender' },
  { id: 'mixed', name: 'Mixed drills', icon: 'target', tone: 'violet', skill: 'grammar', desc: 'Lesson drills of every type', gen: 'drills' },
  { id: 'gap', name: 'Fill the gap', icon: 'pen', tone: 'violet', skill: 'grammar', desc: 'A word is missing from a real sentence', gen: 'gap' },
  { id: 'unscramble', name: 'Unscramble', icon: 'refresh', tone: 'violet', skill: 'grammar', desc: 'Put the words back in order', gen: 'unscramble' },
  { id: 'quiz', name: 'Grammar quiz', icon: 'file', tone: 'violet', skill: 'grammar', desc: 'Quiz questions from your lessons', gen: 'quiz' },
  { id: 'verbs', name: 'Conjugation', icon: 'zap', tone: 'violet', skill: 'grammar', desc: 'Verbs in the tenses you know', verbs: true },
  { id: 'heard', name: 'What did you hear?', icon: 'headphones', tone: 'blue', skill: 'listening', desc: 'Listen, then choose the meaning', gen: 'heard' },
  { id: 'listen', name: 'Dictation', icon: 'headphones', tone: 'blue', skill: 'listening', desc: 'Listen, then type it', gen: 'dictation' },
  { id: 'quebec', name: 'Canadian ear', icon: 'chat', tone: 'blue', skill: 'listening', desc: 'Standard vs casual Canadian French', gen: 'canadian' },
  { id: 'speak', name: 'Speaking practice', icon: 'mic', tone: 'green', skill: 'speaking', desc: 'Hear it, say it, record it', gen: 'speak' },
];

function practicePool() {
  const cw = currentWeek(), scope = state.settings.pScope || 'mine';
  if (scope === 'week') return weeksWith(cw, cw);
  if (scope === 'all') return weeksWith(1, isGuest() ? GUEST_LESSONS : 168);
  return weeksWith(1, cw);
}
// Rough count of distinct exercises the pool can produce (each example feeds five exercise types).
const poolSize = pool => pool.reduce((n, c) => n + c.examples.length * 5 + c.drills.length + c.quiz.length + c.vocab.length * 3 + (c.quebec.items || []).length + c.listen.dialogue.length, 0);

function startSession(host, items, { name, icon = 'target', test = false, onDone } = {}) {
  if (!items.length) { host.innerHTML = '<div class="card empty">Nothing to practise here yet. Try a wider lesson range.</div>'; return; }
  runner(host, items, {
    test, onAnswer: recordAnswer,
    onFinish: pct => {
      recordScore(name, pct); markDaily('practice'); log(`Practice: ${name}, ${pct}%`, icon); save();
      return onDone ? onDone(pct) : '';
    },
  });
  host.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function viewPractice(mode) {
  const pool = practicePool(), cw = currentWeek(), len = state.settings.pLen || 10, test = state.settings.pMode === 'test';
  const mistakes = mistakeCount(), weak = weakLessons(pool);
  later(() => {
    $$('[data-pset]').forEach(b => b.onclick = () => { state.settings[b.dataset.pset] = isNaN(+b.dataset.v) ? b.dataset.v : +b.dataset.v; save(); render(); });
    const host = $('#p-host');
    const run = id => {
      if (id === 'daily') return startSession(host, mix(pool, len), { name: 'Daily mix', icon: 'zap', test });
      if (id === 'weak') return startSession(host, weak.length ? mix(weak, len) : mix(pool, len), { name: 'Weak spots', icon: 'target', test });
      if (id === 'mistakes') {
        const items = shuffle(Object.values(state.mistakes).map(m => m.it)).slice(0, Math.max(len, 10));
        return startSession(host, items, { name: 'Fix my mistakes', icon: 'refresh', onDone: () => `${mistakeCount()} mistake${mistakeCount() === 1 ? '' : 's'} left in your bank. Each one leaves after two right answers.` });
      }
      const pk = PHASES.find(p => `pack${p.id}` === id);
      if (pk) {
        if (!packOpen(pk)) { host.innerHTML = lockedPanel(`${pk.id} pack is locked`, `Pass the lesson ${pk.to} milestone test to unlock it.`, `#w${pk.to}`, `Go to lesson ${pk.to}`); return; }
        return startSession(host, mix(weeksWith(pk.from, pk.to), PACK_SIZE), {
          name: `${pk.id} pack`, icon: 'trophy', test: true,
          onDone: pct => { state.packs[pk.id] = Math.max(pct, state.packs[pk.id] || 0); save(); return pct >= 80 ? `${pk.id} pack mastered!` : 'Score 80% to master this pack.'; },
        });
      }
      const m = PMODES.find(x => x.id === id);
      if (!m) return;
      if (m.cards) { flashcards(host, sample(allVocab(pool), 20), { onDone: (k, n) => { markDaily('practice'); log(`Flashcards: ${k} of ${n} known`, 'cards'); save(); } }); host.scrollIntoView({ behavior: 'smooth' }); return; }
      if (m.verbs) {
        const vs = (EX.verbs || []).filter(v => !state.settings.lock || v.week <= cw), items = verbItems(vs, len);
        if (!items.length) { host.innerHTML = verbsNotYet(); return; }
        return startSession(host, items.map(x => Object.assign({ skill: 'grammar' }, x)), { name: m.name, icon: m.icon, test });
      }
      startSession(host, GEN[m.gen](pool, m.per ? Math.max(2, Math.round(len / 2)) : len), { name: m.name, icon: m.icon, test });
    };
    $$('[data-run]').forEach(b => b.onclick = () => run(b.dataset.run));
    if (mode) run({ cards: 'flashcards' }[mode] || mode);
  });

  const seg = (key, opts, cur) => `<div class="seg">${opts.map(([v, l]) => `<button data-pset="${key}" data-v="${v}" class="${String(cur) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const tile = m => `<button class="tile ${m.tone}" data-run="${m.id}">${ic(m.icon)}${m.name}<small>${m.desc}</small></button>`;
  const acc = s => (state.skill[s] && state.skill[s].n ? Math.round(state.skill[s].ok / state.skill[s].n * 100) : null);
  return `<div class="page-head"><div><h1>Practice</h1><p>About <b>${poolSize(pool).toLocaleString('en-CA')}</b> practice questions from ${pool.length === 1 ? `lesson ${pool[0].w}` : `${pool.length} lessons`}. Every lesson you finish adds about 160 more.</p></div></div>
  <section class="card p-settings">
    <div class="p-set"><span>Lessons</span>${seg('pScope', [['week', `Lesson ${cw}`], ['mine', `Lessons 1–${cw}`], ['all', isGuest() ? 'Free week' : 'All 168']], state.settings.pScope || 'mine')}</div>
    <div class="p-set"><span>Length</span>${seg('pLen', [[5, '5'], [10, '10'], [20, '20']], len)}</div>
    <div class="p-set"><span>Mode</span>${seg('pMode', [['learn', 'Learn'], ['test', 'Test']], test ? 'test' : 'learn')}<small class="sub">${test ? 'No answers until the end.' : 'See the answer after each question.'}</small></div>
  </section>
  <div class="quick">
    <button class="quick-c q-daily" data-run="daily">${ic('zap')}<b>Daily mix</b><small>${len} questions across all four skills, newest lessons first</small></button>
    <button class="quick-c q-mist" data-run="mistakes" ${mistakes ? '' : 'disabled'}>${ic('refresh')}<b>Fix my mistakes</b><small>${mistakes ? `${mistakes} saved. Each one leaves after two right answers.` : 'Nothing saved yet. Wrong answers will appear here.'}</small></button>
    <button class="quick-c q-weak" data-run="weak">${ic('target')}<b>Weak spots</b><small>${weak.length ? `Lessons ${weak.map(c => c.w).join(', ')}: your lowest scores` : 'Practise a little first; then this targets your weakest lessons.'}</small></button>
  </div>
  <div id="p-host" class="p-host"></div>
  ${SKILLS.map(([id, label, icon]) => `<section class="p-skill"><div class="p-skill-h">${ic(icon)}<h2>${label}</h2>${acc(id) !== null ? `<span class="sub">${acc(id)}% correct over ${state.skill[id].n} answers</span>` : ''}</div>
    <div class="tiles p-tiles">${PMODES.filter(m => m.skill === id).map(tile).join('')}</div></section>`).join('')}
  <section class="p-skill"><div class="p-skill-h">${ic('trophy')}<h2>Level packs</h2><span class="sub">${PACK_SIZE} questions in Test mode. Unlock each pack by passing its phase's milestone test.</span></div>
    <div class="packs">${PHASES.map(p => { const open = packOpen(p), best = state.packs[p.id];
      return `<button class="pack ${open ? '' : 'locked'} ${best >= 80 ? 'mastered' : ''}" data-run="pack${p.id}"><span class="pack-badge">${ic(open ? (best >= 80 ? 'trophy' : 'star') : 'lock')}</span>
        <b>${p.id} · ${p.name}</b><small>${open ? (best !== undefined ? `Best score ${best}%${best >= 80 ? ' · mastered' : ''}` : 'Ready: lessons ' + p.from + '–' + p.to) : `Unlocks after lesson ${p.to}`}</small></button>`; }).join('')}</div></section>`;
}
