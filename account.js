// Bonjourly online accounts (Supabase): sign-up, sign-in, Google, password reset, cloud sync of
// progress and profile, data export and account deletion. Without config.js values the app keeps
// on-device profiles only, and none of this loads.
'use strict';

const CFG = window.BJ_CONFIG || {};
const SUPABASE_JS = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.3/dist/umd/supabase.js';
const PENDING_KEY = 'bonjourly.pending'; // guest progress + welcome answers kept across an email/Google round trip

const GOALS = [['tef', 'TEF Canada exam'], ['citizenship', 'Canadian citizenship'], ['work', 'Work'], ['family', 'Family and friends'], ['moving', 'Moving to a French-speaking area'], ['curiosity', 'For fun'], ['other', 'Something else']];
const PROVINCES = [['AB', 'Alberta'], ['BC', 'British Columbia'], ['MB', 'Manitoba'], ['NB', 'New Brunswick'], ['NL', 'Newfoundland and Labrador'], ['NS', 'Nova Scotia'], ['NT', 'Northwest Territories'], ['NU', 'Nunavut'], ['ON', 'Ontario'], ['PE', 'Prince Edward Island'], ['QC', 'Quebec'], ['SK', 'Saskatchewan'], ['YT', 'Yukon'], ['outside', 'Outside Canada']];
const PACES = {
  intensive: { label: 'Intensive', perWeek: 7, months: 6, desc: 'One lesson a day: about 6 months' },
  steady: { label: 'Steady', perWeek: 3.5, months: 12, desc: 'About 3–4 lessons a week: about 12 months' },
  relaxed: { label: 'Relaxed', perWeek: 2.3, months: 18, desc: 'About 2 lessons a week: about 18 months' },
};
const label = (list, k) => (list.find(x => x[0] === k) || [])[1] || '';

// ---------- Plan: target date and whether the learner is on track ----------
function planInfo() {
  const p = state.plan;
  if (!p || !PACES[p.pace]) return null;
  const pace = PACES[p.pace], done = weeksDone();
  const days = Math.max(0, Math.floor((Date.now() - p.start) / 864e5));
  const expected = Math.min(168, (p.startDone || 0) + Math.floor(days * pace.perWeek / 7));
  const left = 168 - done;
  const finish = new Date(Date.now() + left / pace.perWeek * 7 * 864e5);
  const status = done >= expected + 3 ? 'ahead' : done >= expected - 2 ? 'on track' : 'behind';
  return { pace, done, expected, finish, status, behindBy: Math.max(0, expected - done) };
}
function setPlan(pace) {
  state.plan = { pace, start: Date.now(), startDone: weeksDone() };
}

// ---------- Merging two copies of progress (this device + cloud) ----------
function mergeStates(a, b) {
  if (!b) return a;
  const out = Object.assign({}, b, a);
  out.weeks = {};
  new Set([...Object.keys(a.weeks || {}), ...Object.keys(b.weeks || {})]).forEach(w => {
    const x = (a.weeks || {})[w] || { days: [0, 0, 0, 0, 0, 0] }, y = (b.weeks || {})[w] || { days: [0, 0, 0, 0, 0, 0] };
    out.weeks[w] = { days: x.days.map((d, i) => (d || y.days[i] ? 1 : 0)) };
    const at = [x.at, y.at].filter(Boolean); if (at.length) out.weeks[w].at = Math.min(...at);
  });
  const union = k => Object.assign({}, b[k] || {}, a[k] || {});
  ['known', 'practiced', 'mistakes'].forEach(k => { out[k] = union(k); });
  out.srs = {};
  new Set([...Object.keys(a.srs || {}), ...Object.keys(b.srs || {})]).forEach(k => {
    const x = (a.srs || {})[k], y = (b.srs || {})[k];
    out.srs[k] = !x ? y : !y ? x : (x.box >= y.box ? x : y);
  });
  const maxMap = k => { const m = Object.assign({}, b[k] || {}); Object.entries(a[k] || {}).forEach(([key, v]) => { m[key] = typeof v === 'number' ? Math.max(v, m[key] || 0) : v; }); return m; };
  ['days', 'stories', 'packs'].forEach(k => { out[k] = maxMap(k); });
  const bigger = k => { const m = Object.assign({}, b[k] || {}); Object.entries(a[k] || {}).forEach(([key, v]) => { if (!m[key] || v.n > m[key].n) m[key] = v; }); return m; };
  ['skill', 'lessonStats'].forEach(k => { out[k] = bigger(k); });
  out.daily = {}; new Set([...Object.keys(a.daily || {}), ...Object.keys(b.daily || {})]).forEach(d => { out.daily[d] = Object.assign({}, (b.daily || {})[d], (a.daily || {})[d]); });
  out.writes = Object.assign({}, b.writes || {}); Object.entries(a.writes || {}).forEach(([k, v]) => { if (!out.writes[k] || String(v).length >= String(out.writes[k]).length) out.writes[k] = v; });
  const byT = (k, cap) => { const seen = new Set(); return [...(a[k] || []), ...(b[k] || [])].filter(x => { const id = `${x.t}|${x.kind || x.text}`; if (seen.has(id)) return false; seen.add(id); return true; }); };
  out.scores = byT('scores').sort((x, y) => x.t - y.t).slice(-200);
  out.activity = byT('activity').sort((x, y) => y.t - x.t).slice(0, 40);
  out.placed = Math.max(a.placed || 0, b.placed || 0);
  out.plan = a.plan || b.plan;
  out.settings = Object.assign({}, b.settings || {}, a.settings || {});
  return out;
}

// ---------- Supabase client ----------
const Account = {
  enabled: !!(CFG.supabaseUrl && CFG.supabaseKey),
  client: null,
  user: null,
  ready: null,
  syncing: false,
  pushTimer: null,

  load() {
    if (!this.enabled) return Promise.resolve(null);
    if (this.ready) return this.ready;
    this.ready = new Promise((res, rej) => {
      if (window.supabase && window.supabase.createClient) return res();
      const s = document.createElement('script');
      s.src = SUPABASE_JS; s.async = true; s.onload = () => res(); s.onerror = () => rej(new Error('Could not load the sign-in service. Check your connection.'));
      document.head.appendChild(s);
    }).then(() => {
      this.client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'implicit', storageKey: 'bonjourly.auth' },
      });
      this.client.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') { location.hash = '#reset-password'; return; }
        if (event === 'SIGNED_IN' && session && (!this.user || this.user.id !== session.user.id)) this.adopt(session.user);
        if (event === 'SIGNED_OUT') this.user = null;
      });
      return this.client.auth.getSession().then(({ data }) => { if (data.session) return this.adopt(data.session.user); return null; });
    });
    return this.ready;
  },

  // A session exists: pull profile + progress, merge with what this device has, make it the active learner.
  async adopt(user) {
    this.user = user;
    const db = this.client;
    let [{ data: prof }, { data: prog }] = await Promise.all([
      db.from('profiles').select('*').eq('id', user.id).maybeSingle(),
      db.from('progress').select('state').eq('user_id', user.id).maybeSingle(),
    ]);
    const pending = readJSON(localStorage, PENDING_KEY) || {};
    if (!prof) {
      // First sign-in: create the profile from the sign-up form or Google, plus the welcome answers.
      const meta = user.user_metadata || {};
      const first = (meta.first_name || meta.given_name || (meta.full_name || meta.name || '').split(' ')[0] || (user.email || 'learner').split('@')[0]).slice(0, 40);
      const w = pending.welcome || {};
      prof = { id: user.id, first_name: first, goal: meta.goal || w.goal || null, pace: meta.pace || w.pace || null, province: meta.province || w.province || null, target_date: null };
      const { error } = await db.from('profiles').insert(prof);
      if (error) console.warn('profile insert', error.message);
    }
    // Local copy for this account (if any), the guest progress carried from sign-up, and the cloud copy.
    const local = readJSON(localStorage, stateKey(user.id));
    const carried = pending.state && pending.state.weeks ? pending.state : (!state.profile ? state : null);
    let merged = hydrate(mergeStates(local ? hydrate(local) : freshState(), prog && prog.state));
    if (carried) merged = hydrate(mergeStates(merged, carried));
    try { localStorage.removeItem(PENDING_KEY); } catch (e) { /* storage unavailable */ }
    if (pending.localId && pending.localId !== user.id) deleteProfile(pending.localId); // its progress now lives in the account
    merged.profile = { id: user.id, name: prof.first_name, email: user.email, cloud: true, goal: prof.goal, pace: prof.pace, province: prof.province, at: Date.parse(prof.created_at) || Date.now() };
    merged.name = prof.first_name;
    if (!merged.plan && prof.pace) merged.plan = { pace: prof.pace, start: Date.now(), startDone: 0 };
    state = merged;
    if (!profiles().some(p => p.id === user.id)) saveProfiles([...profiles(), { id: user.id, name: prof.first_name, at: Date.now(), cloud: true }]);
    setActive(user.id);
    save(); this.push(true);
    if (/^#?(home|register|signin|start|welcome)?$/.test(location.hash) || /access_token|error_description/.test(location.hash)) location.hash = '#home';
    render();
    return user;
  },

  // Called from save(): upload progress a few seconds after the last change.
  schedule() {
    if (!this.user || !state.profile || state.profile.id !== this.user.id) return;
    clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.push(), 2500);
  },
  async push(now) {
    if (!this.user || !this.client) return;
    clearTimeout(this.pushTimer);
    const copy = Object.assign({}, state); delete copy.prevVisit;
    const { error } = await this.client.from('progress').upsert({ user_id: this.user.id, state: copy, updated_at: new Date().toISOString() });
    this.lastSync = error ? null : Date.now();
    if (error && now) console.warn('sync', error.message);
  },
  // When the app comes back to the foreground, fold in anything another device saved.
  async pull() {
    if (!this.user || !this.client) return;
    const { data } = await this.client.from('progress').select('state').eq('user_id', this.user.id).maybeSingle();
    if (data && data.state) { const me = state.profile; state = hydrate(mergeStates(state, data.state)); state.profile = me; state.name = me.name; save(); render(); }
  },

  // Keep guest or on-device progress (and welcome answers) so it can join the account after the round trip.
  stash(welcome) {
    const local = !state.profile || !state.profile.cloud;
    writeJSON(localStorage, PENDING_KEY, { state: local ? state : null, localId: local && state.profile ? state.profile.id : null, welcome: welcome || state.welcome || null });
  },
  redirect: () => location.origin + location.pathname,

  async signUp({ email, password, first_name, goal, pace, province }) {
    await this.load();
    this.stash({ goal, pace, province });
    const { data, error } = await this.client.auth.signUp({ email, password, options: { emailRedirectTo: this.redirect(), data: { first_name, goal, pace, province, consent: true } } });
    if (error) throw error;
    return { needsConfirm: !data.session };
  },
  async signIn(email, password) {
    await this.load();
    if (isGuest()) this.stash();
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async google(welcome) {
    await this.load();
    this.stash(welcome);
    const { error } = await this.client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: this.redirect() } });
    if (error) throw error;
  },
  async forgot(email) {
    await this.load();
    const { error } = await this.client.auth.resetPasswordForEmail(email, { redirectTo: this.redirect() });
    if (error) throw error;
  },
  async newPassword(password) {
    const { error } = await this.client.auth.updateUser({ password });
    if (error) throw error;
  },
  async saveProfile(fields) {
    if (!this.user) return;
    const { error } = await this.client.from('profiles').update(Object.assign({}, fields, { updated_at: new Date().toISOString() })).eq('id', this.user.id);
    if (error) throw error;
  },
  // Signing out keeps the name in "Who's learning?" but removes this device's copy of the progress,
  // so on a shared computer the next person needs the password.
  async signOut() {
    const id = this.user && this.user.id;
    if (this.client) { await this.push(true); await this.client.auth.signOut(); }
    if (id) { try { localStorage.removeItem(stateKey(id)); } catch (e) { /* storage unavailable */ } }
    this.user = null;
  },
  async deleteAccount() {
    const { error } = await this.client.rpc('delete_my_account');
    if (error) throw error;
    await this.client.auth.signOut().catch(() => {});
    this.user = null;
  },
};

// Plain-language messages for the errors learners actually hit.
function authMessage(e) {
  const m = String((e && e.message) || e || '');
  if (/invalid login credentials/i.test(m)) return 'That email and password don\'t match. Check them, or reset your password.';
  if (/email not confirmed/i.test(m)) return 'Please confirm your email first: open the link we sent you.';
  if (/already registered|already been registered/i.test(m)) return 'An account with this email already exists. Sign in instead.';
  if (/password should be at least|weak password/i.test(m)) return 'Choose a longer password: at least 8 characters.';
  if (/rate limit|too many/i.test(m)) return 'Too many attempts. Wait a minute and try again.';
  if (/fetch|network|load the sign-in/i.test(m)) return 'Can\'t reach the sign-in service. Check your connection and try again.';
  return m || 'Something went wrong. Please try again.';
}

if (Account.enabled) {
  Account.load().catch(e => console.warn(e.message));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') Account.push();
    else Account.pull().catch(() => {});
  });
}
