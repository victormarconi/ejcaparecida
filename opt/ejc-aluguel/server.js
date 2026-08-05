const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
const { PrismaClient } = require("/var/www/ejcaparecida/node_modules/@prisma/client");
const { google } = require("/var/www/ejcaparecida/node_modules/googleapis");

const APP_DIR = "/var/www/ejcaparecida";

function loadEnv(file) {
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnv(`${APP_DIR}/.env`);
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3214);

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "")
      .split(";")
      .map((value) => value.trim())
      .filter(Boolean)
      .map((value) => {
        const idx = value.indexOf("=");
        return [value.slice(0, idx), decodeURIComponent(value.slice(idx + 1))];
      }),
  );
}

function base64url(buffer) {
  return Buffer.from(buffer).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function verifySession(req) {
  const token = parseCookies(req).ejc_session;
  if (!token || !process.env.SESSION_SECRET) return null;
  const idx = token.lastIndexOf(".");
  if (idx < 0) return null;
  const payload = token.slice(0, idx);
  const signature = token.slice(idx + 1);
  const expected = base64url(crypto.createHmac("sha256", process.env.SESSION_SECRET).update(payload).digest());
  if (signature.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (data.exp && Date.now() > data.exp) return null;
  return data.user && data.user.role === "ADMIN" ? data.user : null;
}

function actor(user) {
  return user?.name || user?.username || "Administrador EJC";
}

function id(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
}

function redirect(res, to) {
  res.writeHead(303, { location: to });
  res.end();
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char]);
}

function intValue(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : fallback;
}

function dateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function dateLabel(value) {
  if (!value) return "-";
  const [year, month, day] = dateValue(value).split("-");
  return `${day}/${month}/${year}`;
}

function parseInputDate(value, label) {
  const text = String(value || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) throw new Error(`${label} inválida.`);
  const year = Number(text.slice(0, 4));
  if (year < 2020 || year > 2099) throw new Error(`${label} deve ficar entre 2020 e 2099.`);
  const date = new Date(`${text}T12:00:00`);
  if (Number.isNaN(date.getTime())) throw new Error(`${label} inválida.`);
  return date;
}

function isLate(item) {
  if (!item || item.status === "RETURNED" || !item.dueAt) return false;
  return new Date(dateValue(item.dueAt) + "T23:59:59") < new Date();
}

function statusText(itemOrStatus) {
  if (typeof itemOrStatus === "string") return itemOrStatus === "RETURNED" ? "Recebido" : "Emprestado";
  if (isLate(itemOrStatus)) return "Atrasado";
  return itemOrStatus.status === "RETURNED" ? "Recebido" : "Emprestado";
}

function icon(name) {
  const paths = {
    home: '<path d="M3 10.8 12 3l9 7.8"/><path d="M5 10v10h14V10"/><path d="M9 20v-6h6v6"/>',
    calendar: '<path d="M8 3v4"/><path d="M16 3v4"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/>',
    money: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 12h.01M17 12h.01"/><circle cx="12" cy="12" r="2"/>',
    box: '<path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
    admin: '<path d="M12 3 4 7v6c0 5 3.4 7.6 8 8 4.6-.4 8-3 8-8V7l-8-4Z"/><path d="M9 12l2 2 4-4"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    pin: '<path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
    edit: '<path d="M4 20h4l11-11a2.8 2.8 0 0 0-4-4L4 16v4Z"/><path d="m13 6 5 5"/>',
    trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 14h10l1-14"/><path d="M9 7V4h6v3"/>',
    hand: '<path d="M7 11V6a2 2 0 1 1 4 0v5"/><path d="M11 11V5a2 2 0 1 1 4 0v7"/><path d="M15 12V8a2 2 0 1 1 4 0v5c0 5-3 8-7 8H9c-2.6 0-4.4-1.4-5.5-3.5L2 15a2 2 0 0 1 3.4-2l1.4 1.9"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><path d="M12 7h.01"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3 6.5 6.5 0 0 0 21 12.8Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    logout: '<path d="M10 17l5-5-5-5"/><path d="M15 12H3"/><path d="M21 3v18"/>',
  };
  return `<svg class="ui-icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.info}</svg>`;
}

async function ensureSchema() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS estoque_itens (
      id text PRIMARY KEY,
      nome text NOT NULL,
      categoria text,
      quantidade_total integer NOT NULL DEFAULT 1,
      quantidade_disponivel integer NOT NULL DEFAULT 1,
      estado text NOT NULL DEFAULT 'Bom',
      localizacao text,
      observacoes text,
      ativo boolean NOT NULL DEFAULT true,
      criado_por text,
      atualizado_por text,
      criado_em timestamp without time zone NOT NULL DEFAULT NOW(),
      atualizado_em timestamp without time zone NOT NULL DEFAULT NOW()
    )
  `);
  await prisma.$executeRawUnsafe(`ALTER TABLE emprestimos ADD COLUMN IF NOT EXISTS estoque_item_id text`);
  await prisma.$executeRawUnsafe(`ALTER TABLE estoque_itens ADD COLUMN IF NOT EXISTS observacoes text`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_emprestimos_estoque_item ON emprestimos(estoque_item_id)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_estoque_itens_ativo ON estoque_itens(ativo)`);
}

async function listStock() {
  return prisma.$queryRawUnsafe(`
    SELECT e.id,e.nome,e.categoria,e.quantidade_total AS "totalQty",e.quantidade_disponivel AS "availableQty",
           e.localizacao,e.observacoes AS descricao,e.ativo,e.criado_por AS "createdBy",e.atualizado_por AS "updatedBy",
           e.criado_em AS "createdAt",e.atualizado_em AS "updatedAt",
           COUNT(emp.id) FILTER (WHERE emp.status='BORROWED')::int AS "borrowedQty"
    FROM estoque_itens e
    LEFT JOIN emprestimos emp ON emp.estoque_item_id=e.id
    WHERE e.ativo=true
    GROUP BY e.id
    ORDER BY e.categoria NULLS LAST, e.nome ASC
  `);
}

async function listRentals(filter = "open") {
  const where = filter === "returned"
    ? "WHERE status='RETURNED'"
    : filter === "late"
      ? "WHERE status='BORROWED' AND devolver_em < CURRENT_DATE"
      : filter === "all"
        ? ""
        : "WHERE status='BORROWED'";
  return prisma.$queryRawUnsafe(
    `SELECT id,nome_item AS "itemName",responsavel_nome AS "lenderName",retirado_em AS "rentedAt",devolver_em AS "dueAt",retirado_por AS "takenBy",
            descricao AS description,observacao_estado AS "conditionNote",status,devolvido_em AS "returnedAt",
            estoque_item_id AS "stockItemId",criado_por AS "createdBy",atualizado_por AS "updatedBy",devolvido_por AS "returnedBy",
            criado_em AS "createdAt",atualizado_em AS "updatedAt"
     FROM emprestimos ${where}
     ORDER BY status ASC, devolver_em ASC, retirado_em DESC, criado_em DESC`,
  );
}

async function normalizeStockCounts() {
  await prisma.$executeRawUnsafe(`
    UPDATE emprestimos emp
    SET estoque_item_id = e.id,
        atualizado_em = NOW()
    FROM estoque_itens e
    WHERE emp.estoque_item_id IS NULL
      AND emp.status='BORROWED'
      AND e.ativo=true
      AND lower(trim(emp.nome_item)) = lower(trim(e.nome))
  `);
  await prisma.$executeRawUnsafe(`
    WITH active AS (
      SELECT estoque_item_id, COUNT(*)::int AS borrowed
      FROM emprestimos
      WHERE status='BORROWED' AND estoque_item_id IS NOT NULL
      GROUP BY estoque_item_id
    ),
    calc AS (
      SELECT e.id,
             GREATEST(1, e.quantidade_total, COALESCE(active.borrowed, 0)) AS total,
             COALESCE(active.borrowed, 0) AS borrowed
      FROM estoque_itens e
      LEFT JOIN active ON active.estoque_item_id = e.id
      WHERE e.ativo = true
    )
    UPDATE estoque_itens e
    SET quantidade_total = calc.total,
        quantidade_disponivel = GREATEST(0, calc.total - calc.borrowed),
        atualizado_em = NOW()
    FROM calc
    WHERE e.id = calc.id
      AND (e.quantidade_total <> calc.total OR e.quantidade_disponivel <> GREATEST(0, calc.total - calc.borrowed))
  `);
}

async function logAction(entity, entityId, action, user, payload = {}) {
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO logs_atividade (id,entidade,entidade_id,acao,ator,dados,criado_em) VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      id("log"),
      entity,
      entityId,
      action,
      actor(user),
      JSON.stringify(payload),
    );
  } catch (error) {
    console.error("Falha ao registrar log", error.message || error);
  }
}

async function syncSheet() {
  try {
    const key = JSON.parse(
      fs.readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "/root/ejc-google-service-account.json", "utf8"),
    );
    const auth = new google.auth.JWT({
      email: key.client_email,
      key: key.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    for (const title of ["Empréstimos", "Estoque"]) {
      if (!meta.data.sheets.some((sheet) => sheet.properties.title === title)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title } } }] },
        });
      }
    }

    const rentalValues = [[
      "Item emprestado", "Nome da pessoa que emprestou", "Data", "Prazo", "Quem pegou", "Status",
      "Data de recebimento", "Observação ao receber", "Descrição", "Item do estoque", "Criado por",
      "Criado em", "Última edição por", "Última edição em", "Recebido por",
    ]];
    for (const rental of await listRentals("all")) {
      rentalValues.push([
        rental.itemName || "",
        rental.lenderName || "",
        dateValue(rental.rentedAt),
        dateValue(rental.dueAt),
        rental.takenBy || "",
        statusText(rental),
        dateValue(rental.returnedAt),
        rental.conditionNote || "",
        rental.description || "",
        rental.stockItemId || "",
        rental.createdBy || "",
        dateValue(rental.createdAt),
        rental.updatedBy || "",
        dateValue(rental.updatedAt),
        rental.returnedBy || "",
      ]);
    }

    const stockValues = [["Item", "Categoria", "Total", "Disponível", "Emprestado", "Local", "Descrição", "Atualizado em"]];
    for (const item of await listStock()) {
      stockValues.push([
        item.nome || "",
        item.categoria || "",
        item.totalQty,
        item.availableQty,
        item.borrowedQty,
        item.localizacao || "",
        item.descricao || "",
        dateValue(item.updatedAt),
      ]);
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Empréstimos!A:Z" });
    await sheets.spreadsheets.values.update({ spreadsheetId, range: "Empréstimos!A1", valueInputOption: "USER_ENTERED", requestBody: { values: rentalValues } });
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Estoque!A:Z" });
    await sheets.spreadsheets.values.update({ spreadsheetId, range: "Estoque!A1", valueInputOption: "USER_ENTERED", requestBody: { values: stockValues } });
  } catch (error) {
    console.error("Empréstimos/Estoque Sheets sync failed", error.message || error);
  }
}

async function body(req) {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return new URLSearchParams(raw);
}

function filterHref(key, current) {
  return `class="filter ${current === key ? "active" : ""}" href="/admin/aluguel?status=${key}"`;
}

function renderDetailsModal(item) {
  const estoqueLabel = item.stockItemId ? "Estoque" : "Sem estoque";
  return [
    '<details class="inline-modal details-modal">',
    `<summary class="small-button">${icon("info")}${estoqueLabel}</summary>`,
    '<div class="modal-layer"><div class="modal-card detail-card">',
    '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
    '<h2>Detalhes do aluguel</h2>',
    '<dl class="detail-list">',
    `<div><dt>Item</dt><dd>${escapeHtml(item.itemName)}</dd></div>`,
    `<div><dt>Quem pegou</dt><dd>${escapeHtml(item.takenBy)}</dd></div>`,
    `<div><dt>Quem emprestou</dt><dd>${escapeHtml(item.lenderName)}</dd></div>`,
    `<div><dt>Data</dt><dd>${dateLabel(item.rentedAt)}</dd></div>`,
    `<div><dt>Prazo</dt><dd>${dateLabel(item.dueAt)}</dd></div>`,
    `<div><dt>Status</dt><dd>${statusText(item)}</dd></div>`,
    item.stockItemId ? `<div><dt>Estoque</dt><dd>Vinculado ao estoque</dd></div>` : '<div><dt>Estoque</dt><dd>Registro antigo sem item vinculado</dd></div>',
    item.status === "RETURNED" ? `<div><dt>Recebimento</dt><dd>${dateLabel(item.returnedAt)}</dd></div>` : "",
    `<div class="wide"><dt>Observação ao receber</dt><dd>${escapeHtml(item.conditionNote || "Não informada.")}</dd></div>`,
    `<div class="wide"><dt>Descrição</dt><dd>${escapeHtml(item.description || "Sem descrição.")}</dd></div>`,
    `<div><dt>Criado por</dt><dd>${escapeHtml(item.createdBy || "Administrador EJC")} em ${dateLabel(item.createdAt)}</dd></div>`,
    `<div><dt>Última edição</dt><dd>${escapeHtml(item.updatedBy || item.createdBy || "Administrador EJC")} em ${dateLabel(item.updatedAt)}</dd></div>`,
    item.status === "RETURNED" ? `<div class="wide"><dt>Recebido por</dt><dd>${escapeHtml(item.returnedBy || "Administrador EJC")} em ${dateLabel(item.returnedAt)}</dd></div>` : "",
    "</dl></div></div></details>",
  ].join("");
}

function renderReturnModal(item) {
  if (item.status === "RETURNED") return `<span class="returned-date">Recebido em ${dateLabel(item.returnedAt)}</span>`;
  return [
    '<details class="inline-modal">',
    `<summary class="small-button success-button">${icon("check")}Receber</summary>`,
    '<div class="modal-layer"><div class="modal-card">',
    '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
    "<h2>Confirmar recebimento</h2>",
    `<p>Informe a data em que <strong>${escapeHtml(item.itemName)}</strong> foi recebido.</p>`,
    '<form method="post" action="/admin/aluguel">',
    '<input type="hidden" name="intent" value="return">',
    `<input type="hidden" name="id" value="${escapeHtml(item.id)}">`,
    `<label>Data de recebimento<input type="date" name="returnedAt" min="2020-01-01" max="2099-12-31" value="${dateValue(new Date())}" required></label>`,
    '<label>Observação ao receber<textarea name="conditionNote" placeholder="Ex.: recebido tudo certo, voltou rasgado, faltou cabo..." required></textarea></label>',
    '<div class="modal-actions"><button class="small-button success-button" type="submit">Confirmar</button></div>',
    "</form></div></div></details>",
  ].join("");
}

function renderEditStockModal(item) {
  return [
    '<details class="inline-modal">',
    `<summary class="small-button">${icon("edit")}Editar</summary>`,
    '<div class="modal-layer"><div class="modal-card">',
    '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
    "<h2>Editar item do estoque</h2>",
    '<form class="form-grid" method="post" action="/admin/aluguel">',
    '<input type="hidden" name="intent" value="stock_update">',
    `<input type="hidden" name="id" value="${escapeHtml(item.id)}">`,
    `<label class="wide">Nome<input name="nome" value="${escapeHtml(item.nome)}" required></label>`,
    `<label>Categoria<input name="categoria" value="${escapeHtml(item.categoria || "")}"></label>`,
    `<label>Total<input type="number" min="${Math.max(1, Number(item.borrowedQty || 0))}" name="quantidadeTotal" value="${item.totalQty}" required></label>`,
    `<label>Local<input name="localizacao" value="${escapeHtml(item.localizacao || "")}"></label>`,
    `<label class="wide">Descrição<textarea name="descricao">${escapeHtml(item.descricao || "")}</textarea></label>`,
    '<div class="wide modal-actions"><button class="primary-button" type="submit">Salvar</button></div>',
    "</form></div></div></details>",
  ].join("");
}

function renderLoanStockModal(item) {
  const disabled = Number(item.availableQty) <= 0;
  return [
    '<details class="inline-modal">',
    `<summary class="small-button success-button ${disabled ? "disabled" : ""}">${disabled ? icon("info") + "Sem estoque" : icon("hand") + "Emprestar"}</summary>`,
    disabled ? "" : [
      '<div class="modal-layer"><div class="modal-card">',
      '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
      `<h2>Emprestar ${escapeHtml(item.nome)}</h2>`,
      '<form class="form-grid" method="post" action="/admin/aluguel">',
      '<input type="hidden" name="intent" value="stock_loan">',
      `<input type="hidden" name="stockItemId" value="${escapeHtml(item.id)}">`,
      `<label>Quem pegou<input name="takenBy" required></label>`,
      `<label>Quem emprestou<input name="lenderName" required></label>`,
      `<label>Data<input type="date" name="rentedAt" min="2020-01-01" max="2099-12-31" value="${dateValue(new Date())}" required></label>`,
      `<label>Prazo<input type="date" name="dueAt" min="2020-01-01" max="2099-12-31" required></label>`,
      `<label class="wide">Observação<textarea name="description" placeholder="Detalhes do empréstimo, acessórios, condição de saída..."></textarea></label>`,
      '<div class="wide modal-actions"><button class="primary-button" type="submit">Registrar empréstimo</button></div>',
      "</form></div></div>",
    ].join(""),
    "</details>",
  ].join("");
}

function renderStockRows(items) {
  if (!items.length) return '<div class="empty-state">Nenhum item cadastrado no estoque.</div>';
  const groups = items.reduce((acc, item) => {
    const category = item.categoria || "Sem categoria";
    if (!acc.has(category)) acc.set(category, []);
    acc.get(category).push(item);
    return acc;
  }, new Map());
  return [...groups.entries()].map(([category, group], index) => {
    const total = group.reduce((sum, item) => sum + Number(item.totalQty || 0), 0);
    const available = group.reduce((sum, item) => sum + Number(item.availableQty || 0), 0);
    const rows = group.map((item) => [
      '<article class="inventory-row">',
      '<div class="inventory-main">',
      `<strong>${escapeHtml(item.nome)}</strong>`,
      `<span>${escapeHtml(item.localizacao || "Sem localização")}</span>`,
      "</div>",
      `<span class="inventory-qty">${item.totalQty}</span>`,
      `<span class="inventory-qty">${item.availableQty}</span>`,
      `<span class="inventory-status ${Number(item.availableQty) > 0 ? "done" : "late"}">${Number(item.availableQty) > 0 ? "Disponível" : Number(item.borrowedQty || 0) > 0 ? "Emprestado" : "Sem saldo"}</span>`,
      '<div class="inventory-actions">',
      renderLoanStockModal(item),
      renderEditStockModal(item),
      '<form method="post" action="/admin/aluguel" data-confirm-delete="true">',
      '<input type="hidden" name="intent" value="stock_delete">',
      `<input type="hidden" name="id" value="${escapeHtml(item.id)}">`,
      `<button class="small-button danger-button compact-action" title="Excluir" type="submit">${icon("trash")}<span>Excluir</span></button>`,
      "</form></div></article>",
    ].join("")).join("");
    return [
      `<details class="stock-category" ${index === 0 ? "open" : ""}>`,
      `<summary><span>${escapeHtml(category)}</span><small>${group.length} item${group.length === 1 ? "" : "s"} • ${available}/${total} disponíveis</small></summary>`,
      '<div class="inventory-table">',
      '<div class="inventory-head"><span>Item</span><span>Total</span><span>Disp.</span><span>Status</span><span>Ações</span></div>',
      rows,
      "</div></details>",
    ].join("");
  }).join("");
}

function renderRentalRows(items) {
  if (!items.length) return '<div class="empty-state">Nenhum empréstimo encontrado para esse filtro.</div>';
  return items.map((item) => [
    '<article class="rent-row">',
    '<div class="main-cell">',
    `<strong>${escapeHtml(item.itemName)}</strong>`,
    `<span>${escapeHtml(item.takenBy)} pegou de ${escapeHtml(item.lenderName)}</span>`,
    "</div>",
    `<span class="date-cell"><small>Data</small>${dateLabel(item.rentedAt)}</span>`,
    `<span class="date-cell"><small>Prazo</small>${dateLabel(item.dueAt)}</span>`,
    `<span class="status-pill ${isLate(item) ? "late" : item.status === "RETURNED" ? "done" : "open"}">${statusText(item)}</span>`,
    renderDetailsModal(item),
    '<div class="row-actions">',
    renderReturnModal(item),
    '<form method="post" action="/admin/aluguel" data-confirm-delete="true">',
    '<input type="hidden" name="intent" value="delete">',
    `<input type="hidden" name="id" value="${escapeHtml(item.id)}">`,
    `<button class="small-button danger-button" type="submit">${icon("trash")}Excluir</button>`,
    "</form></div></article>",
  ].join("")).join("");
}

function renderPage({ rentals, stock, filter }) {
  const openRentals = rentals.filter((item) => item.status === "BORROWED").length;
  const lateRentals = rentals.filter((item) => isLate(item)).length;
  const totalAvailable = stock.reduce((sum, item) => sum + Number(item.availableQty || 0), 0);
  return [
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>Estoque - EJC</title>",
    `<script>var EJC_THEME_KEY="ejc-theme";var EJC_MOON='${icon("moon").replace(/'/g, "\\'")}';var EJC_SUN='${icon("sun").replace(/'/g, "\\'")}';function applyThemeIcon(){var b=document.querySelector(".theme-toggle");if(b)b.innerHTML=document.documentElement.dataset.theme==="dark"?EJC_SUN:EJC_MOON}document.documentElement.dataset.theme=localStorage.getItem(EJC_THEME_KEY)||localStorage.getItem("theme")||"light";function toggleTheme(){var n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem(EJC_THEME_KEY,n);localStorage.setItem("theme",n);applyThemeIcon()}document.addEventListener("DOMContentLoaded",applyThemeIcon)</script>`,
    '<link rel="stylesheet" href="/_next/static/chunks/admin-polish-20260512aj-v24.css">',
    "<style>",
    `
    :root{color-scheme:light;--r-bg:#f7f4ee;--r-surface:#fffaf1;--r-strong:#fffdf8;--r-ink:#062b49;--r-muted:#657383;--r-line:#ded6c8;--r-brand:#1f6d93;--r-brand-soft:#e8f3f8;--r-danger:#a64658;--r-danger-bg:#fff7f8;--r-green:#1b5b46}
    :root[data-theme=dark]{color-scheme:dark;--r-bg:#061d32;--r-surface:#0d2d48;--r-strong:#0b263d;--r-ink:#f7f4ee;--r-muted:#b9c7d3;--r-line:#214762;--r-brand:#63b3d8;--r-brand-soft:#123a55;--r-danger:#ffd6de;--r-danger-bg:#a646582e;--r-green:#1f7a58}
    body{background:var(--r-bg);color:var(--r-ink);font-family:var(--font-inter),Inter,Segoe UI,Arial,sans-serif;margin:0}.ui-icon{width:18px;height:18px;display:inline-block;flex:none}
    .app-layout{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100dvh;background:var(--r-bg)}.sidebar{border-right:1px solid #ded6c8;background:#fffaf1;padding:22px;position:sticky;top:0;height:100dvh;box-sizing:border-box;overflow:auto}.brand-lockup{display:flex;align-items:center;gap:12px;margin-bottom:28px;color:#062b49;text-decoration:none;font-weight:900;line-height:1.12;min-height:42px}.logo-mark{background:#fff;border:1px solid rgba(21,92,138,.22);border-radius:999px;place-items:center;width:42px;height:42px;display:grid;flex:none}.sidebar-logo{background:#fff;border-color:#155c8a38}.logo-mark img{object-fit:contain;width:31px;height:31px}.sidebar nav{display:grid;gap:8px;margin-top:28px}.sidebar nav a{display:flex;align-items:center;gap:10px;min-height:42px;border-radius:8px;padding:0 12px;color:#2b5872;text-decoration:none;font-weight:800}.sidebar nav a:hover,.sidebar nav a.active{background:#e8f3f8;color:#062b49}.side-foot,.side-foot p,.sidebar-actions span{margin-top:28px;color:#2b5872!important;line-height:1.45;font-size:.95rem}.side-foot p{margin-top:0}.side-foot strong{color:#062b49!important}.sidebar-actions{display:flex;gap:12px;align-items:center;margin-top:14px;flex-wrap:wrap}.sidebar-actions .theme-toggle{width:42px;height:42px;padding:0;flex:0 0 42px}
    :root[data-theme=dark] .sidebar{border-right:1px solid #2a5a78;background:#0d3552}:root[data-theme=dark] .brand-lockup{color:#f7f4ee}:root[data-theme=dark] .sidebar nav a{color:#c7d5df}:root[data-theme=dark] .sidebar nav a:hover,:root[data-theme=dark] .sidebar nav a.active{background:#174966;color:#fff}:root[data-theme=dark] .side-foot{color:#d9e6ee}:root[data-theme=dark] .side-foot strong{color:#fff}:root[data-theme=dark] .sidebar .small-button{background:#103b59;border-color:#2a5a78;color:#fff}
    .app-main{min-height:100dvh;padding:24px}.wrap{max-width:1220px;margin:0 auto}.top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.top h1{margin:0;font-size:1.85rem;line-height:1.1}.top p{margin:6px 0 0;color:var(--r-muted)}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:0 0 16px}.summary-card{border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);padding:12px}.summary-card span{display:block;color:var(--r-muted);font-size:.78rem;text-transform:uppercase;font-weight:900}.summary-card strong{display:block;font-size:1.55rem;margin-top:5px}.toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0 12px;flex-wrap:wrap}.filters{display:flex;gap:8px;flex-wrap:wrap}
    .filter,.small-button,.primary-button{border:1px solid var(--r-line);border-radius:8px;min-height:34px;padding:8px 12px;font-weight:800;text-decoration:none;cursor:pointer;box-sizing:border-box}.filter{background:var(--r-surface);color:var(--r-ink)}.filter.active{background:var(--r-brand);color:#fff;border-color:var(--r-brand)}.primary-button{display:inline-flex;align-items:center;gap:8px;background:var(--r-brand);color:#fff;border-color:var(--r-brand)}.small-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;background:var(--r-surface);color:var(--r-ink);font:inherit;font-size:.88rem}.success-button{background:var(--r-green);color:#e7fff5;border-color:rgba(94,211,158,.35)}.danger-button{background:var(--r-danger-bg);color:var(--r-danger);border-color:rgba(166,70,88,.24)}.disabled{opacity:.55;pointer-events:none}
    .section-card{border:1px solid var(--r-line);border-radius:10px;background:var(--r-surface);padding:18px;margin-bottom:20px}.section-card h2{margin:0 0 4px}.section-card>p{margin:0 0 12px;color:var(--r-muted)}.rent-list,.stock-list,.stock-categories{display:grid;gap:8px}.rent-head,.rent-row,.stock-head,.stock-row{display:grid;gap:10px;align-items:center}.rent-head,.rent-row{grid-template-columns:minmax(280px,1.7fr) 120px 120px 120px 120px 210px}.stock-head,.stock-row{grid-template-columns:minmax(230px,1fr) 48px 48px 112px 250px}.rent-head,.stock-head{padding:0 12px 6px;color:var(--r-muted);text-transform:uppercase;font-size:.72rem;font-weight:900;letter-spacing:.03em}.rent-head span:not(:first-child),.stock-head span:not(:first-child){text-align:center}.rent-row,.stock-row{padding:10px 12px;border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);min-height:62px;box-sizing:border-box}.main-cell{display:grid;gap:3px;min-width:0}.main-cell strong{font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.main-cell span,.date-cell small{color:var(--r-muted)}.qty-cell{font-size:1.05rem;font-weight:900;text-align:center}.date-cell{display:grid;justify-items:center;text-align:center;gap:2px}.date-cell small{font-size:.7rem;text-transform:uppercase;font-weight:800}.status-pill{justify-self:center;width:max-content;border-radius:999px;padding:5px 9px;font-size:.76rem;font-weight:900}.status-pill.open{background:var(--r-brand-soft);color:var(--r-ink)}.status-pill.done{background:#e9f7ef;color:#2c684d}.status-pill.late{background:#fff0d1;color:#8a5200}.row-actions{display:flex;gap:5px;align-items:center;justify-content:flex-end;flex-wrap:nowrap}.row-actions form{margin:0}.row-actions .small-button,.row-actions button.small-button{min-height:32px;padding:5px 7px;font-size:.74rem;white-space:nowrap}.row-actions .success-button{color:#fff!important}.row-actions .ui-icon{width:13px;height:13px}.compact-action{min-width:34px}.stock-category{border:1px solid var(--r-line);border-radius:10px;background:color-mix(in srgb,var(--r-strong) 86%,var(--r-surface));overflow:hidden}.stock-category summary{display:grid;grid-template-columns:minmax(180px,1fr) auto 22px;align-items:center;gap:12px;cursor:pointer;list-style:none;padding:12px 14px;color:var(--r-ink);font-weight:900}.stock-category summary::-webkit-details-marker{display:none}.stock-category summary::after{content:"";width:9px;height:9px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg);transition:transform .18s;justify-self:end}.stock-category[open] summary::after{transform:rotate(225deg)}.stock-category summary small{color:var(--r-muted);font-size:.78rem;font-weight:800;justify-self:center;text-align:center}.stock-category .stock-list{padding:0 12px 12px}.empty-state{border:1px dashed var(--r-line);border-radius:8px;padding:22px;color:var(--r-muted);text-align:center;min-height:64px;box-sizing:border-box}
    details.create-modal{display:inline-block}details.create-modal>summary,details.inline-modal>summary{list-style:none;appearance:none;-webkit-appearance:none}details.create-modal>summary::marker,details.inline-modal>summary::marker{content:"";font-size:0}details.create-modal>summary::-webkit-details-marker,details.inline-modal>summary::-webkit-details-marker{display:none}details.inline-modal>summary::after{display:none!important;content:none!important}details.create-modal[open]::before,details.inline-modal[open] .modal-layer{content:"";position:fixed;inset:0;background:rgba(7,20,32,.64);backdrop-filter:blur(8px);z-index:40}details.create-modal[open]>summary,details.inline-modal[open]>summary{display:none}.create-card,.modal-card{position:fixed;z-index:41;left:50%;top:50%;transform:translate(-50%,-50%);width:min(700px,calc(100vw - 28px));border:1px solid var(--r-line);border-radius:10px;background:var(--r-surface);box-shadow:0 24px 90px rgba(0,0,0,.26);padding:18px}.modal-close{position:absolute;right:12px;top:12px;width:32px;height:32px;border:1px solid var(--r-line);border-radius:999px;background:var(--r-strong);color:var(--r-ink);font:900 18px/1 Inter,Segoe UI,Arial,sans-serif;cursor:pointer}.create-card h2,.modal-card h2{margin:0 0 4px;font-size:1.24rem}.create-card p,.modal-card p{margin:0 0 14px;color:var(--r-muted)}.detail-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 14px}.detail-list div{border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);padding:10px}.detail-list dt{color:var(--r-muted);font-size:.76rem;font-weight:900;text-transform:uppercase}.detail-list dd{margin:4px 0 0;color:var(--r-ink);line-height:1.45}.detail-list .wide{grid-column:1/-1}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}label{display:grid;gap:6px;color:var(--r-muted);font-weight:800}input,textarea,select{width:100%;box-sizing:border-box;border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);color:var(--r-ink);padding:10px;font:inherit}textarea{min-height:96px;resize:vertical}.wide{grid-column:1/-1}.modal-actions{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:14px;flex-wrap:wrap}
    .sidebar nav a.active{background:transparent;color:#c7d5df}.sidebar nav a.active:hover{background:#174966;color:#fff}.sidebar nav a[href="/membros"]{order:0}.sidebar nav a[href="/membros/calendario"]{order:1}.sidebar nav a[href="/membros/financas"]{order:2}.sidebar nav a[href="/admin/aluguel"]{order:3}.sidebar nav a[href="/admin"]{order:4}.sidebar nav a[href="/admin/avisos"]{order:5}.sidebar nav a[href="/admin/localizacoes"]{order:6}.brand-lockup{padding:0!important;background:transparent!important}.sidebar a,.sidebar button{letter-spacing:0!important}.sidebar svg{color:currentColor!important}
    .inventory-table{display:grid;gap:8px;padding:0 12px 12px}.inventory-head,.inventory-row{display:grid;grid-template-columns:minmax(240px,1fr) 58px 58px 116px 404px;column-gap:12px;align-items:center}.inventory-head{padding:0 12px 6px;color:var(--r-muted);text-transform:uppercase;font-size:.72rem;font-weight:900;letter-spacing:.03em}.inventory-head span:not(:first-child){text-align:center}.inventory-head span:last-child{text-align:right;padding-right:162px}.inventory-row{padding:10px 12px;border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);min-height:62px;box-sizing:border-box}.inventory-main{display:grid;gap:3px;min-width:0}.inventory-main strong{font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.inventory-main span{color:var(--r-muted)}.inventory-qty{font-size:1.05rem;font-weight:900;text-align:center}.inventory-status{justify-self:center;width:max-content;border-radius:999px;padding:5px 9px;font-size:.76rem;font-weight:900}.inventory-status.done{background:#e9f7ef;color:#2c684d}.inventory-status.late{background:#fff0d1;color:#8a5200}.inventory-actions{display:grid;grid-template-columns:150px 104px 110px;justify-content:end;align-items:center;gap:8px;min-width:0}.inventory-actions form,.inventory-actions details.inline-modal{display:inline-flex!important;width:100%!important;max-width:100%!important;margin:0!important;min-width:0!important}.inventory-actions details.inline-modal:not([open])>.modal-layer{display:none!important}.inventory-actions .small-button,.inventory-actions button.small-button{width:100%!important;min-width:0!important;max-width:100%!important;min-height:36px!important;padding:7px 10px!important;font-size:.82rem!important;line-height:1!important;white-space:nowrap!important}.inventory-actions .ui-icon{display:none!important}.inventory-actions .success-button,.inventory-actions .success-button *{color:#fff!important;stroke:#fff!important}
    .stock-head,.stock-row{grid-template-columns:minmax(300px,1fr) 64px 64px 118px 238px!important;column-gap:14px!important}.stock-row>.main-cell{grid-column:1!important}.stock-row>.qty-cell:nth-of-type(1){grid-column:2!important}.stock-row>.qty-cell:nth-of-type(2){grid-column:3!important}.stock-row>.status-pill{grid-column:4!important}.stock-row>.row-actions{grid-column:5!important;display:grid!important;grid-template-columns:repeat(3,max-content)!important;justify-content:end!important;align-items:center!important;gap:8px!important;min-width:0!important;max-width:238px!important}.row-actions details.inline-modal,.row-actions form{display:inline-flex!important;width:auto!important;min-width:0!important;margin:0!important}.row-actions .small-button,.row-actions button.small-button{width:auto!important;min-width:0!important;max-width:none!important;min-height:36px!important;padding:7px 10px!important;font-size:.82rem!important;line-height:1!important;white-space:nowrap!important}.row-actions .success-button,.row-actions .success-button *{color:#fff!important;stroke:#fff!important}.stock-category summary{grid-template-columns:minmax(220px,1fr) minmax(180px,auto) 24px!important}.stock-category summary small{justify-self:center!important;text-align:center!important}.stock-head span:last-child{justify-self:end!important;padding-right:68px!important}
    @media(max-width:900px){.app-layout{display:block}.sidebar{position:static;height:auto;border-right:0;border-bottom:1px solid var(--r-line);padding:12px}.sidebar nav,.sidebar .side-foot{display:none}.app-main{padding:18px 12px}.top{flex-direction:column}.summary-grid{grid-template-columns:1fr 1fr}.toolbar{align-items:stretch}.filters{width:100%}.filter{flex:1;text-align:center}.rent-head,.stock-head,.inventory-head{display:none}.rent-row,.stock-row,.inventory-row{grid-template-columns:1fr;gap:8px;padding:12px}.inventory-actions{grid-template-columns:1fr 1fr;justify-content:stretch}.inventory-actions .small-button,.inventory-actions button{width:100%!important}.main-cell strong,.inventory-main strong{white-space:normal}.date-cell{grid-template-columns:72px auto;align-items:center}.row-actions{justify-content:stretch;display:grid;grid-template-columns:1fr 1fr}.row-actions .small-button,.row-actions button{width:100%}.form-grid,.detail-list{grid-template-columns:1fr}.create-card,.modal-card{max-height:calc(100dvh - 28px);overflow:auto}}
    `,
    "</style></head><body class=\"inter_5901b7c6-module__ec5Qua__variable\"><div class=\"app-layout\">",
    '<aside class="sidebar"><a class="brand-lockup" href="/membros"><span class="logo-mark sidebar-logo"><img src="/uploads/logo-ejc.png" alt=""></span><span>EJC Aparecida - Valentina</span></a>',
    '<nav aria-label="Navegação admin">',
    `<a href="/membros">${icon("home")}Dashboard</a><a href="/membros/calendario">${icon("calendar")}Calendário</a><a href="/membros/financas">${icon("money")}Finanças</a><a href="/admin/aluguel">${icon("box")}Estoque</a><a href="/admin">${icon("admin")}Admin</a><a href="/admin/avisos">${icon("bell")}Avisos</a><a href="/admin/localizacoes">${icon("pin")}Localizações</a>`,
    "</nav>",
    `<div class="side-foot"><p>Conectado como <strong>Administrador EJC</strong></p><div class="sidebar-actions"><button class="small-button theme-toggle" onclick="toggleTheme()" type="button">${icon("moon")}</button><span>Modo claro/escuro</span></div><form action="/api/logout" method="post"><button class="small-button" type="submit">${icon("logout")}Sair</button></form></div></aside>`,
    '<main class="app-main"><div class="wrap">',
    '<div class="top"><div><h1>Estoque</h1><p>Controle de itens, empréstimos, prazos, devoluções e disponibilidade.</p></div><a class="small-button" href="/admin">Voltar para admin</a></div>',
    '<section class="summary-grid">',
    `<article class="summary-card"><span>Itens no estoque</span><strong>${stock.length}</strong></article>`,
    `<article class="summary-card"><span>Disponíveis</span><strong>${totalAvailable}</strong></article>`,
    `<article class="summary-card"><span>Emprestados</span><strong>${openRentals}</strong></article>`,
    `<article class="summary-card"><span>Atrasados</span><strong>${lateRentals}</strong></article>`,
    "</section>",
    '<section class="section-card"><div class="toolbar"><div><h2>Estoque</h2><p>Cadastre os itens antes de emprestar. O sistema só libera empréstimo quando existe saldo disponível no estoque.</p></div>',
    `<details class="create-modal"><summary class="primary-button">${icon("plus")}Novo item</summary><div class="create-card"><button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest('details').open=false">x</button><h2>Novo item no estoque</h2><p>Cadastre quantidade, local e descrição para facilitar a manutenção.</p>`,
    '<form class="form-grid" method="post" action="/admin/aluguel"><input type="hidden" name="intent" value="stock_create"><label class="wide">Nome<input name="nome" placeholder="Ex.: Caixa de som, extensão, banner" required></label><label>Categoria<input name="categoria" placeholder="Som, decoração, cozinha..."></label><label>Quantidade<input type="number" min="1" name="quantidadeTotal" value="1" required></label><label>Local<input name="localizacao" placeholder="Sala, armário, secretaria..."></label><label class="wide">Descrição<textarea name="descricao"></textarea></label><div class="wide modal-actions"><button class="primary-button" type="submit">Salvar item</button></div></form></div></details></div>',
    '<div class="stock-categories">',
    renderStockRows(stock),
    "</div></section>",
    '<section class="section-card"><div class="toolbar">',
    '<div><h2>Empréstimos</h2><p>Histórico dos itens emprestados a partir do estoque cadastrado.</p></div>',
    `<nav class="filters" aria-label="Filtros"><a ${filterHref("open", filter)}>Emprestados</a><a ${filterHref("late", filter)}>Atrasados</a><a ${filterHref("returned", filter)}>Recebidos</a><a ${filterHref("all", filter)}>Todos</a></nav>`,
    '</div>',
    '<div class="rent-list"><div class="rent-head"><span>Item</span><span>Data</span><span>Prazo</span><span>Status</span><span>Estoque</span><span>Ações</span></div>',
    renderRentalRows(rentals),
    "</div></section></div></main></div><script>applyThemeIcon&&applyThemeIcon()</script></body></html>",
  ].join("");
}
async function createStock(form, user) {
  const total = Math.max(1, intValue(form.get("quantidadeTotal"), 1));
  const newId = id("estoque");
  await prisma.$executeRawUnsafe(
    `INSERT INTO estoque_itens (id,nome,categoria,quantidade_total,quantidade_disponivel,localizacao,observacoes,criado_por,atualizado_por,criado_em,atualizado_em)
     VALUES ($1,$2,$3,$4,$4,$5,$6,$7,$7,NOW(),NOW())`,
    newId,
    form.get("nome"),
    form.get("categoria") || null,
    total,
    form.get("localizacao") || null,
    form.get("descricao") || null,
    actor(user),
  );
  await logAction("estoque", newId, "criar", user, { nome: form.get("nome"), total });
}

async function updateStock(form, user) {
  const item = (await prisma.$queryRawUnsafe(
    `SELECT e.quantidade_total,e.quantidade_disponivel,COUNT(emp.id) FILTER (WHERE emp.status='BORROWED')::int AS borrowed
     FROM estoque_itens e
     LEFT JOIN emprestimos emp ON emp.estoque_item_id=e.id
     WHERE e.id=$1
     GROUP BY e.id`,
    form.get("id"),
  ))[0];
  if (!item) return;
  const newTotal = Math.max(1, intValue(form.get("quantidadeTotal"), Number(item.quantidade_total || 1)));
  const borrowed = Number(item.borrowed || 0);
  if (newTotal < borrowed) throw new Error(`Quantidade total não pode ser menor que ${borrowed}, pois já existe item emprestado.`);
  const newAvailable = Math.max(0, newTotal - borrowed);
  await prisma.$executeRawUnsafe(
    `UPDATE estoque_itens SET nome=$1,categoria=$2,quantidade_total=$3,quantidade_disponivel=$4,localizacao=$5,observacoes=$6,atualizado_por=$7,atualizado_em=NOW() WHERE id=$8`,
    form.get("nome"),
    form.get("categoria") || null,
    newTotal,
    newAvailable,
    form.get("localizacao") || null,
    form.get("descricao") || null,
    actor(user),
    form.get("id"),
  );
  await logAction("estoque", form.get("id"), "editar", user, { total: newTotal });
}

async function deleteStock(form, user) {
  const activeLoans = (await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM emprestimos WHERE estoque_item_id=$1 AND status='BORROWED'`, form.get("id")))[0]?.count || 0;
  if (activeLoans > 0) throw new Error("Não é possível excluir item com empréstimo aberto.");
  await prisma.$executeRawUnsafe(`UPDATE estoque_itens SET ativo=false,atualizado_por=$1,atualizado_em=NOW() WHERE id=$2`, actor(user), form.get("id"));
  await logAction("estoque", form.get("id"), "excluir", user);
}

async function createRental(form, user) {
  const newId = id("aluguel");
  await prisma.$executeRawUnsafe(
    `INSERT INTO emprestimos
     (id,nome_item,responsavel_nome,retirado_em,devolver_em,retirado_por,descricao,observacao_estado,status,devolvido_em,estoque_item_id,criado_por,atualizado_por,devolvido_por,criado_em,atualizado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,'BORROWED',NULL,NULL,$8,$8,NULL,NOW(),NOW())`,
    newId,
    form.get("itemName"),
    form.get("lenderName"),
    parseInputDate(form.get("rentedAt"), "Data"),
    parseInputDate(form.get("dueAt"), "Prazo"),
    form.get("takenBy"),
    form.get("description") || "",
    actor(user),
  );
  await logAction("aluguel", newId, "criar", user, { item: form.get("itemName") });
}

async function loanFromStock(form, user) {
  const item = (await prisma.$queryRawUnsafe(`SELECT * FROM estoque_itens WHERE id=$1 AND ativo=true`, form.get("stockItemId")))[0];
  if (!item || Number(item.quantidade_disponivel || 0) <= 0) throw new Error("Item sem saldo disponível.");
  const newId = id("aluguel");
  await prisma.$executeRawUnsafe(
    `INSERT INTO emprestimos
     (id,nome_item,responsavel_nome,retirado_em,devolver_em,retirado_por,descricao,observacao_estado,status,devolvido_em,estoque_item_id,criado_por,atualizado_por,devolvido_por,criado_em,atualizado_em)
     VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,'BORROWED',NULL,$8,$9,$9,NULL,NOW(),NOW())`,
    newId,
    item.nome,
    form.get("lenderName"),
    parseInputDate(form.get("rentedAt"), "Data"),
    parseInputDate(form.get("dueAt"), "Prazo"),
    form.get("takenBy"),
    form.get("description") || item.descricao || "",
    form.get("stockItemId"),
    actor(user),
  );
  await prisma.$executeRawUnsafe(`UPDATE estoque_itens SET quantidade_disponivel=quantidade_disponivel-1,atualizado_por=$1,atualizado_em=NOW() WHERE id=$2`, actor(user), form.get("stockItemId"));
  await logAction("aluguel", newId, "emprestar_estoque", user, { estoqueItemId: form.get("stockItemId") });
}

async function returnRental(form, user) {
  const rental = (await prisma.$queryRawUnsafe(`SELECT status,estoque_item_id FROM emprestimos WHERE id=$1`, form.get("id")))[0];
  if (!rental) return;
  await prisma.$executeRawUnsafe(
    `UPDATE emprestimos SET status='RETURNED', devolvido_em=$1, observacao_estado=$2, devolvido_por=$3, atualizado_por=$3, atualizado_em=NOW() WHERE id=$4`,
    parseInputDate(form.get("returnedAt"), "Data de recebimento"),
    form.get("conditionNote"),
    actor(user),
    form.get("id"),
  );
  if (rental.status !== "RETURNED" && rental.estoque_item_id) {
    await prisma.$executeRawUnsafe(`UPDATE estoque_itens SET quantidade_disponivel=LEAST(quantidade_total,quantidade_disponivel+1),atualizado_por=$1,atualizado_em=NOW() WHERE id=$2`, actor(user), rental.estoque_item_id);
  }
  await logAction("aluguel", form.get("id"), "receber", user);
}

async function deleteRental(form, user) {
  const rental = (await prisma.$queryRawUnsafe(`SELECT status,estoque_item_id FROM emprestimos WHERE id=$1`, form.get("id")))[0];
  if (rental?.status === "BORROWED" && rental.estoque_item_id) {
    await prisma.$executeRawUnsafe(`UPDATE estoque_itens SET quantidade_disponivel=LEAST(quantidade_total,quantidade_disponivel+1),atualizado_por=$1,atualizado_em=NOW() WHERE id=$2`, actor(user), rental.estoque_item_id);
  }
  await prisma.$executeRawUnsafe(`DELETE FROM emprestimos WHERE id=$1`, form.get("id"));
  await logAction("aluguel", form.get("id"), "excluir", user);
}

const server = http.createServer(async (req, res) => {
  try {
    const user = verifySession(req);
    if (!user) return redirect(res, "/login?callbackUrl=/admin/aluguel");
    await ensureSchema();
    await normalizeStockCounts();
    const url = new URL(req.url, "https://ejcaparecida.pdm1.com.br");
    const filter = ["open", "late", "returned", "all"].includes(url.searchParams.get("status")) ? url.searchParams.get("status") : "open";

    if (req.method === "POST") {
      const form = await body(req);
      const intent = form.get("intent");
      if (intent === "stock_create") await createStock(form, user);
      else if (intent === "stock_update") await updateStock(form, user);
      else if (intent === "stock_delete") await deleteStock(form, user);
      else if (intent === "stock_loan") await loanFromStock(form, user);
      else if (intent === "delete") await deleteRental(form, user);
      else if (intent === "return") await returnRental(form, user);
      else throw new Error("Ação inválida. Cadastre o item no estoque antes de emprestar.");
      await syncSheet();
      return redirect(res, "/admin/aluguel");
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(renderPage({ rentals: await listRentals(filter), stock: await listStock(), filter }));
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
      res.end("Erro no aluguel/estoque: " + (error.message || "falha inesperada"));
    }
  }
});

ensureSchema()
  .then(() => normalizeStockCounts())
  .then(() => server.listen(PORT, "127.0.0.1", () => console.log("EJC aluguel e estoque on " + PORT)))
  .catch((error) => {
    console.error("Falha ao preparar o estoque/aluguel:", error);
    process.exit(1);
  });



