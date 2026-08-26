## CURRENT_STATE

- **CONFIRMADO — data:** 2026-08-24.
- **CONFIRMADO — data da reconciliação GitHub/VPS:** 2026-08-24.
- **CONFIRMADO — produção:** a aplicação canônica está em `/opt/icp-apps/apps/ejcaparecida` e o domínio é `ejcaparecida.pdm1.com.br`.
- **CONFIRMADO — resposta observada:** `GET /` em `127.0.0.1:3210` e o vhost HTTPS responderam 200; HTTP respondeu 301.
- **INFERIDO — arquitetura:** aplicação fullstack Next/React/Prisma com PostgreSQL, executada por Docker Compose atrás de Nginx.
- **CONFIRMADO — condição da árvore remota:** runtime/build predominantemente compilado, sem diretórios de fonte `app`, `pages`, `src`, `components` ou `lib`.
- **CONFIRMADO — fonte Git oficial:** `GITHUB_OFFICIAL_SOURCE=https://github.com/victormarconi/ejcaparecida`; `main` agora aponta para `420fde5e8d1c0f1517bfa13f862ada0fa9caca72`. O repositório continua sendo snapshot/export parcial e não contém o fonte Next completo.
- **CONFIRMADO — direção documentada:** commits e documentação registram fluxo VPS→GitHub.
- **NÃO CONFIRMADO — `VPS_DERIVED_FROM_GITHUB`:** não há evidência de que a produção tenha sido deployada do GitHub.
- **CONFIRMADO — operação de 2026-08-24:** após autorização explícita, produção recebeu correção visual, reload de Nginx e limpeza limitada ao app EJC; nenhum banco, upload, dado ativo ou container foi alterado/reiniciado.

## CURRENT_BRANCH

- **CONFIRMADO — local:** `master` unborn, sem commits.
- **CONFIRMADO — local:** nenhum remote configurado.
- **CONFIRMADO — GitHub oficial:** branch default e única branch `main`, agora com 11 commits e sem tags/releases; HEAD `420fde5e8d1c0f1517bfa13f862ada0fa9caca72`, mensagem `fix: refine public landing and restore map pins`.
- **NÃO CONFIRMADO — produção:** branch, remote e commit causador do build; o path canônico não contém `.git`.

## PRODUCTION_VERSION

- **CONFIRMADO — aplicação:** package `ejc-aparecida` versão `0.1.0` no manifesto do GitHub e no observado na VPS; lockfile npm v3.
- **CONFIRMADO — componentes declarados:** Next `16.2.4`, React `19.2.5`, Prisma `6.19.3`, schema HEAD PostgreSQL e `node:20-bookworm` declarado na VPS.
- **INFERIDO — banco:** PostgreSQL major 16 a partir da imagem de infraestrutura `postgres:16-alpine`.
- **NÃO CONFIRMADO — banco:** patch exato e correspondência da imagem declarada com a instância efetivamente usada.
- **CONFIRMADO — `SAFE_PATH_FINGERPRINT_REVISION`:** uma amostra segura de 10/10 arquivos da VPS corresponde por SHA-256 ao commit `e6eb36799d2d5ee0f2ea03bed0aeb2d8b2a7a080`; as revisões `ab394cd` e `8a3e974` correspondem em 7/10, divergem em schema/`DEPLOY.md` e não contêm `public/admin-override.css`.
- **NÃO CONFIRMADO — `DEPLOYED_REVISION`:** a amostra não prova a árvore/build inteira nem causalidade. `.next` não contém revision SHA, labels Docker ficaram inacessíveis e o `BUILD_ID` `PJJVP9Xe7pi2V7Q10f5IL` não foi mapeado a commit.
- **NÃO CONFIRMADO — proveniência completa:** tag, data de build, digest de imagem, pipeline e máquina/processo gerador do fonte Next completo.

## LOCAL_STATUS

- **CONFIRMADO — estado inicial:** Git init vazio, sem commits, remotes ou arquivos.
- **CONFIRMADO — estado atual:** `master` unborn, sem remote/commits, com `AGENTS.md`, `PROJECT_CONTEXT.md`, `OPERATIONS.md` e `PROJECT_STATE.md` untracked.
- **CONFIRMADO — mudança de 2026-08-24:** produção e Git receberam duas iterações da correção visual progressiva em `public/ejc-admin-tools.js`; o vhost injeta a revisão final `v=20260824e`; estes documentos registram execução, validação e limpeza.
- **CONFIRMADO — clone:** não executado; o HEAD atual foi sanitizado quanto aos cinco utilitários identificados, mas revisões históricas ainda contêm o incidente e o workspace pai permanece documentação local, não checkout da fonte.
- **CONFIRMADO — documentos oficiais homônimos:** o HEAD atual não contém `AGENTS.md`, `PROJECT_CONTEXT.md`, `OPERATIONS.md` ou `PROJECT_STATE.md`.
- **CONFIRMADO — executabilidade local:** não há clone/dependências e o snapshot oficial continua incompleto; não executar npm, Prisma ou build até obter a fonte Next completa.

## KNOWN_ISSUES

- **CONFIRMADO:** o runtime de produção não contém o fonte completo esperado e não é um checkout Git.
- **CONFIRMADO:** o repositório oficial também não contém `app`, `pages`, `src`, `components` ou `lib`; `server.js` é artefato standalone e `prisma/seed-content.ts` importa `src/lib` inexistente.
- **CONFIRMADO:** `DEPLOY.md` usa path antigo e foi alterado no HEAD para Docker/ICP/PostgreSQL; `DOCUMENTACAO.md`, `RESTAURACAO.md` e `FLUXO.md` contêm paths/PM2/MariaDB históricos. Esses documentos não são runbook vigente sem validação.
- **CONFIRMADO — incidente mitigado no HEAD:** os quatro scripts com credencial estática e `get_session.js` foram removidos do HEAD `adcf82e`. **NÃO CONFIRMADO:** rotação/revogação da credencial e expurgo do histórico; revisões antigas continuam exigindo resposta coordenada.
- **CONFIRMADO — risco correlato:** `var/www/ejcaparecida/get_session.js` pode imprimir token se executado; não executá-lo. O `README.md` contradiz o estado observado ao afirmar ausência de secrets.
- **NÃO CONFIRMADO — impacto do incidente:** validade atual da credencial e uso indevido.
- **NÃO CONFIRMADO:** fonte Next completa original, máquina/processo gerador e pipeline do build.
- **NÃO CONFIRMADO:** estado, digest, logs e health do container por ausência de acesso ao Docker socket.
- **CONFIRMADO:** não há migrations nem script de testes no manifesto/snapshot oficial.
- **CONFIRMADO:** Dockerfile e `docker-compose.yml` não existem no repositório oficial, embora Compose exista na VPS canônica.
- **CONFIRMADO:** não há endpoint dedicado confirmado; `/health`, `/healthz` e `/api/health` retornaram 404.
- **CONFIRMADO:** o proxy `/admin/aluguel` aponta para 3213, mas essa porta recusou conexão durante o discovery.
- **NÃO CONFIRMADO:** rollback formal e validade/consistência de `.next.recovered`, `.bak` e snapshots.
- **NÃO CONFIRMADO:** integridade, restaurabilidade, retenção e cobertura dos dumps encontrados.
- **NÃO CONFIRMADO:** uso de Redis pelo app, papel detalhado de `activity-sync` e papel de MariaDB.
- **NÃO CONFIRMADO:** agendamentos EJC em todos os possíveis escopos.
- **CONFIRMADO — dark mode corrigido:** um override escopado sob `.site-shell` restaura `.event-card` pública para flex e superfície temática; testes em produção mediram contraste de 14,08:1 no dark e 14,49:1 no light.
- **CONFIRMADO — CSS:** o build público carrega `admin-polish-20260512aj-v24.css`, com overrides cumulativos, seletores genéricos, cores literais e guerras de especificidade que afetam também finanças, extratos, marca/topbar e modais.
- **CONFIRMADO — UX pública corrigida progressivamente:** a home possui hero institucional em duas colunas, um `h1`, nove legendas, botão de cópia PIX, quatro abas com um mapa visível, pins por coordenadas exatas e rótulos mobile legíveis.
- **CONFIRMADO — build observado:** o navegador recebeu `BUILD_ID=PJJVP9Xe7pi2V7Q10f5IL`; ele continua sem mapeamento comprovado para um commit.

## NEXT

1. **RECOMENDAÇÃO — prioridade 1, resposta privada:** notificar privadamente o proprietário; sob autorização específica, rotacionar/revogar a credencial, invalidar sessões, reduzir a exposição e coordenar expurgo no HEAD e histórico. Não abrir issue pública. Nenhuma dessas ações foi executada.
2. **RECOMENDAÇÃO — prioridade 2, resposta restante:** confirmar rotação/revogação da credencial e expurgar o segredo das revisões históricas; o HEAD atual já não contém os cinco utilitários identificados.
3. **RECOMENDAÇÃO — prioridade 3, fonte completa:** obter a fonte Next completa original e o processo gerador; não promover o snapshot oficial parcial ou o runtime da VPS à condição de fonte completa.
4. **RECOMENDAÇÃO — prioridade 4, adoção local:** gerar hashes dos quatro documentos locais; clonar a revisão sanitizada fora do OneDrive ou substituir controladamente o init vazio; comparar homônimos oficiais; incorporar os quatro documentos em branch separada sem sobrescrita; validar remote, `main`, commit e status; só então mover/adotar o workspace.
5. **RECOMENDAÇÃO — prioridade 5, história:** não criar histórico conflitante nem usar branch órfã, pois isso produziria histórico paralelo.
6. **RECOMENDAÇÃO — prioridade 6, setup:** somente após sanitização, clone seguro e obtenção da fonte completa, preparar ambiente isolado com Node 20 bookworm, npm, PostgreSQL local e credenciais exclusivamente locais; revisar schema/seeds e executar `npm ci`, geração Prisma, lint, build e smoke tests.
7. **RECOMENDAÇÃO — prioridade 7, fonte completa:** portar a correção progressiva para componentes React/CSS Modules quando a fonte Next completa for recuperada, eliminando o hotfix do script público e a folha compilada acumulada.
8. **CONFIRMADO — restrição atual:** não conectar automaticamente ao banco nem executar build/Prisma do snapshot parcial; produção deve continuar sob autorização e validação operacional.

## BLOCKERS

- **CONFIRMADO — blocker:** ausência de checkout Git e fonte completo no path canônico de produção.
- **CONFIRMADO — blocker de segurança remanescente:** o HEAD atual foi mitigado, porém o histórico público anterior ainda contém o incidente; rotação/revogação e expurgo histórico permanecem não confirmados.
- **CONFIRMADO — blocker:** o repositório oficial é snapshot/export parcial e não contém o fonte Next completo original.
- **NÃO CONFIRMADO — blocker:** máquina/processo gerador do fonte completo e pipeline de build/deploy ainda não foram identificados.
- **NÃO CONFIRMADO — blocker:** a revisão efetivamente deployada não foi comprovada; o fingerprint seguro é apenas uma amostra.
- **CONFIRMADO — blocker:** sem acesso ao Docker socket, não há evidência de estado, digest, logs atuais ou health do container.
- **NÃO CONFIRMADO — blocker:** versão PostgreSQL exata e compatibilidade dos dumps não estão comprovadas.
- **NÃO CONFIRMADO — blocker:** backups e artefatos de rollback não têm restauração/integridade confirmadas.
- **CONFIRMADO — blocker:** ausência de script de testes reduz a validação automatizada disponível no manifesto observado.
