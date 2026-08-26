# Baseline canônico do runtime

## Decisão operacional

Em 2026-08-26, o proprietário definiu a aplicação em produção na VPS como a verdade absoluta para a recuperação do EJC Aparecida. Essa decisão significa:

- o conteúdo editável presente em `/opt/icp-apps/apps/ejcaparecida` deve ser preservado e reconciliado com este repositório;
- o runtime compilado deve ser identificado por manifesto, sem ser apresentado como código-fonte original;
- qualquer fonte que ainda não exista deve ser reimplementada a partir do comportamento comprovado, do schema Prisma e dos contratos observáveis;
- nenhuma reconstrução pode sobrescrever produção antes de paridade funcional, backup, teste em DEV e promoção explícita.

## Evidência coletada

```json
{
  "schema": "pdm1.ejc.runtime-baseline.v1",
  "observedAt": "2026-08-26T18:25:05Z",
  "canonicalPath": "/opt/icp-apps/apps/ejcaparecida",
  "buildId": "PJJVP9Xe7pi2V7Q10f5IL",
  "fileCount": 436,
  "manifestSha256": "94b526fbd0dab2fc576ccdf952459413e5502bd32f44840409755bce2e8da0bd",
  "excluded": [".env", "public/uploads", "data/site-data.json"]
}
```

O manifesto completo, com hashes por arquivo, permanece privado na VPS em:

`/home/pdmops/.pdm1-private/ejc-runtime-baseline-20260826T182505Z/manifest.sha256`

Ele não inclui `.env`, uploads nem conteúdo do `site-data.json`. Esses itens exigem backups próprios, privados e criptografados.

## Estado do Git

O snapshot versionado em `var/www/ejcaparecida` corresponde aos arquivos editáveis auditados da aplicação canônica. O build `.next` ativo não foi copiado para o Git e não será tratado como fonte. O `BUILD_ID` e o hash do manifesto ligam este registro ao runtime observado.

## Caminho de recuperação

1. Preservar o baseline e criar backup restaurável do PostgreSQL, uploads, JSON persistente e `.env` criptografado.
2. Mapear rotas e contratos públicos/protegidos sem registrar dados pessoais ou credenciais.
3. Reimplementar uma árvore Next.js limpa usando o schema e os contratos comprovados.
4. Subir somente no DEV isolado, com dados fake e integrações externas desabilitadas ou de teste.
5. Comparar comportamento, autorização, responsividade, temas, rotas e integrações.
6. Somente após aprovação, promover o mesmo commit testado para produção com backup e rollback.

Até o passo 6, a VPS continua sendo a referência funcional e o DEV continua sendo um espelho isolado do runtime.
