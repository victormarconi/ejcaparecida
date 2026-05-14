# Restauracao - EJC Aparecida

## Objetivo

Restaurar EJC Aparecida em caso de perda da VPS atual ou migracao para outra VPS.

## Fontes de restauracao

1. Codigo: este repositorio GitHub.
2. Dados sensiveis: Google Drive criptografado pelo `pdm-backup`.
3. Configuracao de servidor: backup de Nginx, PM2, Docker e systemd dentro do pacote `.enc`.

## Passo a passo geral

1. Preparar VPS Ubuntu com Node.js, Nginx, PM2, Docker e bancos necessarios.
2. Clonar este repo no caminho correto:

```bash
# exemplo
mkdir -p "/var/www/ejcaparecida"
# clone conforme o repositorio e ajuste permissao/usuario
```

3. Baixar do Google Drive o backup mais recente:

```bash
rclone copy gcrypt:/<host>/daily ./restore --include "*.enc" --include "*.sha256"
sha256sum -c arquivo.tar.gz.enc.sha256
openssl enc -d -aes-256-cbc -pbkdf2 -iter 250000 -md sha256 -pass file:/root/.pdm-backup-pass -in arquivo.tar.gz.enc -out restore.tar.gz
mkdir restore-data
tar -C restore-data -xzf restore.tar.gz
```

4. Restaurar `.env`, bancos e arquivos persistentes correspondentes.
5. Instalar dependencias se for app Node:

```bash
npm ci || npm install
```

6. Subir processo conforme o projeto:

PM2: ejcaparecida, ejc-aluguel e ejc-activity-sync. Site principal na porta 3210.

7. Restaurar Nginx/SSL ou recriar bloco Nginx apontando para o dominio:

`ejcaparecida.pdm1.com.br`

8. Testar:

```bash
pm2 status || true
docker ps || true
nginx -t
curl -I https://ejcaparecida.pdm1.com.br || true
```

## Validacao final

- Site/API responde.
- Login funciona, quando aplicavel.
- Banco tem dados recentes.
- Uploads/anexos aparecem.
- Timer de backup esta ativo.
