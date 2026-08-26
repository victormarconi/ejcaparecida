# Operações

- **CONFIRMADO — data de referência:** 2026-08-24.
- **CONFIRMADO — data da reconciliação GitHub/VPS:** 2026-08-24.
- **CONFIRMADO — escopo deste runbook:** documentação local, sem alteração ou cópia de produção.

## Acesso e proibições

- **CONFIRMADO — acesso conhecido:** alias SSH `pdm-new`, usuário `pdmops`, host `vps10872.integrator.host`.
- Todo acesso à produção deve permanecer somente leitura até existir autorização futura, explícita, específica e separada.
- Não executar deploy, migração, `db push`, seed, restart, stop/start de serviços, alteração de Nginx, edição de arquivos, rotação de secrets ou restauração em produção.
- Não conectar automaticamente ao banco de produção e não abrir túnel para serviços de produção.
- Não acessar Docker socket sem autorização específica.
- Não ler ou exibir valores de `.env`, credenciais, chaves, tokens, dados pessoais, uploads, JSON de conteúdo ou dumps.
- Não copiar artefatos, banco, uploads, `.env`, build compilado ou backups remotos para o workspace.
- Não executar nem inspecionar o conteúdo dos scripts sensíveis identificados no repositório; registrar somente paths e metadados sanitizados.
- **RECOMENDAÇÃO:** qualquer escrita futura em produção deve usar uma janela autorizada, lock contra writers concorrentes, backup validado, plano de rollback ensaiado e evidências sanitizadas.

## Fonte Git oficial e clone seguro

- **CONFIRMADO — `GITHUB_OFFICIAL_SOURCE`:** `https://github.com/victormarconi/ejcaparecida`, identificado explicitamente pelo usuário. É um repositório público com branch default e única branch `main`, agora com 10 commits, sem tags/releases e HEAD `adcf82ef0d12fd52d1ee117011f01ede72bc0121` de 2026-08-24.
- **CONFIRMADO — natureza da fonte:** a oficialidade do repositório não implica completude. Ele é snapshot/export parcial da VPS, sem o fonte Next completo; commits e documentos registram fluxo VPS→GitHub.
- **NÃO CONFIRMADO — `VPS_DERIVED_FROM_GITHUB`:** não há evidência de que a produção tenha sido deployada a partir desse repositório.
- **CONFIRMADO — `SAFE_PATH_FINGERPRINT_REVISION`:** uma amostra segura de 10/10 arquivos da VPS coincide por SHA-256 com `e6eb36799d2d5ee0f2ea03bed0aeb2d8b2a7a080`. Isso identifica a revisão da amostra, não a revisão do build inteiro.
- **NÃO CONFIRMADO — `DEPLOYED_REVISION`:** `.next` não contém revision SHA, labels Docker não ficaram acessíveis e o `BUILD_ID` observado não está mapeado a commit; não usar fingerprint parcial como prova de deploy ou causalidade.
- **CONFIRMADO — clone local:** não executado. O HEAD atual removeu os cinco utilitários identificados, mas o histórico anterior continua contendo o incidente; o workspace local não é checkout da fonte.
- **CONFIRMADO — workspace enquanto bloqueado:** Git `master` unborn, sem remote/commits e com os quatro documentos untracked. Não tratar esse repositório pai como fonte atual.
- **CONFIRMADO — ausência de documentos homônimos no HEAD atual:** `AGENTS.md`, `PROJECT_CONTEXT.md`, `OPERATIONS.md` e `PROJECT_STATE.md` não existem no snapshot oficial atual.

### Procedimento recomendado de adoção após sanitização

1. **RECOMENDAÇÃO — contenção primeiro:** o proprietário deve concluir a resposta autorizada ao incidente e criar revisão sanitizada que remova o segredo do HEAD e do histórico, após rotação/revogação.
2. **RECOMENDAÇÃO — gate:** validar a revisão e o histórico sanitizados com secret scan antes de qualquer clone local.
3. **RECOMENDAÇÃO — preservação local:** gerar hashes dos quatro documentos locais antes de substituir ou mover qualquer estado Git.
4. **RECOMENDAÇÃO — isolamento:** fazer clone limpo em diretório temporário/local fora do OneDrive ou substituir controladamente o Git init vazio, evitando materialização em diretório sincronizado.
5. **RECOMENDAÇÃO — incorporação:** comparar documentos homônimos oficiais, incorporar os quatro documentos em branch separada sem sobrescrevê-los e preservar seus hashes esperados.
6. **RECOMENDAÇÃO — história linear:** não criar histórico conflitante e não usar branch órfã, pois isso geraria histórico paralelo.
7. **RECOMENDAÇÃO — validação final:** validar remote, branch `main`, commit esperado e status antes de mover/adotar o workspace.
8. **CONFIRMADO — proibição temporária:** enquanto o clone estiver bloqueado, não instalar nem executar npm, scripts, Docker, Prisma ou build desse snapshot.

## Resposta recomendada ao incidente público

- **CONFIRMADO — incidente histórico:** a revisão `e6eb367` introduziu credencial administrativa estática em quatro utilitários. O HEAD `adcf82e` removeu esses paths e o utilitário correlato; nunca registrar, imprimir ou copiar o valor. O histórico anterior ainda requer expurgo.
- **CONFIRMADO — risco correlato:** `var/www/ejcaparecida/get_session.js` pode imprimir token se executado; não executá-lo. A afirmação do `README.md` de que o repositório público não contém secrets está contradita.
- **NÃO CONFIRMADO — validade e abuso:** não foi confirmada a validade atual da credencial nem eventual utilização indevida.
- **RECOMENDAÇÃO — comunicação:** notificar privadamente o proprietário e os responsáveis operacionais. Não abrir issue pública nem divulgar paths junto a qualquer valor sensível.
- **RECOMENDAÇÃO — ações autorizadas:** sob autorização futura específica e plano de incidente, rotacionar/revogar a credencial, invalidar sessões, reduzir a exposição e coordenar expurgo do segredo no HEAD e em todo o histórico Git.
- **RECOMENDAÇÃO — ordem segura:** conter e rotacionar antes de considerar o histórico sanitizado; validar o resultado com secret scan que não imprima valores.
- **CONFIRMADO — ações nesta tarefa:** nenhuma notificação, rotação, revogação, invalidação, redução de exposição, reescrita Git ou alteração remota foi executada.

## Inventário operacional conhecido

### Paths e runtime

- **CONFIRMADO — app canônica:** `/opt/icp-apps/apps/ejcaparecida`.
- **CONFIRMADO — Compose canônico:** `/opt/icp-apps/apps/ejcaparecida/docker-compose.yml`.
- **CONFIRMADO — uploads:** `/opt/icp-apps/apps/ejcaparecida/public/uploads`.
- **CONFIRMADO — dados em arquivo:** `/opt/icp-apps/apps/ejcaparecida/data/site-data.json`.
- **CONFIRMADO — secret lógico:** `/opt/icp-apps/apps/ejcaparecida/.env`, modo `0600`; valores não foram lidos.
- **CONFIRMADO — runtime declarado:** `node:20-bookworm`, npm, diretório `/app`, execução `node server.js`.
- **CONFIRMADO — serviço Compose:** service/container `ejcaparecida`, host network, bind do path canônico para `/app`, `restart: unless-stopped`, `NODE_ENV=production`, porta 3210 e hostname loopback.
- **NÃO CONFIRMADO — estado efetivo:** container, digest de imagem, health, logs e configuração expandida não foram confirmados por falta de acesso ao Docker socket.

### Serviços, Nginx e portas

- **CONFIRMADO — serviços ativos no host durante o discovery:** Docker, Nginx, MariaDB e `pdm-postgres-loopback`.
- **CONFIRMADO — systemd:** nenhuma unit específica do EJC foi identificada.
- **INFERIDO — lifecycle:** a aplicação provavelmente é gerida por Docker Compose.
- **CONFIRMADO — Nginx:** vhost `ejcaparecida` habilitado, 80 redirecionando para HTTPS, 443 com Certbot, `/` para `127.0.0.1:3210` e `/admin/aluguel` para `127.0.0.1:3213`.
- **CONFIRMADO — listeners observados:** 80, 443, 3210 em loopback, 4051 em `0.0.0.0`, PostgreSQL 5432/5433 em loopback, Redis 6379 em loopback e MariaDB 3306 em loopback.
- **CONFIRMADO — falha adjacente:** não havia listener em 3213 no momento da inspeção.
- **CONFIRMADO — auxiliar:** `activity-sync` respondeu HTTP 401 em 4051.
- **INFERIDO — papel auxiliar:** a função detalhada de `activity-sync` no fluxo EJC não foi demonstrada.

### Banco e storage

- **CONFIRMADO — engine da app:** PostgreSQL pelo provider do Prisma.
- **CONFIRMADO — banco lógico de produção:** `ejcaparecida`, identificado em sessões sanitizadas.
- **INFERIDO — versão:** PostgreSQL 16, com base em `postgres:16-alpine` na infraestrutura.
- **NÃO CONFIRMADO — versão exata:** patch e correspondência da imagem declarada com a instância efetiva.
- **INFERIDO — papel da MariaDB:** componente legado ou auxiliar; o uso pela aplicação canônica não foi demonstrado.
- **RECOMENDAÇÃO — engine local:** não adotar MariaDB como banco principal local; preservar PostgreSQL.
- **NÃO CONFIRMADO — Redis:** uso pela aplicação canônica.
- **CONFIRMADO — uploads:** 17 arquivos, aproximadamente 10,75 MB, grupo `team`; conteúdo não inspecionado.
- **CONFIRMADO — JSON:** `site-data.json` com 6326 bytes; conteúdo não inspecionado.
- **CONFIRMADO — persistência:** uploads e dados ficam em path do host bind-mounted para o runtime.

### Integrações e secrets lógicos

- **CONFIRMADO — Google:** existem dependência `googleapis`, configuração lógica para Google Sheets/Drive/service account e `DriveCache` no schema Prisma.
- **NÃO CONFIRMADO — comportamento da integração:** IDs, permissões, frequência, propriedade dos recursos e conteúdo remoto não foram inspecionados.
- **CONFIRMADO — nomes lógicos conhecidos:** `DATABASE_URL`, `AUTH_DATABASE`, `DATA_SOURCE`, `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_FILE` e `GOOGLE_SHEETS_ID`.
- **CONFIRMADO — proteção aplicada no discovery:** nenhum valor dessas chaves foi lido ou registrado.
- **RECOMENDAÇÃO:** no ambiente local, usar somente credenciais locais novas e placeholders seguros; integrações externas devem iniciar desabilitadas ou apontadas para recursos de teste autorizados.

## Processo operacional atual classificado

### Deploy

- **CONFIRMADO:** o `DEPLOY.md` presente no GitHub ainda usa path antigo e foi alterado no HEAD para descrever Docker/ICP/PostgreSQL; documentos históricos também descrevem paths, PM2 e MariaDB incompatíveis com o estado canônico observado.
- **CONFIRMADO:** `docs/VPS_SYNC_2026-05-26.md` registra export da origem `/opt/icp-apps/apps/ejcaparecida` com exclusões; commits/docs registram direção VPS→GitHub.
- **INFERIDO:** houve deploy ou manutenção manual in-place em algum momento.
- **NÃO CONFIRMADO:** runbook vigente, pipeline CI/CD, fonte Next completa original, máquina/processo gerador, commit efetivamente deployado, lock de deploy e gates de validação.
- **RECOMENDAÇÃO:** não reproduzir nenhum documento histórico como runbook vigente; primeiro validar um processo versionado, reprodutível e reversível contra o path canônico e sob autorização específica.

### Rollback

- **CONFIRMADO:** existem nomes/artefatos `.next.recovered`, `.bak` e snapshots de migração.
- **NÃO CONFIRMADO:** rollback formal, relação desses artefatos com a versão ativa, consistência, integridade e procedimento de retorno.
- **RECOMENDAÇÃO:** uma futura definição de rollback deve vincular versão de app, schema, assets e backup de banco, com restauração ensaiada fora de produção.

### Logs

- **CONFIRMADO:** existem logs antigos com padrão `node-startup.log_*`.
- **NÃO CONFIRMADO:** logs atuais do container, retenção, rotação, centralização e correlação de requests.
- **RECOMENDAÇÃO:** quando autorizado, definir coleta read-only sanitizada e política de retenção sem registrar secrets ou dados pessoais.

### Backups

- **CONFIRMADO:** dumps EJC PostgreSQL e MariaDB do checkpoint `2026-08-23` existem em `/opt/migration-final-20260823-103311/db` e `/opt/migration-current/backups/initial/db`.
- **NÃO CONFIRMADO:** integridade, validade, restauração, criptografia, retenção, cobertura, consistência entre engines e aderência à versão ativa.
- **RECOMENDAÇÃO:** presença de arquivo não deve ser tratada como backup válido; qualquer validação futura deve ocorrer em ambiente isolado e autorizado.

### Healthchecks

- **CONFIRMADO:** `GET /` em 3210 e o vhost HTTPS responderam 200; HTTP respondeu 301 para HTTPS.
- **CONFIRMADO:** `/health`, `/healthz` e `/api/health` responderam 404.
- **CONFIRMADO:** 4051 respondeu 401 e 3213 recusou conexão.
- **NÃO CONFIRMADO:** endpoint dedicado de health, healthcheck de container e monitoramento externo.
- **RECOMENDAÇÃO:** após obtenção do fonte, definir healthchecks separados de liveness e readiness, sem dependência de conteúdo sensível.

### Agendamentos

- **CONFIRMADO:** não foi encontrado cron do usuário `pdmops`.
- **NÃO CONFIRMADO:** ausência global de cron, timers ou schedulers; apenas não foram identificados agendamentos específicos do EJC no escopo observado.

### Auditoria visual pública

- **CONFIRMADO — coleta read-only em 2026-08-24:** a raiz e `/login` responderam 200; `/membros` e `/admin` redirecionaram para login. Não houve tentativa de autenticação.
- **CONFIRMADO — artefato ativo observado no navegador:** `BUILD_ID=PJJVP9Xe7pi2V7Q10f5IL` e CSS `admin-polish-20260512aj-v24.css`.
- **CONFIRMADO — regressão de tema:** `.event-card` pública é sobrescrita por regra global administrativa compartilhada com `.finance-entry`, com fundo claro literal e `!important`, anulando o token dark e alterando seu layout.
- **CONFIRMADO — risco de manutenção:** a folha compilada contém camadas cumulativas de overrides, seletores genéricos, cores fixas e guerras de especificidade. Corrigir diretamente o bundle compilado ou empilhar novo override não constitui processo reprodutível.
- **RECOMENDAÇÃO — quick fix na fonte completa:** separar `.public-event-card` de `.admin-event-row` ou escopar todas as regras administrativas sob `.app-layout`; remover cores literais em favor dos tokens; preservar `.site-shell`, topbar e login fora do escopo administrativo.
- **RECOMENDAÇÃO — modernização:** implementar tokens semânticos light/dark, superfície e borda consistentes, navegação mobile com texto, um mapa ativo por vez, legendas para a equipe e testes visuais/contraste dos dois temas.
- **CONFIRMADO — mudança autorizada em 2026-08-24:** em duas iterações com lock e rollback temporário, foi atualizado `public/ejc-admin-tools.js`; o cache-buster final do vhost é `v=20260824e`. O Nginx foi testado e recarregado sem restart do app/container.
- **CONFIRMADO — validação pública automatizada:** desktop dark e light apresentaram contraste calculado de 14,08:1 e 14,49:1 nos cards de evento; `.event-card` pública usa flex; existe um `h1`, nove legendas, quatro abas e um mapa visível; os quatro iframes usam coordenadas exatas, incluindo Paróquia `-7.1989285,-34.8501989` e São Sebastião `-7.1970228,-34.8601213`; no mobile os rótulos permanecem visíveis.
- **CONFIRMADO — preservação administrativa:** `/login` responde 200 com campos de usuário/senha; `/membros`, `/admin`, calendário e finanças continuam protegidos por 307 para login com `callbackUrl`. Nenhum dado, sessão, senha ou banco foi manipulado.
- **CONFIRMADO — Git:** `main=420fde5e8d1c0f1517bfa13f862ada0fa9caca72`, contendo o mesmo script ativo e preservando a remoção do HEAD dos cinco utilitários inseguros registrados. O histórico antigo ainda requer expurgo coordenado separado.
- **CONFIRMADO — limpeza:** `.next.recovered`, backups internos do build, logs antigos, backups legados de `.env` e utilitários avulsos foram removidos após validação. O `.next` ativo, uploads, `site-data.json`, `.env` vigente, schema e banco foram preservados.

## Proposta recomendada para ambiente local

- **RECOMENDAÇÃO — isolamento:** usar WSL2 ou containers locais, sem rota/túnel para a rede de produção.
- **RECOMENDAÇÃO — runtime:** espelhar `node:20-bookworm` para reduzir diferenças de sistema e Node.
- **CONFIRMADO — fonte oficial parcial:** o repositório oficial foi identificado e o HEAD foi mitigado quanto aos utilitários conhecidos, mas ainda não contém o fonte Next completo original; o histórico antigo segue sensível.
- **RECOMENDAÇÃO — fonte completa:** obter do proprietário a fonte Next completa e o processo gerador, sem promover o runtime ou o snapshot parcial a fonte completa.
- **RECOMENDAÇÃO — dependências:** somente após sanitização, clone seguro, confirmação da fonte completa e validação do lockfile, usar `npm ci` em ambiente local limpo.
- **RECOMENDAÇÃO — banco:** usar PostgreSQL local 16 de forma provisória, pois a major 16 é **INFERIDA**, e revisar a versão assim que a instância/manifesto oficiais forem confirmados.
- **RECOMENDAÇÃO — nome local:** criar banco isolado `ejcaparecida_local` com usuário e senha exclusivamente locais.
- **RECOMENDAÇÃO — configuração:** criar `.env` local ignorado pelo Git a partir de um template sem valores reais; nunca reutilizar credenciais de produção.
- **RECOMENDAÇÃO — integrações:** manter Google Sheets/Drive e serviços adjacentes desabilitados, mockados ou ligados apenas a recursos de teste explicitamente autorizados.
- **RECOMENDAÇÃO — validação:** após sanitização e setup seguro da fonte completa, executar geração Prisma, lint, build e smoke tests locais.
- **CONFIRMADO — limitação dos testes:** o manifesto do HEAD não oferece script `test`; o repositório também não contém migrations.
- **RECOMENDAÇÃO — portas:** escolher portas locais sem colisão e não expor banco/Redis publicamente.

## Estratégia recomendada para o banco local

1. **RECOMENDAÇÃO:** não conectar ao PostgreSQL de produção e não criar túnel.
2. **RECOMENDAÇÃO:** não baixar nem restaurar automaticamente dumps existentes.
3. **RECOMENDAÇÃO:** iniciar com PostgreSQL local vazio e banco `ejcaparecida_local`.
4. **RECOMENDAÇÃO:** revisar `prisma/schema.prisma`, migrations e scripts de seed obtidos do repositório oficial antes de executar qualquer um deles.
5. **RECOMENDAÇÃO:** aplicar schema e seeds somente após revisão de efeitos, dependências externas e ausência de dados/credenciais embutidos.
6. **RECOMENDAÇÃO:** aceitar dados sanitizados apenas com autorização explícita, origem documentada, minimização e validação de anonimização.
7. **RECOMENDAÇÃO:** não assumir que os dumps encontrados são necessários, íntegros ou compatíveis; essas propriedades estão **NÃO CONFIRMADAS**.
8. **RECOMENDAÇÃO:** documentar versão de PostgreSQL, versão do schema, seed aplicado e resultados dos testes de setup.

## Paths canônicos e não canônicos

- **CONFIRMADO — canônico:** `/opt/icp-apps/apps/ejcaparecida`.
- **CONFIRMADO — auxiliares:** `/opt/icp-apps/ejc/aluguel` e `activity-sync`.
- **CONFIRMADO — não canônicos:** cópias de staging e migração observadas não são a app canônica.
- **CONFIRMADO — desatualizado:** os paths presentes em `DEPLOY.md` não devem substituir o path canônico.
- **RECOMENDAÇÃO:** toda automação futura deve falhar de forma segura se o path, remote, branch ou versão esperada não coincidirem com os valores previamente validados.
