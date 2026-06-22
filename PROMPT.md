# Claude Code Player Card — prompt para gerar a SUA ficha

Cole o texto abaixo no seu Claude Code, na raiz desta pasta (onde estao `schema/` e `players/`).
Ele vai te analisar e gerar `players/me.json`.

---

Analise como EU uso o Claude no dia a dia.

Vasculhe:
- `~/Developer` e demais pastas de projeto (estrutura, linguagens, frequencia)
- `git log` de cada projeto (datas, nº de commits, autores, co-autoria `Co-Authored-By: Claude`, horarios)
- `~/.claude/CLAUDE.md` e qualquer `CLAUDE.md`/`AGENTS.md` de repo (instrucoes e preferencias)
- `~/.claude/**/memory*` ou `memories*` (memorias salvas)
- Ferramentas instaladas (dotdirs de coding-agents, MCPs, plugins, hooks em `~/.claude/`)

Com base nisso, preencha EXATAMENTE o schema em `schema/player.schema.json`
e salve o resultado em `players/me.json`.

Regras:
- Siga o schema field-by-field, sem omitir campos obrigatorios.
- Seja honesto: nao invente habilidades; cite projetos reais como evidencia (numeros de commits, arquivos, datas).
- Distinga o que e SEU do que e de cliente/colaborador (use `honesty_notes`).
- Tom: brincalhao e orgulhoso, mas verdadeiro.
- NAO inclua segredos, tokens, senhas, emails pessoais ou caminhos sensiveis.
- Se um campo nao tiver evidencia suficiente, use `null` ou o default do schema.
- Ao final, valide o `players/me.json` contra o schema e mostre um resumo do que foi gerado.

---

## Desafio anti-cheat (se você recebeu um TOKEN)

Se o desafiante te passou um TOKEN, depois de gerar `players/me.json` rode:

```bash
node anti-cheat/collect-proof.mjs <SEU-TOKEN>
```

Isso gera `anti-cheat/proof.sealed.json` (prova-de-trabalho selada da SUA máquina,
sem segredos). Envie de volta `players/me.json` + `anti-cheat/proof.sealed.json`.
Detalhes em `anti-cheat/README.md`.

---

## Dicas de mineracao (comandos uteis)

```bash
# repos + nº de commits + janela de atividade
for d in ~/Developer/*/; do
  git -C "$d" rev-parse --git-dir >/dev/null 2>&1 &&
  echo "$(basename "$d"): $(git -C "$d" rev-list --all --count) commits"
done

# quanto do trabalho e co-autorado pelo Claude
git -C <repo> log --all --grep="Co-Authored-By: Claude" -i --oneline | wc -l

# linguagens predominantes (ignora node_modules/.git/Pods)
find <repo> -type f -not -path "*/node_modules/*" -not -path "*/.git/*" \
  | sed -n 's/.*\.\([a-z0-9]\{1,5\}\)$/\1/p' | sort | uniq -c | sort -rn | head
```
