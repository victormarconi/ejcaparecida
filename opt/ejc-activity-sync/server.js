const fs = require("fs");
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
let running = false;

function dateTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

async function sheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_FILE || "/root/ejc-google-service-account.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth: await auth.getClient() });
}

async function ensureLogsSheet(sheets, spreadsheetId) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  if (!meta.data.sheets.some((sheet) => sheet.properties.title === "Logs")) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: "Logs" } } }] },
    });
  }
}

async function syncLogs() {
  if (running) return;
  running = true;
  try {
    const rows = await prisma.$queryRawUnsafe(
      "SELECT id,entity,entityId,action,actor,payload,createdAt FROM ActivityLog ORDER BY createdAt DESC, id DESC LIMIT 1000",
    );
    const values = [["Data/Hora", "Area", "Acao", "Registro", "Usuario", "Dados completos"]];
    for (const row of rows) {
      values.push([
        dateTime(row.createdAt),
        row.entity || "",
        row.action || "",
        row.entityId || "",
        row.actor || "Administrador EJC",
        row.payload || "",
      ]);
    }

    const sheets = await sheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    await ensureLogsSheet(sheets, spreadsheetId);
    await sheets.spreadsheets.values.clear({ spreadsheetId, range: "Logs!A:Z" });
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: "Logs!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Activity log sync failed", error.message || error);
  } finally {
    running = false;
  }
}

syncLogs();
setInterval(syncLogs, 15000);
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
console.log("EJC activity sync running");
