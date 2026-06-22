#!/usr/bin/env node
// =============================================================================
// issue-challenge.mjs  —  rode VOCE (o desafiante)
// Emite um DESAFIO unico (token aleatorio, sem padrao) para um participante.
// Entregue SO o token ao participante. Guarde o registro para verificar depois.
//   uso:  node anti-cheat/issue-challenge.mjs <nome-do-participante>
// =============================================================================
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const name = (process.argv[2] || '').trim();
if (!name) {
  console.error('uso: node anti-cheat/issue-challenge.mjs <nome-do-participante>');
  process.exit(1);
}

const dir = join(HERE, 'issued');
mkdirSync(dir, { recursive: true });
const file = join(dir, `${name}.json`);
if (existsSync(file)) {
  const old = JSON.parse(readFileSync(file, 'utf8'));
  console.error(`Ja existe desafio para "${name}" (token ${old.token.slice(0, 8)}...).`);
  console.error('Apague anti-cheat/issued/' + name + '.json para reemitir.');
  process.exit(1);
}

const token = randomBytes(16).toString('hex');         // 128 bits => imprevisivel
const issuedAt = new Date().toISOString();
const rec = { name, token, issuedAt, seed: parseInt(token.slice(0, 8), 16) >>> 0 };
writeFileSync(file, JSON.stringify(rec, null, 2) + '\n');

console.log('┌─────────────────────────────────────────────────────────────┐');
console.log(`│ Desafio emitido para: ${name.padEnd(40)}│`);
console.log('└─────────────────────────────────────────────────────────────┘');
console.log('\nTOKEN (entregue SO isto ao participante):\n');
console.log('   ' + token + '\n');
console.log('Registro salvo em: anti-cheat/issued/' + name + '.json (NAO compartilhe).');
console.log('\nO participante deve, na maquina dele:');
console.log('  1) rodar o PROMPT.md no Claude Code dele -> gera players/me.json');
console.log('  2) rodar:  node anti-cheat/collect-proof.mjs ' + token);
console.log('  3) te enviar players/me.json + anti-cheat/proof.sealed.json');
