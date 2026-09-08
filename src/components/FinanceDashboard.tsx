"use client";

import { useMemo, useState } from "react";
import { money, shortDate } from "@/lib/format";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";
import { Plus, FolderArchive, QrCode } from "lucide-react";

export type FinanceRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  title: string;
  description: string | null;
  amountCents: number;
  occurredAt: string;
  category: string | null;
  receiptUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type FinanceForm = {
  type: "INCOME" | "EXPENSE";
  title: string;
  description: string;
  amount: string;
  occurredAt: string;
  category: string;
  receiptUrl: string;
};

const timeZone = "America/Fortaleza";

function dateParts(value: string | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(value));
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

function monthKey(value: string | Date) {
  const parts = dateParts(value);
  return `${parts.year}-${parts.month}`;
}

function inputDate(value: string | Date) {
  const parts = dateParts(value);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function getAllAvailableMonths(rows: FinanceRow[], referenceDate: string) {
  const monthMap = new Map<string, string>();
  
  const currentKey = monthKey(referenceDate);
  const currentLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(referenceDate));
  monthMap.set(currentKey, currentLabel);

  for (const row of rows) {
    const key = monthKey(row.occurredAt);
    if (!monthMap.has(key)) {
      const [year, month] = key.split("-").map(Number);
      const d = new Date(Date.UTC(year, month - 1, 1));
      const label = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(d);
      monthMap.set(key, label);
    }
  }

  return Array.from(monthMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, label]) => ({ key, label }));
}

function emptyForm(referenceDate: string): FinanceForm {
  return { type: "INCOME", title: "", description: "", amount: "", occurredAt: inputDate(referenceDate), category: "", receiptUrl: "" };
}

async function responseBody<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
}


async function compressImageFile(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else resolve(file);
          },
          "image/jpeg",
          0.82
        );
      };
      img.onerror = () => resolve(file);
      img.src = event.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

export function FinanceDashboard({ initialRows, referenceDate, canManage = false, initialPixKey = "ejcaparecida2000@gmail.com" }: { initialRows: FinanceRow[]; referenceDate: string; canManage?: boolean; initialPixKey?: string }) {
  const [rows, setRows] = useState(initialRows);
  const allMonths = useMemo(() => getAllAvailableMonths(rows, referenceDate), [rows, referenceDate]);
  const recentMonths = useMemo(() => allMonths.slice(0, 3), [allMonths]);
  const recentKeys = useMemo(() => new Set(recentMonths.map((m) => m.key)), [recentMonths]);

  const [selectedPeriod, setSelectedPeriod] = useState<string>("recent3");
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyMonthFilter, setHistoryMonthFilter] = useState<string>("all");
  const [reportMonth, setReportMonth] = useState<string>(() => recentMonths[0]?.key || "");
  const [reportCategoryTab, setReportCategoryTab] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  
  // PIX Modal State
  const [pixModalOpen, setPixModalOpen] = useState(false);
  const [currentPixKey, setCurrentPixKey] = useState(initialPixKey);
  const [pixInput, setPixInput] = useState(initialPixKey);
  const [pixBeneficiary, setPixBeneficiary] = useState("Paróquia Nossa Senhora Aparecida");
  const [savingPix, setSavingPix] = useState(false);
  const [pixSuccess, setPixSuccess] = useState(false);

  const [view, setView] = useState<"cash" | "reports">("cash");
  const [form, setForm] = useState<FinanceForm>(() => emptyForm(referenceDate));
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingRow, setDeletingRow] = useState<FinanceRow | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [modalReceipt, setModalReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const balance = rows.reduce((total, row) => total + (row.type === "INCOME" ? row.amountCents : -row.amountCents), 0);
  const currentRows = useMemo(() => {
    if (selectedPeriod === "recent3") {
      return rows.filter((r) => recentKeys.has(monthKey(r.occurredAt)));
    }
    return rows.filter((r) => monthKey(r.occurredAt) === selectedPeriod);
  }, [rows, selectedPeriod, recentKeys]);

  const displayIncome = currentRows.filter((row) => row.type === "INCOME").reduce((total, row) => total + row.amountCents, 0);
  const displayExpense = currentRows.filter((row) => row.type === "EXPENSE").reduce((total, row) => total + row.amountCents, 0);
  const filteredRows = [...currentRows].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  const historyFilteredRows = useMemo(() => {
    if (historyMonthFilter === "all") return [...rows].sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
    return rows.filter((r) => monthKey(r.occurredAt) === historyMonthFilter).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));
  }, [rows, historyMonthFilter]);

  const reportMonths = recentMonths.map((month) => {
    const items = rows.filter((row) => monthKey(row.occurredAt) === month.key);
    const income = items.filter((row) => row.type === "INCOME").reduce((total, row) => total + row.amountCents, 0);
    const expense = items.filter((row) => row.type === "EXPENSE").reduce((total, row) => total + row.amountCents, 0);
    return { ...month, income, expense, balance: income - expense };
  });
  const reportMaximum = Math.max(1, ...reportMonths.flatMap((month) => [month.income, month.expense]));

  const expenseCategories = Object.entries(
    rows
      .filter((row) => monthKey(row.occurredAt) === reportMonth && row.type === "EXPENSE")
      .reduce<Record<string, number>>((result, row) => {
        const category = row.category || "Sem categoria";
        result[category] = (result[category] || 0) + row.amountCents;
        return result;
      }, {})
  ).sort((left, right) => right[1] - left[1]);
  const expenseCategoryMaximum = Math.max(1, ...expenseCategories.map(([, value]) => value));

  const incomeCategories = Object.entries(
    rows
      .filter((row) => monthKey(row.occurredAt) === reportMonth && row.type === "INCOME")
      .reduce<Record<string, number>>((result, row) => {
        const category = row.category || "Sem categoria";
        result[category] = (result[category] || 0) + row.amountCents;
        return result;
      }, {})
  ).sort((left, right) => right[1] - left[1]);
  const incomeCategoryMaximum = Math.max(1, ...incomeCategories.map(([, value]) => value));

  function clearForm() {
    setModalOpen(false);
    if (formPreview?.startsWith("blob:")) URL.revokeObjectURL(formPreview);
    setForm(emptyForm(referenceDate));
    setEditing(null);
    setReceipt(null);
    setFormPreview(null);
    setError("");
  }

  function chooseReceipt(file: File | null) {
    if (formPreview?.startsWith("blob:")) URL.revokeObjectURL(formPreview);
    setReceipt(file);
    setFormPreview(file ? URL.createObjectURL(file) : form.receiptUrl || null);
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const normalizedAmount = Number(form.amount.replace(",", "."));
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) throw new Error("Informe um valor maior que zero.");
      let receiptUrl = form.receiptUrl || null;
      if (receipt) {
        const compressed = await compressImageFile(receipt);
        const upload = new FormData();
        upload.set("file", compressed, "comprovante.jpg");
        upload.set("kind", "receipt");
        const uploaded = await responseBody<{ url: string }>(await fetch("/api/admin/uploads", { method: "POST", body: upload }));
        receiptUrl = uploaded.url;
      }
      const payload = {
        type: form.type,
        title: form.title,
        description: form.description || null,
        amountCents: Math.round(normalizedAmount * 100),
        occurredAt: new Date(`${form.occurredAt}T12:00:00-03:00`).toISOString(),
        category: form.category || null,
        receiptUrl,
      };
      const body = await responseBody<{ item: FinanceRow }>(await fetch("/api/admin/financas", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { ...payload, id: editing } : payload),
      }));
      setRows((current) => editing ? current.map((row) => row.id === editing ? body.item : row) : [body.item, ...current]);
      setSelectedPeriod(monthKey(body.item.occurredAt));
      clearForm();
      setModalOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o lançamento.");
    } finally {
      setBusy(false);
    }
  }

  function edit(row: FinanceRow) {
    setModalOpen(true);
    setEditing(row.id);
    setForm({ type: row.type, title: row.title, description: row.description || "", amount: (row.amountCents / 100).toFixed(2).replace(".", ","), occurredAt: inputDate(row.occurredAt), category: row.category || "", receiptUrl: row.receiptUrl || "" });
    setReceipt(null);
    setFormPreview(row.receiptUrl);
    setView("cash");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  
  async function handleSavePix(e: React.FormEvent) {
    e.preventDefault();
    setSavingPix(true);
    setError("");
    try {
      const res = await fetch("/api/admin/configuracoes/pix", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pixKey: pixInput.trim(), beneficiary: pixBeneficiary.trim() }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Falha ao salvar chave PIX.");
      setCurrentPixKey(resData.pixKey);
      setPixSuccess(true);
      setTimeout(() => {
        setPixSuccess(false);
        setPixModalOpen(false);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar chave PIX.");
    } finally {
      setSavingPix(false);
    }
  }

  async function remove(row: FinanceRow) {
    if (!window.confirm(`Excluir o lançamento “${row.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      await responseBody<{ ok: boolean }>(await fetch("/api/admin/financas", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id }) }));
      setRows((current) => current.filter((item) => item.id !== row.id));
      if (editing === row.id) clearForm();
      setModalOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o lançamento.");
    } finally {
      setBusy(false);
    }
  }

  
  const currentMonthKey = recentMonths[0]?.key || monthKey(referenceDate);
  const currentMonthLabel = recentMonths[0]?.label || "Mês atual";

  const monthRows = useMemo(
    () => rows.filter((r) => monthKey(r.occurredAt) === currentMonthKey),
    [rows, currentMonthKey]
  );

  const monthIncome = useMemo(
    () => monthRows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountCents, 0),
    [monthRows]
  );

  const monthExpense = useMemo(
    () => monthRows.filter((r) => r.type === "EXPENSE").reduce((s, r) => s + r.amountCents, 0),
    [monthRows]
  );

  const monthResult = monthIncome - monthExpense;

  const totalIncome = useMemo(
    () => rows.filter((r) => r.type === "INCOME").reduce((s, r) => s + r.amountCents, 0),
    [rows]
  );

  return <>
    <div className="finance-kpis">
      <div className="card kpi finance-balance">
        <span>💰 Caixa atual</span>
        <strong>{money(balance)}</strong>
        <small>Saldo acumulado</small>
      </div>
      <div className="card kpi finance-income">
        <span>📈 Entradas</span>
        <strong>{money(monthIncome)}</strong>
        <small>{currentMonthLabel}</small>
      </div>
      <div className="card kpi finance-expense">
        <span>📉 Saídas</span>
        <strong>{money(monthExpense)}</strong>
        <small>{currentMonthLabel}</small>
      </div>
      <div className="card kpi finance-result">
        <span>⚖️ Resultado</span>
        <strong style={{ color: monthResult >= 0 ? "#34d399" : "#f87171" }}>
          {monthResult >= 0 ? "+" : "−"}{money(Math.abs(monthResult))}
        </strong>
        <small>{currentMonthLabel}</small>
      </div>
      <div className="card kpi finance-total">
        <span>💎 Total Entradas</span>
        <strong>{money(totalIncome)}</strong>
        <small>Desde abril de 2026</small>
      </div>
    </div>

        <div className="flex-between-wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
      <div className="module-tabs" role="tablist" aria-label="Visões de finanças" style={{ margin: 0 }}>
        <button type="button" role="tab" aria-selected={view === "cash"} onClick={() => setView("cash")}>Fluxo de caixa</button>
        <button type="button" role="tab" aria-selected={view === "reports"} onClick={() => setView("reports")}>Relatórios</button>
      </div>
      {canManage && (
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={() => {
              setPixInput(currentPixKey);
              setError("");
              setPixModalOpen(true);
            }}
            title="Alterar chave PIX da paróquia exibida no site oficial"
          >
            <QrCode size={15} />
            <span>Chave PIX Oficial</span>
          </button>
          {view === "cash" && (
            <button
              type="button"
              className="pdm-btn-primary pdm-btn-compact"
              onClick={() => {
                clearForm();
                setModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Novo lançamento</span>
            </button>
          )}
        </div>
      )}
    </div>

    {/* MODAL PADRONIZADO PDM1 PARA NOVO/EDITAR LANÇAMENTO */}
    <PdmModal
      open={modalOpen}
      onClose={clearForm}
      title={editing ? "Editar Lançamento" : "Novo Lançamento Financeiro"}
      subtitle="Registre uma entrada ou saída no fluxo de caixa da paróquia."
    >
      <form className="form finance-form" onSubmit={save}>
        <div className="form-row finance-form-main">
          <label className="field">
            Tipo
            <select
              required
              value={form.type}
              onChange={(event) => {
                const type = event.target.value as FinanceForm["type"];
                setForm({ ...form, type, receiptUrl: type === "INCOME" ? "" : form.receiptUrl });
                if (type === "INCOME") chooseReceipt(null);
              }}
            >
              <option value="INCOME">Entrada (+)</option>
              <option value="EXPENSE">Saída (−)</option>
            </select>
          </label>
          <label className="field field-grow">
            Título
            <input
              required
              maxLength={160}
              placeholder="Ex: Venda de Camisas / Compra de Velas"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
            />
          </label>
          <label className="field">
            Valor (R$)
            <input
              required
              inputMode="decimal"
              placeholder="0,00"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
            />
          </label>
          <label className="field">
            Data
            <input
              type="date"
              required
              value={form.occurredAt}
              onChange={(event) => setForm({ ...form, occurredAt: event.target.value })}
            />
          </label>
        </div>
        <div className="form-row">
          <label className="field">
            Categoria
            <input
              maxLength={100}
              placeholder="Ex: Eventos, Doações, Bazar"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
            />
          </label>
          <label className="field field-grow">
            Descrição (opcional)
            <input
              maxLength={500}
              placeholder="Detalhes adicionais do lançamento"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </label>
          <label className="field receipt-input">
            Foto / Comprovante (opcional)
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => chooseReceipt(event.target.files?.[0] || null)}
            />
          </label>
        </div>
        {formPreview && (
          <div className="receipt-preview" style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "8px" }}>
            <img src={formPreview} alt="Comprovante" style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)" }} />
            <button
              className="pdm-btn-danger pdm-btn-small"
              type="button"
              onClick={() => {
                if (formPreview?.startsWith("blob:")) URL.revokeObjectURL(formPreview);
                setReceipt(null);
                setFormPreview(null);
                setForm({ ...form, receiptUrl: "" });
              }}
            >
              Remover foto
            </button>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "14px" }}>
          <button className="button secondary" type="button" onClick={clearForm}>
            Cancelar
          </button>
          <button className="button" type="submit" disabled={busy}>
            {busy ? "Salvando…" : editing ? "Salvar alterações" : "Confirmar Lançamento"}
          </button>
        </div>
      </form>
    </PdmModal>

    {view === "cash" && <>

      <section className="finance-history">
        <div className="section-heading compact" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <span className="eyebrow">Histórico Recente</span>
            <h2>Últimos 3 Meses</h2>
          </div>
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={() => setHistoryModalOpen(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <FolderArchive size={15} />
            <span>Ver Histórico Completo ({rows.length})</span>
          </button>
        </div>

        <div className="month-tabs" role="tablist" aria-label="Mês do histórico" style={{ margin: "14px 0" }}>
          <button
            type="button"
            role="tab"
            aria-selected={selectedPeriod === "recent3"}
            onClick={() => setSelectedPeriod("recent3")}
          >
            Últimos 3 Meses ({rows.filter(r => recentKeys.has(monthKey(r.occurredAt))).length})
          </button>
          {recentMonths.map((month) => {
            const count = rows.filter((r) => monthKey(r.occurredAt) === month.key).length;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={selectedPeriod === month.key}
                onClick={() => setSelectedPeriod(month.key)}
                key={month.key}
              >
                {month.label} ({count})
              </button>
            );
          })}
        </div>
        <div className="card table-card compact-table"><table><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Comprovante</th>{canManage && <th>Ações</th>}</tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id}>
          <td>{shortDate(row.occurredAt)}</td><td>{row.category || "—"}</td><td>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong>{row.title}</strong>
                {(row.description?.includes("[Editado em") ||
                  (row.updatedAt && row.createdAt && new Date(row.updatedAt).getTime() - new Date(row.createdAt).getTime() > 2000)) && (
                  <span
                    className="pdm-badge"
                    style={{
                      fontSize: "0.68rem",
                      background: "rgba(234, 179, 8, 0.12)",
                      color: "#facc15",
                      border: "1px solid rgba(234, 179, 8, 0.25)",
                      padding: "1px 5px",
                    }}
                    title={row.description?.match(/\[Editado em [^\]]+\]/)?.[0] || "Lançamento editado"}
                  >
                    ✏️ Editado
                  </span>
                )}
              </div>
              {row.description && <small style={{ color: "#94a3b8" }}>{row.description}</small>}
            </div>
          </td><td><span className={`finance-value ${row.type === "INCOME" ? "positive" : "negative"}`}>{row.type === "INCOME" ? "+" : "−"}{money(row.amountCents)}</span></td>
          <td>{row.receiptUrl ? <button className="receipt-thumb" type="button" onClick={() => setModalReceipt(row.receiptUrl)} aria-label={`Abrir comprovante de ${row.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.receiptUrl} alt="" />
          </button> : <span className="muted">—</span>}</td>
          {canManage && <td><div className="actions"><button className="button secondary small" type="button" disabled={busy} onClick={() => edit(row)}>Editar</button><button className="button danger small" type="button" disabled={busy} onClick={() => remove(row)}>Excluir</button></div></td>}
        </tr>)}</tbody></table>{!filteredRows.length && <div className="empty">Nenhum lançamento neste mês.</div>}</div>
      </section>
    </>}

    {view === "reports" && <section className="finance-reports" role="tabpanel">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">Relatórios</span>
          <h2>Comparativo Financeiro (Últimos 3 Meses)</h2>
        </div>
        <p>Análise de fluxo de caixa recente e detalhamento de receitas e despesas por categoria.</p>
      </div>
      <div className="grid two reports-grid">
        <article className="card">
          <h3 style={{ marginBottom: "16px" }}>Entradas e saídas (3 meses)</h3>
          <div className="report-bars">
            {reportMonths.map((month) => (
              <div className="report-month" key={month.key}>
                <strong>{month.label}</strong>
                <div>
                  <span>Entradas</span>
                  <div className="bar-track">
                    <i className="bar income" style={{ width: `${(month.income / reportMaximum) * 100}%` }} />
                  </div>
                  <b>{money(month.income)}</b>
                </div>
                <div>
                  <span>Saídas</span>
                  <div className="bar-track">
                    <i className="bar expense" style={{ width: `${(month.expense / reportMaximum) * 100}%` }} />
                  </div>
                  <b>{money(month.expense)}</b>
                </div>
                <small>
                  Resultado:{" "}
                  <span className={month.balance >= 0 ? "positive-text" : "negative-text"}>
                    {money(month.balance)}
                  </span>
                </small>
              </div>
            ))}
          </div>
        </article>

        <article className="card">
          <div className="report-card-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Categorias do mês</h3>
            <select
              aria-label="Mês das categorias"
              value={reportMonth}
              onChange={(event) => setReportMonth(event.target.value)}
              style={{ padding: "5px 10px", borderRadius: "8px", background: "var(--surface-soft)", color: "var(--text)", border: "1px solid var(--border)", fontSize: "0.82rem" }}
            >
              {recentMonths.map((month) => (
                <option value={month.key} key={month.key}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>

          {/* Abas Saídas / Entradas */}
          <div className="module-tabs" style={{ margin: "0 0 14px 0" }}>
            <button
              type="button"
              role="tab"
              aria-selected={reportCategoryTab === "EXPENSE"}
              onClick={() => setReportCategoryTab("EXPENSE")}
              style={{ fontSize: "0.80rem", padding: "4px 12px" }}
            >
              Saídas ({money(expenseCategories.reduce((acc, [, val]) => acc + val, 0))})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={reportCategoryTab === "INCOME"}
              onClick={() => setReportCategoryTab("INCOME")}
              style={{ fontSize: "0.80rem", padding: "4px 12px" }}
            >
              Entradas ({money(incomeCategories.reduce((acc, [, val]) => acc + val, 0))})
            </button>
          </div>

          {reportCategoryTab === "EXPENSE" ? (
            <div className="category-report">
              {expenseCategories.map(([category, total]) => (
                <div key={category}>
                  <span>{category}</span>
                  <div className="bar-track">
                    <i className="bar expense" style={{ width: `${(total / expenseCategoryMaximum) * 100}%` }} />
                  </div>
                  <strong>{money(total)}</strong>
                </div>
              ))}
              {!expenseCategories.length && <div className="empty">Sem despesas registradas neste mês.</div>}
            </div>
          ) : (
            <div className="category-report">
              {incomeCategories.map(([category, total]) => (
                <div key={category}>
                  <span>{category}</span>
                  <div className="bar-track">
                    <i className="bar income" style={{ width: `${(total / incomeCategoryMaximum) * 100}%` }} />
                  </div>
                  <strong>{money(total)}</strong>
                </div>
              ))}
              {!incomeCategories.length && <div className="empty">Sem entradas registradas neste mês.</div>}
            </div>
          )}
        </article>
      </div>
    </section>}

    {modalReceipt && <div className="image-modal" role="dialog" aria-modal="true" aria-label="Comprovante ampliado" onClick={() => setModalReceipt(null)}><div className="image-modal-card" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setModalReceipt(null)} aria-label="Fechar">×</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={modalReceipt} alt="Comprovante fiscal ampliado" />
    </div></div>}

    
    
    {/* MODAL PADRÃO PDM1 DE CONFIGURAÇÃO DA CHAVE PIX */}
    <PdmModal
      open={pixModalOpen}
      onClose={() => setPixModalOpen(false)}
      title="Chave PIX da Paróquia"
      subtitle="Defina a chave oficial para doações exibida na página pública e campanhas."
      maxWidth="500px"
    >
      <form onSubmit={handleSavePix} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        <div style={{ background: "rgba(2, 132, 199, 0.08)", padding: "12px 14px", borderRadius: "10px", border: "1px solid rgba(2, 132, 199, 0.2)", display: "flex", alignItems: "center", gap: "10px" }}>
          <QrCode size={24} style={{ color: "#38bdf8", flexShrink: 0 }} />
          <div style={{ fontSize: "0.82rem", color: "#cbd5e1" }}>
            Chave atual no site público: <strong style={{ color: "#38bdf8" }}>{currentPixKey}</strong>
          </div>
        </div>

        <label className="field">
          Chave PIX Oficial *
          <input
            required
            placeholder="Ex: email@paroquia.com, telefone ou chave aleatória"
            value={pixInput}
            onChange={(e) => setPixInput(e.target.value)}
          />
        </label>

        <label className="field">
          Beneficiário / Nome da Conta
          <input
            placeholder="Ex: Paróquia Nossa Senhora Aparecida"
            value={pixBeneficiary}
            onChange={(e) => setPixBeneficiary(e.target.value)}
          />
        </label>

        {error && <p className="error" role="alert">{error}</p>}
        {pixSuccess && <p style={{ margin: 0, padding: "8px 12px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderRadius: "8px", fontSize: "0.84rem", fontWeight: 600 }}>✓ Chave PIX atualizada com sucesso no site oficial!</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={() => setPixModalOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="pdm-btn-primary pdm-btn-compact"
            disabled={savingPix}
          >
            {savingPix ? "Salvando..." : "Salvar Chave PIX"}
          </button>
        </div>
      </form>
    </PdmModal>

    {/* MODAL PADRÃO PDM1 DE HISTÓRICO COMPLETO */}
    <PdmModal
      open={historyModalOpen}
      onClose={() => setHistoryModalOpen(false)}
      title="Histórico Financeiro Completo"
      subtitle={`Consulta aos ${rows.length} lançamentos desde Abril de 2026.`}
      maxWidth="960px"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {/* Abas compactas por mês dentro do modal */}
        <div className="month-tabs" style={{ margin: 0 }}>
          <button
            type="button"
            role="tab"
            aria-selected={historyMonthFilter === "all"}
            onClick={() => setHistoryMonthFilter("all")}
          >
            Todos ({rows.length})
          </button>
          {allMonths.map((m) => {
            const c = rows.filter((r) => monthKey(r.occurredAt) === m.key).length;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={historyMonthFilter === m.key}
                onClick={() => setHistoryMonthFilter(m.key)}
                key={m.key}
              >
                {m.label} ({c})
              </button>
            );
          })}
        </div>

        {/* Tabela com scroll suave no modal */}
        <div style={{ maxHeight: "480px", overflowY: "auto", overflowX: "auto", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}>
          <table className="compact-table" style={{ width: "100%", minWidth: "600px", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Data</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Categoria</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Descrição</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Valor</th>
                <th style={{ padding: "8px 12px", textAlign: "left" }}>Foto</th>
                {canManage && <th style={{ padding: "8px 12px", textAlign: "right" }}>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {historyFilteredRows.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>{shortDate(row.occurredAt)}</td>
                  <td style={{ padding: "8px 12px" }}>{row.category || "—"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <strong style={{ color: "#fff" }}>{row.title}</strong>
                      {row.description?.includes("[Editado em") && (
                        <span className="pdm-badge" style={{ fontSize: "0.66rem", background: "rgba(234, 179, 8, 0.12)", color: "#facc15" }}>
                          ✏️ Editado
                        </span>
                      )}
                    </div>
                    {row.description && <small style={{ color: "#94a3b8" }}>{row.description}</small>}
                  </td>
                  <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                    <span className={`finance-value ${row.type === "INCOME" ? "positive" : "negative"}`}>
                      {row.type === "INCOME" ? "+" : "−"}{money(row.amountCents)}
                    </span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>
                    {row.receiptUrl ? (
                      <button
                        className="table-action-btn"
                        type="button"
                        style={{ background: "rgba(56, 189, 248, 0.12)", color: "#38bdf8" }}
                        onClick={() => setModalReceipt(row.receiptUrl)}
                      >
                        📷 Ver
                      </button>
                    ) : "—"}
                  </td>
                  {canManage && (
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button
                          className="table-action-btn edit"
                          type="button"
                          onClick={() => {
                            setHistoryModalOpen(false);
                            edit(row);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="table-action-btn delete"
                          type="button"
                          onClick={() => {
                            setHistoryModalOpen(false);
                            setDeletingRow(row);
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={() => setHistoryModalOpen(false)}
          >
            Fechar
          </button>
        </div>
      </div>
    </PdmModal>

    {/* CONFIRMAÇÃO DE EXCLUSÃO PADRÃO PDM1 */}
    <PdmConfirmModal
      open={Boolean(deletingRow)}
      onClose={() => setDeletingRow(null)}
      onConfirm={async () => {
        if (!deletingRow) return;
        await remove(deletingRow);
        setDeletingRow(null);
      }}
      title="Excluir Lançamento"
      message={`Tem certeza que deseja excluir o lançamento "${deletingRow?.title}"?`}
      confirmLabel="Sim, excluir"
      busy={busy}
    />
  </>;
}
