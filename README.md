# EJC Aparecida

Fonte versionado da aplicação EJC Aparecida, reconstruído em Next.js, React,
Prisma e PostgreSQL a partir do comportamento funcional, do schema e dos dados
institucionais validados. O runtime compilado anterior foi preservado somente em
`runtime-baseline/` para rastreabilidade; ele não é a fonte da aplicação.

## Desenvolvimento

1. Copie `.env.example` para `.env` e preencha somente valores locais.
2. Execute `npm ci` e `npm run db:generate`.
3. Prepare um PostgreSQL isolado com `npm run db:push`.
4. Crie o administrador com `npm run db:seed`.
5. Valide com `npm run typecheck`, `npm run lint` e `npm run build`.

O projeto expõe `/api/health` para identificação da versão e `/api/ready` para
comprovar acesso ao banco.

- Documentação histórica: [DOCUMENTACAO.md](DOCUMENTACAO.md)
- Restauração histórica: [RESTAURACAO.md](RESTAURACAO.md)
- Fluxograma histórico: [FLUXO.md](FLUXO.md)
- Estado atual: [PROJECT_STATE.md](PROJECT_STATE.md)

Este repositório não deve receber `.env`, credenciais, bancos, dumps, backups ou
dependências instaladas.
