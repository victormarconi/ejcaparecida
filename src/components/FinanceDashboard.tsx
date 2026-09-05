"use client";

import { useMemo, useState } from "react";
import { money, shortDate } from "@/lib/format";

export type FinanceRow = {
  id: string;
  type: "INCOME" | "EXPENSE";
  title: string;
  description: string | null;
  amountCents: number;
  occurredAt: string;
  category: string | null;
  receiptUrl: string | null;
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

function monthsFrom(referenceDate: string) {
  const parts = dateParts(referenceDate);
  const base = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, 1));
  return [0, 1, 2].map((offset) => {
    const date = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - offset, 1));
    return {
      key: `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" }).format(date),
    };
  });
}

function emptyForm(referenceDate: string): FinanceForm {
  return { type: "INCOME", title: "", description: "", amount: "", occurredAt: inputDate(referenceDate), category: "", receiptUrl: "" };
}

async function responseBody<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
}

export function FinanceDashboard({ initialRows, referenceDate, canManage = false }: { initialRows: FinanceRow[]; referenceDate: string; canManage?: boolean }) {
  const months = useMemo(() => monthsFrom(referenceDate), [referenceDate]);
  const [rows, setRows] = useState(initialRows);
  const [selectedMonth, setSelectedMonth] = useState(months[0].key);
  const [view, setView] = useState<"cash" | "reports">("cash");
  const [form, setForm] = useState<FinanceForm>(() => emptyForm(referenceDate));
  const [editing, setEditing] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);
  const [modalReceipt, setModalReceipt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const balance = rows.reduce((total, row) => total + (row.type === "INCOME" ? row.amountCents : -row.amountCents), 0);
  const currentRows = rows.filter((row) => monthKey(row.occurredAt) === months[0].key);
  const currentIncome = currentRows.filter((row) => row.type === "INCOME").reduce((total, row) => total + row.amountCents, 0);
  const currentExpense = currentRows.filter((row) => row.type === "EXPENSE").reduce((total, row) => total + row.amountCents, 0);
  const filteredRows = rows.filter((row) => monthKey(row.occurredAt) === selectedMonth).sort((left, right) => right.occurredAt.localeCompare(left.occurredAt));

  const reportMonths = months.map((month) => {
    const items = rows.filter((row) => monthKey(row.occurredAt) === month.key);
    const income = items.filter((row) => row.type === "INCOME").reduce((total, row) => total + row.amountCents, 0);
    const expense = items.filter((row) => row.type === "EXPENSE").reduce((total, row) => total + row.amountCents, 0);
    return { ...month, income, expense, balance: income - expense };
  });
  const reportMaximum = Math.max(1, ...reportMonths.flatMap((month) => [month.income, month.expense]));
  const categories = Object.entries(rows.filter((row) => monthKey(row.occurredAt) === selectedMonth && row.type === "EXPENSE").reduce<Record<string, number>>((result, row) => {
    const category = row.category || "Sem categoria";
    result[category] = (result[category] || 0) + row.amountCents;
    return result;
  }, {})).sort((left, right) => right[1] - left[1]);
  const categoryMaximum = Math.max(1, ...categories.map(([, value]) => value));

  function clearForm() {
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
      let receiptUrl = form.type === "EXPENSE" ? form.receiptUrl || null : null;
      if (form.type === "EXPENSE" && receipt) {
        const upload = new FormData();
        upload.set("file", receipt);
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
      setSelectedMonth(monthKey(body.item.occurredAt));
      clearForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar o lançamento.");
    } finally {
      setBusy(false);
    }
  }

  function edit(row: FinanceRow) {
    setEditing(row.id);
    setForm({ type: row.type, title: row.title, description: row.description || "", amount: (row.amountCents / 100).toFixed(2).replace(".", ","), occurredAt: inputDate(row.occurredAt), category: row.category || "", receiptUrl: row.receiptUrl || "" });
    setReceipt(null);
    setFormPreview(row.receiptUrl);
    setView("cash");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(row: FinanceRow) {
    if (!window.confirm(`Excluir o lançamento “${row.title}”?`)) return;
    setBusy(true);
    setError("");
    try {
      await responseBody<{ ok: boolean }>(await fetch("/api/admin/financas", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id }) }));
      setRows((current) => current.filter((item) => item.id !== row.id));
      if (editing === row.id) clearForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o lançamento.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="grid three finance-kpis">
      <div className="card kpi finance-balance"><span>💰 Caixa atual</span><strong>{money(balance)}</strong><small>Saldo acumulado</small></div>
      <div className="card kpi finance-income"><span>📈 Entradas no mês</span><strong>{money(currentIncome)}</strong><small>{months[0].label}</small></div>
      <div className="card kpi finance-expense"><span>📉 Saídas no mês</span><strong>{money(currentExpense)}</strong><small>{months[0].label}</small></div>
    </div>

    <div className="module-tabs" role="tablist" aria-label="Visões de finanças">
      <button type="button" role="tab" aria-selected={view === "cash"} onClick={() => setView("cash")}>Fluxo de caixa</button>
      <button type="button" role="tab" aria-selected={view === "reports"} onClick={() => setView("reports")}>Relatórios</button>
    </div>

    {view === "cash" && <>
      {canManage && <form className="card form finance-form" onSubmit={save}>
        <div className="form-heading"><div><span className="eyebrow">Lançamento</span><h2>{editing ? "Editar lançamento" : "Novo lançamento"}</h2></div>{editing && <button className="button secondary small" type="button" onClick={clearForm}>Cancelar edição</button>}</div>
        <div className="form-row finance-form-main">
          <label className="field">Tipo<select required value={form.type} onChange={(event) => { const type = event.target.value as FinanceForm["type"]; setForm({ ...form, type, receiptUrl: type === "INCOME" ? "" : form.receiptUrl }); if (type === "INCOME") chooseReceipt(null); }}><option value="INCOME">Entrada</option><option value="EXPENSE">Saída</option></select></label>
          <label className="field field-grow">Título<input required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label className="field">Valor (R$)<input required inputMode="decimal" placeholder="0,00" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} /></label>
          <label className="field">Data<input type="date" required value={form.occurredAt} onChange={(event) => setForm({ ...form, occurredAt: event.target.value })} /></label>
        </div>
        <div className="form-row">
          <label className="field">Categoria<input maxLength={100} value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} /></label>
          <label className="field field-grow">Descrição<input maxLength={500} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          {form.type === "EXPENSE" && <label className="field receipt-input">Foto da nota/recibo<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseReceipt(event.target.files?.[0] || null)} /><small>JPEG, PNG ou WebP · até 5 MB</small></label>}
        </div>
        {form.type === "EXPENSE" && formPreview && <div className="pending-receipt">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={formPreview} alt="Prévia do comprovante" /><span>{receipt?.name || "Comprovante atual"}</span><button className="button secondary small" type="button" onClick={() => { chooseReceipt(null); setForm({ ...form, receiptUrl: "" }); }}>Remover</button>
        </div>}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions"><button className="button" type="submit" disabled={busy}>{busy ? "Salvando…" : editing ? "Salvar alterações" : "Adicionar lançamento"}</button></div>
      </form>}

      <section className="finance-history">
        <div className="section-heading compact"><div><span className="eyebrow">Histórico</span><h2>Últimos 3 meses</h2></div><p>Escolha um mês para consultar os lançamentos.</p></div>
        <div className="month-tabs" role="tablist" aria-label="Mês do histórico">{months.map((month) => <button type="button" role="tab" aria-selected={selectedMonth === month.key} onClick={() => setSelectedMonth(month.key)} key={month.key}>{month.label}</button>)}</div>
        <div className="card table-card compact-table"><table><thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Valor</th><th>Comprovante</th>{canManage && <th>Ações</th>}</tr></thead><tbody>{filteredRows.map((row) => <tr key={row.id}>
          <td>{shortDate(row.occurredAt)}</td><td>{row.category || "—"}</td><td><strong>{row.title}</strong>{row.description && <small>{row.description}</small>}</td><td><span className={`finance-value ${row.type === "INCOME" ? "positive" : "negative"}`}>{row.type === "INCOME" ? "+" : "−"}{money(row.amountCents)}</span></td>
          <td>{row.receiptUrl ? <button className="receipt-thumb" type="button" onClick={() => setModalReceipt(row.receiptUrl)} aria-label={`Abrir comprovante de ${row.title}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={row.receiptUrl} alt="" />
          </button> : <span className="muted">—</span>}</td>
          {canManage && <td><div className="actions"><button className="button secondary small" type="button" disabled={busy} onClick={() => edit(row)}>Editar</button><button className="button danger small" type="button" disabled={busy} onClick={() => remove(row)}>Excluir</button></div></td>}
        </tr>)}</tbody></table>{!filteredRows.length && <div className="empty">Nenhum lançamento neste mês.</div>}</div>
      </section>
    </>}

    {view === "reports" && <section className="finance-reports" role="tabpanel">
      <div className="section-heading compact"><div><span className="eyebrow">Relatórios</span><h2>Comparativo financeiro</h2></div><p>Análise separada do lançamento e do histórico diário.</p></div>
      <div className="grid two reports-grid">
        <article className="card"><h3>Entradas e saídas</h3><div className="report-bars">{reportMonths.map((month) => <div className="report-month" key={month.key}><strong>{month.label}</strong><div><span>Entradas</span><div className="bar-track"><i className="bar income" style={{ width: `${month.income / reportMaximum * 100}%` }} /></div><b>{money(month.income)}</b></div><div><span>Saídas</span><div className="bar-track"><i className="bar expense" style={{ width: `${month.expense / reportMaximum * 100}%` }} /></div><b>{money(month.expense)}</b></div><small>Resultado: <span className={month.balance >= 0 ? "positive-text" : "negative-text"}>{money(month.balance)}</span></small></div>)}</div></article>
        <article className="card"><div className="report-card-heading"><h3>Saídas por categoria</h3><select aria-label="Mês das categorias" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>{months.map((month) => <option value={month.key} key={month.key}>{month.label}</option>)}</select></div><div className="category-report">{categories.map(([category, total]) => <div key={category}><span>{category}</span><div className="bar-track"><i className="bar expense" style={{ width: `${total / categoryMaximum * 100}%` }} /></div><strong>{money(total)}</strong></div>)}</div>{!categories.length && <div className="empty">Sem despesas categorizadas neste mês.</div>}</article>
      </div>
    </section>}

    {modalReceipt && <div className="image-modal" role="dialog" aria-modal="true" aria-label="Comprovante ampliado" onClick={() => setModalReceipt(null)}><div className="image-modal-card" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setModalReceipt(null)} aria-label="Fechar">×</button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={modalReceipt} alt="Comprovante fiscal ampliado" />
    </div></div>}
  </>;
}
