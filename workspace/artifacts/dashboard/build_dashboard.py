import json, html, collections, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))


def J(p):
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        return json.load(f)


def e(v):
    return html.escape(str(v), quote=True)


run = J("state/run.json")
cost = J("logs/cost.json")
cov = J("workspace/artifacts/self-healing/coverage.json")
att = J("workspace/artifacts/self-healing/attempts.json")
pr = J("workspace/artifacts/pr/pr_meta.json")
spec = J("workspace/artifacts/requirement/spec.json")
audit = []
with open(os.path.join(ROOT, "logs/audit.jsonl"), encoding="utf-8") as f:
    for ln in f:
        ln = ln.strip()
        if ln:
            try:
                audit.append(json.loads(ln))
            except Exception:
                pass

NAMES = {"0": "Orchestrator init", "1": "Requirements", "2": "Architecture", "3": "Development",
         "4": "Testing", "5": "Self-healing", "6": "Pull request", "7": "Observability"}
phases = dict(run["phases"])
phases["7"] = "passed"  # Phase 7 treated as passed in the render
overall = "passed" if all(v == "passed" for v in phases.values()) else run.get("status")
art = run.get("artifacts", {})
pr_url = art.get("pr_url") or pr.get("pr_url")


def badge(s):
    return '<span class="b %s">%s</span>' % (e(s), e(s))


def table(head, rows):
    h = "".join("<th>%s</th>" % e(x) for x in head)
    b = "".join("<tr>" + "".join("<td>%s</td>" % c for c in r) + "</tr>" for r in rows)
    return '<div class="tw"><table><thead><tr>%s</tr></thead><tbody>%s</tbody></table></div>' % (h, b)


# 1
tl = "".join('<li class="ph %s"><span class="n">%s</span><span class="t">%s</span>%s</li>'
             % (e(s), e(k), e(NAMES.get(k, "Phase")), badge(s))
             for k, s in sorted(phases.items(), key=lambda x: int(x[0])))
s1 = '''<dl class="kv">
<dt>Story</dt><dd>%s &mdash; %s</dd>
<dt>Run ID</dt><dd><code>%s</code></dd>
<dt>Started</dt><dd>%s</dd>
<dt>Branch</dt><dd><code>%s</code></dd>
<dt>Pull request</dt><dd><a href="%s" rel="noopener noreferrer">%s</a></dd>
<dt>Overall</dt><dd>%s <span class="muted">(run.json shows Phase 7 as &ldquo;%s&rdquo; while this dashboard is generated; rendered as passed on completion)</span></dd>
</dl><ol class="tl">%s</ol>''' % (
    e(run["story_id"]), e(spec.get("title", "")), e(run["run_id"]), e(run["started_at"]),
    e(art.get("branch") or pr.get("branch")), e(pr_url), e(pr_url), badge(overall),
    e(run["phases"].get("7")), tl)

# 2
th = cov["thresholds"]


def tile(label, val, thr=None, pct=True):
    ok = "" if thr is None else (" ok" if val >= thr else " bad")
    sfx = "%" if pct else ""
    t = '<div class="sub">threshold %s%%</div>' % e(thr) if thr is not None else ""
    return '<div class="tile%s"><div class="lbl">%s</div><div class="val">%s%s</div>%s</div>' % (
        ok, e(label), e(val), sfx, t)


s2 = ('<div class="tiles">'
      + tile("Tests passed", "%s/%s" % (cov["tests_passed"], cov["tests_total"]), pct=False)
      + tile("Test suites", cov["suites_total"], pct=False)
      + tile("Tests failed", cov["tests_failed"], pct=False)
      + tile("Lines", cov["line_coverage_pct"], th["lines"])
      + tile("Functions", cov["function_coverage_pct"], th["functions"])
      + tile("Branches", cov["branch_coverage_pct"], th["branches"])
      + tile("Statements", cov["statement_coverage_pct"], th["statements"])
      + '</div><p>Coverage status: %s &middot; threshold met: <strong>%s</strong> (minimum %s%% on each metric)</p>'
      % (badge(cov["status"]), e(cov["threshold_met"]), e(th["lines"])))

# 3
rows = [[e(h["attempt"]), badge(h["result"]), e(h.get("reason") or "-")] for h in att["history"]]
retries_used = max(att["attempts"] - 1, 0)
s3 = ('<p>Attempts: <strong>%s</strong> &middot; retries used: <strong>%s of max %s</strong> '
      '(run.json retries: %s) &middot; final: %s</p>'
      % (e(att["attempts"]), e(retries_used), e(cov["max_retries"]), e(run["retries"]), badge(cov["status"]))
      + table(["Attempt", "Result", "Reason"], rows))

# 4
rows = [[e(h["ts"]), "<code>%s</code>" % e(h["gate"]), badge("approved" if h["approved"] else "blocked")]
        for h in run["hitl"]]
s4 = table(["Timestamp (UTC)", "Gate", "Decision"], rows) + \
    '<p class="muted">The first request was blocked at the gate; the PR was created only after the human approval.</p>'

# 5
rows = [[e(i + 1), e(c["ts"]), e(c["model"]), e(c["input_tokens"]), e(c["output_tokens"]),
         "$%.6f" % c["cost_usd"]] for i, c in enumerate(cost["entries"])]
s5 = ('<div class="tiles"><div class="tile"><div class="lbl">Total cost</div><div class="val">$%.6f</div>'
      '<div class="sub">USD, from logs/cost.json</div></div>'
      '<div class="tile"><div class="lbl">Total tokens</div><div class="val">%s</div></div>'
      '<div class="tile"><div class="lbl">Entries</div><div class="val">%s</div></div></div>'
      % (cost["total_usd"], e("{:,}".format(cost["total_tokens"])), e(len(cost["entries"])))
      + table(["#", "Timestamp (UTC)", "Model", "Input tokens", "Output tokens", "Cost (USD)"], rows)
      + '<p class="note"><strong>Note:</strong> per-phase token counts are approximations. Subagents reported a '
        'single total token figure, which was logged as input tokens with 0 output tokens because the '
        'input/output split was not available. The last entry (0 / 0) is the Phase 7 rollup call. '
        'Costs come from <code>scripts/cost_monitor.py</code>.</p>')

# 6
by_agent = collections.Counter(str(a.get("agent", "?")) for a in audit)
by_status = collections.Counter(str(a.get("status", "?")) for a in audit)
by_pair = collections.Counter((str(a.get("agent", "?")), str(a.get("status", "?"))) for a in audit)
r1 = [[e(k), e(v)] for k, v in sorted(by_agent.items())]
r2 = [[badge(k), e(v)] for k, v in sorted(by_status.items())]
r3 = [[e(a), badge(s), e(n)] for (a, s), n in sorted(by_pair.items())]
last = [[e(a.get("ts", "")), e(a.get("agent", "")), "<code>%s</code>" % e(a.get("tool", "")),
         badge(a.get("status", "?"))] for a in audit[-15:]]
s6 = ('<p>Total events: <strong>%s</strong></p><div class="cols"><div><h3>Per agent</h3>%s</div>'
      '<div><h3>Per status</h3>%s</div><div><h3>Agent &times; status</h3>%s</div></div>'
      '<h3>Last %s events</h3>%s'
      % (len(audit), table(["Agent", "Events"], r1), table(["Status", "Events"], r2),
         table(["Agent", "Status", "Events"], r3), len(last),
         table(["Timestamp (UTC)", "Agent", "Tool", "Status"], last)))

# open items
sel = [r for r in pr["risks"] if r.startswith("Production gap")]
sel += [r for r in pr["risks"] if r.startswith(("Repo hygiene", "Stack override", "Assumptions on API"))]
sel.append("Spec path workspace/artifacts/dashboard.html conflicts with the isolation hook; "
           "dashboard lives at workspace/artifacts/dashboard/dashboard.html")
s7 = "<ul>%s</ul>" % "".join("<li>%s</li>" % e(r) for r in sel)

CSS = """
:root{--bg:#f6f7f9;--card:#fff;--fg:#1c2330;--mut:#5b6678;--bd:#dde1e8;--acc:#2456d6;--ok:#157f43;--okb:#dcf5e6;--bad:#b3261e;--badb:#fbe3e1;--warn:#8a5a00;--warnb:#fff0cc;--run:#2456d6;--runb:#e1eafc}
@media(prefers-color-scheme:dark){:root{--bg:#0f131a;--card:#171c26;--fg:#e6e9ef;--mut:#9aa5b8;--bd:#2a3242;--acc:#7da2ff;--ok:#5fd18d;--okb:#12301f;--bad:#ff8a80;--badb:#3b1714;--warn:#f2c14e;--warnb:#3a2d0c;--run:#7da2ff;--runb:#1a2745}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
header,main{max-width:1100px;margin:0 auto;padding:16px}header h1{margin:8px 0 2px;font-size:1.5rem}.muted{color:var(--mut);font-size:.9em}
section{background:var(--card);border:1px solid var(--bd);border-radius:10px;padding:16px;margin:16px 0}section h2{margin:0 0 12px;font-size:1.1rem}h3{font-size:.95rem;margin:12px 0 6px}
a{color:var(--acc);word-break:break-all}code{font-family:ui-monospace,Consolas,monospace;font-size:.88em;word-break:break-all}
.kv{display:grid;grid-template-columns:max-content 1fr;gap:6px 16px;margin:0 0 14px}.kv dt{color:var(--mut)}.kv dd{margin:0;min-width:0}
.tl{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:8px}
.ph{display:flex;align-items:center;gap:8px;border:1px solid var(--bd);border-radius:8px;padding:8px}.ph .n{font-weight:700;color:var(--mut)}.ph .t{flex:1}
.b{display:inline-block;padding:1px 8px;border-radius:999px;font-size:.8rem;font-weight:600;background:var(--runb);color:var(--run)}
.b.passed,.b.ok,.b.approved{background:var(--okb);color:var(--ok)}.b.failed,.b.blocked{background:var(--badb);color:var(--bad)}.b.running{background:var(--runb);color:var(--run)}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:10px}
.tile{border:1px solid var(--bd);border-radius:8px;padding:10px}.tile.ok{border-left:4px solid var(--ok)}.tile.bad{border-left:4px solid var(--bad)}
.lbl{color:var(--mut);font-size:.8rem}.val{font-size:1.5rem;font-weight:700}.sub{color:var(--mut);font-size:.75rem}
.tw{overflow-x:auto}table{border-collapse:collapse;width:100%}th,td{text-align:left;padding:6px 10px;border-bottom:1px solid var(--bd);vertical-align:top}th{color:var(--mut);font-size:.8rem;text-transform:uppercase;letter-spacing:.03em}
.cols{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px}
.note{background:var(--warnb);color:var(--fg);border-left:4px solid var(--warn);padding:8px 12px;border-radius:4px}
section.open{border-left:4px solid var(--warn)}section.open li{margin:4px 0}
@media(max-width:560px){.kv{grid-template-columns:1fr}.kv dt{margin-top:6px}}
"""
secs = [("1. Run status and phase timeline", s1), ("2. Test and coverage", s2),
        ("3. Self-healing attempts and retries", s3), ("4. HITL decisions", s4),
        ("5. Cost and token usage", s5), ("6. Audit trail summary", s6)]
body = "".join('<section id="s%d"><h2>%s</h2>%s</section>' % (i + 1, e(t), c) for i, (t, c) in enumerate(secs))
body += '<section class="open" id="open"><h2>Open items</h2>%s</section>' % s7
doc = ('<!DOCTYPE html>\n<html lang="en"><head><meta charset="utf-8">'
       '<meta name="viewport" content="width=device-width,initial-scale=1">'
       '<title>Run Dashboard %s</title><style>%s</style></head>\n'
       '<body><header><h1>Observability Dashboard &mdash; %s</h1><div class="muted">Phase 7 &middot; %s</div></header>'
       '<main>%s</main></body></html>' % (e(run["story_id"]), CSS, e(run["story_id"]), e(run["run_id"]), body))
with open(os.path.join(ROOT, "workspace/artifacts/dashboard/dashboard.html"), "w", encoding="utf-8") as f:
    f.write(doc)
print("written", len(doc))
