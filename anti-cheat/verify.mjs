#!/usr/bin/env node
// =============================================================================
// verify.mjs  —  rode VOCE (o desafiante), com a submissao recebida
// Da o VEREDITO: a ficha foi gerada de verdade na maquina do participante,
// ou ele burlou (copiou / editou depois / preparou antes / inflou numeros)?
//   uso:  node anti-cheat/verify.mjs <nome> <proof.sealed.json> <me.json>
// =============================================================================
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sealOf } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(HERE);
const [name, proofPath, mePath] = process.argv.slice(2);
if (!name || !proofPath || !mePath) {
  console.error('uso: node anti-cheat/verify.mjs <nome> <proof.sealed.json> <me.json>');
  process.exit(1);
}

const issuedFile = join(HERE, 'issued', `${name}.json`);
if (!existsSync(issuedFile)) { console.error(`Nenhum desafio emitido para "${name}".`); process.exit(1); }
const issued = JSON.parse(readFileSync(issuedFile, 'utf8'));
const proof = JSON.parse(readFileSync(proofPath, 'utf8'));
const meRaw = readFileSync(mePath);
const me = JSON.parse(meRaw);

const checks = [];
const add = (sev, ok, label, detail = '') => checks.push({ sev, ok, label, detail });
//  sev: 'fatal' (burla) | 'warn' (suspeito) | 'info'

// 1) token bate com o emitido
add('fatal', proof.token === issued.token, 'Token confere com o desafio emitido',
  proof.token === issued.token ? '' : `esperado ${issued.token.slice(0,8)}.. recebeu ${String(proof.token).slice(0,8)}..`);

// 2) selo integro (nada editado depois)
const recomputed = sealOf(issued.token, proof);
add('fatal', recomputed === proof.seal, 'Selo integro (sem edicao pos-geracao)',
  recomputed === proof.seal ? '' : 'selo nao bate -> a prova foi alterada depois de selada');

// 3) a ficha enviada e exatamente a que foi selada
const meHash = createHash('sha256').update(meRaw).digest('hex');
add('fatal', meHash === proof.meHash, 'me.json enviado == me.json selado',
  meHash === proof.meHash ? '' : 'hash da ficha nao bate com o da prova');

// 4) gerado DEPOIS do desafio (nao da pra preparar antes)
const okTime = new Date(proof.generatedAt) > new Date(issued.issuedAt);
add('fatal', okTime, 'Gerado apos a emissao do desafio (anti-precompute)',
  okTime ? '' : `prova de ${proof.generatedAt} <= desafio de ${issued.issuedAt}`);

// 5) amostra ancorada no token e consistente
const ts = proof.tokenSample;
const shaOk = ts && /^[0-9a-f]{40}$/.test(ts.sha || '');
const idxOk = ts && ts.total > 0 && ts.index === (issued.seed % ts.total) && ts.index < ts.total;
add('warn', !!(shaOk && idxOk), 'Amostra-token (SHA real no indice do token) consistente',
  shaOk ? (idxOk ? '' : `indice ${ts?.index} != seed%${ts?.total}=${ts ? issued.seed % ts.total : '?'}`) : 'SHA invalido/ausente');

// 6) consistencia interna dos numeros
const sumTop = (proof.topRepos || []).reduce((s, r) => s + (r.commits || 0), 0);
add('warn', sumTop <= proof.totalCommits && proof.totalCoauthored <= proof.totalCommits,
  'Numeros internamente consistentes', `soma topRepos=${sumTop} total=${proof.totalCommits} claude=${proof.totalCoauthored}`);
add('warn', (proof.languages || []).length > 0 && proof.distinctRepos > 0 && proof.totalCommits > 0,
  'Tem repos, commits e linguagens reais', `repos=${proof.distinctRepos} langs=${(proof.languages||[]).length}`);

// 7) a ficha nao infla muito alem da prova
const claimed = me?.claude_usage?.total_fleet_commits ?? 0;
const inflated = claimed > proof.totalCommits * 1.25 + 50;
add('warn', !inflated, 'Ficha nao infla commits alem da prova',
  inflated ? `ficha diz ${claimed}, prova mostra ${proof.totalCommits}` : `ficha ${claimed} ~ prova ${proof.totalCommits}`);

// 8) anti-copia: nao e a ficha de referencia do desafiante
const refPath = join(ROOT, 'players', 'me.json');
if (existsSync(refPath)) {
  const refHash = createHash('sha256').update(readFileSync(refPath)).digest('hex');
  add('fatal', meHash !== refHash, 'Nao copiou a ficha de referencia (me.json do desafiante)',
    meHash === refHash ? 'a ficha enviada e identica a sua -> ROUBO' : '');
}

// ---- veredito ----
const fatals = checks.filter(c => c.sev === 'fatal' && !c.ok);
const warns = checks.filter(c => c.sev === 'warn' && !c.ok);
const line = (c) => `  ${c.ok ? '✅' : (c.sev === 'fatal' ? '⛔' : '⚠️ ')} ${c.label}${c.detail ? '  — ' + c.detail : ''}`;

console.log(`\n=== VERIFICACAO: ${name} ===\n`);
checks.forEach(c => console.log(line(c)));

let verdict, code;
if (fatals.length) { verdict = '⛔ FRAUDE DETECTADA (' + fatals.length + ' falha(s) critica(s))'; code = 2; }
else if (warns.length) { verdict = '⚠️  SUSPEITO (' + warns.length + ' sinal(is) de alerta — revisar manualmente)'; code = 1; }
else { verdict = '✅ AUTENTICO — prova-de-trabalho real, selada e ancorada no token'; code = 0; }

console.log('\n' + '─'.repeat(60));
console.log('VEREDITO: ' + verdict);
console.log('─'.repeat(60));
console.log(`Resumo da prova: ${proof.distinctRepos} repos | ${proof.totalCommits} commits | ${proof.totalCoauthored} co-Claude | ${proof.toolsInstalled} tools | ${proof.memoryCount} memorias`);
process.exit(code);
