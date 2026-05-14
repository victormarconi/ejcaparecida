# Deploy no SmarterASP.NET

## 1. Criar o banco MySQL

No painel do SmarterASP.NET, crie um banco MySQL e anote:

- Host
- Nome do banco
- Usuário
- Senha

Com isso, monte a `DATABASE_URL`:

```env
DATABASE_URL="mysql://USUARIO:SENHA@HOST:3306/NOME_DO_BANCO"
```

## 2. Variáveis de produção

Configure no painel da hospedagem:

```env
DATA_SOURCE="database"
AUTH_DATABASE="true"
SESSION_SECRET="uma-chave-grande"
ADMIN_EMAIL="admin@ejc.local"
ADMIN_USERNAME="ejcaparecida"
ADMIN_PASSWORD="sua-senha-de-producao"
```

## 3. Preparar o banco

Com a `DATABASE_URL` configurada:

```bash
npm run db:push
npm run db:seed
npm run db:seed-content
```

## 4. Build e start

```bash
npm install
npm run build
npm run start
```

Se a hospedagem pedir o arquivo de inicialização do standalone:

```bash
npm run start:standalone
```

## 5. Conferir depois do upload

- Home pública abre.
- Login entra com o usuário admin.
- Avisos salvam.
- Calendário salva.
- Finanças salva.
- Área interna de documentos abre.
