# Estado atual do EJC Aparecida

Atualizado em 2026-08-26.

## Fonte

- A aplicação voltou a possuir fonte completa, compilável e versionável na raiz.
- O código foi reimplementado sem promover os artefatos compilados anteriores a
  fonte oficial.
- O runtime anterior está preservado em `runtime-baseline/` apenas como evidência
  operacional.
- O schema Prisma, o conteúdo institucional e os uploads rastreados foram mantidos.
- Nenhum `.env`, dump, senha ou token foi incluído.

## Escopo funcional reconstruído

- Home pública com avisos, eventos, equipe, doação, redes e localizações.
- Login e sessão assinada para membros e administradores.
- Áreas de membros: visão geral, calendário, documentos e finanças.
- Administração de avisos, calendário, equipe, finanças, localizações e aluguel.
- Registro de atividade nas alterações administrativas.
- Endpoints `/api/health` e `/api/ready`.
- Build standalone e imagem Docker executada como usuário não privilegiado.

## Validação local

- `npm run typecheck`: aprovado.
- `npm run lint`: aprovado sem avisos.
- `npm run build`: aprovado com Next.js 16.3.3.
- Scan de padrões de segredo na nova fonte: nenhum arquivo identificado.
- Vulnerabilidades críticas de runtime conhecidas: zero. O alerta direto do Next
  existente no snapshot foi corrigido com a atualização para 16.3.3.

## Publicação

- Versão candidata: `0.2.0`.
- O próximo passo é publicar o commit exato no banco DEV isolado, executar health,
  ready, login e smoke funcional e só então promover a mesma revisão à produção.
- Produção nunca deve ser atualizada automaticamente. Git atualiza somente DEV;
  DEV para produção exige confirmação manual e 2FA.

## Pendências controladas

- Validar a candidata no ambiente DEV real.
- Fazer backup imediato do banco e do runtime antes da promoção de produção.
- Registrar e comparar os commits de Git, DEV e produção.
- Ativar o EJC no publicador automático de DEV somente depois do primeiro deploy
  validado.
- O histórico antigo continha utilitários inseguros já removidos do HEAD; a rotação
  e eventual limpeza histórica continuam sendo uma tarefa de segurança separada.
