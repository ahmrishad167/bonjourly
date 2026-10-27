// Bonjourly profile pages: get-started flow, account sign-up and sign-in, password reset,
// the profile page, and the privacy page. Account logic lives in account.js.
'use strict';

const avatarColor = name => { let h = 0; for (const ch of String(name)) h = (h * 31 + ch.charCodeAt(0)) % 360; return `hsl(${h} 62% 42%)`; };
const initialsOf = name => String(name || '?').trim().split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
const fmtDate = d => new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' });
const optionList = (list, cur, blank) => (blank ? `<option value="">${blank}</option>` : '') + list.map(([k, l]) => `<option value="${k}" ${k === cur ? 'selected' : ''}>${esc(l)}</option>`).join('');
const finishFor = pace => new Date(Date.now() + (168 - weeksDone()) / PACES[pace].perWeek * 7 * 864e5);

// Where to practise for real, near the learner.
const LOCAL = {
  ON: 'TFO and ICI Ontario (Radio-Canada), the Franco-Ontarian festivals, and French services in Ottawa, Sudbury and Hearst.',
  QC: 'Télé-Québec, ICI Radio-Canada Première, your library\'s conversation groups, and everyday life: you\'re surrounded by French.',
  NB: 'ICI Acadie and Radio-Canada Acadie. Acadian French has its own sounds and words; Moncton and the Acadian Peninsula are great places to listen.',
  NS: 'ICI Acadie and the Acadian regions of Clare and Chéticamp. Acadian French differs from Quebec French: listen for it.',
  PE: 'ICI Acadie and the Évangéline region, home to Island Acadian French.',
  NL: 'ICI Radio-Canada Terre-Neuve-et-Labrador and the Franco-Newfoundland community on the Port-au-Port Peninsula.',
  MB: 'ICI Manitoba, Saint-Boniface in Winnipeg, and the Festival du Voyageur every February.',
  SK: 'ICI Saskatchewan and the Fransaskois community centres in Regina, Saskatoon and Gravelbourg.',
  AB: 'ICI Alberta, La Cité francophone in Edmonton, and Campus Saint-Jean.',
  BC: 'ICI Colombie-Britannique et Yukon and the Maillardville community in Coquitlam.',
  YT: 'ICI Colombie-Britannique et Yukon and the Association franco-yukonnaise in Whitehorse.',
  NT: 'ICI Nord and the Fédération franco-ténoise in Yellowknife.',
  NU: 'ICI Nord and the Association des francophones du Nunavut in Iqaluit.',
  outside: 'ICI Radio-Canada and Ohdio podcasts stream worldwide, and TV5 has Canadian programmes.',
};

// ---------- Get started ----------
let startStep = 0;
function viewStart() {
  const w = state.welcome || (state.welcome = {});
  const steps = [
    { title: 'Why are you learning French?', body: `<div class="choice-grid">${GOALS.map(([k, l]) => `<button class="choice ${w.goal === k ? 'on' : ''}" data-pick="goal" data-v="${k}">${esc(l)}</button>`).join('')}</div>` },
    { title: 'Where are you starting?', body: `<div class="choice-grid two">
        <button class="choice ${w.level === 'zero' ? 'on' : ''}" data-pick="level" data-v="zero"><b>I'm a complete beginner</b><small>Start at lesson 1</small></button>
        <button class="choice ${w.level === 'some' ? 'on' : ''}" data-pick="level" data-v="some"><b>I know some French</b><small>Take the placement test next</small></button></div>` },
    { title: 'Choose your pace', body: `<div class="choice-grid">${Object.entries(PACES).map(([k, p]) => `<button class="choice ${w.pace === k ? 'on' : ''}" data-pick="pace" data-v="${k}"><b>${p.label}</b><small>${p.desc}</small><small class="eta">Finish around ${fmtDate(finishFor(k))}</small></button>`).join('')}</div>
        <p class="sub" style="margin-top:10px">You can change your pace any time on your profile.</p>` },
    { title: 'Where do you live?', body: `<label class="field">Province or territory<select class="input" id="st-prov">${optionList(PROVINCES, w.province, 'Choose…')}</select></label>
        <p class="sub" style="margin-top:8px">We use this to suggest French radio, TV and communities near you.</p>` },
    { title: 'Save your progress', body: `<div class="stack" style="gap:10px">
        ${Account.enabled ? `<a class="btn" href="#register">${ic('users')} Create a free account</a>
          <button class="btn ghost" data-act="google-start">${googleIcon()} Continue with Google</button>
          <a class="sub" href="#signin" style="text-align:center">Already have an account? Sign in</a>`
          : `<a class="btn" href="#register">${ic('users')} Create a free profile</a>`}
        <button class="btn ghost" data-act="guest-start">Try the free week first (lessons 1–${GUEST_LESSONS})</button></div>` },
  ];
  const s = steps[Math.min(startStep, steps.length - 1)];
  later(() => {
    $$('[data-pick]').forEach(b => b.onclick = () => { w[b.dataset.pick] = b.dataset.v; save(); if (startStep < 3) startStep++; render(); });
    const pv = $('#st-prov'); if (pv) pv.onchange = () => { w.province = pv.value; save(); startStep = 4; render(); };
    $$('[data-st]').forEach(b => b.onclick = () => { startStep = Math.max(0, startStep + +b.dataset.st); render(); });
    const g = $('[data-act="google-start"]'); if (g) g.onclick = () => { finishStart(); Account.google(w).catch(e => toast(authMessage(e))); };
    const gs = $('[data-act="guest-start"]'); if (gs) gs.onclick = () => { finishStart(); location.hash = w.level === 'some' ? '#placement' : '#w1'; };
  });
  return `<div class="onboard card">
    <div class="ob-top"><img src="logo.svg" alt="" width="40" height="40" onerror="this.remove()"><div class="ob-dots">${steps.map((_, i) => `<span class="${i <= startStep ? 'on' : ''}"></span>`).join('')}</div><span class="sub">Step ${startStep + 1} of ${steps.length}</span></div>
    <h1>${s.title}</h1>${s.body}
    <div class="row" style="margin-top:18px">${startStep ? `<button class="btn ghost sm" data-st="-1">${ic('chevl')} Back</button>` : ''}
      ${startStep < 3 && w[['goal', 'level', 'pace'][startStep]] ? `<button class="btn sm" data-st="1" style="margin-left:auto">Next ${ic('chev')}</button>` : ''}
      ${startStep === 3 ? `<button class="btn sm" data-st="1" style="margin-left:auto">${w.province ? 'Next' : 'Skip'} ${ic('chev')}</button>` : ''}</div></div>`;
}
function finishStart() {
  const w = state.welcome || {};
  if (w.pace && !state.plan) setPlan(w.pace);
  w.done = true; save();
}

// ---------- Create an account ----------
function viewSignup() {
  if (!isGuest() && state.profile.cloud) return viewProfile();
  const w = state.welcome || {};
  later(() => {
    $('#su-form').onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries());
      const msg = $('#su-msg'), btn = $('#su-go');
      if (!f.consent) { msg.className = 'form-msg bad'; msg.textContent = 'Please accept the privacy policy to create an account.'; return; }
      btn.disabled = true; msg.className = 'form-msg'; msg.textContent = 'Creating your account…';
      try {
        state.welcome = Object.assign({}, w, { goal: f.goal || w.goal, pace: f.pace || w.pace, province: f.province || w.province, done: true });
        if (f.pace && !state.plan) setPlan(f.pace);
        save();
        const r = await Account.signUp({ email: f.email.trim(), password: f.password, first_name: f.first_name.trim(), goal: f.goal || null, pace: f.pace || null, province: f.province || null });
        if (r.needsConfirm) { $('#su-box').innerHTML = `<div class="empty"><span class="lock-ico">${ic('check')}</span><h3>Check your email</h3><p>We sent a confirmation link to <b>${esc(f.email)}</b>. Open it on this device to finish creating your account. Your progress so far is kept.</p></div>`; }
      } catch (err) { msg.className = 'form-msg bad'; msg.textContent = authMessage(err); btn.disabled = false; }
    };
    $('[data-act="google-signup"]').onclick = () => Account.google(w).catch(e => toast(authMessage(e)));
  });
  return `<div class="register">
    <section class="card reg-card" id="su-box">
      <img src="logo.svg" alt="" width="56" height="56" onerror="this.remove()">
      <h1>Create your free account</h1><p class="sub">Save your progress and continue on any device.</p>
      <button class="btn ghost google-btn" type="button" data-act="google-signup" style="margin-top:16px">${googleIcon()} Continue with Google</button>
      <div class="or"><span>or with email</span></div>
      <form id="su-form" class="stack" style="gap:12px" novalidate>
        <label class="field">First name<input class="input" name="first_name" autocomplete="given-name" required maxlength="40" value="${esc(isGuest() ? '' : state.name)}"></label>
        <label class="field">Email<input class="input" name="email" type="email" autocomplete="email" required maxlength="120"></label>
        <label class="field">Password <span class="sub" style="font-weight:500">at least 8 characters</span><input class="input" name="password" type="password" autocomplete="new-password" required minlength="8"></label>
        <div class="grid2" style="gap:12px">
          <label class="field">Why you're learning<select class="input" name="goal">${optionList(GOALS, w.goal, 'Choose…')}</select></label>
          <label class="field">Pace<select class="input" name="pace">${optionList(Object.entries(PACES).map(([k, p]) => [k, `${p.label} (about ${p.months} months)`]), w.pace, 'Choose…')}</select></label>
        </div>
        <label class="field">Province or territory<select class="input" name="province">${optionList(PROVINCES, w.province, 'Choose…')}</select></label>
        <label class="consent"><input type="checkbox" name="consent" value="1"> <span>I've read the <a href="#privacy">privacy policy</a> and agree that Bonjourly stores my account and learning progress. I'm 14 or older, or a parent or guardian is creating this account.</span></label>
        <div class="form-msg" id="su-msg" role="status"></div>
        <button class="btn" id="su-go" type="submit">${ic('check')} Create account</button>
        <a class="sub" href="#signin" style="text-align:center">Already have an account? Sign in</a>
      </form>
    </section>
    <section class="card"><div class="card-h"><h3>What you get</h3></div>
      <div class="stack" style="gap:10px">
        <div class="req met">${ic('check')} All 168 lessons, A1 to B2</div>
        <div class="req met">${ic('check')} Progress saved and synced across your devices</div>
        <div class="req met">${ic('check')} Your plan, review queue, badges and certificates</div>
        <div class="req met">${ic('check')} 41 stories and full TEF Canada practice</div>
        <div class="req">${ic('x')} <span>We never sell your data, show ads or upload your voice recordings.</span></div>
      </div></section></div>`;
}

// ---------- Sign in, forgot and reset password ----------
function viewSignin() {
  if (!Account.enabled) return viewWelcome();
  if (Account.user) return viewProfile();
  later(() => {
    $('#si-form').onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries()), msg = $('#si-msg');
      msg.className = 'form-msg'; msg.textContent = 'Signing in…';
      try { await Account.signIn(f.email.trim(), f.password); msg.textContent = 'Signed in.'; }
      catch (err) { msg.className = 'form-msg bad'; msg.textContent = authMessage(err); }
    };
    $('#si-forgot').onclick = async () => {
      const email = $('#si-form [name=email]').value.trim(), msg = $('#si-msg');
      if (!email) { msg.className = 'form-msg bad'; msg.textContent = 'Type your email above, then tap “Forgot password?” again.'; return; }
      try { await Account.forgot(email); msg.className = 'form-msg good'; msg.textContent = `We sent a reset link to ${email}.`; }
      catch (err) { msg.className = 'form-msg bad'; msg.textContent = authMessage(err); }
    };
    $('[data-act="google-signin"]').onclick = () => Account.google().catch(e => toast(authMessage(e)));
  });
  return `<div class="register narrow"><section class="card reg-card">
    <img src="logo.svg" alt="" width="56" height="56" onerror="this.remove()">
    <h1>Welcome back</h1><p class="sub">Sign in to continue where you left off.</p>
    <button class="btn ghost google-btn" type="button" data-act="google-signin" style="margin-top:16px">${googleIcon()} Continue with Google</button>
    <div class="or"><span>or with email</span></div>
    <form id="si-form" class="stack" style="gap:12px">
      <label class="field">Email<input class="input" name="email" type="email" autocomplete="email" required></label>
      <label class="field">Password<input class="input" name="password" type="password" autocomplete="current-password" required></label>
      <div class="form-msg" id="si-msg" role="status"></div>
      <button class="btn" type="submit">Sign in</button>
      <div class="row" style="justify-content:space-between"><button type="button" class="link-btn" id="si-forgot" style="grid-area:auto;padding:0;color:var(--primary)">Forgot password?</button><a class="sub" href="#register">Create an account</a></div>
    </form></section></div>`;
}
function viewResetPassword() {
  later(() => {
    $('#rp-form').onsubmit = async e => {
      e.preventDefault();
      const pw = e.target.password.value, msg = $('#rp-msg');
      try { await Account.newPassword(pw); toast('Password updated.'); location.hash = '#profile'; }
      catch (err) { msg.className = 'form-msg bad'; msg.textContent = authMessage(err); }
    };
  });
  return `<div class="register narrow"><section class="card reg-card"><h1>Choose a new password</h1>
    <form id="rp-form" class="stack" style="gap:12px;margin-top:14px"><label class="field">New password<input class="input" name="password" type="password" autocomplete="new-password" minlength="8" required></label>
    <div class="form-msg" id="rp-msg" role="status"></div><button class="btn" type="submit">Save password</button></form></section></div>`;
}

// ---------- Profile ----------
let deleteArmed = false;
function viewProfile() {
  if (isGuest()) {
    return `<div class="page-head"><div><h1>Profile</h1></div></div>${registerPanel('Create your profile', 'Save your progress, set your pace and see your plan. It takes a minute.')}
      <div class="row" style="justify-content:center;margin-top:12px">${Account.enabled ? '<a href="#signin">Already have an account? Sign in</a>' : ''}</div>`;
  }
  const p = state.profile, cloud = !!p.cloud, plan = planInfo(), cw = currentWeek(), ph = phaseOf(cw);
  const got = badges().filter(b => b.got).length, certs = PHASES.filter(x => isDone(x.to)).length;
  later(() => {
    $('#pf-form').onsubmit = async e => {
      e.preventDefault();
      const f = Object.fromEntries(new FormData(e.target).entries()), msg = $('#pf-msg');
      const name = f.first_name.trim();
      if (!name) { msg.className = 'form-msg bad'; msg.textContent = 'Your first name can\'t be empty.'; return; }
      try {
        if (cloud) await Account.saveProfile({ first_name: name, goal: f.goal || null, province: f.province || null, pace: f.pace || null });
        Object.assign(p, { name, goal: f.goal || null, province: f.province || null, pace: f.pace || null });
        state.name = name;
        if (f.pace && (!state.plan || state.plan.pace !== f.pace)) setPlan(f.pace);
        saveProfiles(profiles().map(x => x.id === p.id ? Object.assign(x, { name }) : x));
        save(); toast('Profile saved.'); render();
      } catch (err) { msg.className = 'form-msg bad'; msg.textContent = authMessage(err); }
    };
    $('#pf-export').onclick = () => {
      const data = { exported: new Date().toISOString(), profile: { first_name: state.name, email: p.email || null, goal: p.goal || null, pace: p.pace || null, province: p.province || null }, progress: state };
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' }));
      a.download = `bonjourly-my-data-${localDate()}.json`; document.body.appendChild(a); a.click(); a.remove();
      toast('Your data was saved to your Downloads folder.');
    };
    const pw = $('#pf-password'); if (pw) pw.onclick = () => Account.forgot(p.email).then(() => toast(`We sent a password link to ${p.email}.`)).catch(e => toast(authMessage(e)));
    $('#pf-signout').onclick = async () => { if (cloud) await Account.signOut().catch(() => {}); signOut(); toast('Signed out. Your progress is saved.'); location.hash = '#welcome'; render(); };
    $('#pf-delete').onclick = async () => {
      if (!deleteArmed) { deleteArmed = true; $('#pf-delete').textContent = cloud ? 'Click again to delete your account and all its data' : 'Click again to delete this profile and its progress'; return; }
      deleteArmed = false;
      try { if (cloud) await Account.deleteAccount(); deleteProfile(p.id); toast(cloud ? 'Your account and data were deleted.' : 'Profile deleted.'); location.hash = '#home'; render(); }
      catch (err) { toast(authMessage(err)); }
    };
  });
  const statusChip = plan ? `<span class="chip ${plan.status === 'behind' ? 'amber' : 'green'}">${plan.status === 'behind' ? `${plan.behindBy} lesson${plan.behindBy === 1 ? '' : 's'} behind` : plan.status === 'ahead' ? 'Ahead of plan' : 'On track'}</span>` : '';
  return `<div class="profile">
    <section class="card pf-head">
      <span class="avatar big" style="background:${avatarColor(p.name)}">${esc(initialsOf(p.name))}</span>
      <div style="flex:1;min-width:0"><h1>${esc(p.name)}</h1>
        <div class="sub">${cloud ? `${esc(p.email || '')} · ${Account.lastSync ? 'synced' : 'online account'}` : 'Saved on this device only'} · learning since ${fmtDate(p.at || Date.now())}</div>
        <div class="row" style="margin-top:8px"><span class="chip">${ph.id} · ${ph.name}</span><span class="chip grey">Lesson ${cw}</span>${statusChip}</div></div>
      <a class="btn sm ghost" href="#welcome">${ic('users')} Switch learner</a>
    </section>
    ${!cloud && Account.enabled ? `<section class="guest-bar">${ic('refresh')}<div><b>Sync this progress online.</b><span>Create a free account to keep ${esc(p.name)}'s progress safe and use it on any device.</span></div><a class="btn sm" href="#register">Create account</a></section>` : ''}
    <div class="grid2">
      <section class="card"><div class="card-h"><span class="ico">${ic('cal')}</span><h2>Your plan</h2></div>
        ${plan ? `<div class="plan-big"><b>${fmtDate(plan.finish)}</b><span class="sub">estimated finish at your ${plan.pace.label.toLowerCase()} pace (${plan.pace.desc.toLowerCase()})</span></div>
          <div class="bar" style="margin:12px 0 6px"><span style="width:${plan.done / 168 * 100}%"></span></div>
          <div class="sub">${plan.done} of 168 lessons done · ${plan.expected} expected by today${plan.status === 'behind' ? '. A couple of extra lessons this week will catch you up.' : '.'}</div>`
          : `<p class="sub">Choose a pace below to get a target date and see whether you're on track.</p>`}
      </section>
      <section class="card"><div class="card-h"><span class="ico">${ic('chart')}</span><h2>At a glance</h2><a class="more" href="#progress">All progress</a></div>
        <div class="glance"><div><b>${weeksDone()}</b><span>lessons done</span></div><div><b>${Object.keys(state.known).length}</b><span>words known</span></div>
          <div><b>${streak()}</b><span>day streak</span></div><div><b>${got}</b><span>badges</span></div><div><b>${certs}</b><span>certificates</span></div></div></section>
    </div>
    <section class="card"><div class="card-h"><span class="ico">${ic('users')}</span><h2>About you</h2></div>
      <form id="pf-form" class="pf-form">
        <label class="field">First name<input class="input" name="first_name" maxlength="40" value="${esc(p.name)}"></label>
        <label class="field">Why you're learning<select class="input" name="goal">${optionList(GOALS, p.goal || (state.welcome || {}).goal, 'Choose…')}</select></label>
        <label class="field">Pace<select class="input" name="pace">${optionList(Object.entries(PACES).map(([k, x]) => [k, `${x.label} (about ${x.months} months)`]), (state.plan || {}).pace || p.pace, 'Choose…')}</select></label>
        <label class="field">Province or territory<select class="input" name="province">${optionList(PROVINCES, p.province || (state.welcome || {}).province, 'Choose…')}</select></label>
        <div class="form-msg" id="pf-msg" role="status"></div>
        <div><button class="btn" type="submit">${ic('check')} Save</button></div>
      </form></section>
    ${(p.province || (state.welcome || {}).province) ? `<section class="card"><div class="card-h"><span class="ico">${ic('flag')}</span><h2>French near you</h2></div><p>${esc(LOCAL[p.province || state.welcome.province] || '')}</p></section>` : ''}
    <section class="card"><div class="card-h"><span class="ico">${ic('lock')}</span><h2>Account and privacy</h2><a class="more" href="#privacy">Privacy policy</a></div>
      <div class="row">
        <button class="btn sm ghost" id="pf-export" type="button">${ic('arrow')} Download my data</button>
        ${cloud ? `<button class="btn sm ghost" id="pf-password" type="button">${ic('lock')} Change password</button>` : ''}
        <button class="btn sm ghost" id="pf-signout" type="button">Sign out</button>
        <button class="btn sm ghost" id="pf-delete" type="button" style="color:var(--bad)">${cloud ? 'Delete my account' : 'Delete this profile'}</button>
      </div></section>
  </div>`;
}

// ---------- Privacy ----------
function viewPrivacy() {
  const region = CFG.dataRegion || 'Canada';
  return `<article class="card privacy learn-sec">
    <h1>Privacy policy</h1><p class="sub">Last updated ${fmtDate('2026-10-26')}. Bonjourly is a free, non-profit French learning app.</p>
    <h3>In short</h3>
    <p>No ads. No selling or sharing your data. No tracking or analytics. You can try the free week without giving us anything.</p>
    <h3>What we collect, and why</h3>
    <p><b>Without an account:</b> nothing leaves your device. Your progress is stored in your browser only.</p>
    ${Account.enabled ? '' : `<p><b>Online accounts are not switched on yet.</b> Today, profiles and progress stay in your browser on this device and nothing is sent to us. The rest of this policy describes what will apply once accounts open.</p>`}
    <p><b>With an account:</b> your email and password (the password is stored encrypted by our provider; we never see it), your first name, and, if you choose to give them, your learning goal, pace and province. We also store your learning progress: lessons, scores, words, review schedule and the texts you write in exercises. We use this only to save your progress, sync it across your devices and personalise your plan.</p>
    <p><b>Google sign-in:</b> if you use it, Google shares your name and email with us. Nothing else.</p>
    <h3>What we never collect</h3>
    <p>Your voice recordings stay on your device and are never uploaded. We don't collect your location, contacts or anything from other sites.</p>
    <p>One exception to know about: the optional <i>Check with speech recognition</i> button uses your browser's speech service (Google in Chrome, Microsoft in Edge), which processes the audio under that company's own privacy policy. Recording yourself with <i>Record yourself</i> does not.</p>
    <h3>Where it's stored</h3>
    <p>Account data is stored by our provider, Supabase, in ${esc(region)}, protected so that only you can read or change your own data.</p>
    <h3>How long we keep it</h3>
    <p>Until you delete your account. Deleting it removes your profile and progress immediately (provider backups expire on their normal schedule).</p>
    <h3>Your rights</h3>
    <p>On your Profile page you can see and correct your information, <b>download all your data</b>, and <b>delete your account</b>. You can withdraw your consent at any time by deleting your account.</p>
    <p>If you are under 14, a parent or guardian must create the account.</p>
    <h3>Contact</h3>
    <p>Questions or requests about your personal information: <a href="${esc(CFG.privacyContact || '#')}" target="_blank" rel="noopener">${esc(CFG.privacyContact || '')}</a>. You can also contact the Office of the Privacy Commissioner of Canada, or in Quebec the Commission d'accès à l'information.</p>
  </article>`;
}

function googleIcon() {
  return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="stroke:none"><path fill="#4285F4" d="M22.5 12.27c0-.8-.07-1.56-.2-2.27H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.55c2.08-1.92 3.25-4.74 3.25-8.03z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.55-2.75c-.98.66-2.24 1.06-3.73 1.06-2.87 0-5.3-1.94-6.16-4.54H2.18v2.84A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.07.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.06l3.66 2.84C6.7 7.32 9.13 5.38 12 5.38z"/></svg>';
}
