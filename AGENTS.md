# Regras permanentes para agentes

- **CONFIRMADO — data de referência:** 2026-08-24.
- Antes de qualquer ação, leia `AGENTS.md`, `PROJECT_CONTEXT.md`, `OPERATIONS.md` e `PROJECT_STATE.md`.
- **CONFIRMADO — escopo local atual:** este workspace é um repositório Git inicializado, vazio, sem commits, remotes ou arquivos anteriores a estes documentos.
- **CONFIRMADO — produção:** o acesso conhecido usa o alias SSH `pdm-new`, usuário `pdmops`, host `vps10872.integrator.host`.
- Trate todo acesso à produção por `ssh pdm-new` como **somente leitura**. Escrita só poderá ocorrer com autorização futura, explícita, específica e separada desta tarefa.
- Nunca leia, imprima, copie, registre ou exponha valores de secrets, credenciais, tokens, chaves privadas ou conteúdo sensível. Trabalhe apenas com nomes lógicos quando isso for necessário.
- Nunca estabeleça conexão automática com o banco de produção, nem crie túnel para ele.
- Preserve a engine PostgreSQL na reconstrução local. Não substitua PostgreSQL por MariaDB, SQLite ou outra engine por conveniência.
- Classifique afirmações relevantes como **CONFIRMADO**, **INFERIDO** ou **NÃO CONFIRMADO**. Recomendações devem ser identificadas como recomendações, nunca como estado observado.
- Não faça deploy, migração, restart, alteração de proxy, manipulação de container, restauração de dump ou qualquer operação de escrita em produção sem autorização futura explícita e plano separado com lock, backup, rollback e evidências.
- Solicite e obtenha o repositório oficial, o remote correto ou a máquina/processo gerador antes de tentar reconstruir a aplicação.
- **CONFIRMADO — artefato disponível em produção:** a árvore canônica é predominantemente runtime/build compilado e não contém os diretórios de fonte esperados `app`, `pages`, `src`, `components` ou `lib`.
- Não trate `.next`, `server.js`, bundles, mapas, caches ou outros artefatos compilados como fonte oficial, nem tente reconstruir o código-fonte a partir deles.
- Antes de propor mudança, valide premissas contra os documentos locais e, quando houver autorização para isso, contra a fonte oficial. Registre comando/teste, resultado e limitação sem incluir dados sensíveis.
- Mantenha estes quatro documentos atualizados quando um fato for confirmado ou invalidado. Preserve o rótulo de incerteza enquanto não houver evidência suficiente.
- **CONFIRMADO — path canônico:** `/opt/icp-apps/apps/ejcaparecida`.
- **CONFIRMADO — documentação desatualizada:** `DEPLOY.md` em produção descreve paths que não correspondem ao path canônico atual.
- Use sempre o path canônico em análises futuras. Não reutilize paths de `DEPLOY.md` sem validação independente.
- **CONFIRMADO — cópias não canônicas:** existem auxiliares em `/opt/icp-apps/ejc/aluguel` e `activity-sync`, além de cópias de staging/migração; elas não são a aplicação canônica.
- Não promova cópias auxiliares, staging, migração, backups, `.bak` ou `.next.recovered` à condição de fonte oficial sem comprovação.

## Critérios mínimos de validação local

- **RECOMENDAÇÃO:** após obter a fonte oficial, confirmar integridade Git, branch/commit, lockfile e compatibilidade com Node 20 antes de instalar dependências.
- **RECOMENDAÇÃO:** executar instalação reprodutível com `npm ci`, geração Prisma, lint e build somente no ambiente local isolado.
- **CONFIRMADO:** o manifesto observado não define script de testes.
- **RECOMENDAÇÃO:** não interpretar a ausência de script de testes como aprovação funcional; documentar a lacuna e realizar smoke tests locais sem produção.
- **RECOMENDAÇÃO:** qualquer procedimento futuro de produção deve prever lock contra writers concorrentes, backup validado, rollback ensaiado e coleta de evidências sanitizadas.
