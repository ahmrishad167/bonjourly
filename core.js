// Bonjourly core: state, helpers, speech, exercise runner and flashcards. Views live in views.js.
'use strict';
const RM = window.BP_ROADMAP || [];
const WK = window.BP_WEEKS || {};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s).replace(/\*([^*]+)\*/g, '<em class="fr">$1</em>');
const plainText = s => String(s ?? '').replace(/\*/g, '');
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sample = (a, n) => shuffle(a).slice(0, n);

const ICONS = {
  home: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  mic: '<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>',
  headphones: '<path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3"/>',
  book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  chart: '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/>',
  chat: '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  volume: '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  arrow: '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  chev: '<path d="m9 18 6-6-6-6"/>',
  chevl: '<path d="m15 18-6-6 6-6"/>',
  flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
  star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
  cal: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  cards: '<rect width="16" height="12" x="4" y="8" rx="2"/><path d="M8 4h10a2 2 0 0 1 2 2v8"/>',
  refresh: '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
  grad: '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/><path d="M22 10v6"/>',
  flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  activity: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  trophy: '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>',
  stop: '<rect width="14" height="14" x="5" y="5" rx="2"/>',
};
const ic = n => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n] || ''}</svg>`;

const PHASES = [
  { id: 'A1', name: 'Foundations', from: 1, to: 40, icon: 'book', goal: 'Introduce yourself, handle shops and small talk, talk about the past simply' },
  { id: 'A2', name: 'Everyday life', from: 41, to: 84, icon: 'chat', goal: 'Tell stories, rent an apartment, see a doctor, follow everyday Canadian French at a slow pace' },
  { id: 'B1', name: 'Independence', from: 85, to: 128, icon: 'file', goal: 'Give opinions, use the subjunctive, follow Radio-Canada news' },
  { id: 'B2', name: 'Fluency', from: 129, to: 168, icon: 'grad', goal: 'Debate, work in French, switch between joual and standard French' },
];
const phaseOf = w => PHASES.find(p => w >= p.from && w <= p.to) || PHASES[0];
const DAYS = [
  { k: 'learn', n: 'Learn', icon: 'book' },
  { k: 'drill', n: 'Drill', icon: 'target' },
  { k: 'vocab', n: 'Vocabulary', icon: 'cards' },
  { k: 'listen', n: 'Listen', icon: 'headphones' },
  { k: 'speak', n: 'Speak & Write', icon: 'mic' },
  { k: 'quiz', n: 'Quiz', icon: 'star' },
];
const isCheckpoint = r => /review|milestone|mock assessment/i.test(r.topic);

// ---------- State (kept in this browser only) ----------
const KEY = 'bonjourpro.v2'; // storage key predates the Bonjourly name; changing it would wipe saved progress
function freshState() {
  const weeks = {};
  return {
    name: '', profile: null, weeks, known: {}, scores: [], activity: [], days: {}, writes: {}, goal: 'undecided',
    srs: {}, daily: {}, stories: {}, practiced: {}, placed: 0,
    settings: { rate: 0.95, voice: '', lock: true },
  };
}
// Learners on this device: each registered profile keeps its own progress in localStorage under
// KEY:<id>, listed in PROFILES_KEY; ACTIVE_KEY remembers who is signed in. Guests use sessionStorage only.
const PROFILES_KEY = 'bonjourly.profiles', ACTIVE_KEY = 'bonjourly.active';
const stateKey = id => `${KEY}:${id}`;
const hydrate = s => Object.assign(freshState(), s, { settings: Object.assign(freshState().settings, s.settings) });
function readJSON(store, k) { try { return JSON.parse(store.getItem(k)); } catch (e) { return null; } }
function writeJSON(store, k, v) { try { store.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }
const profiles = () => readJSON(localStorage, PROFILES_KEY) || [];
const saveProfiles = list => writeJSON(localStorage, PROFILES_KEY, list);
function setActive(id) { try { id ? localStorage.setItem(ACTIVE_KEY, id) : localStorage.removeItem(ACTIVE_KEY); } catch (e) { /* storage unavailable */ } }
const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function migrateLegacy() {
  // Before multi-learner support, one state lived under KEY itself.
  const s = readJSON(localStorage, KEY);
  if (!s || !s.weeks) return;
  try { localStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  if (s.profile) {
    s.profile.id = s.profile.id || newId();
    writeJSON(localStorage, stateKey(s.profile.id), s);
    saveProfiles([...profiles(), { id: s.profile.id, name: s.profile.name, at: s.profile.at || Date.now(), lastSeen: Date.now() }]);
    setActive(s.profile.id);
  } else {
    s.name = '';
    writeJSON(sessionStorage, KEY, s); // unregistered progress becomes this session's guest progress
  }
}
function loadState() {
  migrateLegacy();
  let id = null;
  try { id = localStorage.getItem(ACTIVE_KEY); } catch (e) { /* storage unavailable */ }
  const mine = id && readJSON(localStorage, stateKey(id));
  if (mine && mine.weeks) return hydrate(mine);
  const guest = readJSON(sessionStorage, KEY);
  if (guest && guest.weeks) { guest.name = ''; guest.profile = null; return hydrate(guest); }
  return freshState();
}
let state = loadState();
if (state.profile) state.prevVisit = (profiles().find(p => p.id === state.profile.id) || {}).lastSeen || null;
function save() {
  if (!state.profile) { writeJSON(sessionStorage, KEY, state); return; }
  writeJSON(localStorage, stateKey(state.profile.id), state);
  // Keep the "Who's learning?" summary current.
  saveProfiles(profiles().map(p => p.id === state.profile.id
    ? Object.assign(p, { name: state.name, lastSeen: Date.now(), lesson: currentWeek(), done: weeksDone() }) : p));
}
function signIn(id) {
  const s = readJSON(localStorage, stateKey(id));
  if (!s) return false;
  state = hydrate(s);
  state.prevVisit = (profiles().find(p => p.id === id) || {}).lastSeen || null;
  setActive(id); save();
  return true;
}
function signOut() {
  setActive(null);
  try { sessionStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  state = freshState();
}
function createProfile(name, email) {
  const id = newId();
  state.profile = { id, name, email, at: Date.now() }; // the guest's progress so far carries over
  state.name = name;
  saveProfiles([...profiles(), { id, name, at: Date.now(), lastSeen: Date.now() }]);
  try { sessionStorage.removeItem(KEY); } catch (e) { /* storage unavailable */ }
  setActive(id); save();
}
function deleteProfile(id) {
  saveProfiles(profiles().filter(p => p.id !== id));
  try { localStorage.removeItem(stateKey(id)); } catch (e) { /* storage unavailable */ }
  if (state.profile && state.profile.id === id) signOut(); else { try { if (localStorage.getItem(ACTIVE_KEY) === id) setActive(null); } catch (e) { /* storage unavailable */ } }
}
const GUEST_LESSONS = 7; // the free week: one lesson a day for 7 days
const isGuest = () => !state.profile;
// The 6-month plan: one lesson a day, 7 a week, 28 a month.
const monthOf = w => Math.ceil(w / 28);
const planWeekOf = w => Math.ceil(w / 7);

const wstate = w => state.weeks[w] || { days: [0, 0, 0, 0, 0, 0] };
const daysDone = w => wstate(w).days.filter(Boolean).length;
const isDone = w => daysDone(w) === 6;
const weeksDone = () => RM.filter(r => isDone(r.w)).length;
const currentWeek = () => (RM.find(r => !isDone(r.w) && r.w > (state.placed || 0)) || RM.find(r => !isDone(r.w)) || { w: 168 }).w;
const nextDay = w => { const d = wstate(w).days.findIndex(x => !x); return d < 0 ? 0 : d; };
const localDate = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function touch() { const k = localDate(); state.days[k] = (state.days[k] || 0) + 1; }
function streak() {
  const d = new Date(); let n = 0;
  if (!state.days[localDate(d)]) d.setDate(d.getDate() - 1);
  while (state.days[localDate(d)]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function log(text, icon = 'check', w) {
  state.activity.unshift({ t: Date.now(), text, icon, w });
  state.activity = state.activity.slice(0, 40);
}
function setDay(w, d, v = true) {
  const s = state.weeks[w] || (state.weeks[w] = { days: [0, 0, 0, 0, 0, 0] });
  const was = s.days[d];
  s.days[d] = v ? 1 : 0;
  if (v && !was) {
    log(`Lesson ${w}, step ${d + 1}: ${DAYS[d].n}`, DAYS[d].icon, w);
    markDaily('lesson');
    if (d === 2) srsAdd((WK[w] || {}).vocab || [], w);
    if (isDone(w)) { s.at = Date.now(); log(`Completed lesson ${w}: ${RM[w - 1].topic}`, 'trophy', w); }
  }
  touch(); save();
}

// ---------- Section locks ----------
// A step opens when the previous step's evaluation is passed; a lesson opens when the previous lesson is complete.
// Guests get the first GUEST_LESSONS lessons; registering unlocks the rest.
const PASS = { learn: 80, drill: 70, vocab: 80, listen: 70, quiz: 70, checkpoint: 80 };
const quizPass = w => (isCheckpoint(RM[w - 1]) ? PASS.checkpoint : PASS.quiz);
const weekOpen = w => (isGuest() && w > GUEST_LESSONS ? false : !state.settings.lock || w <= 1 || w <= state.placed + 1 || isDone(w - 1) || daysDone(w) > 0);
const dayOpen = (w, d) => weekOpen(w) && (!state.settings.lock || d === 0 || isDone(w) || !!wstate(w).days[d - 1]);
const minWords = w => ({ A1: 20, A2: 40, B1: 70, B2: 100 }[phaseOf(w).id]);
const wordCount = s => (String(s || '').match(/[\p{L}'’-]+/gu) || []).length;

// ---------- Daily checklist ----------
function markDaily(k) { const t = localDate(); (state.daily[t] = state.daily[t] || {})[k] = 1; }
const daily = () => state.daily[localDate()] || {};

// ---------- Spaced repetition (Leitner boxes) ----------
const SRS_DAYS = [0, 1, 3, 7, 16, 35];
const addDays = n => { const d = new Date(); d.setDate(d.getDate() + n); return localDate(d); };
function srsAdd(vocab, w) {
  vocab.forEach(v => { const k = vkey(v); if (!state.srs[k]) state.srs[k] = { box: 1, due: localDate(), w }; });
}
function srsGrade(k, knew) {
  const s = state.srs[k] || (state.srs[k] = { box: 1, due: localDate() });
  s.box = knew ? Math.min(5, s.box + 1) : 1;
  s.due = addDays(knew ? SRS_DAYS[s.box] : 1);
  if (s.box >= 3) state.known[k] = 1; else if (!knew) delete state.known[k];
}
function srsDue() {
  const today = localDate(), byKey = {};
  RM.forEach(r => (WK[r.w] ? WK[r.w].vocab : []).forEach(v => { const k = vkey(v); if (!byKey[k]) byKey[k] = Object.assign({ _w: r.w }, v); }));
  return Object.entries(state.srs).filter(([k, s]) => s.due <= today && byKey[k]).map(([k]) => byKey[k]);
}

// ---------- Badges ----------
function badges() {
  const done = weeksDone(), known = Object.keys(state.known).length, st = streak(), stories = Object.keys(state.stories).length;
  const best = Math.max(0, ...state.scores.map(s => s.pct));
  const quebec = state.scores.some(s => s.kind === 'quebec' && s.pct >= 80);
  const ms = w => isDone(w);
  return [
    ['First step', 'Pass your first lesson step', 'play', RM.some(r => daysDone(r.w) > 0)],
    ['Lesson one', 'Complete a full lesson', 'check', done >= 1],
    ['First week', 'Complete 7 lessons', 'cal', done >= 7],
    ['First month', 'Complete 28 lessons', 'route', done >= 28],
    ['On fire', '3-day practice streak', 'flame', st >= 3],
    ['Habit', '7-day practice streak', 'flame', st >= 7],
    ['Unstoppable', '30-day practice streak', 'flame', st >= 30],
    ['Collector', 'Know 50 words', 'cards', known >= 50],
    ['Word hoard', 'Know 250 words', 'cards', known >= 250],
    ['Lexicon', 'Know 750 words', 'book', known >= 750],
    ['Reader', 'Finish a story', 'book', stories >= 1],
    ['Bookworm', 'Finish 10 stories', 'book', stories >= 10],
    ['Perfect', 'Score 100% on any test', 'star', best === 100],
    ['Oreille canadienne', '80%+ on a Canadian ear session', 'chat', quebec],
    ['Placed', 'Take the placement test', 'target', !!state.placedAt],
    ['A1 certificate', 'Pass the A1 milestone (lesson 40)', 'trophy', ms(40)],
    ['A2 certificate', 'Pass the A2 milestone (lesson 84)', 'trophy', ms(84)],
    ['B1 certificate', 'Pass the B1 milestone (lesson 128)', 'trophy', ms(128)],
    ['B2 certificate', 'Pass the B2 milestone (lesson 168)', 'grad', ms(168)],
  ].map(([name, how, icon, got]) => ({ name, how, icon, got }));
}
function recordScore(kind, pct, w) {
  state.scores.push({ t: Date.now(), kind, pct, w });
  state.scores = state.scores.slice(-200);
  touch(); save();
}
function ago(t) {
  const s = (Date.now() - t) / 1000;
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  const d = Math.floor(s / 86400);
  return d === 1 ? 'Yesterday' : `${d} days ago`;
}
function toast(msg) {
  $$('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast'; t.textContent = msg; t.setAttribute('role', 'status');
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2600);
}

// ---------- Answer checking ----------
const norm = s => String(s ?? '').toLowerCase().replace(/[’‘`´]/g, "'").replace(/[«»"“”.!?,;:…()]/g, ' ')
  .replace(/\s*'\s*/g, "'").replace(/\s*-\s*/g, '-').replace(/\s+/g, ' ').trim();
const loose = s => norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe');
function checkText(given, answers) {
  const g = norm(given);
  if (!g) return 'empty';
  if (answers.some(a => norm(a) === g)) return 'ok';
  if (answers.some(a => loose(a) === loose(g))) return 'almost';
  return 'no';
}
function similarity(heard, model) {
  const words = s => loose(s).replace(/'/g, ' ').split(' ').filter(Boolean);
  const h = words(heard), m = words(model);
  if (!m.length) return 0;
  const pool = h.slice(); let hit = 0;
  m.forEach(w => { const i = pool.indexOf(w); if (i >= 0) { hit++; pool.splice(i, 1); } });
  return hit / m.length;
}

// ---------- Speech ----------
const TTS = {
  ok: 'speechSynthesis' in window,
  token: 0,
  voices() { return this.ok ? speechSynthesis.getVoices().filter(v => /^fr/i.test(v.lang)) : []; },
  voice() {
    const vs = this.voices();
    return vs.find(v => v.name === state.settings.voice) || vs.find(v => /fr[-_]CA/i.test(v.lang)) || vs[0] || null;
  },
  stop() { this.token++; if (this.ok) speechSynthesis.cancel(); },
  say(text, opts = {}) {
    if (!this.ok) { toast('This browser cannot play French audio.'); return Promise.resolve(); }
    speechSynthesis.cancel();
    const clean = plainText(text).replace(/\[[^\]]*\]/g, '').replace(/\s+\/\s+/g, '. ').replace(/_{2,}/g, '…');
    return new Promise(res => {
      const u = new SpeechSynthesisUtterance(clean);
      const v = this.voice();
      if (v) u.voice = v;
      u.lang = v ? v.lang : 'fr-CA';
      u.rate = (opts.rate || 1) * state.settings.rate;
      u.pitch = opts.pitch || 1;
      u.onend = u.onerror = () => res();
      speechSynthesis.speak(u);
    });
  },
  async sequence(lines, onLine) {
    const my = ++this.token;
    for (let i = 0; i < lines.length; i++) {
      if (my !== this.token) return;
      onLine && onLine(i);
      await this.say(lines[i].text, { pitch: lines[i].pitch });
      await new Promise(r => setTimeout(r, 250));
    }
    if (my === this.token) onLine && onLine(-1);
  },
};
if (TTS.ok) speechSynthesis.getVoices();
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function hear() {
  return new Promise((res, rej) => {
    let done = false;
    const r = new SR();
    r.lang = 'fr-CA'; r.interimResults = false; r.maxAlternatives = 1;
    r.onresult = e => { done = true; res(e.results[0][0].transcript); };
    r.onerror = e => { done = true; rej(e.error); };
    r.onend = () => { if (!done) res(''); };
    r.start();
  });
}
const sayBtn = (text, slow) => `<button class="say" data-say="${esc(plainText(text))}" title="Listen" aria-label="Listen">${ic('volume')}</button>`
  + (slow ? `<button class="say slow" data-say="${esc(plainText(text))}" data-rate="0.6" title="Listen slowly">0.6×</button>` : '');

// ---------- Exercise runner ----------
// Item types: mcq, fill, build, translate (from content) plus dict and shadow (generated in Practice).
const KIND = { mcq: 'Choose the answer', fill: 'Fill in the blank', build: 'Build the sentence', translate: 'Translate into French', dict: 'Dictation', shadow: 'Repeat after me' };
const ACCENTS = ['é', 'è', 'ê', 'à', 'â', 'ç', 'î', 'ô', 'û', 'ù', 'ë', 'ï', 'œ'];
function answerOf(it) {
  if (it.t === 'mcq') return it.options[it.a];
  if (it.t === 'fill') return it.q.replace('___', it.a[0]);
  if (it.t === 'build') return it.a;
  if (it.t === 'translate') return it.a[0];
  return it.fr;
}

function runner(host, items, opts = {}) {
  let list = items.slice(), i = 0, results = [], answered = false, built = [];
  const total = () => list.length;

  function frame(inner) {
    const pct = Math.round(i / total() * 100);
    host.innerHTML = `<div class="runner card">
      <div class="runner-top"><div class="bar"><span style="width:${pct}%"></span></div><span>${i + 1} / ${total()}</span></div>
      ${inner}
      <div id="r-fb"></div>
      <div class="runner-actions" id="r-actions"></div>
    </div>`;
  }
  const accentBar = () => `<div class="accents">${ACCENTS.map(a => `<button type="button" data-acc="${a}" tabindex="-1">${a}</button>`).join('')}</div>`;
  const setActions = html => { $('#r-actions', host).innerHTML = html; };

  function draw() {
    if (i >= total()) return finish();
    answered = false; built = [];
    const it = list[i];
    const kind = `<div class="q-kind">${KIND[it.t] || ''}${it._w ? ` · Lesson ${it._w}` : ''}</div>`;
    if (it.t === 'mcq') {
      if (it.audio) setTimeout(() => TTS.say(it.audio), 250);
      frame(`${kind}<div class="q-text">${md(it.q)}</div>${it.audio ? `<div class="row" style="margin-bottom:12px">${sayBtn(it.audio, true)}<span class="sub">Play again</span></div>` : ''}
        ${it.passage ? `<div class="passage">${it.passage.split('\n').map(p => `<p>${md(p)}</p>`).join('')}</div>` : ''}<div class="opts">${it.options.map((o, k) =>
        `<button class="opt" data-opt="${k}"><span class="k">${k + 1}</span><span>${md(o)}</span></button>`).join('')}</div>`);
    } else if (it.t === 'fill') {
      const [pre, post] = it.q.split('___');
      frame(`${kind}<div class="fill-line"><span>${md(pre)}</span><input id="r-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Your answer"><span>${md(post)}</span></div>
        ${it.en ? `<div class="q-hint">${esc(it.en)}</div>` : ''}${accentBar()}`);
      setActions(`<button class="btn" data-r="check">Check</button>`);
    } else if (it.t === 'build') {
      it._words = it._words || shuffle(it.a.split(' '));
      frame(`${kind}<div class="q-text">${esc(it.en)}</div><div class="q-hint">Tap the words in order.</div>
        <div class="build-slot" id="r-slot"></div><div class="build-bank" id="r-bank">${it._words.map((w, k) => `<button class="word" data-word="${k}">${esc(w)}</button>`).join('')}</div>`);
      setActions(`<button class="btn ghost" data-r="clear">Clear</button><button class="btn" data-r="check">Check</button>`);
    } else if (it.t === 'translate') {
      frame(`${kind}<div class="q-text">${esc(it.en)}</div>
        <textarea class="input" id="r-in" rows="2" autocomplete="off" spellcheck="false" placeholder="Type in French…" aria-label="Your translation"></textarea>${accentBar()}`);
      setActions(`<button class="btn ghost" data-r="reveal">Show answer</button><button class="btn" data-r="check">Check</button>`);
    } else if (it.t === 'dict') {
      frame(`${kind}<div class="q-text">Listen and type what you hear.</div>
        <div class="row" style="margin-bottom:12px">${sayBtn(it.fr, true)}<span class="sub">Play as often as you need.</span></div>
        <textarea class="input" id="r-in" rows="2" autocomplete="off" spellcheck="false" placeholder="Type in French…" aria-label="What you heard"></textarea>${accentBar()}`);
      setActions(`<button class="btn ghost" data-r="reveal">Show answer</button><button class="btn" data-r="check">Check</button>`);
      setTimeout(() => TTS.say(it.fr), 250);
    } else if (it.t === 'shadow') {
      frame(`${kind}<div class="q-text">${esc(it.fr)}</div><div class="q-hint">${esc(it.en)}</div>
        <div class="row">${sayBtn(it.fr, true)}<span class="sub">Listen, then say it out loud.</span></div><div id="r-heard"></div>`);
      setActions((SR ? `<button class="btn ghost rec" data-r="rec">${ic('mic')} Record</button>` : '')
        + `<button class="btn ghost" data-r="self-no">Need more practice</button><button class="btn" data-r="self-ok">I said it well</button>`);
      setTimeout(() => TTS.say(it.fr), 250);
    }
    const inp = $('#r-in', host);
    if (inp) inp.focus({ preventScroll: true });
  }

  function grade(status, given) {
    if (answered) return;
    answered = true;
    const it = list[i];
    const ok = status === 'ok' || status === 'almost';
    results.push({ it, ok, given });
    const ans = answerOf(it);
    const head = status === 'ok' ? 'Correct!' : status === 'almost' ? 'Almost: check your accents.' : 'Not quite.';
    const showAns = it.t !== 'mcq' || status === 'no';
    $('#r-fb', host).innerHTML = `<div class="feedback ${status === 'ok' ? 'ok' : status === 'almost' ? 'almost' : 'no'}" role="status">
      ${ic(ok ? 'check' : 'x')}<div style="flex:1;min-width:0"><b>${head}</b>
      ${showAns ? `<div class="row" style="margin-top:4px"><span>${md(ans)}</span>${it.t === 'mcq' && !/[a-zàâçéèêëîïôûùœ]{3}/i.test(ans) ? '' : sayBtn(ans)}</div>` : ''}
      ${it.why ? `<div class="why">${md(it.why)}</div>` : ''}</div></div>`;
    setActions(`<button class="btn" data-r="next">${i + 1 < total() ? 'Next' : 'See results'} ${ic('arrow')}</button>`);
    $('[data-r="next"]', host).focus({ preventScroll: true });
  }

  function check() {
    const it = list[i];
    if (it.t === 'build') {
      if (!built.length) return;
      return grade(checkText(built.map(k => it._words[k]).join(' '), [it.a]), built.map(k => it._words[k]).join(' '));
    }
    const v = $('#r-in', host).value;
    const answers = it.t === 'dict' ? [it.fr] : it.a;
    const st = checkText(v, answers);
    if (st === 'empty') return $('#r-in', host).focus();
    grade(st, v);
  }

  function finish() {
    const ok = results.filter(r => r.ok).length;
    const pct = total() ? Math.round(ok / total() * 100) : 0;
    const extra = opts.onFinish ? opts.onFinish(pct, results) : '';
    const missed = results.filter(r => !r.ok);
    host.innerHTML = `<div class="runner card result">
      <div class="big">${pct}%</div><div class="sub">${ok} of ${total()} correct</div>
      ${extra ? `<p style="margin-top:10px">${extra}</p>` : ''}
      ${missed.length ? `<div class="review-list"><b>Review these</b>${missed.map(r => `<div>${md(r.it.q || r.it.en || r.it.fr)}<small>Answer: ${md(answerOf(r.it))}</small></div>`).join('')}</div>` : ''}
      <div class="runner-actions" style="justify-content:center">
        ${missed.length ? `<button class="btn ghost" data-r="retry">${ic('refresh')} Retry mistakes</button>` : ''}
        <button class="btn ghost" data-r="restart">Start again</button>
        ${opts.nextHref ? `<a class="btn" href="${opts.nextHref}">${esc(opts.nextLabel || 'Continue')} ${ic('arrow')}</a>` : ''}
      </div></div>`;
  }

  host.onclick = e => {
    const t = e.target.closest('[data-opt],[data-word],[data-r],[data-acc]');
    if (!t || !host.contains(t)) return;
    const it = list[i];
    if (t.dataset.acc) {
      const inp = $('#r-in', host);
      if (!inp) return;
      const s = inp.selectionStart ?? inp.value.length, en = inp.selectionEnd ?? s;
      inp.value = inp.value.slice(0, s) + t.dataset.acc + inp.value.slice(en);
      inp.focus(); inp.setSelectionRange(s + 1, s + 1);
      return;
    }
    if (t.dataset.opt !== undefined && !answered) {
      const k = +t.dataset.opt;
      $$('.opt', host).forEach((b, j) => { b.disabled = true; if (j === it.a) b.classList.add('right'); });
      if (k !== it.a) t.classList.add('wrong');
      return grade(k === it.a ? 'ok' : 'no', it.options[k]);
    }
    if (t.dataset.word !== undefined && !answered) {
      const k = +t.dataset.word;
      if (t.closest('#r-slot')) built = built.filter(x => x !== k); else if (!built.includes(k)) built.push(k);
      $('#r-slot', host).innerHTML = built.map(x => `<button class="word" data-word="${x}">${esc(it._words[x])}</button>`).join('');
      $$('#r-bank .word', host).forEach(b => b.classList.toggle('used', built.includes(+b.dataset.word)));
      return;
    }
    const r = t.dataset.r;
    if (r === 'check' && !answered) check();
    else if (r === 'clear') { built = []; $('#r-slot', host).innerHTML = ''; $$('#r-bank .word', host).forEach(b => b.classList.remove('used')); }
    else if (r === 'reveal' && !answered) grade('no', '');
    else if (r === 'self-ok') grade('ok', '');
    else if (r === 'self-no') grade('no', '');
    else if (r === 'rec') {
      t.classList.add('on'); t.innerHTML = `${ic('mic')} Listening…`;
      hear().then(txt => {
        const sc = similarity(txt, it.fr);
        $('#r-heard', host).innerHTML = `<div class="prompt"><div class="heard">I heard: <b>${esc(txt || '(nothing)')}</b> · ${Math.round(sc * 100)}% match</div></div>`;
        if (txt) grade(sc >= 0.7 ? 'ok' : 'no', txt);
      }).catch(() => toast('The microphone is not available here. Say it aloud and grade yourself.'))
        .finally(() => { t.classList.remove('on'); t.innerHTML = `${ic('mic')} Record`; });
    }
    else if (r === 'next') { i++; draw(); }
    else if (r === 'retry') { list = results.filter(x => !x.ok).map(x => x.it); i = 0; results = []; draw(); }
    else if (r === 'restart') { list = items.slice(); i = 0; results = []; draw(); }
  };
  host.onkeydown = e => {
    const it = list[i];
    if (e.key === 'Enter' && !e.shiftKey && it && !answered && it.t !== 'mcq' && it.t !== 'shadow' && it.t !== 'build') { e.preventDefault(); check(); }
    else if (e.key === 'Enter' && answered && e.target.tagName !== 'BUTTON') { e.preventDefault(); i++; draw(); }
    else if (it && it.t === 'mcq' && !answered && /^[1-5]$/.test(e.key) && e.target.tagName !== 'INPUT') {
      const b = $(`[data-opt="${+e.key - 1}"]`, host); if (b) b.click();
    }
  };
  host._cur = () => list[i]; // used by the automated smoke test
  if (!list.length) { host.innerHTML = `<div class="card empty">Nothing to practise here yet.</div>`; return; }
  draw();
}

// ---------- Flashcards ----------
const vkey = v => norm(v.fr);
function flashcards(host, cards, opts = {}) {
  let list = cards.slice(), i = 0, flipped = false, knew = 0;
  function draw() {
    if (i >= list.length) {
      host.innerHTML = `<div class="fc-wrap card result"><div class="big">${knew}/${list.length}</div><div class="sub">marked as known</div>
        <div class="runner-actions" style="justify-content:center"><button class="btn ghost" data-f="again">${ic('refresh')} Go again</button>
        ${opts.nextHref ? `<a class="btn" href="${opts.nextHref}">${esc(opts.nextLabel || 'Continue')} ${ic('arrow')}</a>` : ''}</div></div>`;
      opts.onDone && opts.onDone(knew, list.length);
      return;
    }
    const v = list[i];
    host.innerHTML = `<div class="fc-wrap">
      <div class="runner-top"><div class="bar"><span style="width:${Math.round(i / list.length * 100)}%"></span></div><span>${i + 1} / ${list.length}</span></div>
      <button class="flash${flipped ? ' flipped' : ''}" data-f="flip" aria-label="Flip card"><div class="inner">
        <div class="face"><div class="w">${esc(v.fr)}</div>${v.g ? `<span class="chip grey">${v.g === 'm' ? 'masculine' : 'feminine'}</span>` : ''}${v.qc ? '<span class="chip qc">Canadian</span>' : ''}<div class="m">Tap to see the meaning</div></div>
        <div class="face back"><div class="w" style="font-size:22px">${esc(v.en)}</div>${v.ex ? `<div class="e">${esc(v.ex)}</div>` : ''}${v._w ? `<div class="m">Lesson ${v._w}</div>` : ''}</div>
      </div></button>
      <div class="row" style="justify-content:center">${sayBtn(v.fr)}${v.ex ? `<button class="btn sm ghost" data-say="${esc(v.ex)}">${ic('play')} Example</button>` : ''}</div>
      <div class="runner-actions" style="justify-content:center"><button class="btn ghost" data-f="learning">Still learning</button><button class="btn good" data-f="known">${ic('check')} I know it</button></div>
    </div>`;
  }
  host.onclick = e => {
    const t = e.target.closest('[data-f]'); if (!t) return;
    const f = t.dataset.f;
    if (f === 'flip') { flipped = !flipped; $('.flash', host).classList.toggle('flipped', flipped); if (flipped) TTS.say(list[i].fr); return; }
    if (opts.srs && (f === 'known' || f === 'learning')) { srsGrade(vkey(list[i]), f === 'known'); if (f === 'known') knew++; touch(); save(); }
    else if (f === 'known') { state.known[vkey(list[i])] = 1; knew++; touch(); save(); }
    else if (f === 'learning') { delete state.known[vkey(list[i])]; save(); }
    if (f === 'again') { list = shuffle(cards); i = 0; knew = 0; flipped = false; return draw(); }
    i++; flipped = false; draw();
  };
  if (!list.length) { host.innerHTML = `<div class="card empty">No words to review here yet.</div>`; return; }
  draw();
}

// ---------- Content pools ----------
const weeksWith = (from, to) => RM.filter(r => r.w >= from && r.w <= to && WK[r.w]).map(r => WK[r.w]);
function allVocab(weeks) {
  const seen = new Set(), out = [];
  weeks.forEach(c => (c.vocab || []).forEach(v => { const k = vkey(v); if (!seen.has(k)) { seen.add(k); out.push(Object.assign({ _w: c.w }, v)); } }));
  return out;
}
const tag = (arr, w) => arr.map(x => Object.assign({ _w: w }, x));

// Weeks whose vocabulary day was finished before spaced repetition existed join the review queue once.
if (!state.srsInit) {
  RM.forEach(r => { if (wstate(r.w).days[2] && WK[r.w]) srsAdd(WK[r.w].vocab, r.w); });
  state.srsInit = 1; save();
}
