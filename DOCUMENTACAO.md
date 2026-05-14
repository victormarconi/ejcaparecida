# EJC Aparecida - Documentacao Operacional

## Papel do projeto

EJC Aparecida faz parte da VPS PDM. Este repositorio guarda codigo fonte e documentacao, mas nao guarda dados sensiveis nem dados de cliente.

## Dominio

`ejcaparecida.pdm1.com.br`

## Caminho na VPS

`/var/www/ejcaparecida + /opt/ejc-aluguel + /opt/ejc-activity-sync`

## Stack

Node.js/Next restaurado do host antigo, PM2, Nginx, MariaDB/Prisma conforme modulo

## Processo de execucao

PM2: ejcaparecida, ejc-aluguel e ejc-activity-sync. Site principal na porta 3210.

## Dados que nao estao no GitHub

Banco MariaDB do EJC, uploads publicos do site e dados JSON quando usados.

Esses dados ficam no Google Drive criptografado, via projeto `pdm-backup`.

## O que nao deve ser versionado

- `.env` e variaveis sensiveis
- dumps de banco
- backups `.tar.gz` / `.enc`
- `node_modules`, builds e caches
- logs e temporarios
- certificados/chaves
- uploads privados de clientes, quando existirem

## Observacoes

Repositorio publico, mas sem .env, banco e segredos.

## Checklist de manutencao

- Conferir processo PM2/Docker depois de deploy.
- Conferir Nginx e SSL.
- Conferir se o backup diario rodou.
- Nunca commitar segredos.
- Antes de restaurar em outra VPS, restaurar primeiro banco/.env/uploads pelo backup criptografado.
