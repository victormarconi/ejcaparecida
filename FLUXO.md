# Fluxograma - EJC Aparecida

```mermaid
flowchart TD
  U[Usuario ou sistema externo] --> DNS[Cloudflare / DNS]
  DNS --> NG[Nginx com SSL]
  NG --> APP[EJC Aparecida]
  APP --> ENV[Arquivo .env restaurado do backup]
  APP --> DATA[(Banco / arquivos persistentes)]
  APP --> PROC[PM2 ou Docker]
  DATA --> BACKUP[Google Drive criptografado via pdm-backup]
  ENV --> BACKUP
  PROC --> MON[Painel VPS monitora status]
  GH[GitHub: codigo fonte] --> APP
```

## Leitura rapida

- GitHub guarda codigo e documentacao.
- Google Drive guarda dados que nao podem se perder.
- Nginx publica o dominio com SSL.
- PM2 ou Docker mantem o servico rodando.
