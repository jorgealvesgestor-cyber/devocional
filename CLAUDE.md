# Devocional — jornada jovem (manual do projeto e do robô mensal)

App gratuito de devocionais para jovens de **10 a 15 anos**. Projeto pessoal do Jorge Alves (Sorocaba/SP).
Site estático (React + Vite), sem IA em tempo real, sem servidor. Publicado em https://devocional.blacklion.pro
— o servidor baixa a pasta `dist/` da branch `main` deste repositório a cada 10 minutos.

> ⚠️ O nome do app é só **Devocional**. Não inventar outro nome/marca pro app nem pras jornadas
> (o nome do protótipo antigo é marca registrada de terceiros). Hashtag do projeto: `#DevocionalJovem`.

## Estrutura

- `data/jornadas/NN/` — uma pasta por jornada (01, 02, 03...). Cada jornada = 30 devocionais = 1 mês.
  - `semana1.ts` (dias 1–7), `semana2.ts` (8–14), `semana3.ts` (15–21), `semana4.ts` (22–30)
  - `index.ts` — exporta `JORNADA` com `numero`, `titulo`, `liberadaEm`, `semanas`, `devocionais`
- `data/jornadas/index.ts` carrega todas as pastas sozinho (não precisa editar).
- Uma jornada só aparece no app quando `liberadaEm` (AAAA-MM-DD) chega.
- `dist/` é commitado de propósito (é o que vai pro ar). Sempre rodar `npm run build` antes de commitar.

## Tarefa do robô mensal (roda por volta do dia 25)

1. Descobrir o número da próxima jornada (maior pasta existente + 1) e a data de liberação = **dia 1º do mês seguinte**.
2. Levantar **todos os capítulos já usados** (campos `livro` + `capitulo` de todas as jornadas). **Não repetir capítulo.**
3. Escolher um tema geral pra jornada + um tema por semana (4 semanas), pensado pra 10–15 anos
   (ex.: amizade, identidade, família, oração, coragem, redes sociais, perdão, propósito, heróis da Bíblia, Espírito Santo).
   Misturar Antigo e Novo Testamento, priorizando capítulos com histórias e aplicação clara pra essa idade.
4. Escrever os 30 devocionais em `data/jornadas/NN/` seguindo **exatamente** o formato de `data/jornadas/01/` (copiar a estrutura dos arquivos).
5. Rodar `npm install`, `npx tsc --noEmit` e `npm run build` — tudo tem que passar.
6. Criar a branch `jornada-NN`, commitar (inclusive `dist/`) e abrir um **Pull Request** pra `main` com o título
   `Jornada NN — <título> (libera em AAAA-MM-01)` e, na descrição, a **lista dos 30 dias** (dia, título, livro e capítulo)
   + um checklist de revisão pro Jorge. **Nunca fazer merge sozinho.** O Jorge revisa e aprova.

## Formato de cada devocional (obrigatório)

Campo `conteudo` em Markdown, nesta ordem, com `---` entre as partes:

```
Fala, geração que não se conforma com este mundo! 🚀 **Dia N** ... (abertura curta e animada, 1–3 frases)

---

## 1. Fala, {{nome}}! 👋

Gancho do cotidiano do adolescente (escola, celular, games, amigos, família) que conecta com o tema. Termina com "Se liga!" ou parecido.

---

## 2. O que tá rolando? 📖

Explica o capítulo de forma simples e fiel ao texto, com 1–3 citações curtas entre aspas e itálico + referência (ex.: (João 3:3)).
Pode usar lista com emojis. Aplicação clara pra idade.

---

## 3. Conexão Espírito Santo 🔥

*Feche os olhos por um segundo, respira fundo e sente a presença dEle aí onde você está.*

Oração em 1ª pessoa, falando com Deus/Jesus/Espírito Santo, ligada ao tema. Termina com "Amém! 🙏".

---

## 4. Desafio Radical ⚡

**Missão: Nome Criativo!**

1. Passo prático e possível pra um adolescente
2. ...
3. ...

Frase final curta com 😉.

---

## 5. Versículo pra postar 📸

*Instrução de foto simples (algo que dá pra fotografar em casa/escola) e usa essa legenda:*

"Texto do versículo. EMOJI Livro C:V #DevocionalJovem #DiaN #HashtagDoTema #OutraHashtag"
```

- `{{nome}}` vira o nome do jovem no app. Usar só no título da seção 1.
- A legenda da seção 5 é **uma linha só**, entre aspas retas, começando com `"`.
- Dias 7, 14, 21 e 28: mencionar o fechamento da semana. Dia 1: boas-vindas à jornada nova. Dia 30: celebração + missão final.
- Tamanho: parecido com os da Jornada 01 (~300–450 palavras cada).

## Tom de voz

- Mentor jovem, animado, pentecostal (ênfase no Espírito Santo), gírias cristãs leves: "manda a real", "tá ligado", "a parada é", "se liga", "bora".
- Emojis com moderação (vários, mas sem poluir).
- Gênero neutro com "(a)" quando falar com o jovem: "cansado(a)", "filho(a)".
- Respeitoso, acolhedor, nunca humilhar, nunca linguagem grosseira, nunca terror/culpa pesada.

## Regras de segurança (inegociáveis)

- **Versículos:** citar na **NVI**, fielmente. Se não tiver certeza do texto exato, **parafrasear sem aspas** em vez de inventar citação. Referência sempre correta.
- **Doutrina:** cristã evangélica/pentecostal "de consenso". Evitar temas polêmicos entre denominações (escatologia detalhada, dízimo como obrigação, política, etc.).
- **Público de 10–15 anos:** nada de violência gráfica, sexualidade, medo. Desafios seguros, sem expor o jovem, sem pedir dinheiro, sem encontrar estranhos.
- Quando o tema tocar em ansiedade, tristeza, bullying ou problemas em casa: incluir orientação gentil de **conversar com pais ou um adulto de confiança**.
- Não citar marcas, influenciadores reais, igrejas ou pastores específicos.
