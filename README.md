# 🦁 Claude Code — Player Card Challenge

Gere uma **ficha de jogador** (estilo RPG) que descreve como você usa o **Claude Code** no
dia a dia — a partir de **evidência real** da sua máquina (repos, `git log`, memórias,
ferramentas) — valide contra um schema e renderize um **card HTML** que imprime bonito.

E o melhor: um sistema **anti-cheat** pra rodar isso como um **desafio entre amigos** —
dá pra saber se a pessoa gerou de verdade ou **burlou**.

**▶ [Ver um card ao vivo](https://theliongab.github.io/claude-player-card-challenge/)** — demo com ficha fictícia, só pra mostrar o formato.

> Este repositório é só o **framework**. Sua ficha (`players/me.json`) é gerada localmente
> a partir da SUA máquina e **não** vem aqui — nada de dados de ninguém no repo.

## Como gerar a sua ficha

```bash
git clone https://github.com/TheLionGab/claude-player-card-challenge
cd claude-player-card-challenge
```

1. **Abra o Claude Code nesta pasta** e cole o conteúdo de [`PROMPT.md`](./PROMPT.md).
   Ele te analisa e cria `players/me.json` (validado contra [`schema/`](./schema/)).
2. **Renderize o card:**
   ```bash
   node render-card.mjs players/me.json players/me.card.html
   open players/me.card.html      # Cmd+P imprime em PDF
   ```

## Modo desafio (anti-cheat)

| Papel | Comando |
|---|---|
| **Desafiante** emite um token único | `node anti-cheat/issue-challenge.mjs <amigo>` |
| **Participante** gera a prova selada da máquina dele | `node anti-cheat/collect-proof.mjs <TOKEN>` |
| **Desafiante** verifica a submissão | `node anti-cheat/verify.mjs <amigo> proof.sealed.json me.json` |

**Por que é difícil burlar** — token aleatório (não dá pra preparar **antes**) + selo
SHA-256 ligando token+prova+ficha (não dá pra editar **depois**) + um SHA de git real
ancorado no token (só existe na máquina real). A prova só contém contagens e hashes —
**sem segredos** (não lê `.env`, senha nem conteúdo de arquivo).

**Limite honesto:** sem rodar na máquina do participante, nenhum sistema prova 100%. Este
torna a trapaça **cara e detectável** — a prova que passa em todos os checks é a gerada de
verdade. Modelo de ameaça completo em [`anti-cheat/README.md`](./anti-cheat/README.md).

## Estrutura

```
schema/player.schema.json   # o contrato (JSON Schema draft 2020-12)
PROMPT.md                   # o "input" que você cola no Claude Code
render-card.mjs             # ficha JSON -> card HTML (data-driven, offline, 1 arquivo)
anti-cheat/                 # prova-de-trabalho selada + verificador
players/                    # sua ficha gerada vai aqui (fora do git)
```

## Design

Paleta **Tokyo Night** + dourado; Space Grotesk + JetBrains Mono; herói com medidor de
co-autoria com o Claude sobre uma constelação. Sem dependências — só Node.js.

## Licença

MIT — veja [LICENSE](./LICENSE).

---
*Feito com Claude Code. Tom: brincalhão e orgulhoso, mas honesto — cada número tem evidência.*
