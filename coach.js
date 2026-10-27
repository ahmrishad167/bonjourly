// Bonjourly coach: record-and-compare speaking practice and an automatic writing checker.
// Everything runs on the device: recordings are kept in memory only and never uploaded.
'use strict';

// ---------- Speaking: record, play back, compare with the model ----------
const CAN_RECORD = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
let activeRec = null; // { rec, stream, timer } while recording

function stopRecording() {
  if (!activeRec) return;
  clearTimeout(activeRec.timer);
  if (activeRec.rec.state !== 'inactive') activeRec.rec.stop();
  activeRec.stream.getTracks().forEach(t => t.stop());
  activeRec = null;
}

// Recorder markup for one prompt; mountRecorders() wires every [data-recorder] inside a container.
const recorderUI = (model, label = 'Record yourself') => CAN_RECORD
  ? `<div class="recorder" data-recorder data-model="${esc(plainText(model))}"><button type="button" class="btn sm rec-btn">${ic('mic')} ${label}</button><div class="takes"></div></div>`
  : `<div class="recorder"><span class="sub">This browser can't record audio. Say it out loud, then compare with the model.</span></div>`;

function mountRecorders(root, { onTake, max = 90 } = {}) {
  $$('[data-recorder]', root).forEach(box => {
    const btn = $('.rec-btn', box), takes = $('.takes', box);
    let url = null;
    btn.onclick = async () => {
      if (activeRec && activeRec.box === box) { stopRecording(); return; }
      stopRecording(); TTS.stop();
      let stream;
      try { stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); }
      catch (e) {
        toast(e && e.name === 'NotAllowedError'
          ? 'Microphone blocked. Allow microphone access for this site in your browser settings.'
          : 'No microphone found on this device.');
        return;
      }
      const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm', 'audio/ogg'].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t));
      const rec = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
      const chunks = [];
      rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      rec.onstop = () => {
        btn.classList.remove('on'); btn.innerHTML = `${ic('mic')} Record again`;
        if (!chunks.length) return;
        if (url) URL.revokeObjectURL(url);
        url = URL.createObjectURL(new Blob(chunks, { type: rec.mimeType || type || 'audio/webm' }));
        takes.innerHTML = `<div class="take"><span class="take-l">You</span><audio controls src="${url}"></audio></div>
          <div class="take"><span class="take-l">Model</span><button type="button" class="btn sm soft" data-say="${esc(box.dataset.model)}">${ic('play')} Play model</button>
          <button type="button" class="btn sm ghost" data-say="${esc(box.dataset.model)}" data-rate="0.7">Slower</button></div>
          <p class="sub take-tip">Listen to yourself, then the model. Same rhythm? Same vowel sounds? If not, record again.</p>`;
        onTake && onTake(box);
      };
      activeRec = { rec, stream, box, timer: setTimeout(stopRecording, max * 1000) };
      rec.start();
      btn.classList.add('on'); btn.innerHTML = `${ic('stop')} Stop recording`;
    };
  });
}

// ---------- Writing checker ----------
let LEX = null; // built lazily from the course's own French
function lexicon() {
  if (LEX) return LEX;
  const plain = new Set(), accented = new Map();
  const add = s => (String(s || '').toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœæ]+/g) || []).forEach(t => {
    plain.add(t);
    if (/[àâäçéèêëîïôöùûüÿœæ]/.test(t)) {
      const k = loose(t), m = accented.get(k) || new Map();
      m.set(t, (m.get(t) || 0) + 1); accented.set(k, m);
    }
  });
  Object.values(WK).forEach(c => {
    c.examples.forEach(e => add(e.fr)); c.vocab.forEach(v => { add(v.fr); add(v.ex); });
    c.listen.dialogue.forEach(d => add(d.fr)); c.speak.forEach(s => add(s.model)); add(c.write.model);
  });
  ((window.BP_EXTRA || {}).stories || []).forEach(s => s.text.forEach(add));
  LEX = { plain, accented };
  return LEX;
}

const VOWEL = /^[aeiouàâäéèêëîïôöùûü]/;
const H_MUET = /^(habit|habill|heure|homme|hôtel|hotel|hiver|histoire|hôpital|hopital|herbe|hésit|hesit|heureu|humain|huile|hier)/;
const ENGLISH = ['the', 'and', 'is', 'my', 'you', 'with', 'very', 'because', 'have', 'are', 'this', 'that', 'what', 'when', 'where', 'they', 'she', 'he', 'was', 'were', 'will', 'would', 'want', 'going', 'people', 'friend', 'friends', 'family', 'house', 'work', 'think', 'really', 'something', 'about', 'there', 'their', 'from'];
const INFORMAL = ['chu', "j'vas", "m'as", "t'sais", 'tsé', 'faque', 'pantoute', 'icitte', 'moé', 'toé', 'ouin', 'ouain', 'astheure'];

// Words to look for: "le dépanneur" -> "dépanneur"; "petit / petite" -> both; verbs match any form sharing the stem.
function targetTerms(vocab) {
  return vocab.map(v => {
    const forms = v.fr.split('/').map(s => s.replace(/\(.*?\)/g, '').trim().replace(/^(le|la|les|un|une|des|l'|se|s')\s*/i, '').trim()).filter(Boolean);
    return { label: v.fr, forms };
  });
}
function usesTerm(textLoose, tokens, form) {
  const f = loose(form);
  if (!f) return false;
  if (f.includes(' ')) return textLoose.includes(f);
  if (/(er|ir|re)$/.test(f) && f.length > 4) { const stem = f.slice(0, -2); return tokens.some(t => t.startsWith(stem)); }
  return tokens.includes(f) || tokens.includes(f + 's') || tokens.includes(f + 'e') || tokens.includes(f + 'es');
}

// "Montreal" -> "Montréal", "Je aime" -> "J'aime": keep the learner's capital letter.
const keepCase = (orig, fix) => /^[A-ZÀÂÄÇÉÈÊËÎÏÔÖÙÛÜ]/.test(orig) ? fix.charAt(0).toUpperCase() + fix.slice(1) : fix;

function checkWriting(text, { vocab = [], min = 0, informalOk = false } = {}) {
  const out = []; // { kind: 'fix' | 'tip' | 'ok', html }
  const raw = String(text || '');
  const words = wordCount(raw);
  if (!words) return [{ kind: 'tip', html: 'Write something first, then check it.' }];
  const { plain, accented } = lexicon();
  const lowerTokens = raw.toLowerCase().match(/[a-zàâäçéèêëîïôöùûüÿœæ']+/g) || [];
  const tokens = lowerTokens.map(t => loose(t.replace(/^[a-z]+'/, '')));

  // 1. Missing accents: the bare spelling is not a French word in the course, but an accented one is.
  const accentFixes = new Map();
  (raw.match(/[A-Za-zàâäçéèêëîïôöùûüÿœæ]+/g) || []).forEach(w0 => {
    const w = w0.toLowerCase();
    if (w.length < 3 || /[àâäçéèêëîïôöùûüÿœæ]/.test(w) || plain.has(w)) return;
    const m = accented.get(loose(w));
    if (m) accentFixes.set(w0, keepCase(w0, [...m.entries()].sort((a, b) => b[1] - a[1])[0][0]));
  });
  if (accentFixes.size) out.push({ kind: 'fix', html: `Accents: ${[...accentFixes].slice(0, 8).map(([a, b]) => `<s>${esc(a)}</s> → <b>${esc(b)}</b>`).join(', ')}` });

  // 2. Elision: je aime → j'aime, si il → s'il, ce est → c'est.
  const elisions = [];
  const re = /\b(je|me|te|se|le|la|de|ne|que|si|ce)\s+([a-zàâäéèêëîïôöùûüh][\wàâäéèêëîïôöùûü]*)/gi;
  let m;
  while ((m = re.exec(raw))) {
    const a = m[1].toLowerCase(), b = m[2], bl = b.toLowerCase();
    let fix = null;
    if (a === 'si' && /^ils?$/.test(bl)) fix = `s'${b}`;
    else if (a === 'ce' && /^(est|était|etait)$/.test(bl)) fix = `c'${b}`;
    else if (!['si', 'ce'].includes(a) && (VOWEL.test(bl) || H_MUET.test(bl)) && !/^(oui|onze|onzième)/.test(bl) && !(/^l[ea]$/.test(a) && /^une?$/.test(bl))) {
      fix = (a === 'que' ? "qu'" : a[0] + "'") + b;
    }
    if (fix) elisions.push([m[0], keepCase(m[1], fix)]);
  }
  if (elisions.length) out.push({ kind: 'fix', html: `Elision: ${elisions.slice(0, 6).map(([a, b]) => `<s>${esc(a)}</s> → <b>${esc(b)}</b>`).join(', ')}` });

  // 3. English words that slipped in.
  const eng = [...new Set(tokens.filter(t => ENGLISH.includes(t) && !plain.has(t)))];
  if (eng.length) out.push({ kind: 'fix', html: `English words: <b>${eng.map(esc).join(', ')}</b>. Find the French word in this lesson's vocabulary or the Vocabulary page.` });

  // 4. Casual Quebec forms in writing.
  const informal = [...new Set(lowerTokens.filter(t => INFORMAL.includes(t)))];
  if (/\bpis\b/i.test(raw) && !/\btant pis\b/i.test(raw)) informal.push('pis');
  if (informal.length && !informalOk) out.push({ kind: 'tip', html: `Casual Quebec forms: <b>${informal.map(esc).join(', ')}</b>. Fine in a text to a friend; in formal writing use the standard form (je suis, je vais, puis, alors…).` });

  // 5. Capitals and end punctuation.
  const sentences = raw.replace(/([.!?…])\s+/g, '$1\n').split('\n').map(s => s.trim()).filter(Boolean);
  const lowerStarts = sentences.filter(s => /^[a-zàâäçéèêëîïôöùûü]/.test(s)).length;
  if (lowerStarts) out.push({ kind: 'tip', html: `${lowerStarts} sentence${lowerStarts === 1 ? '' : 's'} start${lowerStarts === 1 ? 's' : ''} with a small letter. Start each sentence with a capital.` });
  if (!/[.!?…»)]\s*$/.test(raw.trim())) out.push({ kind: 'tip', html: 'End your last sentence with a full stop, question mark or exclamation mark.' });

  // 6. Target vocabulary.
  if (vocab.length) {
    const tl = loose(raw), terms = targetTerms(vocab);
    const used = terms.filter(t => t.forms.some(f => usesTerm(tl, tokens, f)));
    const unused = terms.filter(t => !used.includes(t));
    out.push({ kind: used.length >= 3 ? 'ok' : 'tip', html: `You used <b>${used.length}</b> of this lesson's ${terms.length} words${used.length ? `: ${used.slice(0, 8).map(t => esc(t.label)).join(', ')}` : ''}.${unused.length ? ` Try adding: ${sample(unused, 3).map(t => `<i>${esc(t.label)}</i>`).join(', ')}.` : ''}` });
  }

  // 7. Length.
  if (min) out.push({ kind: words >= min ? 'ok' : 'tip', html: `${words} words (${min} needed).` });
  if (!out.some(o => o.kind === 'fix')) out.unshift({ kind: 'ok', html: '<b>No common slips found.</b> Now compare with the model answer for grammar and style.' });
  return out;
}

const writingFeedback = list => `<div class="wfb">${list.map(o => `<div class="wfb-i ${o.kind}">${ic(o.kind === 'ok' ? 'check' : o.kind === 'fix' ? 'x' : 'bulb')}<span>${o.html}</span></div>`).join('')}
  <p class="sub">The checker catches common slips (accents, elision, English words, punctuation). It doesn't check all grammar, so compare with the model answer too.</p></div>`;
