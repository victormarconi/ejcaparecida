"use client";

import { useMemo, useState } from "react";

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "datetime-local" | "select" | "checkbox";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

type Row = Record<string, unknown> & { id: string };

function inputValue(value: unknown, type?: string) {
  if (type === "datetime-local" && value) return new Date(String(value)).toISOString().slice(0, 16);
  if (type === "checkbox") return Boolean(value);
  return value === null || value === undefined ? "" : String(value);
}

export function ResourceManager({ endpoint, fields, initialRows, columns }: { endpoint: string; fields: ResourceField[]; initialRows: Row[]; columns: Array<{ key: string; label: string }> }) {
  const empty = useMemo(() => Object.fromEntries(fields.map((field) => [field.key, field.type === "checkbox" ? false : ""])), [fields]);
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<Record<string, unknown>>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const payload = Object.fromEntries(fields.map((field) => {
      const value = form[field.key];
      if (field.type === "number") return [field.key, value === "" ? null : Number(value)];
      if (field.type === "datetime-local") return [field.key, value ? new Date(String(value)).toISOString() : null];
      return [field.key, value === "" ? null : value];
    }));
    try {
      const response = await fetch(endpoint, { method: editing ? "PUT" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(editing ? { ...payload, id: editing } : payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível salvar");
      setRows((current) => editing ? current.map((row) => row.id === editing ? body.item : row) : [body.item, ...current]);
      setForm(empty); setEditing(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha ao salvar"); }
    finally { setBusy(false); }
  }

  function edit(row: Row) {
    setEditing(row.id);
    setForm(Object.fromEntries(fields.map((field) => [field.key, inputValue(row[field.key], field.type)])));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(row: Row) {
    if (!confirm("Tem certeza que deseja excluir este registro?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(endpoint, { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: row.id }) });
      if (!response.ok) throw new Error((await response.json()).error || "Não foi possível excluir");
      setRows((current) => current.filter((item) => item.id !== row.id));
      if (editing === row.id) { setEditing(null); setForm(empty); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Falha ao excluir"); }
    finally { setBusy(false); }
  }

  return <div className="admin-grid">
    <form className="card form admin-form" onSubmit={save}>
      <h2>{editing ? "Editar registro" : "Novo registro"}</h2>
      {fields.map((field) => <label className="field" key={field.key}>{field.label}
        {field.type === "textarea" ? <textarea rows={4} required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />
          : field.type === "select" ? <select required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}><option value="">Selecione</option>{field.options?.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}</select>
          : field.type === "checkbox" ? <input type="checkbox" checked={Boolean(form[field.key])} onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })} />
          : <input type={field.type || "text"} required={field.required} value={String(form[field.key] ?? "")} onChange={(event) => setForm({ ...form, [field.key]: event.target.value })} />}
      </label>)}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="actions"><button className="button" disabled={busy} type="submit">{busy ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar"}</button>{editing && <button className="button secondary" type="button" onClick={() => { setEditing(null); setForm(empty); }}>Cancelar</button>}</div>
    </form>
    <div className="card table-card"><table><thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}<th>Ações</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{typeof row[column.key] === "boolean" ? row[column.key] ? "Sim" : "Não" : String(row[column.key] ?? "—")}</td>)}<td><div className="actions"><button className="button secondary small" type="button" onClick={() => edit(row)}>Editar</button><button className="button danger small" type="button" onClick={() => remove(row)}>Excluir</button></div></td></tr>)}</tbody></table>{!rows.length && <div className="empty">Nenhum registro cadastrado.</div>}</div>
  </div>;
}
