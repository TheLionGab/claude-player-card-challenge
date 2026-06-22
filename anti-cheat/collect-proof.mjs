#!/usr/bin/env node
// =============================================================================
// collect-proof.mjs  —  rode VOCE (o participante), na SUA maquina
// Faz a "prova-de-trabalho": varre TODOS os seus repos git (inclusive
// arquivados), mede commits/co-autoria/linguagens, amostra um SHA real
// ancorado no token (so existe na sua maquina), liga na sua players/me.json
// e SELA tudo. Mexer depois quebra o selo; sem o token nao da pra preparar antes.
//   uso:  node anti-cheat/collect-proof.mjs <TOKEN>
// Nao coleta segredos: so contagens, extensoes e hashes.
// =============================================================================
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { homedir, hostname, platform } from 'node:os';
import { fileURLToPath } from 'node:url';
import { stable, sealOf } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);

const token = (process.argv[2] || '').trim().toLowerCase();
if (!/^[0-9a-f]{16,}$/.test(token)) {
  console.error('uso: node anti-cheat/collect-proof.mjs <TOKEN>  (hex que o desafiante te deu)');
  process.exit(1);
}
const seed = parseInt(token.slice(0, 8), 16) >>> 0;

const git = (repo, args) => {
  try {
    return execFileSync('git', ['-c', 'safe.directory=*', '-C', repo, ...args],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 128 * 1024 * 1024, timeout: 8000 });
  } catch { return ''; }       // timeout/erro => vazio (robusto contra repos gigantes)
};

// --- 1) descobrir TODOS os repos git (inclui arquivados em Documents/Archive/Desktop) ---
const PRUNE = new Set(['node_modules', 'Library', '.cache', 'Pods', '.Trash', 'DerivedData',
  '.pub-cache', '.cocoapods', '.gradle', '.npm', '.bun', '.rustup', 'checkouts', '.build',
  '.next', 'dist', 'build', '.expo']);
function discover() {
  const repos = [];
  const stack = [homedir()];
  let guard = 0;
  while (stack.length && guard++ < 400000) {
    const dir = stack.pop();
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    if (entries.some(e => e.name === '.git')) { repos.push(dir); continue; } // achou repo: nao desce mais
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      if (PRUNE.has(e.name)) continue;
      if (e.name.startsWith('.')) continue;          // pula dotdirs (tooling clones, nao projetos)
      stack.push(join(dir, e.name));
    }
  }
  return repos;
}

process.stderr.write('Varrendo repos... ');
const repoPaths = discover();
process.stderr.write(repoPaths.length + ' encontrados. Medindo...\n');

// --- 2) metricas por repo, deduplicando por origin ---
const byOrigin = new Map();   // origin|path -> melhor registro
const langs = {};
for (const d of repoPaths) {
  const commits = parseInt((git(d, ['rev-list', '--all', '--count']) || '0').trim(), 10) || 0;
  if (!commits) continue;
  const coauthored = (git(d, ['log', '--all', '-i', '--grep=Co-Authored-By: Claude', '--format=%H']) || '')
    .split('\n').filter(Boolean).length;
  let origin = (git(d, ['config', '--get', 'remote.origin.url']) || '').trim();
  origin = origin.replace(/^https:\/\/[^@]*@/, 'https://').replace(/\.git$/, '');
  const key = origin || ('local:' + basename(d));
  const rec = { name: basename(d), commits, coauthored, origin: origin || null };
  const prev = byOrigin.get(key);
  if (!prev || commits > prev.commits) byOrigin.set(key, { ...rec, _path: d });
  for (const f of (git(d, ['ls-files']) || '').split('\n')) {
    const e = extname(f).slice(1).toLowerCase();
    if (e && e.length <= 5 && /^[a-z0-9]+$/.test(e)) langs[e] = (langs[e] || 0) + 1;
  }
}
const distinct = [...byOrigin.values()].sort((a, b) => b.commits - a.commits);
const totalCommits = distinct.reduce((s, r) => s + r.commits, 0);
const totalCoauthored = distinct.reduce((s, r) => s + r.coauthored, 0);

// --- 3) amostra ancorada no token: SHA real no indice (seed % nCommits) ---
let tokenSample = null;
for (const r of distinct) {
  const shas = (git(r._path, ['log', '--all', '--format=%H']) || '').split('\n').filter(Boolean);
  if (shas.length >= 1) {
    const index = seed % shas.length;
    tokenSample = { repo: r.name, total: shas.length, index, sha: shas[index] };
    break;
  }
}

// --- 4) ambiente (sem segredos) ---
const agentDirs = ['.codex', '.grok', '.gemini', '.cursor', '.aider', '.augment', '.continue',
  '.factory', '.codeium', '.codebuddy', '.iflow', '.forge', '.commandcode', '.bob', '.hermes',
  '.inferencesh', '.autohand', '.astrbot', '.jazz', '.clawpatch', '.windsurf', '.aider-desk'];
const toolsInstalled = agentDirs.filter(n => existsSync(join(homedir(), n))).length;

function countMemories() {
  const base = join(homedir(), '.claude', 'projects');
  if (!existsSync(base)) return 0;
  let n = 0;
  const walk = (p, depth) => {
    if (depth > 5) return;
    let ks; try { ks = readdirSync(p, { withFileTypes: true }); } catch { return; }
    for (const k of ks) {
      if (!k.isDirectory()) continue;
      const q = join(p, k.name);
      if (k.name === 'memory' || k.name === 'memories') {
        try { n += readdirSync(q).filter(f => f.endsWith('.md') && f !== 'MEMORY.md').length; } catch {}
      } else walk(q, depth + 1);
    }
  };
  walk(base, 0);
  return n;
}

// --- 5) ligar na ficha do participante (2o arg opcional p/ testes) ---
const mePath = process.argv[3]
  ? (process.argv[3].startsWith('/') ? process.argv[3] : join(process.cwd(), process.argv[3]))
  : join(ROOT, 'players', 'me.json');
if (!existsSync(mePath)) {
  console.error('ERRO: players/me.json nao existe. Gere a ficha (PROMPT.md) ANTES de selar a prova.');
  process.exit(1);
}
const meRaw = readFileSync(mePath);
const meHash = createHash('sha256').update(meRaw).digest('hex');

const languages = Object.entries(langs).sort((a, b) => b[1] - a[1]).slice(0, 12)
  .map(([ext, n]) => ({ ext, n }));

const proof = {
  v: 1,
  token,
  seed,
  generatedAt: new Date().toISOString(),
  machineFingerprint: createHash('sha256').update(hostname() + '|' + platform()).digest('hex').slice(0, 16),
  reposScanned: repoPaths.length,
  distinctRepos: distinct.length,
  totalCommits,
  totalCoauthored,
  coAuthorRatio: totalCommits ? +(totalCoauthored / totalCommits).toFixed(4) : 0,
  tokenSample,
  languages,
  toolsInstalled,
  memoryCount: countMemories(),
  topRepos: distinct.slice(0, 25).map(({ name, commits, coauthored, origin }) => ({ name, commits, coauthored, origin })),
  meHash,
};
proof.seal = sealOf(token, proof);

const outPath = join(HERE, 'proof.sealed.json');
writeFileSync(outPath, JSON.stringify(proof, null, 2) + '\n');

console.log('\nPROVA SELADA: anti-cheat/proof.sealed.json');
console.log(`  repos distintos: ${proof.distinctRepos} | commits: ${proof.totalCommits} | Claude: ${proof.totalCoauthored} (${(proof.coAuthorRatio*100).toFixed(0)}%)`);
console.log(`  amostra-token: repo "${tokenSample?.repo}" idx ${tokenSample?.index}/${tokenSample?.total} sha ${tokenSample?.sha?.slice(0,10)}...`);
console.log(`  selo: ${proof.seal.slice(0, 16)}...`);
console.log('\nEnvie ao desafiante:  players/me.json  +  anti-cheat/proof.sealed.json');
