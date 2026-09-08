"use client";

import { useMemo, useState } from "react";
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, FileText } from "lucide-react";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";

export type ResourceField = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "number" | "datetime-local" | "select" | "checkbox";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
};

type Row = Record<string, unknown> & { id: string };

function inputValue(value: unknown, type?: string) {
  if (type === "datetime-local" && value) {
    const d = new Date(String(value));
    if (!isNaN(d.getTime())) return d.toISOString().slice(0, 16);
    return "";
  }
  if (type === "checkbox") return Boolean(value);
  return value === null || value === undefined ? "" : String(value);
}

function formatCell(value: unknown, key: string) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") {
    return (
      <span className={`pdm-badge ${value ? "active" : "inactive"}`}>
        {value ? <><CheckCircle2 size={12} /> Sim</> : <><XCircle size={12} /> Não</>}
      </span>
    );
  }
  // If looks like ISO date
  if (typeof value === "string" && value.length >= 19 && value.includes("T") && value.includes("-")) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
  }
  return String(value);
}

export function ResourceManager({
  endpoint,
  fields,
  initialRows,
  columns,
  createLabel = "Novo Registro",
  resourceName = "registro",
}: {
  endpoint: string;
  fields: ResourceField[];
  initialRows: Row[];
  columns: Array<{ key: string; label: string }>;
  createLabel?: string;
  resourceName?: string;
}) {
  const empty = useMemo(
    () => Object.fromEntries(fields.map((f) => [f.key, f.type === "checkbox" ? false : ""])),
    [fields]
  );
  const [rows, setRows] = useState(initialRows);
  const [form, setForm] = useState<Record<string, unknown>>(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingRow, setDeletingRow] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(row: Row) {
    setEditing(row.id);
    setForm(Object.fromEntries(fields.map((f) => [f.key, inputValue(row[f.key], f.type)])));
    setError("");
    setModalOpen(true);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const payload = Object.fromEntries(
      fields.map((f) => {
        const value = form[f.key];
        if (f.type === "number") return [f.key, value === "" ? null : Number(value)];
        if (f.type === "datetime-local") return [f.key, value ? new Date(String(value)).toISOString() : null];
        return [f.key, value === "" ? null : value];
      })
    );

    try {
      const response = await fetch(endpoint, {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { ...payload, id: editing } : payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível salvar");

      setRows((current) =>
        editing ? current.map((row) => (row.id === editing ? body.item : row)) : [body.item, ...current]
      );
      setForm(empty);
      setEditing(null);
      setModalOpen(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingRow) return;
    setBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deletingRow.id }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new Error(body.error || "Não foi possível excluir");
      }
      setRows((current) => current.filter((item) => item.id !== deletingRow.id));
      if (editing === deletingRow.id) {
        setEditing(null);
        setForm(empty);
      }
      setDeletingRow(null);
    } catch (reason) {
      alert(reason instanceof Error ? reason.message : "Falha ao excluir");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* BOTÃO NOVO REGISTRO NO TOPO */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "18px" }}>
        <button
          type="button"
          className="pdm-btn-primary pdm-btn-compact"
          onClick={openCreate}
        >
          <Plus size={16} />
          <span>{createLabel}</span>
        </button>
      </div>

      {/* TABELA PADRÃO PDM1 */}
      {rows.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            background: "var(--surface)",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <FileText size={40} style={{ color: "#64748b", margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.05rem" }}>
            Nenhum {resourceName} encontrado
          </h3>
          <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "0.86rem" }}>
            Clique no botão acima para adicionar o primeiro item.
          </p>
          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={openCreate}
          >
            <Plus size={15} />
            <span>{createLabel}</span>
          </button>
        </div>
      ) : (
        <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
          <table>
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {columns.map((column) => (
                    <td key={column.key}>{formatCell(row[column.key], column.key)}</td>
                  ))}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="table-action-btn edit"
                        onClick={() => openEdit(row)}
                        title="Editar"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        onClick={() => setDeletingRow(row)}
                        title="Excluir"
                      >
                        <Trash2 size={13} />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PADRÃO PDM1 DE CADASTRO/EDIÇÃO */}
      <PdmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Editar ${resourceName}` : createLabel}
        subtitle={`Preencha os campos abaixo para salvar o ${resourceName}.`}
        maxWidth="640px"
      >
        <form onSubmit={save} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
            {fields.map((field) => (
              <label className="field" key={field.key}>
                {field.label} {field.required ? "*" : ""}
                {field.type === "textarea" ? (
                  <textarea
                    rows={3}
                    required={field.required}
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  />
                ) : field.type === "select" ? (
                  <select
                    required={field.required}
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {field.options?.map((option) => (
                      <option value={option.value} key={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "checkbox" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(event) => setForm({ ...form, [field.key]: event.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "var(--brand)" }}
                    />
                    <span style={{ fontSize: "0.84rem", color: "#cbd5e1" }}>Marcar como {field.label.toLowerCase()}</span>
                  </div>
                ) : (
                  <input
                    type={field.type || "text"}
                    required={field.required}
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setForm({ ...form, [field.key]: event.target.value })}
                  />
                )}
              </label>
            ))}
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
            <button
              type="button"
              className="pdm-btn-secondary pdm-btn-compact"
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pdm-btn-primary pdm-btn-compact"
              disabled={busy}
            >
              {busy ? "Salvando..." : editing ? "Salvar Alterações" : "Cadastrar"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      <PdmConfirmModal
        open={Boolean(deletingRow)}
        onClose={() => setDeletingRow(null)}
        onConfirm={handleDeleteConfirm}
        title={`Excluir ${resourceName}`}
        message={`Tem certeza que deseja excluir este ${resourceName}? Esta ação é permanente.`}
        confirmLabel="Sim, excluir"
        busy={busy}
      />
    </div>
  );
}
