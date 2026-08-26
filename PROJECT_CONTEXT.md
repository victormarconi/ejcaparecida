# Contexto do projeto

- **CONFIRMADO — data do registro:** 2026-08-24.
- **CONFIRMADO — data da reconciliação GitHub/VPS:** 2026-08-24.
- **CONFIRMADO — nome do pacote:** `ejc-aparecida`.
- **CONFIRMADO — domínio:** `ejcaparecida.pdm1.com.br`.
- **CONFIRMADO — aplicação canônica em produção:** `/opt/icp-apps/apps/ejcaparecida`.
- **INFERIDO — natureza da aplicação:** aplicação fullstack JavaScript/TypeScript baseada em Next.js, com UI React, rotas de servidor/API e persistência via Prisma/PostgreSQL.

## Arquitetura observada

```text
Internet
  -> Nginx :80 (redirecionamento HTTPS)
  -> Nginx :443 (TLS/Certbot)
       -> /                 -> 127.0.0.1:3210 -> app Next.js
       -> /admin/aluguel    -> 127.0.0.1:3213 -> sem listener observado

App canônica
  -> Prisma -> PostgreSQL (banco lógico ejcaparecida)
  -> uploads e JSON em bind mount no host
  -> integração lógica com Google Sheets/Drive

Serviços adjacentes observados
  -> activity-sync :4051
  -> Redis em loopback :6379
  -> MariaDB em loopback :3306
```

- **CONFIRMADO — limite do diagrama:** os fluxos Nginx e Prisma/PostgreSQL foram sustentados pelas evidências do discovery.
- **INFERIDO — limite do diagrama:** a relação detalhada de `activity-sync`, Redis e MariaDB com a aplicação não foi demonstrada.
- **NÃO CONFIRMADO — limite do diagrama:** não há topologia interna de container, digest de imagem ou dependências completas confirmadas.

## Matriz dos 25 itens de discovery

| # | Item | Estado | Evidência/origem sanitizada e limitação |
|---:|---|---|---|
| 1 | Workspace local | **CONFIRMADO** | Inspeção Git local: repositório inicializado, `HEAD` em `master` unborn, sem commits ou remotes e com os quatro documentos locais untracked. Nenhum clone foi executado. |
| 2 | Identidade e localização canônica | **CONFIRMADO** | Relatório de inspeção read-only: pacote `ejc-aparecida`, domínio `ejcaparecida.pdm1.com.br` e path `/opt/icp-apps/apps/ejcaparecida`. |
| 3 | Fonte Git oficial e Git da produção | **CONFIRMADO / NÃO CONFIRMADO** | **CONFIRMADO:** repositório oficial `https://github.com/victormarconi/ejcaparecida`, branch única/default `main`, agora com 10 commits e HEAD `adcf82ef0d12fd52d1ee117011f01ede72bc0121`. **NÃO CONFIRMADO:** Git na produção, causalidade do build original e derivação completa da VPS a partir do GitHub; o path canônico não contém `.git`. |
| 4 | Disponibilidade do fonte | **CONFIRMADO** | A árvore canônica observada é predominantemente runtime/build; o repositório oficial é snapshot/export parcial da VPS. Ambos não contêm `app`, `pages`, `src`, `components` ou `lib`; o `server.js` é artefato standalone e `prisma/seed-content.ts` importa `src/lib` inexistente. A oficialidade do repositório não comprova completude do fonte Next original. |
| 5 | Artefatos presentes | **CONFIRMADO** | Foram observados `package.json`, `package-lock.json`, `server.js`, `.next`, `prisma/schema.prisma`, `public/uploads`, `data/site-data.json`, `.env` e `docker-compose.yml`; conteúdo sensível não foi lido. |
| 6 | Stack e versões | **CONFIRMADO** | Manifestos do GitHub e runtime indicam package `ejc-aparecida` `0.1.0`, lockfile npm v3, JavaScript/TypeScript, Next `16.2.4`, React `19.2.5`, Prisma `6.19.3` e imagem declarada na VPS `node:20-bookworm`. |
| 7 | Gerenciador, schema e scripts | **CONFIRMADO** | Há lockfile npm v3 e scripts `dev`, `build`, `start`, `start:standalone`, `lint`, `db:generate`, `db:push`, `db:seed` e `db:seed-content`. O schema no HEAD usa PostgreSQL; não há migrations, e o seed de conteúdo referencia fonte ausente. |
| 8 | Testes automatizados | **CONFIRMADO** | Nenhum script `test` foi encontrado no manifesto do HEAD; a existência de testes fora do snapshot permanece **NÃO CONFIRMADA**. |
| 9 | Forma da aplicação e rotas | **CONFIRMADO / INFERIDO** | **CONFIRMADO:** artefatos compilados em `.next/server/app` e `.next/server/pages` sustentam a presença de rotas API/server-side, sem comprovar que endpoints funcionais tenham sido testados. **INFERIDO:** o conjunto Next/React/Prisma sugere arquitetura full-stack em um único serviço; o fonte completo não está disponível. |
| 10 | Endpoint principal | **CONFIRMADO** | O serviço principal respondeu em `127.0.0.1:3210`; `GET /` local e o vhost HTTPS retornaram 200 no momento da inspeção. |
| 11 | Definição Compose | **CONFIRMADO** | `/opt/icp-apps/apps/ejcaparecida/docker-compose.yml` existe na VPS e define service/container `ejcaparecida`, `node:20-bookworm`, diretório `/app`, `restart: unless-stopped`, host network, `NODE_ENV=production`, `PORT=3210`, `HOSTNAME=127.0.0.1`, bind do path para `/app` e execução de `node server.js`. Dockerfile e `docker-compose.yml` estão ausentes do repositório oficial. |
| 12 | Estado do container | **NÃO CONFIRMADO** | Não houve acesso ao Docker socket; estado, digest, logs e health do container não foram consultados. |
| 13 | Supervisão e lifecycle | **INFERIDO** | Não foi identificada unit systemd específica do EJC; Docker, Nginx, MariaDB e `pdm-postgres-loopback` estavam ativos. O lifecycle via Compose é inferido, não comprovado operacionalmente. |
| 14 | Nginx/TLS | **CONFIRMADO** | Vhost `ejcaparecida` habilitado: HTTP 80 redireciona para HTTPS, 443 usa Certbot, `/` aponta para 3210 e `/admin/aluguel` para 3213. |
| 15 | Portas e listeners | **CONFIRMADO** | Observados 80, 443, 3210 em loopback, 4051 em `0.0.0.0`, PostgreSQL em loopback 5432/5433, Redis em loopback 6379 e MariaDB em loopback 3306; 3213 recusou conexão. |
| 16 | Banco principal | **CONFIRMADO** | O provider Prisma é PostgreSQL e sessões sanitizadas identificaram o banco lógico `ejcaparecida`; host, usuário, senha e URL não foram lidos nem registrados. |
| 17 | Versão PostgreSQL | **INFERIDO** | A infraestrutura declara `postgres:16-alpine`, sugerindo PostgreSQL 16; o patch e a correspondência exata com a instância usada pelo app são **NÃO CONFIRMADOS**. |
| 18 | MariaDB | **INFERIDO** | MariaDB está presente, mas seu papel como legado ou auxiliar é apenas inferido; uso pela aplicação canônica não foi demonstrado. |
| 19 | Redis e filas | **NÃO CONFIRMADO** | Redis existe na infraestrutura, porém o uso pelo app não foi confirmado; não foram observadas dependências de queue no manifesto disponível. |
| 20 | `activity-sync` | **INFERIDO** | Serviço em 4051 respondeu 401, confirmando disponibilidade HTTP protegida; seu papel detalhado para o EJC permanece inferido. |
| 21 | Agendamentos | **NÃO CONFIRMADO** | Não havia cron de `pdmops` e não foram identificados cron/timers específicos do EJC; isso não prova ausência em todos os escopos. |
| 22 | Storage persistente | **CONFIRMADO** | `public/uploads` contém 17 arquivos, cerca de 10,75 MB, grupo `team`; `data/site-data.json` tem 6326 bytes. Ambos ficam no host bind-mounted; conteúdos não foram lidos. |
| 23 | Integrações Google | **CONFIRMADO** | Dependência `googleapis`, configuração lógica de Sheets/Drive/service account e modelo `DriveCache` no schema foram observados; IDs, credenciais e conteúdo integrado não foram lidos. |
| 24 | Configuração sensível | **CONFIRMADO** | `.env` existe com modo `0600` e há nomes de backups históricos. Somente os nomes lógicos `DATABASE_URL`, `AUTH_DATABASE`, `DATA_SOURCE`, `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_FILE` e `GOOGLE_SHEETS_ID` foram identificados; valores nunca foram lidos. |
| 25 | Operação, recuperação e saúde | **CONFIRMADO / INFERIDO / NÃO CONFIRMADO** | **CONFIRMADO:** os documentos do repositório registram fluxo VPS→GitHub e contêm runbooks históricos/desatualizados; dumps de checkpoint datados de 2026-08-23 existem nos dois paths de migração registrados em `OPERATIONS.md`; a raiz respondeu 200 localmente e no vhost HTTPS, enquanto `/health`, `/healthz` e `/api/health` retornaram 404. **INFERIDO:** houve operação manual in-place em algum momento. **NÃO CONFIRMADO:** runbook vigente, healthcheck dedicado, CI/CD, rollback formal, validade de `.next.recovered`/`.bak`/snapshots, logs atuais Docker e restauração/retenção/cobertura dos dumps. |

## Reconciliação GitHub/VPS

### Identidade e completude da fonte

- **CONFIRMADO — `GITHUB_OFFICIAL_SOURCE`:** `https://github.com/victormarconi/ejcaparecida`, público, owner/name `victormarconi/ejcaparecida`, branch única/default `main`, agora com 10 commits, sem tag/release e HEAD `adcf82ef0d12fd52d1ee117011f01ede72bc0121`.
- **CONFIRMADO — HEAD observado:** `e6eb36799d2d5ee0f2ea03bed0aeb2d8b2a7a080`, datado de 2026-08-05, com mensagem `chore: sync VPS production source (2026-08-05)`.
- **CONFIRMADO — limite da oficialidade:** o repositório é um snapshot/export parcial da VPS, não a fonte Next completa. Estão ausentes `app`, `pages`, `src`, `components` e `lib`; `server.js` é um artefato standalone e `prisma/seed-content.ts` importa `src/lib` inexistente.
- **CONFIRMADO — direção documentada:** commits e documentos registram `export filtrado da vps` e sincronização da VPS para o GitHub.
- **NÃO CONFIRMADO — `VPS_DERIVED_FROM_GITHUB`:** as evidências não demonstram que a produção tenha sido deployada do GitHub; não atribuir causalidade inversa ao fluxo documentado.

### Documentação e conteúdo técnico do repositório

- **CONFIRMADO — documentação prioritária lida:** `docs/VPS_SYNC_2026-05-26.md` registra origem `/opt/icp-apps/apps/ejcaparecida` e exclusões do export. O `README.md` afirma que o repositório público não contém secrets, mas essa afirmação é contradita pelo incidente registrado abaixo.
- **CONFIRMADO — documentação histórica:** `DOCUMENTACAO.md`, `RESTAURACAO.md` e `FLUXO.md` contêm paths, PM2, MariaDB e procedimentos históricos/desatualizados. O `DEPLOY.md` do repositório ainda usa path antigo e foi alterado no HEAD para descrever Docker/ICP/PostgreSQL.
- **RECOMENDAÇÃO:** nenhum desses documentos históricos deve ser usado como runbook vigente sem validação independente contra o path canônico, a infraestrutura efetiva e uma autorização operacional específica.
- **CONFIRMADO — estrutura/versionamento:** package `ejc-aparecida` `0.1.0`, lockfile npm v3, Next `16.2.4`, React `19.2.5`, Prisma `6.19.3`, schema HEAD PostgreSQL, sem migrations e sem script `test`. Dockerfile e `docker-compose.yml` não existem no repositório, embora Compose exista na VPS canônica.

### Fingerprint seguro e limite de proveniência

- **CONFIRMADO — `SAFE_PATH_FINGERPRINT_REVISION`:** `e6eb36799d2d5ee0f2ea03bed0aeb2d8b2a7a080`. Uma comparação SHA-256 sanitizada, sem leitura de scripts sensíveis, encontrou correspondência de 10/10 arquivos seguros entre a VPS e esse commit.
- **CONFIRMADO — amostra usada:** `package.json`, `package-lock.json`, `prisma/schema.prisma`, `server.js`, `DEPLOY.md`, `web.config`, `prisma/seed-content.ts`, `prisma/seed.ts`, `public/admin-override.css` e `public/ejc-admin-tools.js`.
- **CONFIRMADO — comparação histórica:** as revisões `ab394cd` e `8a3e974` correspondem em 7/10 itens, divergem em schema/`DEPLOY.md` e não contêm `public/admin-override.css`.
- **NÃO CONFIRMADO — `DEPLOYED_REVISION`:** o fingerprint de amostra não prova a árvore/build inteira nem causalidade de deploy. Artefatos `.next` não contêm revision SHA, labels Docker ficaram inacessíveis e o `BUILD_ID` `PJJVP9Xe7pi2V7Q10f5IL` não foi mapeado a commit.

### Incidente de segurança no repositório público

- **CONFIRMADO — incidente histórico:** quatro scripts introduzidos em `e6eb367` continham credencial administrativa estática. O HEAD `adcf82e` removeu esses scripts e `get_session.js`; o valor não foi e não deve ser incluído nestes documentos. Revisões antigas ainda contêm o incidente.
- **CONFIRMADO — script correlato:** `var/www/ejcaparecida/get_session.js` pode imprimir token se executado; não executá-lo. A declaração do `README.md` de ausência de secrets é contraditória com o HEAD observado.
- **NÃO CONFIRMADO — impacto:** validade atual da credencial e eventual uso indevido não foram confirmados.
- **RECOMENDAÇÃO — resposta privada e coordenada:** notificar privadamente o proprietário; com autorização específica, rotacionar/revogar a credencial, invalidar sessões, reduzir a exposição e coordenar expurgo do HEAD e do histórico Git. Nenhuma dessas ações foi executada. Não abrir issue pública sobre o incidente.

### Estado do clone local

- **CONFIRMADO — clone:** não executado. O HEAD atual foi mitigado quanto aos utilitários conhecidos, mas o histórico antigo continua sensível e o repositório pai local não deve ser tratado como checkout da fonte.
- **RECOMENDAÇÃO — sequência segura:** o proprietário deve primeiro criar uma revisão sanitizada, removendo o segredo do HEAD e do histórico conforme a resposta coordenada ao incidente e após a rotação/revogação, e validar com secret scan. Depois, gerar hashes dos quatro documentos locais; fazer clone limpo em diretório temporário/local fora do OneDrive ou substituir controladamente o Git init vazio; comparar os documentos homônimos oficiais — que não existem no HEAD atual —; incorporar os quatro documentos em branch separada sem sobrescrita; validar remote, `main`, commit e status; e somente então mover/adotar o workspace.
- **RECOMENDAÇÃO — integridade histórica:** não criar histórico conflitante e não usar branch órfã, pois isso produziria histórico paralelo.
- **CONFIRMADO — restrição enquanto bloqueado:** não instalar ou executar npm, scripts, Docker, Prisma ou build desse snapshot.

## Auditoria visual pública de 2026-08-24

- **CONFIRMADO — disponibilidade:** `GET /` e `GET /login` responderam 200; `/membros` e `/admin` responderam 307 para login. Nenhuma autenticação foi tentada.
- **CONFIRMADO — build público observado:** o HTML da raiz referencia o `BUILD_ID` `PJJVP9Xe7pi2V7Q10f5IL` e a folha compilada `/_next/static/chunks/admin-polish-20260512aj-v24.css`.
- **CONFIRMADO — falha principal de dark mode:** a classe pública `.event-card` recebe posteriormente uma regra global compartilhada com `.finance-entry`, contendo `background:#fffdf8 !important`, borda clara e grid administrativo de quatro colunas. Essa regra vence a definição dark anterior e causa superfície clara/layout incorreto nos eventos públicos.
- **CONFIRMADO — causa estrutural:** a folha compilada acumula overrides administrativos globais, cores literais e `!important` sobre seletores reutilizados pela área pública, incluindo `.event-card`, `.finance-entry`, elementos de extrato e `.brand-lockup`. Há guerra de especificidade em vez de isolamento por layout/componente.
- **CONFIRMADO — problemas públicos adicionais:** a home não contém `h1`; cards da equipe mostram apenas imagens, sem nome/função visíveis; eventos podem emitir parágrafos vazios; quatro iframes do Google Maps são carregados juntos; no mobile os rótulos de navegação são visualmente ocultados e restam ícones isolados.
- **CONFIRMADO — referência avaliada:** `nellavio/nellavio` é um starter Next.js 16/React 19/Tailwind 4 com tokens light/dark, componentes reutilizáveis, acessibilidade e testes. É referência útil para sistema de superfícies, tokens, controles e navegação, mas não deve converter a landing pública em dashboard SaaS.
- **RECOMENDAÇÃO — direção visual:** adotar tokens semânticos de canvas/surface/text/border, raios consistentes, cards elevados discretos, navegação mobile rotulada, equipe com legenda, localizações em abas com um único mapa e bloco PIX com ação de cópia; preservar identidade azul/dourada e linguagem pastoral.
- **CONFIRMADO — correção aplicada em produção em 2026-08-24:** a landing pública recebeu hero institucional em duas colunas, correção escopada de light/dark, cards/superfícies consistentes, `h1`, identificação visual da equipe, cópia de PIX, localizações em abas com um mapa visível, coordenadas exatas com pins e navegação mobile rotulada. Login e área administrativa foram preservados.
- **CONFIRMADO — forma da correção:** como a fonte React/Next completa continua ausente, a correção reprodutível disponível foi incorporada a `public/ejc-admin-tools.js`, já injetado pelo vhost, com CSS temático inline e aprimoramentos progressivos da landing. O artefato compilado principal não foi reconstruído.
- **CONFIRMADO — Git sincronizado:** após refinamento visual e correção dos mapas, `main` avançou para `420fde5e8d1c0f1517bfa13f862ada0fa9caca72`; o SHA-256 do `public/ejc-admin-tools.js` no Git e na VPS é `d6ee32c84a98d45f4f5af55bc30347f90794ed84ab49ef9647d35d7392d4ca0e`.
- **CONFIRMADO — sanitização do HEAD:** os cinco utilitários inseguros anteriormente registrados foram removidos do HEAD novo. Isso reduz a exposição atual, mas não expurga revisões históricas anteriores.
- **CONFIRMADO — limpeza canônica:** foram removidos `.next.recovered` (26.791.391 bytes), 149 arquivos `*.bak*` internos do `.next`, 48 logs de startup, cinco backups antigos de `.env` e seis utilitários avulsos obsoletos/sensíveis. Uploads, dados ativos, `.env` vigente, banco, Prisma e runtime ativo não foram removidos.

## Fonte de evidência e limitações

- **CONFIRMADO — fontes reconciliadas:** este documento combina o relatório de discovery read-only de 2026-08-24, a inspeção Git local e as evidências GitHub/VPS explicitamente fornecidas para a reconciliação de 2026-08-24.
- **CONFIRMADO — modo de coleta reportado:** a inspeção de produção foi read-only via `ssh pdm-new`, como `pdmops`, em `vps10872.integrator.host`.
- **CONFIRMADO — proteção de dados:** valores de `.env`, credenciais, conteúdo de uploads, conteúdo de `site-data.json` e dados de integração não foram lidos nem copiados.
- **CONFIRMADO — ausência de alteração remota:** o discovery não realizou alteração ou cópia em produção.
- **CONFIRMADO — fingerprint limitado:** a amostra segura da VPS corresponde 10/10 ao commit `e6eb36799d2d5ee0f2ea03bed0aeb2d8b2a7a080`.
- **NÃO CONFIRMADO — proveniência do build:** a correspondência de amostra não liga o runtime/build inteiro a um deploy do GitHub, nem identifica pipeline ou máquina/processo gerador do fonte Next completo.
- **NÃO CONFIRMADO — estado operacional profundo:** sem Docker socket, não é possível confirmar container, imagem efetiva, health, logs atuais ou restart history.
- **NÃO CONFIRMADO — consistência de recuperação:** a mera presença de dumps, backups e artefatos recuperados não comprova integridade, cobertura, retenção ou restaurabilidade.
- **INFERIDO — risco de defasagem:** o runtime compilado e o `DEPLOY.md` com paths antigos podem não representar o processo gerador atual; por isso não devem ser usados como fonte oficial.
