// Utilitarios compartilhados (sem dependencias externas).
import { createHash } from 'node:crypto';

// JSON canonico determinístico (chaves ordenadas) — base do selo.
export function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort()
      .map(k => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  return JSON.stringify(v);
}

export const sha256 = (s) => createHash('sha256').update(s).digest('hex');

// selo = sha256(token + json-canonico-da-prova-sem-o-campo-seal)
export function sealOf(token, proof) {
  const { seal, ...rest } = proof;
  return sha256(token + '|' + stable(rest));
}
