#!/usr/bin/env node
// =============================================================================
// render-card.mjs — transforma uma ficha players/*.json num PLAYER CARD HTML
// autoral (arquivo único, offline-friendly). Data-driven: serve pra qualquer um.
//   uso:  node render-card.mjs [players/me.json] [saida.html]
// Estetica: paleta Tokyo Night (tema de terminal do operador) + dourado "Lion".
// =============================================================================
import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const inPath = process.argv[2] || 'players/me.json';
const data = JSON.parse(readFileSync(inPath, 'utf8'));
const outPath = process.argv[3] || inPath.replace(/\.json$/, '') + '.card.html';

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const P = data.player || {};
const C = data.class || {};
const U = data.claude_usage || {};
const PS = data.playstyle || {};
const A = data.arsenal || {};

// ---- stats: rotulos PT + cor Tokyo Night por papel ----
const STAT_LABELS = {
  shipping: 'Entrega', mobile_ios: 'Mobile / iOS', backend_data: 'Backend / Dados',
  frontend_design: 'Frontend / Design', automation_tooling: 'Automação',
  debugging_qa: 'Debug / QA', agent_orchestration: 'Orquestração', security_ops: 'Segurança',
};
const STAT_COLORS = {
  shipping: '#e0af68', mobile_ios: '#7aa2f7', backend_data: '#7dcfff',
  frontend_design: '#bb9af7', automation_tooling: '#9ece6a',
  debugging_qa: '#73daca', agent_orchestration: '#ff9e64', security_ops: '#f7768e',
};
const stats = Object.entries(data.stats || {});

const STATUS_LABEL = {
  'scaffold': 'esqueleto', 'wip': 'em obras', 'shipped-testflight': 'TestFlight',
  'near-launch': 'quase loja', 'live': 'no ar', 'dormant': 'dormente', 'client-work': 'cliente',
};

const ratio = U.co_author_ratio ?? (U.total_fleet_commits ? U.claude_co_authored_commits / U.total_fleet_commits : 0);
const pct = Math.round(ratio * 100);
const R = 84, CIRC = 2 * Math.PI * R;
const dash = (CIRC * (1 - ratio)).toFixed(2);

const initials = (P.handle || '?').replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'LN';

// ---- blocos ----
const statBars = stats.map(([k, v]) => {
  const label = STAT_LABELS[k] || k;
  const c = STAT_COLORS[k] || '#7aa2f7';
  return `<div class="stat">
      <div class="stat-head"><span class="stat-name">${esc(label)}</span><span class="stat-val" style="color:${c}">${v.score}</span></div>
      <div class="stat-track"><div class="stat-fill" style="width:${v.score}%;background:${c};box-shadow:0 0 14px ${c}66"></div></div>
      <div class="stat-ev">${esc(v.evidence)}</div>
    </div>`;
}).join('\n');

const quests = (data.signature_projects || []).map((p, i) => `<article class="quest">
      <div class="quest-rank">${String(i + 1).padStart(2, '0')}</div>
      <header class="quest-head">
        <h3>${esc(p.name)}</h3>
        <span class="badge badge--${esc((p.status || '').replace(/[^a-z]/g, ''))}">${esc(STATUS_LABEL[p.status] || p.status || '')}</span>
      </header>
      <div class="quest-xp">${p.commits != null ? `<b>${p.commits}</b> commits` : ''} <span class="dot">·</span> ${esc(p.role || '')}</div>
      ${p.highlight ? `<p class="quest-hl">${esc(p.highlight)}</p>` : ''}
      <div class="chips">${(p.stack || []).map(s => `<span class="chip chip--ghost">${esc(s)}</span>`).join('')}</div>
    </article>`).join('\n');

const arsenalGroup = (title, arr, cls) => arr && arr.length
  ? `<div class="ars-group"><h4>${esc(title)}</h4><div class="chips">${arr.map(x => `<span class="chip ${cls}">${esc(x)}</span>`).join('')}</div></div>` : '';

const achievements = (data.achievements || []).map(a => `<li class="ach">
      <span class="ach-medal">★</span>
      <div><b>${esc(a.title)}</b>${a.date ? `<span class="ach-date">${esc(a.date)}</span>` : ''}<p>${esc(a.proof)}</p></div>
    </li>`).join('\n');

const traits = (PS.traits || []).map(t => `<li>${esc(t)}</li>`).join('\n');
const peeves = (PS.pet_peeves || []).map(t => `<span class="chip chip--red">${esc(t)}</span>`).join('');
const workflows = (U.favorite_workflows || []).map(w => `<span class="chip chip--green">${esc(w)}</span>`).join('');

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(P.handle)} — Player Card</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
<style>
  :root{
    --bg:#16161e; --bg2:#1a1b26; --panel:#1f2335; --panel2:#24283b;
    --ink:#c0caf5; --ink-dim:#a9b1d6; --muted:#565f89; --line:#2a2e44;
    --gold:#e0af68; --blue:#7aa2f7; --purple:#bb9af7; --green:#9ece6a;
    --cyan:#7dcfff; --orange:#ff9e64; --red:#f7768e; --teal:#73daca;
    --display:'Space Grotesk',system-ui,sans-serif; --mono:'JetBrains Mono',ui-monospace,monospace;
  }
  *{box-sizing:border-box}
  html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{
    margin:0;background:
      radial-gradient(1200px 600px at 80% -10%, #1f2335 0%, transparent 60%),
      radial-gradient(900px 500px at -10% 20%, #1d1e30 0%, transparent 55%),
      var(--bg);
    color:var(--ink);font-family:var(--display);line-height:1.5;
    -webkit-font-smoothing:antialiased;
  }
  .wrap{max-width:960px;margin:0 auto;padding:32px 20px 64px}
  .mono{font-family:var(--mono)}
  .eyebrow{font-family:var(--mono);font-size:.72rem;letter-spacing:.22em;text-transform:uppercase;color:var(--muted)}
  section{margin-top:34px}
  h2.sec{font-size:.8rem;font-family:var(--mono);letter-spacing:.24em;text-transform:uppercase;color:var(--gold);
    margin:0 0 16px;display:flex;align-items:center;gap:12px}
  h2.sec::after{content:"";flex:1;height:1px;background:linear-gradient(90deg,var(--line),transparent)}

  /* ---------- HERO ---------- */
  .card{position:relative;border:1px solid var(--line);border-radius:20px;overflow:hidden;
    background:linear-gradient(180deg,#1b1c2acc,#191a25cc);box-shadow:0 30px 80px -40px #000;}
  .stars{position:absolute;inset:0;overflow:hidden;pointer-events:none}
  .stars i{position:absolute;width:2px;height:2px;border-radius:50%;background:#c0caf5;opacity:.5;
    animation:tw 4s ease-in-out infinite}
  @keyframes tw{0%,100%{opacity:.15}50%{opacity:.85}}
  .hero{position:relative;display:grid;grid-template-columns:1.4fr .9fr;gap:24px;padding:30px 30px 26px}
  .crest{display:flex;align-items:center;gap:14px;margin-bottom:18px}
  .monogram{width:54px;height:54px;border-radius:14px;display:grid;place-items:center;
    font-family:var(--mono);font-weight:700;font-size:1.25rem;color:#16161e;
    background:linear-gradient(135deg,var(--gold),#ffce8a);box-shadow:0 0 28px #e0af6855}
  .who .handle{font-size:1.05rem;font-weight:600;letter-spacing:.01em}
  .who .org{font-family:var(--mono);font-size:.74rem;color:var(--muted)}
  .title{font-size:2.5rem;font-weight:700;line-height:1.04;margin:4px 0 0;letter-spacing:-.02em;
    background:linear-gradient(180deg,#fff,#9aa5d6);-webkit-background-clip:text;background-clip:text;color:transparent}
  .clazz{font-family:var(--mono);font-size:.85rem;color:var(--blue);margin-top:10px}
  .clazz .sep{color:var(--muted)}
  .term{font-family:var(--mono);font-size:.84rem;color:var(--ink-dim);background:#13141c;border:1px solid var(--line);
    border-radius:10px;padding:10px 12px;margin-top:16px;min-height:42px}
  .term .prompt{color:var(--green)}
  .cursor{display:inline-block;width:8px;height:1.05em;background:var(--gold);vertical-align:-2px;margin-left:2px;animation:blink 1s steps(1) infinite}
  @keyframes blink{50%{opacity:0}}
  .tagline{color:var(--ink-dim);font-size:.96rem;margin:16px 0 0;max-width:46ch}

  .hero-right{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px}
  .gauge{width:190px;height:190px}
  .gauge-track{fill:none;stroke:#2a2e44;stroke-width:14}
  .gauge-arc{fill:none;stroke:url(#g);stroke-width:14;stroke-linecap:round;
    stroke-dasharray:${CIRC.toFixed(2)};stroke-dashoffset:${dash};
    transform:rotate(-90deg);transform-origin:50% 50%;filter:drop-shadow(0 0 10px #9ece6a66)}
  .gauge-num{font-family:var(--display);font-weight:700;font-size:2.4rem;fill:#fff}
  .gauge-lbl{font-family:var(--mono);font-size:.5rem;letter-spacing:.18em;fill:var(--muted)}
  .level{display:flex;align-items:baseline;gap:8px;font-family:var(--mono)}
  .level b{font-size:2rem;color:var(--gold);font-family:var(--display)}
  .level span{font-size:.72rem;letter-spacing:.2em;text-transform:uppercase;color:var(--muted)}

  /* ---------- STATS ---------- */
  .stats{display:grid;grid-template-columns:1fr 1fr;gap:18px 28px}
  .stat-head{display:flex;justify-content:space-between;align-items:baseline;font-family:var(--mono);font-size:.82rem}
  .stat-name{color:var(--ink)}
  .stat-val{font-weight:700}
  .stat-track{height:8px;border-radius:6px;background:#13141c;border:1px solid var(--line);margin:7px 0;overflow:hidden}
  .stat-fill{height:100%;border-radius:6px;transition:width .9s cubic-bezier(.2,.8,.2,1)}
  .stat-ev{font-size:.78rem;color:var(--muted);line-height:1.45}

  /* ---------- QUESTS ---------- */
  .quests{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .quest{position:relative;border:1px solid var(--line);border-radius:14px;padding:16px 16px 14px;
    background:linear-gradient(180deg,#1d1e2e,#191a24);overflow:hidden}
  .quest-rank{position:absolute;top:8px;right:12px;font-family:var(--mono);font-weight:700;font-size:1.6rem;color:#23263a}
  .quest-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
  .quest-head h3{margin:0;font-size:1.04rem;font-weight:600}
  .quest-xp{font-family:var(--mono);font-size:.78rem;color:var(--ink-dim);margin:8px 0}
  .quest-xp b{color:var(--gold)}
  .quest-xp .dot{color:var(--muted);margin:0 6px}
  .quest-hl{font-size:.85rem;color:var(--ink-dim);margin:6px 0 12px}

  /* ---------- BADGES / CHIPS ---------- */
  .badge{font-family:var(--mono);font-size:.62rem;letter-spacing:.08em;text-transform:uppercase;
    padding:3px 8px;border-radius:999px;border:1px solid;white-space:nowrap}
  .badge--nearlaunch{color:var(--gold);border-color:#e0af6855;background:#e0af6814}
  .badge--shippedtestflight{color:var(--green);border-color:#9ece6a55;background:#9ece6a14}
  .badge--wip{color:var(--blue);border-color:#7aa2f755;background:#7aa2f714}
  .badge--clientwork{color:var(--purple);border-color:#bb9af755;background:#bb9af714}
  .badge--live,.badge--dormant,.badge--scaffold{color:var(--cyan);border-color:#7dcfff55;background:#7dcfff14}
  .chips{display:flex;flex-wrap:wrap;gap:6px}
  .chip{font-family:var(--mono);font-size:.72rem;padding:4px 9px;border-radius:8px;border:1px solid var(--line);color:var(--ink-dim);background:#15161f}
  .chip--ghost{background:transparent}
  .chip--blue{color:var(--blue);border-color:#7aa2f733}
  .chip--purple{color:var(--purple);border-color:#bb9af733}
  .chip--green{color:var(--green);border-color:#9ece6a33}
  .chip--cyan{color:var(--cyan);border-color:#7dcfff33}
  .chip--gold{color:var(--gold);border-color:#e0af6833}
  .chip--red{color:var(--red);border-color:#f7768e33}

  /* ---------- ARSENAL / ACH / PLAYSTYLE ---------- */
  .panel{border:1px solid var(--line);border-radius:14px;padding:18px 20px;background:#191a24aa}
  .ars-group{margin-bottom:14px}
  .ars-group:last-child{margin-bottom:0}
  .ars-group h4{margin:0 0 8px;font-family:var(--mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  .grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  .ach-list{list-style:none;margin:0;padding:0;display:grid;gap:12px}
  .ach{display:flex;gap:12px;align-items:flex-start}
  .ach-medal{color:var(--gold);font-size:1.1rem;line-height:1.2;filter:drop-shadow(0 0 6px #e0af6877)}
  .ach b{font-weight:600}
  .ach-date{font-family:var(--mono);font-size:.68rem;color:var(--muted);margin-left:8px}
  .ach p{margin:3px 0 0;font-size:.82rem;color:var(--muted)}
  .motto{font-size:1.35rem;font-weight:600;line-height:1.3;margin:0 0 16px;letter-spacing:-.01em}
  .motto .q{color:var(--gold)}
  .traits{list-style:none;margin:0;padding:0;display:grid;gap:8px}
  .traits li{position:relative;padding-left:18px;font-size:.88rem;color:var(--ink-dim)}
  .traits li::before{content:"▸";position:absolute;left:0;color:var(--gold)}
  .kv{font-family:var(--mono);font-size:.78rem;color:var(--muted);margin-top:12px}
  .kv b{color:var(--ink)}

  /* ---------- METER STRIP ---------- */
  .strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line);
    border-radius:14px;overflow:hidden;margin-top:18px}
  .strip div{background:#191a24;padding:16px 14px;text-align:center}
  .strip b{display:block;font-size:1.7rem;font-weight:700;font-family:var(--display)}
  .strip span{font-family:var(--mono);font-size:.64rem;letter-spacing:.12em;text-transform:uppercase;color:var(--muted)}

  /* ---------- FOOTER ---------- */
  .honesty{font-size:.78rem;color:var(--muted);line-height:1.6;border-left:2px solid var(--gold);padding-left:14px}
  .foot{margin-top:36px;font-family:var(--mono);font-size:.7rem;color:var(--muted);display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px}

  a:focus-visible,[tabindex]:focus-visible{outline:2px solid var(--gold);outline-offset:3px}
  @media (max-width:720px){
    .hero{grid-template-columns:1fr}.stats,.quests,.grid2,.strip{grid-template-columns:1fr}
    .title{font-size:2rem}.strip{grid-template-columns:repeat(2,1fr)}
  }
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
</style>
</head>
<body>
<div class="wrap">

  <!-- ===== HERO ===== -->
  <div class="card">
    <div class="stars">${[[6,18],[14,62],[22,30],[31,78],[40,12],[52,48],[60,84],[68,24],[77,60],[85,38],[92,72],[12,88],[46,90],[70,8],[88,16]].map(([l,t],i)=>`<i style="left:${l}%;top:${t}%;animation-delay:${(i%5)*0.6}s"></i>`).join('')}</div>
    <div class="hero">
      <div class="hero-left">
        <div class="crest">
          <div class="monogram">${esc(initials)}</div>
          <div class="who">
            <div class="handle">@${esc(P.handle)}${P.display_name ? ` · ${esc(P.display_name)}` : ''}</div>
            <div class="org">${esc(P.org || '')}</div>
          </div>
        </div>
        <div class="eyebrow">Claude Code · Player Card</div>
        <h1 class="title">${esc(P.title)}</h1>
        <div class="clazz">${esc(C.primary || '')}${C.secondary ? `<br><span class="sep">↳</span> ${esc(C.secondary)}` : ''} <span class="sep">·</span> ${esc(C.alignment || '')}</div>
        <div class="term" id="term"><span class="prompt">~/frota ❯</span> <span class="mono" style="color:var(--muted)">lema --print</span><br><span id="type" style="color:var(--gold)"></span><span class="cursor"></span></div>
        <p class="tagline">${esc(P.tagline)}</p>
      </div>
      <div class="hero-right">
        <svg class="gauge" viewBox="0 0 200 200" role="img" aria-label="Co-autoria com o Claude: ${pct}%">
          <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#9ece6a"/><stop offset="1" stop-color="#e0af68"/></linearGradient></defs>
          <circle class="gauge-track" cx="100" cy="100" r="${R}"/>
          <circle class="gauge-arc" cx="100" cy="100" r="${R}"/>
          <text class="gauge-num" x="100" y="98" text-anchor="middle" dominant-baseline="middle">${pct}%</text>
          <text class="gauge-lbl" x="100" y="122" text-anchor="middle">CO-AUTORIA CLAUDE</text>
        </svg>
        <div class="level"><b>LVL ${P.level}</b><span>${esc(C.primary ? '' : '')}nível</span></div>
      </div>
    </div>
  </div>

  <!-- ===== STRIP ===== -->
  <div class="strip">
    <div><b style="color:var(--gold)">${U.total_fleet_commits ?? '—'}</b><span>commits na frota</span></div>
    <div><b style="color:var(--green)">${U.claude_co_authored_commits ?? '—'}</b><span>co-autorados</span></div>
    <div><b style="color:var(--blue)">${U.agent_tools_installed ?? (A.tools||[]).length}</b><span>coding-agents</span></div>
    <div><b style="color:var(--purple)">${U.memory_count ?? '—'}</b><span>memórias</span></div>
  </div>

  <!-- ===== STATS ===== -->
  <section>
    <h2 class="sec">Atributos</h2>
    <div class="stats">${statBars}</div>
  </section>

  <!-- ===== FROTA / QUESTS ===== -->
  <section>
    <h2 class="sec">Frota · quests ativas</h2>
    <div class="quests">${quests}</div>
  </section>

  <!-- ===== ARSENAL ===== -->
  <section>
    <h2 class="sec">Arsenal</h2>
    <div class="panel">
      ${arsenalGroup('Linguagens', A.languages, 'chip--gold')}
      ${arsenalGroup('Frameworks', A.frameworks, 'chip--blue')}
      ${arsenalGroup('Ferramentas', A.tools, 'chip--cyan')}
      ${arsenalGroup('MCPs', A.mcps, 'chip--purple')}
      ${arsenalGroup('Plugins', A.plugins, 'chip--green')}
    </div>
  </section>

  <!-- ===== CONQUISTAS + PLAYSTYLE ===== -->
  <section>
    <div class="grid2">
      <div>
        <h2 class="sec">Conquistas</h2>
        <ul class="ach-list">${achievements}</ul>
      </div>
      <div>
        <h2 class="sec">Estilo de jogo</h2>
        <p class="motto"><span class="q">“</span>${esc(PS.motto || '')}<span class="q">”</span></p>
        <ul class="traits">${traits}</ul>
        ${PS.work_hours ? `<p class="kv">⏱ <b>Horário:</b> ${esc(PS.work_hours)}</p>` : ''}
        ${peeves ? `<p class="kv" style="margin-bottom:8px">⚠ Pet peeves:</p><div class="chips">${peeves}</div>` : ''}
      </div>
    </div>
  </section>

  <!-- ===== WORKFLOWS ===== -->
  ${workflows ? `<section><h2 class="sec">Workflows favoritos com o Claude</h2><div class="chips">${workflows}</div></section>` : ''}

  <!-- ===== HONESTY ===== -->
  <section>
    <h2 class="sec">Nota de honestidade</h2>
    <p class="honesty">${esc(data.honesty_notes)}</p>
  </section>

  <div class="foot">
    <span>gerado de evidência real · ${esc(basename(inPath))} · schema v${esc(data.schema_version || '?')}</span>
    <span>${esc(data.generated_at || '')}</span>
  </div>
</div>

<script>
  (function(){
    var line = ${JSON.stringify(PS.motto || P.tagline || '')};
    var el = document.getElementById('type');
    if (!el) return;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = line; return; }
    var i = 0;
    (function tick(){ if (i <= line.length){ el.textContent = line.slice(0, i++); setTimeout(tick, 34); } })();
  })();
</script>
</body>
</html>`;

writeFileSync(outPath, html);
console.log('Player card gerado: ' + outPath);
console.log(`  ${P.handle} · LVL ${P.level} · ${pct}% co-autoria · ${stats.length} atributos · ${(data.signature_projects||[]).length} quests`);
