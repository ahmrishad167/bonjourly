// Bonjourly views and router. Depends on core.js.
'use strict';
const page = $('#page');
let afterRender = [];
const later = fn => afterRender.push(fn);

const NAV_GROUPS = [
  ['Learn', [['home', 'Home', 'home'], ['path', 'Learning Path', 'route'], ['stories', 'Stories', 'book']]],
  ['Practise', [['practice', 'Practice', 'target'], ['review', 'Review', 'refresh'], ['sounds', 'Pronunciation', 'mic']]],
  ['Reference', [['vocab', 'Vocabulary', 'cards'], ['verbs', 'Verbs', 'zap'], ['grammar', 'Grammar', 'file'], ['quebec', 'Canadian French', 'chat']]],
  ['Goals', [['exam', 'TEF Canada', 'flag'], ['progress', 'Progress', 'chart']]],
];
const BOTTOM = [['home', 'Home', 'home'], ['path', 'Path', 'route'], ['review', 'Review', 'refresh'], ['stories', 'Stories', 'book'], ['more', 'More', 'cards']];

const SKY = `<svg class="sky" viewBox="0 0 600 220" preserveAspectRatio="xMaxYMax slice" aria-hidden="true">
  <circle cx="500" cy="62" r="30" fill="#fff1d6" opacity=".9"/>
  <path d="M0 165 Q140 128 300 146 T600 132 V220 H0Z" fill="#a9c2a6" opacity=".75"/>
  <path d="M228 176 L244 150 L566 148 L600 158 V186 H228Z" fill="#6f8570"/>
  <g fill="#8e9ab3"><rect x="206" y="128" width="28" height="46"/><rect x="512" y="118" width="30" height="34"/><rect x="546" y="128" width="24" height="24"/></g>
  <g fill="#86503d"><rect x="330" y="98" width="122" height="54"/><rect x="373" y="62" width="34" height="90"/><rect x="298" y="116" width="36" height="36"/><rect x="450" y="110" width="42" height="42"/></g>
  <g fill="#3f9a82"><polygon points="373,62 390,28 407,62"/><polygon points="330,98 346,84 436,84 452,98"/><polygon points="298,116 316,100 334,116"/><polygon points="450,110 471,94 492,110"/><polygon points="386,36 390,18 394,36"/></g>
  <g fill="#ffe2a6"><rect x="380" y="74" width="5" height="7"/><rect x="394" y="74" width="5" height="7"/><rect x="380" y="90" width="5" height="7"/><rect x="394" y="90" width="5" height="7"/>
    <rect x="342" y="110" width="5" height="7"/><rect x="356" y="110" width="5" height="7"/><rect x="420" y="110" width="5" height="7"/><rect x="434" y="110" width="5" height="7"/>
    <rect x="342" y="126" width="5" height="7"/><rect x="420" y="126" width="5" height="7"/><rect x="462" y="122" width="5" height="7"/><rect x="476" y="122" width="5" height="7"/></g>
  <g fill="#4f8a5b"><circle cx="252" cy="166" r="12"/><circle cx="272" cy="170" r="10"/><circle cx="560" cy="156" r="13"/><circle cx="586" cy="160" r="12"/></g>
  <rect y="180" width="600" height="40" fill="#7fa7d9"/>
  <path d="M30 194 H220 M260 202 H540 M110 212 H400" stroke="#fff" opacity=".5" stroke-width="2"/>
  <g transform="translate(150 183)"><path d="M0 8 H50 L43 16 H6Z" fill="#fff"/><rect x="11" y="0" width="24" height="8" fill="#e2363f"/></g>
</svg>`;

// ---------- Shell ----------
function drawShell(base) {
  const due = srsDue().length;
  $('#nav').innerHTML = NAV_GROUPS.map(([g, items]) => `<div class="nav-g">${g}</div>` + items.map(([id, label, icon]) =>
    `<a href="#${id}" class="${base === id ? 'on' : ''}">${ic(icon)}<span>${label}</span>${id === 'review' && due ? `<span class="count">${due}</span>` : ''}</a>`).join('')).join('');
  $('#bottom-nav').innerHTML = BOTTOM.map(([id, label, icon]) => `<a href="#${id}" class="${base === id ? 'on' : ''}">${ic(icon)}${label}</a>`).join('');
  const cw = currentWeek(), ph = phaseOf(cw);
  const initials = (state.name || '?').trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
  const me = $('#me');
  if (isGuest()) { me.href = '#register'; me.innerHTML = `<span class="btn sm">${ic('users')} Register free</span>`; }
  else { me.href = '#progress'; me.innerHTML = `<span class="avatar">${esc(initials)}</span><span class="who"><b>${esc(state.name)}</b><small>Lesson ${cw} · ${ph.id} ${ph.name}</small></span>`; }
}

function render() {
  TTS.stop();
  afterRender = [];
  const h = (location.hash || '#home').slice(1);
  let m, html, base = h;
  if ((m = h.match(/^w(\d+)(?:-d([1-6]))?$/)) && +m[1] >= 1 && +m[1] <= 168) {
    base = 'path';
    const w = +m[1];
    html = viewWeek(w, m[2] ? +m[2] - 1 : nextDay(w));
  } else if ((m = h.match(/^practice(?:-(\w+))?$/))) { base = 'practice'; html = viewPractice(m[1]); }
  else if ((m = h.match(/^story-(\w+)$/))) { base = 'stories'; html = viewStory(m[1]); }
  else if ((m = h.match(/^verb-([\w-]+)$/))) { base = 'verbs'; html = viewVerb(m[1]); }
  else if ((m = h.match(/^exam(?:-([A-Z]{2})(?:-(\d+))?)?$/))) { base = 'exam'; html = viewExam(m[1], m[2] ? +m[2] - 1 : undefined); }
  else if (h === 'review') html = viewReview();
  else if (h === 'stories') html = viewStories();
  else if (h === 'verbs') html = viewVerbs();
  else if (h === 'sounds') html = viewSounds();
  else if (h === 'placement') { base = 'path'; html = viewPlacement(); }
  else if (h === 'more') html = viewMore();
  else if (h === 'register') html = viewRegister();
  else if (h === 'path') html = viewPath();
  else if (h === 'vocab') html = viewVocab();
  else if (h === 'grammar') html = viewGrammar();
  else if (h === 'quebec') html = viewQuebec();
  else if (h === 'progress') html = viewProgress();
  else { base = 'home'; html = viewHome(); }
  drawShell(base);
  page.innerHTML = html;
  afterRender.forEach(fn => fn());
  window.scrollTo(0, 0);
}

// ---------- Home ----------
function viewHome() {
  const cw = currentWeek(), r = RM[cw - 1], c = WK[cw], ph = phaseOf(cw), d = nextDay(cw);
  const done = weeksDone(), pct = Math.round(done / 168 * 100);
  const quote = (c && ((c.examples || []).find(e => e.fr.length <= 34) || {}).fr) || 'Bonjour, ça va?';
  const known = Object.keys(state.known).length;
  const nextCheck = RM.find(x => x.w >= cw && isCheckpoint(x));
  const a1 = RM.filter(x => x.w <= 40 && isDone(x.w)).length;
  const circ = 2 * Math.PI * 50;

  const phaseSteps = PHASES.map(p => {
    const n = RM.filter(x => x.w >= p.from && x.w <= p.to && isDone(x.w)).length, size = p.to - p.from + 1;
    const cls = n === size ? 'done' : (cw >= p.from && cw <= p.to) ? 'cur' : 'locked';
    return `<a class="phase ${cls}" href="#path" data-phase="${p.id}">
      <span class="dot">${ic(p.icon)}<span class="badge">${ic(cls === 'done' ? 'check' : cls === 'cur' ? 'play' : 'lock')}</span></span>
      <b>${p.id} ${p.name}</b><small>Lessons ${p.from}–${p.to} · month ${monthRange(p)}</small>
      <span class="bar"><span style="width:${Math.round(n / size * 100)}%"></span></span></a>`;
  }).join('');

  return `<div class="home">
  <div class="stack">
    <section class="hero">${SKY}
      <div class="quote">Le français<br>ouvre des portes!</div>
      <div class="copy">
        <h1><span class="fl"><span style="background:#1f4fbf"></span><span style="background:#fff"></span><span style="background:#e2363f"></span></span>Bonjour${state.profile && state.name ? `, ${esc(state.name)}` : ''}!</h1>
        <h2>Canadian French, from zero to B2</h2>
        <p>168 lessons. Take one a day and reach B2 in about 6 months, or learn at your own pace. You're on lesson ${cw}: month ${monthOf(cw)}, week ${planWeekOf(cw)} of the plan.</p>
        <a class="btn" href="#w${cw}-d${d + 1}">Continue learning ${ic('chev')}</a>
      </div>
    </section>

    ${isGuest() ? `<section class="guest-bar">${ic('users')}<div><b>You're on the free week: lessons 1–${GUEST_LESSONS}.</b><span>Register free to unlock all 168 lessons and save your progress.</span></div><a class="btn sm" href="#register">Register free</a></section>` : ''}

    <section class="card">
      <div class="card-h"><span class="ico">${ic('target')}</span><div><h2>Your Learning Path</h2><div class="sub">Four phases, 168 lessons, about 6 months at one lesson a day.</div></div>
        <a class="more btn sm soft" href="#path">${ic('route')} Open path</a></div>
      <div class="phases">${phaseSteps}</div>
    </section>

    <div class="grid2">
      <section class="card">
        <div class="card-h"><span class="ico">${ic('cal')}</span><h2>Today's Lesson</h2><a class="more" href="#w${cw}">View lesson</a></div>
        <div class="today">
          <div>
            <h3>Leçon ${cw} : ${esc(r.topic)}</h3>
            <div class="row" style="margin-top:6px"><span class="chip">${ph.id} · ${ph.name}</span><span class="chip grey">Step ${d + 1} · ${DAYS[d].n}</span></div>
            <p class="lead">${c ? esc(c.goal) : 'This lesson is still being written. You can preview the topic and its Canadian French layer.'}</p>
            <a class="btn" href="#w${cw}-d${d + 1}">Start lesson ${ic('chev')}</a>
          </div>
          <div class="postcard"><q>${esc(quote)}</q><button class="say" data-say="${esc(quote)}" aria-label="Listen">${ic('play')}</button></div>
        </div>
      </section>
      <section class="card">
        <div class="card-h"><span class="ico" style="color:var(--warn)">${ic('zap')}</span><h2>Quick Practice</h2></div>
        <div class="tiles">
          <a class="tile green" href="#practice-speak">${ic('mic')}Speaking Practice<small>Hear it, say it, check it</small></a>
          <a class="tile blue" href="#practice-listen">${ic('headphones')}Listening Practice<small>Dictation from your lessons</small></a>
          <a class="tile red" href="#practice-cards">${ic('cards')}Vocabulary<small>Flashcards for your lessons</small></a>
          <a class="tile violet" href="#practice-quiz">${ic('file')}Grammar<small>Quiz on the rules</small></a>
        </div>
      </section>
    </div>

    <section class="card">
      <div class="card-h"><span class="ico">${ic('star')}</span><h2>Featured Resources</h2></div>
      <div class="resources">
        <a class="res" href="#grammar"><span class="ri" style="background:var(--t-violet);color:var(--t-violet-ink)">${ic('book')}</span><span><b>Grammar Guide</b><small>Every rule, lesson by lesson</small></span>${ic('chev')}</a>
        <a class="res" href="#practice-cards"><span class="ri" style="background:var(--t-green);color:var(--t-green-ink)">${ic('cards')}</span><span><b>Flashcards</b><small>Build your vocabulary</small></span>${ic('chev')}</a>
        <a class="res" href="#quebec"><span class="ri" style="background:var(--t-blue);color:var(--t-blue-ink)">${ic('chat')}</span><span><b>Canadian French</b><small>What you'll hear in Canada</small></span>${ic('chev')}</a>
        <a class="res" href="#exam"><span class="ri" style="background:var(--t-amber);color:var(--t-amber-ink)">${ic('flag')}</span><span><b>TEF Canada prep</b><small>Immigration and citizenship</small></span>${ic('chev')}</a>
      </div>
    </section>
  </div>

  <aside class="stack">
    <section class="card">
      <div class="card-h"><span class="ico">${ic('chart')}</span><h2>Your Progress</h2></div>
      <div class="ring"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary-soft)" stroke-width="12"/>
        <circle cx="60" cy="60" r="50" fill="none" stroke="var(--primary)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${circ * (1 - pct / 100)}"/></svg><div class="v">${pct}%</div></div>
      <div class="sub" style="text-align:center">Overall completion</div>
      <div class="stat-list">
        <div><span class="si" style="background:var(--t-green);color:var(--t-green-ink)">${ic('book')}</span>Lessons completed<b>${done} / 168</b></div>
        <div><span class="si" style="background:var(--t-blue);color:var(--t-blue-ink)">${ic('cards')}</span>Words known<b>${known}</b></div>
        <div><span class="si" style="background:var(--t-amber);color:var(--t-amber-ink)">${ic('flame')}</span>Practice streak<b>${streak()} day${streak() === 1 ? '' : 's'}</b></div>
      </div>
    </section>

    ${dailyCard(cw, d)}

    ${nextCheck ? `<section class="card">
      <div class="card-h"><span class="ico">${ic('flag')}</span><h2>Next Checkpoint</h2><a class="btn sm" href="#w${nextCheck.w}" style="margin-left:auto">Open</a></div>
      <div class="goal"><span class="gi" style="background:var(--t-violet);color:var(--t-violet-ink)">${ic('trophy')}</span>
      <div><b>Lesson ${nextCheck.w}: ${esc(nextCheck.topic)}</b><small>${nextCheck.w === cw ? 'Next up' : `In ${nextCheck.w - cw} lesson${nextCheck.w - cw === 1 ? '' : 's'}`} · ${esc(nextCheck.qc)}</small></div></div>
    </section>` : ''}

    <section class="card">
      <div class="card-h"><span class="ico">${ic('target')}</span><h2>Your Goals</h2><a class="more" href="#progress">View all</a></div>
      <div class="goal"><span class="gi" style="background:var(--t-green);color:var(--t-green-ink)">${ic('book')}</span><div style="flex:1"><b>Pass the A1 milestone</b><small>${a1} of 40 lessons · test in lesson 40 (month 2)</small><div class="bar"><span style="width:${a1 / 40 * 100}%"></span></div></div></div>
      <div class="goal"><span class="gi" style="background:var(--t-violet);color:var(--t-violet-ink)">${ic('grad')}</span><div style="flex:1"><b>Reach B2</b><small>${done} of 168 lessons · 6 months at one a day</small><div class="bar"><span style="width:${pct}%"></span></div></div></div>
      <div class="goal"><span class="gi" style="background:var(--t-red);color:var(--t-red-ink)">${ic('flag')}</span><div><b>${state.goal === 'undecided' ? 'Choose: exam or conversation' : state.goal === 'conv' ? 'Goal: conversational fluency' : `Goal: ${state.goal === 'tef' ? 'TEF Canada' : 'DELF B2'}`}</b><small>Decide before lesson 129 · <a href="#progress">set it</a></small></div></div>
    </section>

    <section class="card">
      <div class="card-h"><span class="ico">${ic('clock')}</span><h2>Recent Activity</h2></div>
      ${state.activity.length ? `<div class="activity">${state.activity.slice(0, 5).map(a =>
        `<div><span class="ai">${ic(a.icon)}</span><span>${esc(a.text)}<small>${ago(a.t)}</small></span></div>`).join('')}</div>`
        : `<div class="empty" style="padding:12px">Finished lessons and practice sessions show up here.</div>`}
    </section>
  </aside>
  </div>`;
}

function dailyCard(cw, d) {
  const t = daily(), due = srsDue().length;
  const items = [
    ['lesson', `Lesson ${cw}, step ${d + 1} (${DAYS[d].n})`, `#w${cw}-d${d + 1}`, t.lesson],
    ['review', due ? `Review ${due} word${due === 1 ? '' : 's'} due` : 'Review: nothing due', '#review', t.review || !due],
    ['practice', 'One practice session', '#practice', t.practice],
    ['story', 'Read a story', '#stories', t.story],
  ];
  const n = items.filter(x => x[3]).length;
  return `<section class="card"><div class="card-h"><span class="ico">${ic('check')}</span><h2>Today's checklist</h2><span class="sub" style="margin-left:auto">${n}/4</span></div>
    <div class="checklist-d">${items.map(([k, label, href, ok]) => `<a href="${href}" class="${ok ? 'ok' : ''}"><span class="box">${ok ? ic('check') : ''}</span>${esc(label)}</a>`).join('')}</div></section>`;
}

// ---------- Learning path ----------
let pathFilter = 'all';
function viewPath() {
  const cw = currentWeek();
  const blocks = PHASES.filter(p => pathFilter === 'all' || p.id === pathFilter).map(p => {
    const rows = RM.filter(r => r.w >= p.from && r.w <= p.to);
    const n = rows.filter(r => isDone(r.w)).length;
    return `<section class="phase-block">
      <div class="phase-title"><h2>${p.id} · ${p.name}</h2><span class="chip grey">Lessons ${p.from}–${p.to} · month ${monthRange(p)}</span><span class="bar"><span style="width:${n / rows.length * 100}%"></span></span><span class="sub">${n}/${rows.length} done</span></div>
      <p class="sub" style="margin:-4px 0 12px">Goal: ${esc(p.goal)}.</p>
      <div class="weeks">${rows.map(r => weekCard(r, cw)).join('')}</div></section>`;
  }).join('');
  later(() => {
    $$('[data-pf]').forEach(b => b.onclick = () => { pathFilter = b.dataset.pf; render(); });
    const cur = $('.wk.cur'); if (cur && pathFilter !== 'all') cur.scrollIntoView({ block: 'center' });
  });
  return `<div class="page-head"><div><h1>Learning Path</h1><p>168 lessons, each in six steps. One lesson a day finishes in about 6 months; go faster or slower as life allows. Review lessons recycle the block; milestones test the phase.</p></div>
    <div class="seg" style="margin-left:auto">${['all', 'A1', 'A2', 'B1', 'B2'].map(f => `<button data-pf="${f}" class="${pathFilter === f ? 'on' : ''}">${f === 'all' ? 'All' : f}</button>`).join('')}</div>
    <a class="btn ghost" href="#placement">${ic('target')} Placement test</a><a class="btn" href="#w${cw}">${ic('play')} Lesson ${cw}</a></div>
    ${state.settings.lock ? `<p class="sub" style="margin:-8px 0 16px">${ic('lock')} Section locks are on: each step opens after you pass the previous step's check, and each lesson after the previous lesson. You can turn this off in Progress → Settings.</p>` : ''}${blocks}`;
}
function weekCard(r, cw) {
  const dd = daysDone(r.w);
  const open = weekOpen(r.w);
  const cls = [isDone(r.w) ? 'done' : dd ? 'part' : '', r.w === cw ? 'cur' : '', isCheckpoint(r) ? 'milestone' : '', open ? '' : 'locked'].join(' ');
  return `<a class="wk ${cls}" href="#w${r.w}"><span class="n">${isDone(r.w) ? ic('check') : open ? r.w : ic('lock')}</span>
    <span style="min-width:0"><b>${esc(r.topic)}</b><small>${esc(r.qc)}</small>
    <span class="dots">${wstate(r.w).days.map(x => `<i class="${x ? 'on' : ''}"></i>`).join('')}</span>
    ${WK[r.w] ? '' : '<span class="chip grey" style="margin-top:6px">Lesson coming soon</span>'}</span></a>`;
}

// ---------- Week / lesson ----------
function viewWeek(w, d) {
  const r = RM[w - 1], c = WK[w], ph = phaseOf(w);
  const head = `<section class="card">
    <div class="crumbs"><a href="#path">Learning Path</a>${ic('chev')}<span>${ph.id} ${ph.name}</span>${ic('chev')}<span>Lesson ${w}</span></div>
    <div class="lesson-head">
      <div class="wnum"><span><small>LEÇON</small>${w}</span></div>
      <div style="flex:1;min-width:0">
        <h1>${esc(r.topic)}</h1>
        ${c ? `<p class="goal-line">${esc(c.goal)}</p>` : ''}
        <div class="row" style="margin-top:10px"><span class="chip">${ph.id} · ${ph.name}</span><span class="chip grey">${ic('cal')} Month ${monthOf(w)} · week ${planWeekOf(w)}</span><span class="chip qc">${ic('chat')} Canadian French: ${esc(r.qc)}</span>${isDone(w) ? `<span class="chip green">${ic('check')} Completed</span>` : ''}</div>
      </div>
      <div class="row">${w > 1 ? `<a class="btn sm ghost" href="#w${w - 1}" aria-label="Previous lesson">${ic('chevl')}</a>` : ''}${w < 168 ? `<a class="btn sm ghost" href="#w${w + 1}" aria-label="Next lesson">${ic('chev')}</a>` : ''}</div>
    </div></section>`;
  if (!c) {
    return head + `<section class="card empty" style="margin-top:18px"><h3 style="margin-bottom:6px">This lesson is still being written</h3>
      <p>Lesson ${w} covers <b>${esc(r.topic)}</b>, with the Canadian French layer “${esc(r.qc)}”.</p>
      <div class="row" style="justify-content:center;margin-top:14px"><a class="btn ghost" href="#path">Back to the path</a>${w < 168 ? `<a class="btn" href="#w${w + 1}">Next lesson</a>` : ''}</div></section>`;
  }
  if (isGuest() && w > GUEST_LESSONS) return head + registerPanel();
  if (!weekOpen(w)) {
    return head + lockedPanel(`Lesson ${w} is locked`, `Complete lesson ${w - 1} first, or take the placement test to skip ahead.`, `#w${w - 1}`, `Go to lesson ${w - 1}`);
  }
  const tabs = `<nav class="day-tabs">${DAYS.map((x, k) => `<a class="day-tab ${k === d ? 'on' : ''} ${dayOpen(w, k) ? '' : 'locked'}" href="#w${w}-d${k + 1}"${k === d ? ' aria-current="page"' : ''}>
    ${wstate(w).days[k] ? `<span class="ok">${ic('check')}</span>` : dayOpen(w, k) ? '' : `<span class="ok lk">${ic('lock')}</span>`}<small>Step ${k + 1}</small><b>${x.n}</b></a>`).join('')}</nav>`;
  if (!dayOpen(w, d)) {
    return head + tabs + lockedPanel(`Step ${d + 1} is locked`, `Pass step ${d}: ${DAYS[d - 1].n} to open it. Each step ends with a short check.`, `#w${w}-d${d}`, `Go to step ${d}`);
  }
  const next = d < 5 ? `#w${w}-d${d + 2}` : (w < 168 ? `#w${w + 1}` : '#progress');
  const nextLabel = d < 5 ? `Step ${d + 2}: ${DAYS[d + 1].n}` : (w < 168 ? `Lesson ${w + 1}` : 'See progress');
  // Every day ends in an evaluation; passing it unlocks the next day.
  const check = (title, note, items, pass, kind) => {
    later(() => runner($(`#chk-${d}`), items, {
      nextHref: next, nextLabel,
      onFinish: pct => {
        recordScore(kind, pct, w);
        if (pct >= pass) { setDay(w, d); return d === 5 && isDone(w) ? `Lesson ${w} complete. Félicitations!` : `Passed. ${nextLabel} is open.`; }
        return `You need ${pass}% to pass. Retry your mistakes, then start again.`;
      },
    }));
    return `<section class="eval"><div class="eval-h">${ic('lock')}<div><h3>${title}</h3><div class="sub">${note} Pass mark: ${pass}%.${wstate(w).days[d] ? ' You already passed this.' : ''}</div></div></div><div id="chk-${d}"></div></section>`;
  };
  const foot = () => wstate(w).days[d] ? `<div class="day-foot"><span class="sub">${ic('check')} Step ${d + 1} passed</span><a class="btn" href="${next}">${esc(nextLabel)} ${ic('arrow')}</a></div>` : '';
  Object.assign(foot, { check });
  const body = [dayLearn, dayDrill, dayVocab, dayListen, daySpeak, dayQuiz][d](w, c, r, { next, nextLabel, foot });
  return head + tabs + body;
}

function dayLearn(w, c, r, { foot }) {
  const secs = c.learn.map(s => `<section class="card learn-sec"><h3>${md(s.h)}</h3>${s.body.map(p => `<p>${md(p)}</p>`).join('')}
    ${s.table ? `<div class="table-wrap"><table class="t"><thead><tr>${s.table.head.map(h => `<th>${md(h)}</th>`).join('')}</tr></thead>
      <tbody>${s.table.rows.map(row => `<tr>${row.map(x => `<td>${md(x)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : ''}
    ${s.tip ? `<div class="tip">${ic('bulb')}<span>${md(s.tip)}</span></div>` : ''}</section>`).join('');
  const ex = `<section class="card" id="ex-card"><div class="card-h"><span class="ico">${ic('chat')}</span><h2>Examples (${c.examples.length})</h2>
    <div class="row" style="margin-left:auto"><button class="btn sm ghost" data-act="hide-en" data-target="ex-card">${ic('eye')} Hide English</button><button class="btn sm soft" data-act="play-all">${ic('play')} Play all</button></div></div>
    <div class="ex-list">${c.examples.map(e => `<div class="ex"><div style="min-width:0"><div class="fr">${esc(e.fr)}</div><div class="en">${esc(e.en)}</div>${e.note ? `<div class="note">${md(e.note)}</div>` : ''}</div>
      <div class="acts">${sayBtn(e.fr, true)}</div></div>`).join('')}</div></section>`;
  const qc = quebecCard(c.quebec, r.qc);
  later(() => {
    const btn = $('[data-act="play-all"]');
    if (btn) btn.onclick = () => {
      const rows = $$('#ex-card .ex');
      TTS.sequence(c.examples.map(e => ({ text: e.fr })), i => rows.forEach((el, k) => el.style.background = k === i ? 'var(--primary-soft)' : ''));
    };
  });
  const side = `<aside class="stack"><section class="card side-note">
      <div class="sn"><small>This lesson's Canadian French layer</small>${esc(r.qc)}</div>
      <div class="sn"><small>Six steps</small>${DAYS.map((x, k) => `<div class="row" style="gap:8px;margin-top:4px"><span class="chip ${wstate(w).days[k] ? 'green' : 'grey'}">${wstate(w).days[k] ? ic('check') : k + 1}</span><a href="#w${w}-d${k + 1}" style="color:inherit;text-decoration:none">${x.n}</a></div>`).join('')}</div>
      <div class="sn"><small>In this lesson</small>${c.learn.length} sections · ${c.examples.length} examples · ${c.drills.length} drills · ${c.vocab.length} words · ${c.quiz.length}-question quiz</div>
    </section></aside>`;
  return `<div class="lesson-grid"><div class="stack">${secs}${ex}${qc}
    ${foot.check('Lesson check', 'Six questions on this lesson\'s examples and Canadian French layer.', learnCheck(c), PASS.learn, 'lesson check')}</div>${side}</div>`;
}
function quebecCard(q, label) {
  return `<section class="card"><div class="card-h"><span class="ico">${ic('chat')}</span><div><h2>Canadian French layer</h2><div class="sub">${esc(label || '')}</div></div></div>
    <p style="margin-bottom:12px">${md(q.intro)}</p>
    <div class="table-wrap"><table class="t qc-table"><thead><tr><th>Standard French</th><th>What you'll hear in Canada</th><th>English</th></tr></thead><tbody>
    ${q.items.map(x => `<tr><td>${esc(x.std)}${sayBtn(x.std)}</td><td class="qc-cell">${esc(x.qc)}${sayBtn(x.qc)}</td><td>${esc(x.en)}${x.note ? `<div class="sub">${md(x.note)}</div>` : ''}</td></tr>`).join('')}
    </tbody></table></div></section>`;
}

function dayDrill(w, c, r, { foot }) {
  return foot.check('Drill', `${c.drills.length} exercises: multiple choice, fill in the blank, sentence building and translation. Press Enter to check.`, c.drills, PASS.drill, 'drill');
}

let vocabMode = 'list';
function dayVocab(w, c, r, { next, nextLabel, foot }) {
  later(() => {
    $$('[data-vm]').forEach(b => b.onclick = () => { vocabMode = b.dataset.vm; render(); });
    if (vocabMode === 'cards') flashcards($('#vh'), shuffle(c.vocab));
  });
  return `<div class="row" style="margin-bottom:14px"><div class="seg"><button data-vm="list" class="${vocabMode === 'list' ? 'on' : ''}">Word list</button><button data-vm="cards" class="${vocabMode === 'cards' ? 'on' : ''}">Flashcards</button></div>
    <span class="sub">${c.vocab.length} words · ${c.vocab.filter(v => state.known[vkey(v)]).length} known</span></div>
    <div id="vh">${vocabMode === 'list' ? `<div class="vgrid">${c.vocab.map(vcard).join('')}</div>` : ''}</div>
    <div style="margin-top:18px">${foot.check('Vocabulary test', 'Eight questions, French to English and back. Passing adds these words to your Review queue.', vocabTest(c), PASS.vocab, 'vocab test')}</div>`;
}
function vcard(v) {
  const k = state.known[vkey(v)];
  return `<div class="vcard ${k ? 'known' : ''}"><div class="top"><b>${esc(v.fr)}</b>${v.g ? `<span class="chip grey">${v.g}.</span>` : ''}${v.qc ? '<span class="chip qc">QC</span>' : ''}${sayBtn(v.fr)}</div>
    <div class="en">${esc(v.en)}</div>${v.ex ? `<div class="ex">${esc(v.ex)} <button class="say" style="width:22px;height:22px" data-say="${esc(v.ex)}" aria-label="Listen to example">${ic('volume')}</button></div>` : ''}
    <button class="known-btn" data-act="known" data-k="${esc(vkey(v))}">${ic('check')} ${k ? 'Known' : 'Mark as known'}</button>${v._w ? `<span class="sub" style="font-size:11.5px">Lesson ${v._w}</span>` : ''}</div>`;
}

function dayListen(w, c, r, { foot }) {
  const L = c.listen;
  later(() => {
    const btn = $('[data-act="play-dialogue"]');
    btn.onclick = () => {
      const lines = $$('#dlg .dl');
      TTS.sequence(L.dialogue.map(x => ({ text: x.fr, pitch: x.s === 'B' ? 0.8 : 1.1 })), i => lines.forEach((el, k) => el.classList.toggle('playing', k === i)));
    };
  });
  return `<div class="stack">
    <section class="card"><div class="card-h"><span class="ico">${ic('mic')}</span><h2>Pronunciation focus</h2></div>
      <div class="pron">${L.pron.map(p => `<div><div class="row"><b>${esc(p.fr)}</b><span style="margin-left:auto" class="row">${sayBtn(p.fr, true)}</span></div><small>${md(p.tip)}</small></div>`).join('')}</div></section>
    <section class="card" id="dlg-card"><div class="card-h"><span class="ico">${ic('headphones')}</span><div><h2>Dialogue: ${esc(L.title)}</h2><div class="sub">Listen first with the English hidden, then check.</div></div>
      <div class="row" style="margin-left:auto"><button class="btn sm ghost" data-act="hide-en" data-target="dlg-card">${ic('eye')} Hide English</button><button class="btn sm" data-act="play-dialogue">${ic('play')} Play dialogue</button></div></div>
      <div id="dlg">${L.dialogue.map(x => `<div class="dl ${x.s === 'B' ? 'b' : ''}"><span class="sp">${esc(x.s)}</span><div class="bubble"><div class="fr">${esc(x.fr)}</div><div class="en">${esc(x.en)}</div></div>${sayBtn(x.fr)}</div>`).join('')}</div></section>
    ${foot.check('Listening check', 'Comprehension questions on the dialogue, then two lines of dictation.', listenTest(c), PASS.listen, 'listening')}</div>`;
}

function daySpeak(w, c, r, { foot, next, nextLabel }) {
  const need = minWords(w);
  later(() => {
    const ta = $('#write-in');
    let t;
    const req = () => {
      const spoken = c.speak.filter((_, i) => state.practiced[`${w}-${i}`]).length, words = wordCount(ta.value);
      const ok = spoken === c.speak.length && words >= need;
      $('#sw-req').innerHTML = `<div class="req ${spoken === c.speak.length ? 'met' : ''}">${ic('check')} Practise all ${c.speak.length} speaking prompts (${spoken}/${c.speak.length})</div>
        <div class="req ${words >= need ? 'met' : ''}">${ic('check')} Write at least ${need} words (${words}/${need})</div>
        <div class="row" style="margin-top:12px">${wstate(w).days[4] ? `<a class="btn" href="${next}">${esc(nextLabel)} ${ic('arrow')}</a>`
          : `<button class="btn" id="sw-submit" ${ok ? '' : 'disabled'}>Submit step 5 ${ic('arrow')}</button>`}</div>`;
      const sb = $('#sw-submit');
      if (sb) sb.onclick = () => { setDay(w, 4); toast('Step 5 passed.'); location.hash = next; };
    };
    ta.oninput = () => { req(); clearTimeout(t); t = setTimeout(() => { state.writes[w] = ta.value; save(); const s = $('#write-saved'); if (s) s.textContent = 'Saved in this browser'; }, 400); };
    $$('[data-act="practiced"]').forEach(b => b.onclick = () => { state.practiced[b.dataset.k] = 1; touch(); save(); b.classList.add('good'); b.innerHTML = `${ic('check')} Practised`; req(); });
    req();
    $$('[data-act="rec"]').forEach(b => b.onclick = () => {
      const i = +b.dataset.i, model = c.speak[i].model;
      b.classList.add('on'); b.innerHTML = `${ic('mic')} Listening…`;
      hear().then(txt => {
        $(`#heard-${i}`).innerHTML = `<div class="heard">I heard: <b>${esc(txt || '(nothing)')}</b>${txt ? ` · ${Math.round(similarity(txt, model) * 100)}% overlap with the model` : ''}</div>`;
        if (txt) { state.practiced[`${w}-${i}`] = 1; req(); }
        touch(); save();
      }).catch(() => toast('The microphone is not available here. Say it aloud and compare with the model.'))
        .finally(() => { b.classList.remove('on'); b.innerHTML = `${ic('mic')} Record`; });
    });
  });
  return `<div class="stack">
    <section class="card"><div class="card-h"><span class="ico">${ic('mic')}</span><div><h2>Speak</h2><div class="sub">Answer out loud first. Then reveal and play the model answer and say it again.${SR ? '' : ' Recording works in Chrome or Edge when the app runs from your computer.'}</div></div></div>
      ${c.speak.map((s, i) => `<div class="prompt"><b>${i + 1}. ${md(s.prompt)}</b>
        <div class="row" style="margin-top:10px">${SR ? `<button class="btn sm ghost rec" data-act="rec" data-i="${i}">${ic('mic')} Record</button>` : ''}
        <button class="btn sm soft" data-act="reveal" data-target="model-${i}">${ic('eye')} Show model</button>
        <button class="btn sm ${state.practiced[`${w}-${i}`] ? 'good' : 'ghost'}" data-act="practiced" data-k="${w}-${i}">${ic('check')} ${state.practiced[`${w}-${i}`] ? 'Practised' : 'I said it out loud'}</button></div>
        <div id="heard-${i}"></div>
        <div class="model" id="model-${i}" hidden><span style="flex:1">${esc(s.model)}</span>${sayBtn(s.model, true)}</div></div>`).join('')}</section>
    <section class="card"><div class="card-h"><span class="ico">${ic('pen')}</span><div><h2>Write</h2><div class="sub">${md(c.write.prompt)}</div></div></div>
      <textarea class="input" id="write-in" rows="6" placeholder="Écris ici…">${esc(state.writes[w] || '')}</textarea>
      <div class="row" style="margin-top:10px"><span class="sub" id="write-saved"></span><button class="btn sm soft" style="margin-left:auto" data-act="reveal" data-target="wmodel">${ic('eye')} Show model answer</button></div>
      <div class="prompt" style="margin-top:12px;border:0;padding:0"><div class="model" id="wmodel" hidden><span style="flex:1">${esc(c.write.model)}</span>${sayBtn(c.write.model)}</div></div></section>
    <section class="eval"><div class="eval-h">${ic('lock')}<div><h3>Step 5 requirements</h3><div class="sub">Speaking and writing can't be auto-graded, so the step passes once you've done the work.</div></div></div><div id="sw-req"></div></section></div>`;
}

function dayQuiz(w, c, r, { foot }) {
  const cp = isCheckpoint(r);
  return foot.check(cp ? 'Checkpoint test' : 'Lesson quiz', `${c.quiz.length} questions on the whole lesson${cp ? '. Checkpoints need a higher score' : ''}.`, c.quiz.map(q => Object.assign({ t: 'mcq' }, q)), quizPass(w), 'quiz');
}

// ---------- Practice ----------
let practiceScope = 'mine';
const MODES = [
  { id: 'mixed', name: 'Mixed drills', icon: 'target', tone: 'blue', desc: 'Sentence drills from your lessons' },
  { id: 'quiz', name: 'Grammar quiz', icon: 'file', tone: 'violet', desc: '10 quiz questions' },
  { id: 'listen', name: 'Listening dictation', icon: 'headphones', tone: 'blue', desc: 'Hear a sentence, type it' },
  { id: 'speak', name: 'Speaking practice', icon: 'mic', tone: 'green', desc: 'Hear it, repeat it, check yourself' },
  { id: 'cards', name: 'Flashcards', icon: 'cards', tone: 'red', desc: '20 words from your lessons' },
  { id: 'quebec', name: 'Canadian ear', icon: 'chat', tone: 'amber', desc: 'Match standard French to Canadian speech' },
  { id: 'verbs', name: 'Conjugation', icon: 'zap', tone: 'violet', desc: 'Verbs in the tenses you know' },
];
function practicePool() {
  const cw = currentWeek();
  if (practiceScope === 'week') return weeksWith(cw, cw);
  if (practiceScope === 'all') return weeksWith(1, isGuest() ? GUEST_LESSONS : 168);
  return weeksWith(1, cw);
}
function viewPractice(mode) {
  const m = MODES.find(x => x.id === mode);
  const pool = practicePool();
  later(() => {
    $$('[data-ps]').forEach(b => b.onclick = () => { practiceScope = b.dataset.ps; render(); });
    if (!m) return;
    const host = $('#p-host');
    if (!pool.length) { host.innerHTML = `<div class="card empty">No lessons in this range yet. Try “Everything”.</div>`; return; }
    const done = pct => { recordScore(m.id, pct); markDaily('practice'); log(`Practice: ${m.name}, ${pct}%`, m.icon); save(); return ''; };
    const all = k => pool.flatMap(c => tag(c[k] || [], c.w));
    if (m.id === 'mixed') runner(host, sample(all('drills'), 12), { onFinish: done });
    else if (m.id === 'quiz') runner(host, sample(all('quiz'), 10).map(q => Object.assign({ t: 'mcq' }, q)), { onFinish: done });
    else if (m.id === 'listen') runner(host, sample(all('examples').filter(e => e.fr.split(' ').length <= 10), 8).map(e => ({ t: 'dict', fr: e.fr, en: e.en, why: e.en, _w: e._w })), { onFinish: done });
    else if (m.id === 'speak') runner(host, sample(all('examples'), 8).map(e => ({ t: 'shadow', fr: e.fr, en: e.en, _w: e._w })), { onFinish: done });
    else if (m.id === 'cards') flashcards(host, sample(allVocab(pool), 20), { onDone: (k, n) => { markDaily('practice'); log(`Flashcards: ${k} of ${n} known`, 'cards'); save(); } });
    else if (m.id === 'verbs') {
      const vs = (EX.verbs || []).filter(v => !state.settings.lock || v.week <= currentWeek());
      const items = verbItems(vs, 12);
      if (!items.length) host.innerHTML = verbsNotYet();
      else runner(host, items, { onFinish: done });
    }
    else if (m.id === 'quebec') {
      const items = pool.flatMap(c => tag((c.quebec || {}).items || [], c.w));
      runner(host, sample(items, 10).map(x => {
        const wrong = sample(items.filter(y => y.qc !== x.qc), 3).map(y => y.qc);
        const options = shuffle([x.qc, ...wrong]);
        return { t: 'mcq', q: `How might you hear this in casual Canadian French? *${x.std}*`, options, a: options.indexOf(x.qc), why: `${x.en}${x.note ? ` · ${x.note}` : ''}`, _w: x._w };
      }), { onFinish: done });
    }
  });
  const cw = currentWeek();
  return `<div class="page-head"><div><h1>Practice</h1><p>Short sessions built from your lessons. Pick a mode and a range.</p></div>
    <div class="seg" style="margin-left:auto">${[['week', `Lesson ${cw} only`], ['mine', `Lessons 1–${cw}`], ['all', isGuest() ? 'Free week' : 'Everything']].map(([k, l]) => `<button data-ps="${k}" class="${practiceScope === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
    <div class="tiles" style="grid-template-columns:repeat(auto-fill,minmax(160px,1fr));margin-bottom:20px">
      ${MODES.map(x => `<a class="tile ${x.tone}" href="#practice-${x.id}" ${m && m.id === x.id ? 'style="box-shadow:0 0 0 2px currentColor"' : ''}>${ic(x.icon)}${x.name}<small>${x.desc}</small></a>`).join('')}
    </div>
    ${m ? `<div id="p-host"></div>` : `<div class="card empty">Choose a mode above to start. ${pool.length} lesson${pool.length === 1 ? '' : 's'} in range.</div>`}`;
}

// ---------- Vocabulary ----------
const vocabF = { q: '', phase: 'all', qc: false, hideKnown: false, limit: 120 };
function viewVocab() {
  const all = allVocab(weeksWith(1, isGuest() ? GUEST_LESSONS : 168));
  const known = all.filter(v => state.known[vkey(v)]).length;
  const list = () => {
    const q = loose(vocabF.q);
    return all.filter(v => (vocabF.phase === 'all' || phaseOf(v._w).id === vocabF.phase) && (!vocabF.qc || v.qc) && (!vocabF.hideKnown || !state.known[vkey(v)])
      && (!q || loose(v.fr).includes(q) || loose(v.en).includes(q)));
  };
  const drawList = () => {
    const l = list();
    $('#v-count').textContent = `${l.length} word${l.length === 1 ? '' : 's'}`;
    $('#v-grid').innerHTML = l.length ? l.slice(0, vocabF.limit).map(vcard).join('') : `<div class="empty">No words match.</div>`;
    $('#v-more').hidden = l.length <= vocabF.limit;
  };
  later(() => {
    drawList();
    $('#v-q').oninput = e => { vocabF.q = e.target.value; vocabF.limit = 120; drawList(); };
    $('#v-qc').onchange = e => { vocabF.qc = e.target.checked; drawList(); };
    $('#v-hk').onchange = e => { vocabF.hideKnown = e.target.checked; drawList(); };
    $$('[data-vp]').forEach(b => b.onclick = () => { vocabF.phase = b.dataset.vp; $$('[data-vp]').forEach(x => x.classList.toggle('on', x === b)); drawList(); });
    $('#v-more').onclick = () => { vocabF.limit += 200; drawList(); };
    $('#v-cards').onclick = () => { const host = $('#v-fc'); host.hidden = false; flashcards(host, sample(list(), 25)); host.scrollIntoView({ behavior: 'smooth' }); };
  });
  return `<div class="page-head"><div><h1>Vocabulary</h1><p>${all.length} words from your lessons · ${known} marked as known.${isGuest() ? ' Register free to see the vocabulary of all 168 lessons.' : ''}</p></div>
    <button class="btn" id="v-cards" style="margin-left:auto">${ic('cards')} Flashcards from this list</button></div>
    <div class="card" style="margin-bottom:16px"><div class="row">
      <input class="input" id="v-q" type="search" placeholder="Search French or English…" value="${esc(vocabF.q)}" style="max-width:320px" aria-label="Search words">
      <div class="seg">${['all', 'A1', 'A2', 'B1', 'B2'].map(f => `<button data-vp="${f}" class="${vocabF.phase === f ? 'on' : ''}">${f === 'all' ? 'All' : f}</button>`).join('')}</div>
      <label class="row" style="gap:6px"><input type="checkbox" id="v-qc" ${vocabF.qc ? 'checked' : ''}> Canadian only</label>
      <label class="row" style="gap:6px"><input type="checkbox" id="v-hk" ${vocabF.hideKnown ? 'checked' : ''}> Hide known</label>
      <span class="sub" id="v-count" style="margin-left:auto"></span></div></div>
    <div id="v-fc" hidden style="margin-bottom:18px"></div>
    <div class="vgrid" id="v-grid"></div>
    <div style="text-align:center;margin-top:16px"><button class="btn ghost" id="v-more" hidden>Show more</button></div>`;
}

// ---------- Grammar ----------
let grammarQ = '';
function viewGrammar() {
  const draw = () => {
    const q = loose(grammarQ);
    $('#g-list').innerHTML = PHASES.map(p => {
      const rows = RM.filter(r => r.w >= p.from && r.w <= p.to).filter(r => {
        if (!q) return true;
        const c = WK[r.w];
        return loose(r.topic + ' ' + r.qc + ' ' + (c ? c.learn.map(s => s.h + ' ' + s.body.join(' ')).join(' ') : '')).includes(q);
      });
      if (!rows.length) return '';
      return `<section class="card phase-block"><div class="card-h"><h2>${p.id} · ${p.name}</h2><span class="sub">${rows.length} topic${rows.length === 1 ? '' : 's'}</span></div>
        <div class="table-wrap"><table class="t"><thead><tr><th style="width:60px">Lesson</th><th>Topic</th><th>What the lesson covers</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td><a href="#w${r.w}-d1"><b>${r.w}</b></a></td><td><a href="#w${r.w}-d1" style="color:inherit;font-weight:650">${esc(r.topic)}</a></td>
          <td>${WK[r.w] ? WK[r.w].learn.map(s => `<span class="chip grey" style="margin:2px">${esc(plainText(s.h))}</span>`).join('') : '<span class="sub">Coming soon</span>'}</td></tr>`).join('')}
        </tbody></table></div></section>`;
    }).join('') || `<div class="card empty">Nothing matches “${esc(grammarQ)}”.</div>`;
  };
  later(() => { draw(); $('#g-q').oninput = e => { grammarQ = e.target.value; draw(); }; });
  return `<div class="page-head"><div><h1>Grammar Guide</h1><p>Every rule in the course. Open a lesson to read it in full with examples.</p></div>
    <input class="input" id="g-q" type="search" placeholder="Search rules, e.g. subjonctif, pronoun y…" value="${esc(grammarQ)}" style="max-width:340px;margin-left:auto" aria-label="Search grammar"></div>
    <div class="stack" id="g-list"></div>`;
}

// ---------- Quebec Corner ----------
let quebecQ = '', quebecOnlySets = false;
function viewQuebec() {
  const weeks = weeksWith(1, 168);
  const draw = () => {
    const q = loose(quebecQ);
    const cards = weeks.filter(c => !quebecOnlySets || /quebec expressions|joual|sacres/i.test(RM[c.w - 1].topic)).map(c => {
      const items = c.quebec.items.filter(x => !q || loose(x.std + ' ' + x.qc + ' ' + x.en).includes(q));
      if (!items.length) return '';
      return `<section class="card"><div class="card-h"><a class="chip" href="#w${c.w}" style="text-decoration:none">Lesson ${c.w}</a><h3>${esc(RM[c.w - 1].qc)}</h3></div>
        <div class="table-wrap"><table class="t qc-table"><thead><tr><th>Standard</th><th>Canadian</th><th>English</th></tr></thead><tbody>
        ${items.map(x => `<tr><td>${esc(x.std)}${sayBtn(x.std)}</td><td class="qc-cell">${esc(x.qc)}${sayBtn(x.qc)}</td><td>${esc(x.en)}${x.note ? `<div class="sub">${md(x.note)}</div>` : ''}</td></tr>`).join('')}
        </tbody></table></div></section>`;
    }).join('');
    $('#q-list').innerHTML = cards || `<div class="card empty">Nothing matches.</div>`;
  };
  later(() => {
    draw();
    $('#q-q').oninput = e => { quebecQ = e.target.value; draw(); };
    $('#q-sets').onchange = e => { quebecOnlySets = e.target.checked; draw(); };
  });
  return `<div class="page-head"><div><h1>Canadian French</h1><p>Standard French first, then what you'll actually hear across French Canada: Montréal, Québec City, Ottawa–Gatineau, Northern Ontario, Manitoba and on Radio-Canada. These forms come from Quebec French, the variety most Canadian francophones speak; Acadian French in New Brunswick and Nova Scotia has its own features. Casual forms are for listening and friends, not formal writing.</p></div></div>
    <div class="card" style="margin-bottom:16px"><div class="row">
      <input class="input" id="q-q" type="search" placeholder="Search: chum, pantoute, frette…" value="${esc(quebecQ)}" style="max-width:320px" aria-label="Search Canadian French expressions">
      <label class="row" style="gap:6px"><input type="checkbox" id="q-sets" ${quebecOnlySets ? 'checked' : ''}> Expression and joual lessons only</label>
      <a class="btn sm soft" href="#practice-quebec" style="margin-left:auto">${ic('headphones')} Train your Canadian ear</a></div></div>
    <div class="stack" id="q-list"></div>`;
}

// ---------- Progress & settings ----------
let resetArmed = false;
function viewProgress() {
  const cw = currentWeek(), done = weeksDone();
  const daysTotal = RM.reduce((n, r) => n + daysDone(r.w), 0);
  const recent = state.scores.slice(-12).reverse();
  later(() => {
    const vs = $('#s-voice');
    const fill = () => {
      const voices = TTS.voices();
      vs.innerHTML = `<option value="">Automatic (Canadian French if available)</option>` + voices.map(v => `<option value="${esc(v.name)}" ${v.name === state.settings.voice ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
    };
    fill();
    if (TTS.ok) speechSynthesis.onvoiceschanged = fill;
    vs.onchange = () => { state.settings.voice = vs.value; save(); TTS.say('Bonjour! Ça va bien?'); };
    $('#s-rate').oninput = e => { state.settings.rate = +e.target.value; $('#s-rate-v').textContent = `${state.settings.rate.toFixed(2)}×`; save(); };
    $('#s-name').onchange = e => { state.name = e.target.value.trim() || state.name; save(); drawShell('progress'); };
    $$('[data-goal]').forEach(b => b.onclick = () => { state.goal = b.dataset.goal; save(); render(); });
    $('#s-export').onclick = () => {
      const blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = `bonjourly-progress-${localDate()}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      toast('Backup saved to your Downloads folder.');
    };
    $('#s-import').onchange = e => {
      const f = e.target.files[0]; if (!f) return;
      f.text().then(txt => {
        const d = JSON.parse(txt);
        if (!d || typeof d.weeks !== 'object') throw new Error('not a Bonjourly backup');
        state = Object.assign(freshState(), d, { settings: Object.assign(freshState().settings, d.settings) });
        save(); toast('Progress restored.'); render();
      }).catch(() => toast('That file is not a Bonjourly backup.'));
    };
    $('#s-lock').onchange = e => { state.settings.lock = e.target.checked; save(); toast(e.target.checked ? 'Section locks on.' : 'Section locks off. Everything is open.'); };
    $('#s-reset').onclick = () => {
      if (!resetArmed) { resetArmed = true; $('#s-reset').textContent = 'Click again to erase all progress'; return; }
      resetArmed = false; state = freshState(); save(); toast('Progress reset.'); render();
    };
  });
  return `<div class="page-head"><div><h1>Progress</h1><p>${isGuest() ? 'Guest mode: progress lasts until you close the browser. Register free to save it.' : 'Saved in this browser.'} You're on lesson ${cw}, month ${monthOf(cw)} of the 6-month plan.</p></div></div>
  <div class="stack">
    <div class="big-stats">
      <div class="card"><b>${done}</b><span>lessons completed of 168</span></div>
      <div class="card"><b>${daysTotal}</b><span>lesson steps passed</span></div>
      <div class="card"><b>${Object.keys(state.known).length}</b><span>words known</span></div>
      <div class="card"><b>${streak()}</b><span>day practice streak</span></div>
    </div>
    <section class="card"><div class="card-h"><h2>Phases</h2></div><div class="stack" style="gap:12px">
      ${PHASES.map(p => { const size = p.to - p.from + 1, n = RM.filter(r => r.w >= p.from && r.w <= p.to && isDone(r.w)).length;
        return `<div><div class="row" style="justify-content:space-between"><b>${p.id} ${p.name}</b><span class="sub">${n}/${size} · ${esc(p.goal)}</span></div><div class="bar" style="margin-top:6px"><span style="width:${n / size * 100}%"></span></div></div>`; }).join('')}
    </div></section>
    <section class="card"><div class="card-h"><h2>Badges</h2><span class="sub" style="margin-left:auto">${badges().filter(b => b.got).length} of ${badges().length} earned</span></div>
      <div class="badges">${badges().map(b => `<div class="badge-i ${b.got ? 'got' : ''}" title="${esc(b.how)}"><span>${ic(b.icon)}</span><b>${esc(b.name)}</b><small>${esc(b.how)}</small></div>`).join('')}</div></section>
    <section class="card"><div class="card-h"><h2>Certificates</h2><span class="sub" style="margin-left:auto">Earned by passing each phase's milestone test</span></div>
      <div class="certs">${PHASES.map(p => isDone(p.to) ? certificate(p) : `<div class="cert locked"><div class="cert-in"><span class="lock-ico">${ic('lock')}</span><h3>${p.id} · ${p.name}</h3><p class="sub">Pass the lesson ${p.to} milestone test</p></div></div>`).join('')}</div></section>
    <section class="card"><div class="card-h"><h2>All 168 lessons</h2><span class="sub" style="margin-left:auto">6 months at one lesson a day</span></div>
      <div class="wgrid">${RM.map(r => `<a href="#w${r.w}" class="${isDone(r.w) ? 'done' : r.w === cw ? 'cur' : daysDone(r.w) ? 'part' : ''}" title="Lesson ${r.w}: ${esc(r.topic)}">${r.w}</a>`).join('')}</div>
      <div class="legend"><span><i style="background:var(--good)"></i>Done</span><span><i style="background:var(--primary)"></i>Current</span><span><i style="background:var(--t-amber)"></i>Started</span><span><i></i>Not started</span></div></section>
    <div class="grid2">
      <section class="card"><div class="card-h"><h2>Recent scores</h2></div>
        ${recent.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>When</th><th>Activity</th><th style="text-align:right">Score</th></tr></thead><tbody>
          ${recent.map(s => `<tr><td>${ago(s.t)}</td><td>${esc(s.kind)}${s.w ? ` · lesson ${s.w}` : ''}</td><td style="text-align:right;font-variant-numeric:tabular-nums"><span class="chip ${s.pct >= 80 ? 'green' : s.pct >= 60 ? 'amber' : 'red'}">${s.pct}%</span></td></tr>`).join('')}
          </tbody></table></div>` : `<div class="empty">Drill, quiz and practice scores appear here.</div>`}</section>
      <section class="card"><div class="card-h"><h2>Settings</h2></div><div class="stack" style="gap:14px">
        <label class="field">Your name<input class="input" id="s-name" value="${esc(state.name)}"></label>
        <label class="field">French voice<select class="input" id="s-voice"></select></label>
        <label class="field">Speech speed <span class="sub" id="s-rate-v">${state.settings.rate.toFixed(2)}×</span><input type="range" id="s-rate" min="0.5" max="1.3" step="0.05" value="${state.settings.rate}"></label>
        <div class="field">Goal for Phase 4 <span class="sub">Conversation keeps the plan as written. An exam turns lessons 152, 160, 161, 163 and 165 into exam-format practice.</span>
          <div class="seg">${[['conv', 'Conversation'], ['tef', 'TEF Canada'], ['delf', 'DELF B2'], ['undecided', 'Undecided']].map(([k, l]) => `<button data-goal="${k}" class="${state.goal === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
        <label class="row" style="gap:8px;font-weight:600"><input type="checkbox" id="s-lock" ${state.settings.lock ? 'checked' : ''}> Section locks <span class="sub" style="font-weight:500">Steps and lessons open only after you pass the previous one.</span></label>
        <div class="field">Already know some French?<div class="row"><a class="btn sm ghost" href="#placement">${ic('target')} Take the placement test</a>${state.placed ? `<span class="sub">Lessons 1–${state.placed} unlocked by placement</span>` : ''}</div></div>
        <div class="field">Back up your progress <span class="sub">Progress lives in this browser only. Save a backup file now and then, and load it on another device or browser.</span>
          <div class="row"><button class="btn sm ghost" id="s-export">${ic('arrow')} Save backup file</button>
          <label class="btn sm ghost" for="s-import">${ic('refresh')} Load backup file</label><input type="file" id="s-import" accept=".json,application/json" hidden></div></div>
        <div><button class="btn sm ghost" id="s-reset" style="color:var(--bad)">Reset all progress</button></div>
      </div></section>
    </div>
  </div>`;
}

// ---------- Search ----------
function search(qs) {
  const q = loose(qs);
  if (q.length < 2) return '';
  const lessons = RM.filter(r => loose(r.topic + ' ' + r.qc).includes(q)).slice(0, 6)
    .map(r => `<button data-go="#w${r.w}">Lesson ${r.w}: ${esc(r.topic)}<small>${esc(r.qc)}</small></button>`);
  const words = [], exs = [];
  for (const c of weeksWith(1, 168)) {
    if (words.length < 6) c.vocab.forEach(v => { if (words.length < 6 && (loose(v.fr).includes(q) || loose(v.en).includes(q))) words.push(`<button data-go="#w${c.w}-d3">${esc(v.fr)}<small>${esc(v.en)} · lesson ${c.w}</small></button>`); });
    if (exs.length < 5) c.examples.forEach(e => { if (exs.length < 5 && (loose(e.fr).includes(q) || loose(e.en).includes(q))) exs.push(`<button data-go="#w${c.w}-d1">${esc(e.fr)}<small>${esc(e.en)} · lesson ${c.w}</small></button>`); });
  }
  const grp = (t, a) => a.length ? `<div class="grp">${t}</div>${a.join('')}` : '';
  return grp('Lessons', lessons) + grp('Words', words) + grp('Examples', exs) || `<div class="empty" style="padding:12px">No results for “${esc(qs)}”.</div>`;
}
(function initSearch() {
  const box = $('#search'), inp = $('#search-input'), res = $('#search-results');
  let t;
  inp.oninput = () => { clearTimeout(t); t = setTimeout(() => { const h = search(inp.value); res.innerHTML = h; res.hidden = !h; }, 120); };
  inp.onkeydown = e => { if (e.key === 'Escape') { res.hidden = true; inp.blur(); box.classList.remove('open'); } };
  res.onclick = e => { const b = e.target.closest('[data-go]'); if (b) { location.hash = b.dataset.go; res.hidden = true; inp.value = ''; box.classList.remove('open'); } };
  document.addEventListener('click', e => { if (!box.contains(e.target) && !e.target.closest('#search-toggle')) { res.hidden = true; box.classList.remove('open'); } });
  $('#search-toggle').onclick = () => { box.classList.add('open'); inp.focus(); };
})();

// ---------- Global actions ----------
document.addEventListener('click', e => {
  const s = e.target.closest('[data-say]');
  if (s) { e.preventDefault(); e.stopPropagation(); TTS.say(s.dataset.say, { rate: +s.dataset.rate || 1 }); return; }
  const a = e.target.closest('[data-act]');
  if (!a) return;
  const act = a.dataset.act;
  if (act === 'complete') {
    const w = +a.dataset.w, d = +a.dataset.d;
    if (!wstate(w).days[d]) { setDay(w, d); toast(isDone(w) ? `Lesson ${w} complete!` : `Step ${d + 1} done.`); }
    location.hash = a.dataset.next;
  } else if (act === 'hide-en') {
    const card = document.getElementById(a.dataset.target);
    const on = card.classList.toggle('hide-en');
    a.innerHTML = `${ic('eye')} ${on ? 'Show English' : 'Hide English'}`;
  } else if (act === 'reveal') {
    const el = document.getElementById(a.dataset.target); el.hidden = !el.hidden;
  } else if (act === 'known') {
    const k = a.dataset.k;
    if (state.known[k]) delete state.known[k]; else { state.known[k] = 1; touch(); }
    save();
    const card = a.closest('.vcard'); card.classList.toggle('known', !!state.known[k]);
    a.innerHTML = `${ic('check')} ${state.known[k] ? 'Known' : 'Mark as known'}`;
  }
}, true);

window.addEventListener('hashchange', render);
render();
