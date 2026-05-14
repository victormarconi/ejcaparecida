const http = require("http");
const fs = require("fs");
const crypto = require("crypto");
const { PrismaClient } = require("/var/www/ejcaparecida/node_modules/@prisma/client");
const { google } = require("/var/www/ejcaparecida/node_modules/googleapis");

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

loadEnv("/var/www/ejcaparecida/.env");
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT || 3213);

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

function dateValue(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

function dateLabel(value) {
  if (!value) return "-";
  const [year, month, day] = dateValue(value).split("-");
  return `${day}/${month}/${year}`;
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

async function listRentals(filter = "open") {
  const where = filter === "returned"
    ? "WHERE status='RETURNED'"
    : filter === "late"
      ? "WHERE status='BORROWED' AND dueAt < CURDATE()"
      : filter === "all"
        ? ""
        : "WHERE status='BORROWED'";
  return prisma.$queryRawUnsafe(
    `SELECT id,itemName,lenderName,rentedAt,dueAt,takenBy,description,conditionNote,status,returnedAt,createdAt,updatedAt,
            createdBy,updatedBy,returnedBy
     FROM Rental ${where}
     ORDER BY status ASC, dueAt ASC, rentedAt DESC, createdAt DESC`,
  );
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
    if (!meta.data.sheets.some((sheet) => sheet.properties.title === "Aluguel")) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: "Aluguel" } } }] },
      });
    }

    const values = [[
      "Item emprestado",
      "Nome da pessoa que emprestou",
      "Data",
      "Prazo",
      "Quem pegou",
      "Status",
      "Data de recebimento",
      "Observacao ao receber",
      "Descricao",
      "Criado por",
      "Criado em",
      "Ultima edicao por",
      "Ultima edicao em",
      "Recebido por",
    ]];

    for (const rental of await listRentals("all")) {
      values.push([
        rental.itemName || "",
        rental.lenderName || "",
        dateValue(rental.rentedAt),
        dateValue(rental.dueAt),
        rental.takenBy || "",
        statusText(rental),
        dateValue(rental.returnedAt),
        rental.conditionNote || "",
        rental.description || "",
        rental.createdBy || "",
        dateValue(rental.createdAt),
        rental.updatedBy || "",
        dateValue(rental.updatedAt),
        rental.returnedBy || "",
      ]);
    }

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Aluguel!A:Z" });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Aluguel!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Aluguel Sheets sync failed", error.message || error);
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

function icon(name) {
  const common = 'width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const paths = {
    dashboard: '<rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>',
    file: '<path d="M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
    calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>',
    coins: '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17"/><path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9"/><circle cx="16" cy="9" r="2.9"/>',
    settings: '<path d="M9.7 4.1a2.3 2.3 0 0 1 4.6 0 2.3 2.3 0 0 0 3.3 1.9 2.3 2.3 0 0 1 2.3 4 2.3 2.3 0 0 0 0 3.8 2.3 2.3 0 0 1-2.3 4 2.3 2.3 0 0 0-3.3 1.9 2.3 2.3 0 0 1-4.6 0 2.3 2.3 0 0 0-3.3-1.9 2.3 2.3 0 0 1-2.3-4 2.3 2.3 0 0 0 0-3.8 2.3 2.3 0 0 1 2.3-4 2.3 2.3 0 0 0 3.3-1.9"/><circle cx="12" cy="12" r="3"/>',
    pin: '<path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 1 1 16 0"/><circle cx="12" cy="10" r="3"/>',
    shield: '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9"/>',
    logout: '<path d="m16 17 5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>',
  };
  return `<svg ${common}>${paths[name] || ""}</svg>`;
}

function renderDetailsModal(item) {
  return [
    '<details class="inline-modal details-modal">',
    '<summary class="small-button">Detalhes</summary>',
    '<div class="modal-layer">',
    '<div class="modal-card detail-card">',
    '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
    '<h2>Detalhes do aluguel</h2>',
    '<dl class="detail-list">',
    `<div><dt>Item</dt><dd>${escapeHtml(item.itemName)}</dd></div>`,
    `<div><dt>Quem pegou</dt><dd>${escapeHtml(item.takenBy)}</dd></div>`,
    `<div><dt>Quem emprestou</dt><dd>${escapeHtml(item.lenderName)}</dd></div>`,
    `<div><dt>Data</dt><dd>${dateLabel(item.rentedAt)}</dd></div>`,
    `<div><dt>Prazo</dt><dd>${dateLabel(item.dueAt)}</dd></div>`,
    `<div><dt>Status</dt><dd>${statusText(item)}</dd></div>`,
    item.status === "RETURNED" ? `<div><dt>Recebimento</dt><dd>${dateLabel(item.returnedAt)}</dd></div>` : "",
    `<div class="wide"><dt>Observacao ao receber</dt><dd>${escapeHtml(item.conditionNote || "Nao informada.")}</dd></div>`,
    `<div class="wide"><dt>Descrição</dt><dd>${escapeHtml(item.description || "Sem descrição.")}</dd></div>`,
    `<div><dt>Criado por</dt><dd>${escapeHtml(item.createdBy || "Administrador EJC")} em ${dateLabel(item.createdAt)}</dd></div>`,
    `<div><dt>Última edição</dt><dd>${escapeHtml(item.updatedBy || item.createdBy || "Administrador EJC")} em ${dateLabel(item.updatedAt)}</dd></div>`,
    item.status === "RETURNED" ? `<div class="wide"><dt>Recebido por</dt><dd>${escapeHtml(item.returnedBy || "Administrador EJC")} em ${dateLabel(item.returnedAt)}</dd></div>` : "",
    "</dl>",
    "</div>",
    "</div>",
    "</details>",
  ].join("");
}

function renderReturnModal(item) {
  if (item.status === "RETURNED") {
    return `<span class="returned-date">Recebido em ${dateLabel(item.returnedAt)}</span>`;
  }

  return [
    '<details class="inline-modal">',
    '<summary class="small-button success-button">Receber</summary>',
    '<div class="modal-layer">',
    '<div class="modal-card">',
    '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
    `<h2>Confirmar recebimento</h2>`,
    `<p>Informe a data em que <strong>${escapeHtml(item.itemName)}</strong> foi recebido.</p>`,
    '<form method="post" action="/admin/aluguel">',
    '<input type="hidden" name="intent" value="return">',
    `<input type="hidden" name="id" value="${escapeHtml(item.id)}">`,
    `<label>Data de recebimento<input type="date" name="returnedAt" value="${dateValue(new Date())}" required></label>`,
    '<label>Observacao ao receber<textarea name="conditionNote" placeholder="Ex.: recebido tudo certo, voltou rasgado, faltou cabo..." required></textarea></label>',
    '<div class="modal-actions">',
    '<button class="small-button success-button" type="submit">Confirmar</button>',
    '</div>',
    '</form>',
    '</div>',
    '</div>',
    '</details>',
  ].join("");
}

function renderRows(items) {
  if (!items.length) {
    return '<div class="empty-state">Nenhum item encontrado para esse filtro.</div>';
  }

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
    '<button class="small-button danger-button" type="submit">Excluir</button>',
    "</form>",
    "</div>",
    "</article>",
  ].join("")).join("");
}

function renderPage(items, filter) {
  const counts = {
    all: items.filter(Boolean).length,
  };

  return [
    '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    "<title>Aluguel - EJC</title>",
    '<link rel="stylesheet" href="/_next/static/chunks/admin-polish-20260512n.css">',
    '<script>document.documentElement.dataset.theme=localStorage.getItem("theme")||"light";function toggleTheme(){var n=document.documentElement.dataset.theme==="dark"?"light":"dark";document.documentElement.dataset.theme=n;localStorage.setItem("theme",n)}</script>',
    "<style>",
    `
    :root{color-scheme:light;--r-bg:#f7f4ee;--r-surface:#fffaf1;--r-strong:#fffdf8;--r-ink:#062b49;--r-muted:#657383;--r-line:#ded6c8;--r-brand:#1f6d93;--r-brand-soft:#e8f3f8;--r-danger:#a64658;--r-danger-bg:#fff7f8;--r-green:#1b5b46}
    :root[data-theme=dark]{color-scheme:dark;--r-bg:#061d32;--r-surface:#0d2d48;--r-strong:#0b263d;--r-ink:#f7f4ee;--r-muted:#b9c7d3;--r-line:#214762;--r-brand:#63b3d8;--r-brand-soft:#123a55;--r-danger:#ffd6de;--r-danger-bg:#a646582e;--r-green:#1f7a58}
    body{background:var(--r-bg);color:var(--r-ink);font-family:Inter,Segoe UI,Arial,sans-serif;margin:0}
    .app-layout{display:grid;grid-template-columns:260px minmax(0,1fr);min-height:100dvh;background:var(--r-bg)}
    .sidebar{border-right:1px solid var(--r-line);background:var(--r-surface);padding:22px;position:sticky;top:0;height:100dvh;box-sizing:border-box;overflow:auto}
    .brand-lockup{display:flex;align-items:center;gap:12px;margin-bottom:28px;color:var(--r-ink);text-decoration:none;font-weight:900;min-height:42px}
    .logo-mark{background:#ffffff14;border:1px solid #d5a5338c;border-radius:999px;place-items:center;width:42px;height:42px;display:grid;flex:none}
    .sidebar-logo{background:#fff;border-color:#155c8a38}
    .logo-mark img{object-fit:contain;width:31px;height:31px}
    .sidebar nav{display:grid;gap:8px;margin-top:28px}
    .sidebar nav a{display:flex;align-items:center;gap:10px;min-height:42px;border-radius:8px;padding:0 12px;color:var(--r-muted);text-decoration:none;font-weight:700}
    .sidebar nav a:hover,.sidebar nav a.active{background:color-mix(in srgb,var(--r-brand) 12%,var(--r-surface));color:var(--r-ink)}
    .side-foot{margin-top:28px;color:var(--r-muted);line-height:1.45;font-size:.9rem}
    .side-foot strong{color:var(--r-ink)}
    .sidebar-actions{display:flex;gap:10px;align-items:center;margin-top:14px;flex-wrap:wrap}.sidebar-actions button{justify-content:flex-start}
    .app-main{min-height:100dvh;padding:24px}
    .wrap{max-width:1180px;margin:0 auto}
    .top{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}
    .top h1{margin:0;font-size:1.85rem;line-height:1.1}
    .top p{margin:6px 0 0;color:var(--r-muted)}
    .toolbar{display:flex;justify-content:space-between;gap:12px;align-items:center;margin:14px 0 12px;flex-wrap:wrap}
    .filters{display:flex;gap:8px;flex-wrap:wrap}
    .filter,.small-button,.primary-button{border:1px solid var(--r-line);border-radius:8px;min-height:34px;padding:8px 12px;font-weight:800;text-decoration:none;cursor:pointer;box-sizing:border-box}
    .filter{background:var(--r-surface);color:var(--r-ink)}
    .filter.active{background:var(--r-brand);color:#fff;border-color:var(--r-brand)}
    .primary-button{display:inline-flex;align-items:center;background:var(--r-brand);color:#fff;border-color:var(--r-brand)}
    .small-button{display:inline-flex;align-items:center;justify-content:center;background:var(--r-surface);color:var(--r-ink);font:inherit;font-size:.88rem}
    .success-button{background:var(--r-green);color:#e7fff5;border-color:rgba(94,211,158,.35)}
    .danger-button{background:var(--r-danger-bg);color:var(--r-danger);border-color:rgba(166,70,88,.24)}
    .neutral-button{background:transparent;color:var(--r-muted)}
    .rent-list{display:grid;gap:8px}
    .rent-head,.rent-row{display:grid;grid-template-columns:minmax(260px,1.8fr) minmax(110px,.7fr) minmax(110px,.7fr) minmax(105px,.72fr) minmax(90px,.62fr) minmax(180px,auto);gap:10px;align-items:center}
    .rent-head{padding:0 12px 6px;color:var(--r-muted);text-transform:uppercase;font-size:.74rem;font-weight:900;letter-spacing:.03em}
    .rent-row{padding:10px 12px;border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);min-height:64px;box-sizing:border-box}
    .main-cell{display:grid;gap:3px;min-width:0}
    .main-cell strong{font-size:1rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .main-cell span,.date-cell small{color:var(--r-muted)}
    .date-cell{display:grid;gap:2px}
    .date-cell small{font-size:.7rem;text-transform:uppercase;font-weight:800}
    .status-pill{width:max-content;border-radius:999px;padding:5px 9px;font-size:.78rem;font-weight:900}
    .status-pill.open{background:var(--r-brand-soft);color:var(--r-ink)}
    .status-pill.done{background:#e9f7ef;color:#2c684d}
    .status-pill.late{background:#fff0d1;color:#8a5200}
    .row-actions{display:flex;gap:8px;align-items:center;justify-content:flex-end}
    .row-actions form{margin:0}
    .empty-state{border:1px dashed var(--r-line);border-radius:8px;padding:22px;color:var(--r-muted);text-align:center;min-height:64px;box-sizing:border-box}
    details.create-modal{display:inline-block}
    details.create-modal>summary{list-style:none}
    details.create-modal>summary::-webkit-details-marker,details.inline-modal>summary::-webkit-details-marker{display:none}
    details.create-modal[open]::before,details.inline-modal[open] .modal-layer{content:"";position:fixed;inset:0;background:rgba(7,20,32,.64);backdrop-filter:blur(8px);z-index:40}
    details.create-modal[open]>summary,details.inline-modal[open]>summary{display:none}
    .create-card,.modal-card{position:fixed;z-index:41;left:50%;top:50%;transform:translate(-50%,-50%);width:min(660px,calc(100vw - 28px));border:1px solid var(--r-line);border-radius:10px;background:var(--r-surface);box-shadow:0 24px 90px rgba(0,0,0,.26);padding:18px}
    .modal-close{position:absolute;right:12px;top:12px;width:32px;height:32px;border:1px solid var(--r-line);border-radius:999px;background:var(--r-strong);color:var(--r-ink);font:900 18px/1 Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
    .create-card h2,.modal-card h2{margin:0 0 4px;font-size:1.24rem}
    .create-card p,.modal-card p{margin:0 0 14px;color:var(--r-muted)}
    .detail-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:12px 0 14px}.detail-list div{border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);padding:10px}.detail-list dt{color:var(--r-muted);font-size:.76rem;font-weight:900;text-transform:uppercase}.detail-list dd{margin:4px 0 0;color:var(--r-ink);line-height:1.45}.detail-list .wide{grid-column:1/-1}
    .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    label{display:grid;gap:6px;color:var(--r-muted);font-weight:800}
    input,textarea,select{width:100%;box-sizing:border-box;border:1px solid var(--r-line);border-radius:8px;background:var(--r-strong);color:var(--r-ink);padding:10px;font:inherit}
    textarea{min-height:96px;resize:vertical}
    .wide{grid-column:1/-1}
    .modal-actions{display:flex;gap:8px;justify-content:flex-end;align-items:center;margin-top:14px;flex-wrap:wrap}
    @media(max-width:900px){
      .app-layout{display:block}.sidebar{position:static;height:auto;border-right:0;border-bottom:1px solid var(--r-line);padding:12px}.sidebar .brand-lockup{margin-bottom:0}.sidebar nav,.sidebar .side-foot{display:none}.sidebar.sidebar-open nav{display:grid;grid-template-columns:1fr;gap:6px;margin-top:10px}.sidebar nav a{justify-content:flex-start;font-size:.92rem}.side-foot{display:none}.ejc-menu-toggle{display:inline-flex}
      .app-main{padding:18px 12px}.top{flex-direction:column}.toolbar{align-items:stretch}.filters{width:100%}.filter{flex:1;text-align:center}
      .rent-head{display:none}.rent-row{grid-template-columns:1fr;gap:8px;padding:12px}.main-cell strong{white-space:normal}.date-cell{grid-template-columns:52px auto;align-items:center}
      .row-actions{justify-content:stretch;display:grid;grid-template-columns:1fr 1fr}.row-actions .small-button,.row-actions button{width:100%}
      .form-grid,.detail-list{grid-template-columns:1fr}.create-card,.modal-card{max-height:calc(100dvh - 28px);overflow:auto}
    }
    `,
    "</style></head><body><div class=\"app-layout\">",
    '<aside class="sidebar"><a class="brand-lockup" href="/membros"><span class="logo-mark sidebar-logo"><img src="/uploads/logo-ejc.png" alt=""></span><span>EJC NSA</span></a>',
    '<nav aria-label="Navegacao admin">',
    `<a href="/membros">${icon("dashboard")}Dashboard</a>`,
    `<a href="/membros/calendario">${icon("calendar")}Calendário</a>`,
    `<a href="/membros/financas">${icon("coins")}Finanças</a>`,
    `<a class="active" href="/admin/aluguel">${icon("coins")}Aluguel</a>`,
    `<a href="/admin">${icon("settings")}Admin</a>`,
    `<a href="/admin/avisos">${icon("file")}Avisos</a>`,
    `<a href="/admin/localizacoes">${icon("pin")}Localizações</a>`,
    "</nav>",
    `<div class="side-foot"><p>Conectado como<br><strong>Administrador EJC</strong></p><div class="sidebar-actions"><button class="small-button" onclick="toggleTheme()" type="button">${icon("moon")}Modo claro/escuro</button><form action="/api/logout" method="post"><button class="small-button" type="submit">${icon("logout")}Sair</button></form></div></div></aside>`,
    '<main class="app-main"><div class="wrap">',
    '<div class="top"><div><h1>Aluguel</h1><p>Controle profissional de itens emprestados, prazos e devoluções.</p></div><a class="small-button" href="/admin">Voltar para admin</a></div>',
    '<div class="toolbar">',
    `<nav class="filters" aria-label="Filtros"><a ${filterHref("open", filter)}>Emprestados</a><a ${filterHref("late", filter)}>Atrasados</a><a ${filterHref("returned", filter)}>Recebidos</a><a ${filterHref("all", filter)}>Todos</a></nav>`,
    '<details class="create-modal"><summary class="primary-button">Novo aluguel</summary>',
    '<div class="create-card">',
    '<button class="modal-close" type="button" aria-label="Fechar" onclick="this.closest(\'details\').open=false">x</button>',
    '<h2>Novo aluguel</h2><p>Cadastre somente o essencial. A descrição fica guardada nos detalhes do item.</p>',
    '<form class="form-grid" method="post" action="/admin/aluguel">',
    '<label class="wide">Nome do item emprestado<input name="itemName" placeholder="Ex.: Caixa de som, extensão, banner" required></label>',
    '<label>Quem emprestou<input name="lenderName" required></label>',
    '<label>Quem pegou<input name="takenBy" required></label>',
    '<label>Data<input type="date" name="rentedAt" required></label>',
    '<label>Prazo<input type="date" name="dueAt" required></label>',
    '<label class="wide">Descrição<textarea name="description" required></textarea></label>',
    '<div class="wide modal-actions"><button class="primary-button" type="submit">Salvar aluguel</button></div>',
    "</form></div></details></div>",
    '<section class="rent-list">',
    '<div class="rent-head"><span>Item</span><span>Data</span><span>Prazo</span><span>Status</span><span>Info</span><span>Ações</span></div>',
    renderRows(items),
    "</section>",
    `<p class="top-count">${counts.all} registro(s) neste filtro.</p>`,
    "</div></main></div></body></html>",
  ].join("");
}

http.createServer(async (req, res) => {
  try {
    const user = verifySession(req);
    if (!user) return redirect(res, "/login?callbackUrl=/admin/aluguel");
    const url = new URL(req.url, "https://ejcaparecida.pdm1.com.br");
    const filter = ["open", "late", "returned", "all"].includes(url.searchParams.get("status"))
      ? url.searchParams.get("status")
      : "open";

    if (req.method === "POST") {
      const form = await body(req);
      const intent = form.get("intent");
      if (intent === "delete") {
        await prisma.$executeRawUnsafe("DELETE FROM Rental WHERE id=?", form.get("id"));
      } else if (intent === "return") {
        await prisma.$executeRawUnsafe(
          "UPDATE Rental SET status='RETURNED', returnedAt=?, conditionNote=?, returnedBy=?, updatedBy=?, updatedAt=NOW() WHERE id=?",
          new Date(form.get("returnedAt")),
          form.get("conditionNote"),
          user.name || user.username || "Administrador EJC",
          user.name || user.username || "Administrador EJC",
          form.get("id"),
        );
      } else {
        await prisma.$executeRawUnsafe(
          `INSERT INTO Rental
           (id,itemName,lenderName,rentedAt,dueAt,takenBy,description,conditionNote,status,returnedAt,createdBy,updatedBy,returnedBy,createdAt,updatedAt)
           VALUES (?,?,?,?,?,?,?,NULL,'BORROWED',NULL,?,?,NULL,NOW(),NOW())`,
          "aluguel-" + Date.now().toString(36),
          form.get("itemName"),
          form.get("lenderName"),
          new Date(form.get("rentedAt")),
          new Date(form.get("dueAt")),
          form.get("takenBy"),
          form.get("description"),
          user.name || user.username || "Administrador EJC",
          user.name || user.username || "Administrador EJC",
        );
      }
      await syncSheet();
      return redirect(res, "/admin/aluguel");
    }

    res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
    res.end(renderPage(await listRentals(filter), filter));
  } catch (error) {
    console.error(error);
    res.writeHead(500);
    res.end("Erro no aluguel");
  }
}).listen(PORT, "127.0.0.1", () => console.log("EJC aluguel on " + PORT));
