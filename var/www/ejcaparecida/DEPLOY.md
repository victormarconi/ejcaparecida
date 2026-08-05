# Deploy - EJC Aparecida

## Producao

- URL: https://ejcaparecida.pdm1.com.br
- Codigo principal: /var/www/ejcaparecida
- Runtime principal: Docker Compose gerenciado pelo iContainer/ICP
- Compose principal: /opt/icp-apps/ejcaparecida/docker-compose.yml
- Porta local principal: 3210 via network_mode host
- Proxy atual: Nginx da VPS apontando para 127.0.0.1:3210

## Auxiliares

Ainda ficaram em PM2 por seguranca:

- ejc-aluguel: /opt/ejc-aluguel, porta 3213, usado em /admin/aluguel
- ejc-activity-sync: /opt/ejc-activity-sync, porta 4051

Motivo: o teste de container do ejc-aluguel nao abriu a porta 3213; rollback automatico manteve PM2 funcionando.

## Variaveis do app principal

O app usa /var/www/ejcaparecida/.env. Nao versionar este arquivo.

Nomes esperados:

- ADMIN_EMAIL
- ADMIN_PASSWORD
- ADMIN_USERNAME
- AUTH_DATABASE
- DATABASE_URL
- DATA_SOURCE
- GOOGLE_DRIVE_FOLDER_ID
- GOOGLE_PRIVATE_KEY
- GOOGLE_SERVICE_ACCOUNT_EMAIL
- GOOGLE_SERVICE_ACCOUNT_FILE
- GOOGLE_SHEETS_ID
- SESSION_SECRET

## Comandos uteis

cd /opt/icp-apps/ejcaparecida
docker compose ps
docker compose logs --tail=100 ejcaparecida
docker compose restart ejcaparecida

## Atualizacao

cd /var/www/ejcaparecida
npm install
npm run build
cd /opt/icp-apps/ejcaparecida
docker compose restart ejcaparecida

## Observacao

O processo antigo PM2 ejcaparecida foi removido apos validacao do container em producao. Os auxiliares continuam em PM2 ate uma etapa propria de ajuste.
