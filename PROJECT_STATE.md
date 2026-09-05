# Estado atual do EJC Aparecida

Atualizado em 2026-09-05.

## Fonte e plataforma

- **CONFIRMADO — fonte local:** a raiz contém a implementação completa em
  Next.js/React/TypeScript, compilável e versionada no branch `main`.
- **CONFIRMADO — proveniência:** a implementação local foi reconstruída sem
  promover os artefatos compilados anteriores a fonte oficial; a evidência do
  runtime anterior permanece em `runtime-baseline/`.
- **CONFIRMADO — persistência:** o provider do Prisma continua sendo PostgreSQL.
  Nenhuma troca de engine foi realizada.
- **CONFIRMADO — proteção de dados:** nenhum valor de segredo, credencial, token,
  chave privada ou dado de produção foi lido ou incluído nesta alteração.

## Implementação de 2026-09-05

- **CONFIRMADO — schema local:** `FinanceEntry` possui `receiptUrl`; `Rental`
  possui `initialConditionPhoto` e `conditionCaption`; e o schema contém
  `FormCampaign` e `FormSubmission` com a relação e os mapeamentos solicitados.
- **CONFIRMADO — patrimônio:** o schema e a aplicação também contemplam catálogo
  de bens (`InventoryItem`), quantidade disponível, telefone do tomador e vínculo
  do empréstimo ao item de estoque.
- **CONFIRMADO — home pública:** o código exibe uma campanha ativa e ainda válida
  no topo, com banner e formulário dinâmico; quando não existe campanha, o
  primeiro bloco é o calendário mensal navegável. Abaixo dele são exibidos até
  cinco próximos eventos.
- **CONFIRMADO — conteúdo público:** equipe e localizações foram reorganizadas em
  grades responsivas; as localizações apresentam endereço, horários de missa e
  link direto para o Google Maps.
- **CONFIRMADO — formulários:** há submissão pública para campos de texto, número,
  opções e checkbox, além de gestão administrativa de campanhas, consulta das
  200 respostas mais recentes e exportação CSV compatível com Excel. A exportação
  neutraliza valores que poderiam ser interpretados como fórmulas de planilha.
- **CONFIRMADO — finanças:** as telas administrativa e de membros apresentam
  caixa atual, entradas e saídas do mês, histórico em abas para os últimos três
  meses e relatórios em aba separada. A administração permite anexar imagem de
  comprovante a despesas e visualizá-la por miniatura e modal.
- **CONFIRMADO — patrimônio e estoque:** o antigo módulo de aluguel apresenta
  catálogo, totais e disponibilidade, registra empréstimos com foto e legenda do
  estado inicial e permite dar baixa na devolução.
- **CONFIRMADO — navegação administrativa:** o painel e a barra lateral incluem
  Formulários e identificam o antigo aluguel como Patrimônio & Estoque.

## Validação local

- **CONFIRMADO — dependências:** `npm ci` foi concluído a partir do lockfile; o
  Next.js instalado e usado na validação é o 16.3.3.
- **CONFIRMADO — Prisma:** `npx prisma generate` foi concluído com Prisma 6.19.3.
- **CONFIRMADO — tipos:** `npm run typecheck` foi aprovado.
- **CONFIRMADO — lint:** `npm run lint` foi aprovado sem avisos.
- **CONFIRMADO — build:** `npm run build` foi aprovado com Next.js 16.3.3 e
  incluiu as novas páginas e rotas de formulários, patrimônio e uploads.
- **CONFIRMADO — testes disponíveis:** o `package.json` não define script
  automatizado `test`.
- **CONFIRMADO — auditoria de dependências:** a execução de `npm ci` reportou nove
  vulnerabilidades conhecidas (duas baixas, uma moderada e seis altas); nenhuma
  correção automática ou atualização incompatível foi aplicada nesta tarefa.
- **NÃO CONFIRMADO — validação funcional:** não foi executado smoke test em
  navegador com PostgreSQL local preenchido nem fluxo autenticado ponta a ponta.
- **NÃO CONFIRMADO — schema aplicado:** esta tarefa não executou migration,
  `prisma db push`, seed ou alteração de banco; o schema foi alterado e o cliente
  foi gerado, mas as tabelas e colunas ainda precisam ser aplicadas por um plano
  separado no ambiente de destino.

## Publicação e operação

- **CONFIRMADO — versão do pacote:** a versão candidata permanece `0.2.0`.
- **CONFIRMADO — escopo desta tarefa:** não houve push, deploy, conexão ao banco,
  migração, restart, alteração de proxy ou escrita em produção.
- **NÃO CONFIRMADO — DEV e produção:** a revisão ainda não foi validada ou
  publicada em ambiente DEV real e não foi promovida à produção.
- **RECOMENDAÇÃO — próximo passo:** aplicar o schema primeiro em PostgreSQL DEV
  isolado, executar health, ready, login e smoke funcional e somente depois
  planejar eventual promoção da mesma revisão.
- **RECOMENDAÇÃO — produção:** qualquer promoção futura deve ter autorização
  específica, lock, backup validado, rollback, evidências e confirmação manual
  com 2FA.

## Pendências controladas

- **RECOMENDAÇÃO:** definir e versionar a migração PostgreSQL correspondente ao
  novo schema antes de publicar a funcionalidade.
- **RECOMENDAÇÃO:** avaliar as vulnerabilidades reportadas pelo npm sem usar
  `npm audit fix --force` automaticamente.
- **NÃO CONFIRMADO — segurança histórica:** a rotação de credenciais e a eventual
  limpeza do histórico antigo continuam sendo uma tarefa separada.
