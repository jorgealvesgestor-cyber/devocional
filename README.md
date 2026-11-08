# Devocional: jornada jovem

Jornadas de 30 dias para jovens de 10 a 15 anos. Site estático: sem IA, sem servidor, sem custo.
Uma jornada nova por mês (veja `CLAUDE.md`).

- Jornadas: `data/jornadas/NN/` (use `{{nome}}` onde entra o nome do jovem)
- Progresso e nome ficam salvos no aparelho do jovem (localStorage)
- Botão OUVIR usa a voz do próprio aparelho (grátis)

## Rodar
    npm install
    npm run dev

## Publicar
    npm run build   # gera dist/ (commitado)
    git push        # o servidor busca a branch main a cada 10 minutos
