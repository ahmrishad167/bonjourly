"""Validate content/weeks/*.json and bundle them into content/weeks.js.

Usage:
    python build.py                 # validate all, bundle the valid ones
    python build.py --check 4 5 6   # validate only these weeks, no bundle
"""
import json
import pathlib
import sys

ROOT = pathlib.Path(__file__).parent
WEEKS_DIR = ROOT / "content" / "weeks"
OUT = ROOT / "content" / "weeks.js"


def check_mcq(item, where, errs, need_why=False):
    opts = item.get("options")
    if not isinstance(opts, list) or not 2 <= len(opts) <= 5:
        errs.append(f"{where}: options must be a list of 2-5")
        return
    if not isinstance(item.get("a"), int) or not 0 <= item["a"] < len(opts):
        errs.append(f"{where}: 'a' must be a valid option index")
    if len(set(opts)) != len(opts):
        errs.append(f"{where}: duplicate options")
    if not item.get("q"):
        errs.append(f"{where}: missing q")
    if need_why and not item.get("why"):
        errs.append(f"{where}: missing why")


def count(lst, lo, hi, name, errs):
    if not isinstance(lst, list) or not lo <= len(lst) <= hi:
        n = len(lst) if isinstance(lst, list) else "none"
        errs.append(f"{name}: expected {lo}-{hi} items, got {n}")
        return False
    return True


def validate(d, w):
    errs = []
    if d.get("w") != w:
        errs.append(f"'w' is {d.get('w')}, expected {w}")
    for k in ("title", "goal"):
        if not isinstance(d.get(k), str) or not d[k].strip():
            errs.append(f"missing {k}")

    if count(d.get("learn"), 2, 6, "learn", errs):
        for i, s in enumerate(d["learn"]):
            if not s.get("h") or not isinstance(s.get("body"), list) or not s["body"]:
                errs.append(f"learn[{i}]: needs h and non-empty body list")
            t = s.get("table")
            if t is not None and (not isinstance(t.get("head"), list) or not isinstance(t.get("rows"), list)):
                errs.append(f"learn[{i}].table: needs head and rows lists")

    if count(d.get("examples"), 10, 20, "examples", errs):
        for i, e in enumerate(d["examples"]):
            if not e.get("fr") or not e.get("en"):
                errs.append(f"examples[{i}]: needs fr and en")

    q = d.get("quebec") or {}
    if not q.get("intro"):
        errs.append("quebec.intro missing")
    if count(q.get("items"), 3, 8, "quebec.items", errs):
        for i, e in enumerate(q["items"]):
            if not all(e.get(k) for k in ("std", "qc", "en")):
                errs.append(f"quebec.items[{i}]: needs std, qc, en")

    if count(d.get("drills"), 8, 16, "drills", errs):
        types = set()
        for i, x in enumerate(d["drills"]):
            t = x.get("t")
            types.add(t)
            where = f"drills[{i}]"
            if t == "mcq":
                check_mcq(x, where, errs)
            elif t == "fill":
                if x.get("q", "").count("___") != 1:
                    errs.append(f"{where}: fill needs exactly one ___")
                if not isinstance(x.get("a"), list) or not x["a"]:
                    errs.append(f"{where}: fill 'a' must be a non-empty list")
            elif t == "build":
                if not isinstance(x.get("a"), str) or not 2 <= len(x["a"].split()) <= 12 or not x.get("en"):
                    errs.append(f"{where}: build needs en and a 2-12 word string 'a'")
            elif t == "translate":
                if not x.get("en") or not isinstance(x.get("a"), list) or not x["a"]:
                    errs.append(f"{where}: translate needs en and non-empty 'a' list")
            else:
                errs.append(f"{where}: unknown type {t!r}")
        if len(types) < 3:
            errs.append(f"drills: use at least 3 types, got {sorted(map(str, types))}")

    if count(d.get("vocab"), 10, 20, "vocab", errs):
        for i, v in enumerate(d["vocab"]):
            if not v.get("fr") or not v.get("en"):
                errs.append(f"vocab[{i}]: needs fr and en")
            if v.get("g") not in (None, "m", "f"):
                errs.append(f"vocab[{i}]: g must be m or f")

    li = d.get("listen") or {}
    count(li.get("pron"), 4, 10, "listen.pron", errs)
    if not li.get("title"):
        errs.append("listen.title missing")
    if count(li.get("dialogue"), 4, 16, "listen.dialogue", errs):
        for i, l in enumerate(li["dialogue"]):
            if not all(l.get(k) for k in ("s", "fr", "en")):
                errs.append(f"listen.dialogue[{i}]: needs s, fr, en")
    if count(li.get("questions"), 2, 5, "listen.questions", errs):
        for i, x in enumerate(li["questions"]):
            check_mcq(x, f"listen.questions[{i}]", errs)

    if count(d.get("speak"), 2, 5, "speak", errs):
        for i, s in enumerate(d["speak"]):
            if not s.get("prompt") or not s.get("model"):
                errs.append(f"speak[{i}]: needs prompt and model")
    wr = d.get("write") or {}
    if not wr.get("prompt") or not wr.get("model"):
        errs.append("write: needs prompt and model")

    if count(d.get("quiz"), 6, 12, "quiz", errs):
        for i, x in enumerate(d["quiz"]):
            check_mcq(x, f"quiz[{i}]", errs, need_why=True)
    return errs


def load(path):
    w = int(path.stem[1:])
    try:
        d = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:  # noqa: BLE001
        return w, None, [f"invalid JSON: {e}"]
    return w, d, validate(d, w)


EXTRA_DIR = ROOT / "content" / "extra"
EXTRA_OUT = ROOT / "content" / "extra.js"


def check_extra(name, d):
    """Light structural checks for content/extra/*.json. Returns a list of errors."""
    errs = []

    def mcqs(qs, where):
        for i, q in enumerate(qs or []):
            check_mcq(q, f"{where}[{i}]", errs)

    if name.startswith("stories"):
        for s in d:
            w = s.get("id", "?")
            for k in ("id", "title", "level", "week", "text", "glossary", "questions"):
                if not s.get(k):
                    errs.append(f"{w}: missing {k}")
            mcqs(s.get("questions"), f"{w}.questions")
    elif name == "verbs":
        for v in d:
            t = v.get("t") or {}
            for tense, forms in t.items():
                n = len(forms)
                ok = n in (0, 3) if tense == "imperatif" else n in (1, 6)
                if not ok:
                    errs.append(f"{v.get('inf')}: {tense} has {n} forms")
    elif name == "exam":
        for s in d.get("sections", []):
            for st in s.get("sets", []):
                for j, it in enumerate(st.get("items") or []):
                    mcqs(it.get("questions"), f"{s.get('code')}/{st.get('title')}/item{j}")
    return errs


def bundle_extra():
    out, bad = {}, []
    for p in sorted(EXTRA_DIR.glob("*.json")):
        try:
            d = json.loads(p.read_text(encoding="utf-8"))
        except Exception as e:  # noqa: BLE001
            bad.append(f"{p.name}: invalid JSON: {e}")
            continue
        errs = check_extra(p.stem, d)
        if errs:
            bad.append(f"{p.name}:\n  " + "\n  ".join(errs[:20]))
            continue
        if p.stem.startswith("stories"):
            out.setdefault("stories", []).extend(d)
        else:
            out[p.stem] = d
    if "stories" in out:
        out["stories"].sort(key=lambda s: (s.get("week", 0), s["id"]))
    EXTRA_OUT.write_text(
        "// Generated by build.py from content/extra/*.json. Do not edit by hand.\n"
        "window.BP_EXTRA = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print("Extras bundled: " + ", ".join(f"{k} ({len(v) if isinstance(v, list) else 'ok'})" for k, v in out.items()))
    for b in bad:
        print("Extra skipped: " + b)
    return not bad


APP_FILES = ("index.html", "styles.css", "core.js", "views-extra.js", "views.js", "manifest.webmanifest", "logo.svg",
             "content/roadmap.js", "content/weeks.js", "content/extra.js")


def stamp_service_worker():
    """Give sw.js a cache version derived from the app files, so installed copies update when anything changes."""
    import hashlib
    import re
    h = hashlib.sha1()
    for f in APP_FILES:
        h.update((ROOT / f).read_bytes())
    sw = ROOT / "sw.js"
    src = sw.read_text(encoding="utf-8")
    sw.write_text(re.sub(r"const VERSION = '[^']*';", f"const VERSION = '{h.hexdigest()[:10]}';", src), encoding="utf-8")


def bundle_single():
    """Inline CSS, data and scripts into dist/bonjourly.html (one file, no external assets but fonts)."""
    import re
    html = (ROOT / "index.html").read_text(encoding="utf-8")

    def script(path):
        js = (ROOT / path).read_text(encoding="utf-8").replace("</script", "<\\/script")
        return f"<script>\n{js}\n</script>"

    html = html.replace('<link rel="stylesheet" href="styles.css">',
                        "<style>\n" + (ROOT / "styles.css").read_text(encoding="utf-8") + "\n</style>")
    for src in ("content/roadmap.js", "content/weeks.js", "content/extra.js", "core.js", "views-extra.js", "views.js"):
        html = html.replace(f'<script src="{src}"></script>', script(src))
    # The artifact host supplies the document skeleton.
    html = re.sub(r"<!doctype html>\s*<html[^>]*>\s*<head>\s*", "", html, flags=re.I)
    html = re.sub(r'<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*', "", html)
    html = re.sub(r"</head>\s*<body>\s*", "", html)
    html = re.sub(r"</body>\s*</html>\s*$", "", html)
    out = ROOT / "dist" / "bonjourly.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8")
    print(f"Single-file app: {out.relative_to(ROOT)} ({out.stat().st_size // 1024} KB)")


def main(argv):
    if "--check" in argv:
        weeks = [int(a) for a in argv[argv.index("--check") + 1:]]
        paths = [WEEKS_DIR / f"w{w:03d}.json" for w in weeks]
        bad = 0
        for p in paths:
            if not p.exists():
                print(f"w{p.stem[1:]}: MISSING")
                bad += 1
                continue
            w, _, errs = load(p)
            print(f"w{w:03d}: " + ("OK" if not errs else "\n  " + "\n  ".join(errs)))
            bad += bool(errs)
        return 1 if bad else 0

    good, bad = {}, []
    for p in sorted(WEEKS_DIR.glob("w*.json")):
        w, d, errs = load(p)
        if errs:
            bad.append((w, errs))
        else:
            good[w] = d
    OUT.write_text(
        "// Generated by build.py from content/weeks/*.json. Do not edit by hand.\n"
        "window.BP_WEEKS = " + json.dumps(good, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    print(f"Bundled {len(good)} weeks into {OUT.relative_to(ROOT)}")
    extra_ok = bundle_extra()
    stamp_service_worker()
    if "--single" in argv:
        bundle_single()
    for w, errs in bad:
        print(f"w{w:03d} skipped:\n  " + "\n  ".join(errs))
    missing = sorted(set(range(1, 169)) - set(good) - {w for w, _ in bad})
    if missing:
        print(f"{len(missing)} weeks have no content yet")
    return 1 if bad or not extra_ok else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
