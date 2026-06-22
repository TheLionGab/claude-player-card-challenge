# Anti-cheat — prova-de-trabalho selada (anti-roubo / antidetect)

Sistema para saber se um participante **gerou a ficha de verdade na máquina dele** ou
**burlou** (copiou a sua, editou os números, preparou antes, ou inflou a ficha).

A ideia: **fingir custa o mesmo que fazer de verdade.** A única forma de produzir uma
prova válida é rodar a análise real, numa máquina real, com repos reais — que é
exatamente a tarefa. Não há "padrão" (gabarito) para roubar: cada desafio é único.

## Fluxo (3 papéis: VOCÊ = desafiante, ELE = participante)

```
VOCÊ                                   ELE (outra máquina)
────                                   ───────────────────
issue-challenge.mjs <nome>
   └─ gera TOKEN único  ──── entrega só o token ───►
                                       roda o PROMPT.md no Claude Code
                                          └─ gera players/me.json
                                       collect-proof.mjs <TOKEN>
                                          └─ varre TODOS os repos (inclui
                                             arquivados), amostra um SHA real
                                             ancorado no token, liga na me.json
                                             e SELA  ► proof.sealed.json
        ◄──── envia me.json + proof.sealed.json ────┘
verify.mjs <nome> proof.sealed.json me.json
   └─ VEREDITO: ✅ autêntico / ⚠️ suspeito / ⛔ fraude
```

### Comandos

```bash
# VOCÊ emite o desafio (um por participante):
node anti-cheat/issue-challenge.mjs joao

# ELE, na máquina dele, depois de gerar players/me.json:
node anti-cheat/collect-proof.mjs <TOKEN-que-voce-deu>

# VOCÊ verifica a submissão dele:
node anti-cheat/verify.mjs joao proof.sealed.json me.json
```

## Por que não dá para burlar — "nem antes do terminal, nem depois"

| Ataque | Defesa | Check que pega |
|---|---|---|
| **Roubar a sua ficha** (copiar `me.json`) | comparação de hash com a ficha de referência | ⛔ "copiou a ficha de referencia" |
| **Preparar a prova ANTES** | o token é aleatório (128 bits) e só é revelado na hora; a amostra-SHA depende dele | ⛔ token / ⚠️ amostra-token |
| **Editar a prova DEPOIS** (inflar números) | selo `SHA-256(token + prova)` — qualquer byte alterado quebra o selo | ⛔ selo íntegro |
| **Mandar a prova de outra pessoa** | o token tem que ser o que VOCÊ emitiu para aquele nome | ⛔ token confere |
| **Inflar a ficha** além do trabalho real | a ficha é selada junto da prova; commits alegados vs. medidos | ⛔ me.json==selado / ⚠️ inflação |
| **Inventar repos/commits** | precisaria de SHAs git reais no índice exato derivado do token | ⚠️ consistência / amostra-token |

**Limite honesto:** sem rodar na máquina dele nem ter acesso aos repos dele, nenhum
sistema prova 100%. O que este faz é tornar a trapaça **cara e detectável**: as únicas
provas que passam em todos os checks são as geradas rodando a análise real. Para falsificar
de forma convincente, a pessoa teria que... fazer o trabalho de verdade. 🦁

## O que a prova contém (e o que NÃO contém)

Contém: contagens (repos, commits, co-autoria), histograma de extensões, nº de ferramentas
e memórias, 1 SHA de commit real (público no git), hash da máquina (não-reversível), timestamp, selo.

**Não contém** segredos, tokens de API, emails, conteúdo de arquivo, caminhos privados.
