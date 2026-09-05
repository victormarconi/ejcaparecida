# TASK: Nova Cara do EJC Aparecida (Home com Calendário/Banner, Finanças Compacto com Foto da Nota e Patrimônio)

## 1. Contexto & Instruções do Usuário
"Na questão do EJC, lá no começo tem um banner e depois tem eventos futuros, calendário e depois apresentação da equipe, mantém a equipe. Tem a localização das capelas que ficou tudo bugado lá, precisa ser ajeitado. Eu quero que tenha um calendário. Se tiver uma banner ou formulário (estilo Google Forms integrado para inscrições/pedidos com exportação para CSV/Excel), exibe no topo; se NÃO tiver, fica só o calendário no começo.
Embaixo do calendário vai ter um resumo com os próximos 3 a 5 eventos.
No Finanças: o site tá bem confuso com muita informação. Na tela inicial do finanças vai ter só o caixa atual, variação no mês (entradas/saídas) e embaixo o histórico compacto dos últimos 3 meses com filtro de mês. E que nos lançamentos de gastos tenha opção de colocar foto, porque coloco foto da nota fiscal/recibo. Relatórios em aba separada.
No Estoque/Patrimônio (antigo aluguel): catalogar o que a gente tem (bens do EJC) e controle de empréstimos com foto do estado do bem antes de entregar + legenda/observação e baixa na devolução."

---

## 2. Implementação Técnica Detalhada

### 2.1. Prisma Schema & Banco (`prisma/schema.prisma`)
1. No modelo `FinanceEntry` (`lancamentos_financeiros`):
   - Adicionar campo opcional: `receiptUrl String? @db.Text @map("url_comprovante")`
2. No modelo `Rental` (`emprestimos`):
   - Adicionar campos opcionais: `initialConditionPhoto String? @db.Text @map("foto_estado_inicial")` e `conditionCaption String? @db.Text @map("legenda_estado")`
3. Criar modelos para Formulários Integrados:
   ```prisma
   model FormCampaign {
     id          String   @id @default(cuid())
     title       String   @map("titulo")
     description String?  @db.Text @map("descricao")
     bannerUrl   String?  @db.Text @map("url_banner")
     fieldsJson  String   @default("[]") @db.Text @map("campos_json")
     active      Boolean  @default(true) @map("ativo")
     expiresAt   DateTime? @map("expira_em")
     createdAt   DateTime @default(now()) @map("criado_em")
     updatedAt   DateTime @updatedAt @map("atualizado_em")
     submissions FormSubmission[]
     @@map("campanhas_formulario")
   }

   model FormSubmission {
     id         String       @id @default(cuid())
     formId     String       @map("formulario_id")
     form       FormCampaign @relation(fields: [formId], references: [id], onDelete: Cascade)
     dataJson   String       @db.Text @map("dados_json")
     createdAt  DateTime     @default(now()) @map("criado_em")
     @@map("respostas_formulario")
   }
   ```
4. Executar `npx prisma generate`.

### 2.2. Tela Inicial Pública (`src/app/page.tsx` e componentes)
1. **Banner ou Formulário Dinâmico:**
   - Buscar formulário/banner ativo (`prisma.formCampaign.findFirst({ where: { active: true } })`).
   - Se existir: renderiza o Banner com o Formulário interativo no topo (campos dinâmicos: texto, número, opções, checkbox). Submissão salva em `/api/forms/[id]/submit`.
   - **Se NÃO existir:** Não renderiza bloco vazio — a página começa **DIRETO no Calendário Público**!
2. **Calendário Público do Mês (`src/components/PublicCalendar.tsx`):**
   - Criar componente client interativo de calendário mensal.
   - Navegação de meses `[ ◀ Mês Anterior | Próximo Mês ▶ ]`.
   - Dias do mês em grade, com marcadores visuais para eventos públicos.
   - **Abaixo do Calendário:** Seção de "Próximos Eventos" exibindo cards dos próximos 3 a 5 eventos (título, data formatada, horário, local e descrição).
3. **Conserto de Equipe e Localização das Capelas:**
   - Em `#equipe`: grid limpo e responsivo com avatar, nome e função pastoral.
   - Em `#localizacao`: cards das capelas e paróquia Nossa Senhora Aparecida com endereço, horário das missas e botão direto "Ver no Google Maps" (`https://www.google.com/maps/search/?api=1&query=...`).

### 2.3. Finanças Compacto & Foto da Nota (`src/app/(app)/admin/financas/page.tsx` e `/membros/financas/page.tsx`)
1. **Cards de Topo:**
   - `[ 💰 Caixa Atual ]` (Saldo acumulado)
   - `[ 📈 Entradas no Mês ]` (Verde)
   - `[ 📉 Saídas no Mês ]` (Vermelho)
2. **Histórico Compacto dos Últimos 3 Meses:**
   - Abas rápidas para alternar entre os últimos 3 meses (ex: Setembro, Agosto, Julho).
   - Tabela compacta e legível: Data, Categoria, Descrição, Valor, Comprovante.
3. **Foto da Nota / Recibo nos Gastos:**
   - No formulário de despesa, incluir campo de upload de imagem da nota/recibo fiscal (armazena imagem ou aceita URL/upload).
   - Na listagem de despesas, exibir miniatura da foto. Ao clicar na miniatura, abre modal/dialog para visualização do recibo.
4. **Aba de Relatórios Separada:**
   - Aba dedicada para análise gráfica de categorias e comparativos sem poluir a visão do fluxo de caixa.

### 2.4. Patrimônio & Estoque / Empréstimos (`src/app/(app)/admin/aluguel/page.tsx` reformulado para Patrimônio)
1. **Catálogo de Bens:**
   - Itens do EJC (caixas de som, toalhas, panelas, projetores, etc.) com quantidade e estado.
2. **Controle de Empréstimo:**
   - Registro de empréstimo: quem retirou, telefone, data de retirada, previsão de devolução.
   - **Foto do estado antes de entregar** + **Legenda/Observações** (para registrar avarias prévias).
   - Botão de dar baixa / devolução com confirmação de estado.

---

## 3. Critérios de Conclusão
- `npm run build` deve compilar sem nenhum erro de TypeScript ou Next.js.
- Deixar commit claro no branch `main` e worktree limpa.
