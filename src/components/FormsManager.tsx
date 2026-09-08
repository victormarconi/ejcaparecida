"use client";

import { useState, useRef } from "react";
import { Plus, Edit2, Trash2, Eye, Download, CheckCircle2, XCircle, FileText, Upload, Image as ImageIcon, X } from "lucide-react";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";
import { DynamicFormField } from "@/lib/forms";

export type AdminFormCampaign = {
  id: string;
  title: string;
  description: string | null;
  bannerUrl: string | null;
  fieldsJson: string;
  active: boolean;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  _count: { submissions: number };
};

type Submission = {
  id: string;
  createdAt: string;
  data: Record<string, unknown>;
};

function formatDate(iso?: string | null) {
  if (!iso) return "Sem data limite";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "Data inválida";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseFields(json: string): DynamicFormField[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function FormsManager({ initialCampaigns }: { initialCampaigns: AdminFormCampaign[] }) {
  const [campaigns, setCampaigns] = useState<AdminFormCampaign[]>(initialCampaigns);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerUploading, setBannerUploading] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);
  const [fields, setFields] = useState<DynamicFormField[]>([
    { id: "nome", label: "Nome Completo", type: "text", required: true },
    { id: "whatsapp", label: "WhatsApp / Telefone", type: "text", required: true },
  ]);

  // View submissions modal state
  const [viewResponsesCampaign, setViewResponsesCampaign] = useState<AdminFormCampaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Delete modal state
  const [deletingCampaign, setDeletingCampaign] = useState<AdminFormCampaign | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const bannerFileInputRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setBannerUrl("");
    setExpiresAt(""); // Default: no limit
    setActive(true);
    setFields([
      { id: "nome", label: "Nome Completo", type: "text", required: true },
      { id: "whatsapp", label: "WhatsApp / Telefone", type: "text", required: true },
    ]);
    setError("");
    setModalOpen(true);
  }

  function openEdit(campaign: AdminFormCampaign) {
    setEditingId(campaign.id);
    setTitle(campaign.title);
    setDescription(campaign.description || "");
    setBannerUrl(campaign.bannerUrl || "");
    setExpiresAt(campaign.expiresAt ? new Date(campaign.expiresAt).toISOString().slice(0, 16) : "");
    setActive(campaign.active);
    setFields(parseFields(campaign.fieldsJson));
    setError("");
    setModalOpen(true);
  }

  async function handleBannerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setBannerUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("kind", "banner");

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao fazer upload do banner");

      setBannerUrl(data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao enviar imagem do banner");
    } finally {
      setBannerUploading(false);
      if (bannerFileInputRef.current) bannerFileInputRef.current.value = "";
    }
  }

  async function openResponses(campaign: AdminFormCampaign) {
    setViewResponsesCampaign(campaign);
    setLoadingSubmissions(true);
    try {
      const res = await fetch(`/api/admin/formularios/${campaign.id}/respostas`);
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data.items || []);
      } else {
        setSubmissions([]);
      }
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  }

  async function handleToggleActive(campaign: AdminFormCampaign) {
    setBusy(true);
    try {
      const newActive = !campaign.active;
      const res = await fetch("/api/admin/formularios", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: campaign.id,
          title: campaign.title,
          description: campaign.description,
          bannerUrl: campaign.bannerUrl,
          active: newActive,
          expiresAt: campaign.expiresAt,
          fields: parseFields(campaign.fieldsJson),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao atualizar status");

      setCampaigns((prev) =>
        prev.map((c) => {
          if (c.id === campaign.id) return { ...c, active: newActive };
          if (newActive) return { ...c, active: false };
          return c;
        })
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao alternar status");
    } finally {
      setBusy(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        id: editingId || undefined,
        title: title.trim(),
        description: description.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        active,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        fields,
      };

      const res = await fetch("/api/admin/formularios", {
        method: editingId ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar formulário");

      if (editingId) {
        setCampaigns((prev) =>
          prev.map((c) => {
            if (c.id === editingId) return { ...c, ...data.item };
            if (data.item.active) return { ...c, active: false };
            return c;
          })
        );
      } else {
        setCampaigns((prev) => [
          data.item,
          ...prev.map((c) => (data.item.active ? { ...c, active: false } : c)),
        ]);
      }

      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingCampaign) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/formularios", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deletingCampaign.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");

      setCampaigns((prev) => prev.filter((c) => c.id !== deletingCampaign.id));
      setDeletingCampaign(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha ao excluir formulário");
    } finally {
      setBusy(false);
    }
  }

  function addField() {
    const id = `campo_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setFields((prev) => [
      ...prev,
      { id, label: `Novo Campo ${prev.length + 1}`, type: "text", required: false },
    ]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, patch: Partial<DynamicFormField>) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...patch } : f))
    );
  }

  return (
    <div>
      {/* BARRA SUPERIOR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 800, margin: 0, color: "var(--text)" }}>
            Formulários & Campanhas
          </h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
            Gerencie formulários de inscrição para retiros, pedidos e coletas paroquiais.
          </p>
        </div>

        <button
          type="button"
          className="pdm-btn-primary pdm-btn-compact"
          onClick={openCreate}
        >
          <Plus size={15} />
          <span>Novo Formulário</span>
        </button>
      </div>

      {/* LISTAGEM DE FORMULÁRIOS */}
      {campaigns.length === 0 ? (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "48px 24px",
            color: "var(--muted)",
            borderRadius: "16px",
          }}
        >
          <FileText size={40} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
          <h3 style={{ fontSize: "1.1rem", margin: "0 0 6px", color: "var(--text)" }}>
            Nenhum formulário cadastrado
          </h3>
          <p style={{ fontSize: "0.88rem", maxWidth: "420px", margin: "0 auto 18px" }}>
            Crie formulários para inscrições de retiros, pedidos de oração ou enquetes da paróquia.
          </p>
          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={openCreate}
          >
            <Plus size={14} />
            <span>Criar Primeiro Formulário</span>
          </button>
        </div>
      ) : (
        <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
          <table>
            <thead>
              <tr>
                <th>Formulário</th>
                <th>Período</th>
                <th>Status</th>
                <th>Respostas</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((camp) => (
                <tr key={camp.id}>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                      <strong style={{ color: "#f8fafc", fontSize: "0.92rem" }}>
                        {camp.title}
                      </strong>
                      {camp.description && (
                        <small style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                          {camp.description.slice(0, 75)}
                          {camp.description.length > 75 ? "..." : ""}
                        </small>
                      )}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Início:</span>{" "}
                        {new Date(camp.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Término:</span>{" "}
                        {formatDate(camp.expiresAt)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(camp)}
                      className={`pdm-badge ${camp.active ? "active" : "inactive"}`}
                      title={camp.active ? "Clique para desativar" : "Clique para ativar"}
                      style={{ cursor: "pointer", border: "none" }}
                    >
                      {camp.active ? (
                        <>
                          <CheckCircle2 size={12} />
                          <span>Ativo no site</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={12} />
                          <span>Desativado</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-action-btn"
                      onClick={() => openResponses(camp)}
                      style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}
                      title="Ver respostas dos participantes"
                    >
                      <Eye size={13} />
                      <span>{camp._count?.submissions || 0} respostas</span>
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <a
                        href={`/api/admin/formularios/${camp.id}/export`}
                        className="table-action-btn"
                        title="Exportar respostas para CSV/Excel"
                        download
                      >
                        <Download size={14} />
                      </a>
                      <button
                        type="button"
                        className="table-action-btn edit"
                        onClick={() => openEdit(camp)}
                        title="Editar formulário"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        onClick={() => setDeletingCampaign(camp)}
                        title="Excluir formulário"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL PADRÃO PDM1 DE CRIAR / EDITAR FORMULÁRIO */}
      <PdmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Formulário" : "Novo Formulário"}
        subtitle="Defina o título, validade, banner e perguntas a serem preenchidas."
        maxWidth="720px"
      >
        <form
          onSubmit={handleSave}
          onKeyDown={(e) => {
            // Prevent Enter key in inputs from accidentally submitting/closing the modal
            if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
            }
          }}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {/* TÍTULO E DESCRIÇÃO */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <label className="field">
              <span>Nome do Formulário / Campanha *</span>
              <input
                required
                maxLength={180}
                placeholder="Ex: Inscrições EJC Aparecida 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Descrição / Orientações</span>
              <textarea
                rows={2}
                placeholder="Explique o objetivo do formulário ou orientações para quem vai se inscrever..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          {/* VALIDADE E BANNER ALINHADOS */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px", alignItems: "start" }}>
            {/* DATA DE TÉRMINO */}
            <div className="field" style={{ margin: 0 }}>
              <span style={{ display: "block", marginBottom: "6px", fontSize: "0.84rem", fontWeight: 600, color: "#cbd5e1" }}>
                Data de Término / Validade
              </span>
              <div style={{ display: "flex", gap: "6px", alignItems: "center", height: "40px" }}>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  style={{ flex: 1, height: "40px", boxSizing: "border-box" }}
                />
                {expiresAt && (
                  <button
                    type="button"
                    onClick={() => setExpiresAt("")}
                    className="pdm-btn-secondary"
                    style={{ height: "40px", padding: "0 12px", color: "#f87171", display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                    title="Remover data limite"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* UPLOAD DE BANNER */}
            <div className="field" style={{ margin: 0 }}>
              <span style={{ display: "block", marginBottom: "6px", fontSize: "0.84rem", fontWeight: 600, color: "#cbd5e1" }}>
                Imagem do Banner (Opcional)
              </span>
              <input
                ref={bannerFileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: "none" }}
                onChange={handleBannerUpload}
              />

              <div style={{ height: "40px" }}>
                {bannerUrl ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "0 10px",
                      height: "40px",
                      borderRadius: "8px",
                      background: "#090e17",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      style={{ width: "42px", height: "26px", objectFit: "cover", borderRadius: "4px" }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "0.78rem", color: "#e2e8f0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        Banner anexado
                      </div>
                    </div>
                    <button
                      type="button"
                      className="pdm-btn-danger pdm-btn-small"
                      onClick={() => setBannerUrl("")}
                      title="Remover banner"
                      style={{ padding: "3px 6px" }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="pdm-btn-secondary"
                    disabled={bannerUploading}
                    onClick={() => bannerFileInputRef.current?.click()}
                    style={{
                      width: "100%",
                      height: "40px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      background: "#090e17",
                      border: "1px dashed rgba(255, 255, 255, 0.2)",
                      borderRadius: "8px",
                      boxSizing: "border-box",
                      fontSize: "0.82rem",
                    }}
                  >
                    <Upload size={14} />
                    <span>{bannerUploading ? "Enviando imagem..." : "Upload do Banner (JPG/PNG)"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* STATUS DO FORMULÁRIO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "#090e17",
              border: "1px solid rgba(255, 255, 255, 0.10)",
            }}
          >
            <label htmlFor="activeCampaign" style={{ margin: 0, cursor: "pointer", fontSize: "0.86rem", color: "#f8fafc", fontWeight: 600 }}>
              Status do Formulário
            </label>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", cursor: "pointer", margin: 0, fontSize: "0.84rem", color: active ? "#38bdf8" : "#94a3b8" }}>
              <input
                id="activeCampaign"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--brand)", cursor: "pointer" }}
              />
              <span>{active ? "Ativo no site oficial" : "Desativado / Rascunho"}</span>
            </label>
          </div>

          {/* CAMPOS DINÂMICOS */}
          <div style={{ marginTop: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <span style={{ fontSize: "0.92rem", fontWeight: 700, color: "#f1f5f9" }}>
                Perguntas e Campos ({fields.length})
              </span>
              <button
                type="button"
                className="pdm-btn-secondary pdm-btn-small"
                onClick={addField}
              >
                <Plus size={13} />
                <span>Adicionar Pergunta</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "360px", overflowY: "auto", paddingRight: "4px" }}>
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    background: "#0c1322",
                    padding: "14px 16px",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "38px 1.4fr 1.1fr auto 38px",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        height: "38px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        color: "#38bdf8",
                        background: "rgba(56, 189, 248, 0.12)",
                        border: "1px solid rgba(56, 189, 248, 0.25)",
                        borderRadius: "8px",
                        boxSizing: "border-box",
                      }}
                    >
                      #{idx + 1}
                    </span>

                    <input
                      value={field.label}
                      placeholder="Nome da pergunta (ex: Nome Completo)"
                      onChange={(e) => updateField(field.id, { label: e.target.value })}
                      style={{
                        height: "38px",
                        fontSize: "0.85rem",
                        padding: "0 12px",
                        background: "#060910",
                        border: "1px solid rgba(255, 255, 255, 0.14)",
                        borderRadius: "8px",
                        color: "#ffffff",
                        boxSizing: "border-box",
                      }}
                    />

                    <select
                      value={field.type}
                      onChange={(e) => {
                        const t = e.target.value as DynamicFormField["type"];
                        const patch: Partial<DynamicFormField> = { type: t };
                        if (t === "radio" && (!field.options || !field.options.length)) {
                          patch.options = ["Sim", "Não"];
                        } else if (t === "select" && (!field.options || !field.options.length)) {
                          patch.options = ["Opção 1", "Opção 2"];
                        }
                        updateField(field.id, patch);
                      }}
                      style={{
                        height: "38px",
                        fontSize: "0.84rem",
                        padding: "0 10px",
                        background: "#060910",
                        border: "1px solid rgba(56, 189, 248, 0.3)",
                        borderRadius: "8px",
                        color: "#38bdf8",
                        fontWeight: 600,
                        boxSizing: "border-box",
                      }}
                    >
                      <option value="text">Texto curto</option>
                      <option value="number">Número</option>
                      <option value="select">Lista de opções (Dropdown)</option>
                      <option value="radio">Sim ou Não (Escolha única)</option>
                      <option value="checkbox">Caixa de marcar</option>
                      <option value="file">Anexo (Foto ou PDF)</option>
                    </select>

                    <label
                      style={{
                        height: "38px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.78rem",
                        color: "#cbd5e1",
                        cursor: "pointer",
                        margin: 0,
                        whiteSpace: "nowrap",
                        padding: "0 10px",
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "8px",
                        boxSizing: "border-box",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(field.id, { required: e.target.checked })}
                        style={{ accentColor: "var(--brand)", cursor: "pointer" }}
                      />
                      <span>Obrigatório</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      className="pdm-btn-danger pdm-btn-small"
                      style={{
                        height: "38px",
                        width: "38px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                        boxSizing: "border-box",
                      }}
                      title="Excluir campo"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* CONFIGURADOR DE OPÇÕES PARA DROPDOWN OU RADIO */}
                  {(field.type === "select" || field.type === "radio") && (
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.35)",
                        border: "1px dashed rgba(56, 189, 248, 0.25)",
                        borderRadius: "8px",
                        padding: "10px 12px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "0.76rem", color: "#38bdf8", fontWeight: 700 }}>
                          Opções da lista (digite separadas por vírgula):
                        </span>
                        {field.type === "radio" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              type="button"
                              onClick={() => updateField(field.id, { options: ["Sim", "Não"] })}
                              className="pdm-btn-secondary pdm-btn-small"
                              style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                            >
                              Sim / Não
                            </button>
                          </div>
                        )}
                      </div>

                      <input
                        placeholder="Ex: Círculo Vermelho, Círculo Azul, Círculo Amarelo, Círculo Verde"
                        value={field.options?.join(", ") || ""}
                        onChange={(e) => {
                          const opts = e.target.value
                            .split(",")
                            .map((o) => o.trim())
                            .filter(Boolean);
                          updateField(field.id, { options: opts });
                        }}
                        style={{
                          fontSize: "0.82rem",
                          padding: "6px 10px",
                          background: "#060910",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          borderRadius: "6px",
                          color: "#ffffff",
                        }}
                      />

                      {field.options && field.options.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "2px" }}>
                          {field.options.map((opt, i) => (
                            <span
                              key={i}
                              style={{
                                fontSize: "0.72rem",
                                background: "rgba(56, 189, 248, 0.15)",
                                border: "1px solid rgba(56, 189, 248, 0.3)",
                                color: "#38bdf8",
                                padding: "2px 8px",
                                borderRadius: "12px",
                              }}
                            >
                              {opt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {field.type === "file" && (
                    <div
                      style={{
                        background: "rgba(0, 0, 0, 0.25)",
                        border: "1px dashed rgba(255, 255, 255, 0.12)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                      }}
                    >
                      📎 Permite envio de fotos (JPEG, PNG) ou documentos em PDF (ideal para comprovante PIX).
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="error" style={{ margin: 0, fontSize: "0.85rem", color: "#f87171" }}>{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "10px" }}>
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
              {busy ? "Salvando..." : editingId ? "Salvar Alterações" : "Criar Formulário"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* MODAL DE VER RESPOSTAS */}
      <PdmModal
        open={Boolean(viewResponsesCampaign)}
        onClose={() => setViewResponsesCampaign(null)}
        title={`Respostas: ${viewResponsesCampaign?.title || ""}`}
        subtitle={`Total de ${submissions.length} inscrições recebidas.`}
        maxWidth="840px"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
              {submissions.length === 0 ? "Nenhum participante respondeu ainda." : "Listagem de inscrições recebidas:"}
            </span>
            {submissions.length > 0 && viewResponsesCampaign && (
              <a
                href={`/api/admin/formularios/${viewResponsesCampaign.id}/export`}
                className="pdm-btn-secondary pdm-btn-small"
                download
              >
                <Download size={13} />
                <span>Baixar Planilha CSV</span>
              </a>
            )}
          </div>

          {loadingSubmissions ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
              Carregando respostas...
            </div>
          ) : submissions.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "36px 16px",
                background: "rgba(255, 255, 255, 0.02)",
                borderRadius: "12px",
                color: "var(--muted)",
                fontSize: "0.88rem",
              }}
            >
              Ainda não há respostas registradas para este formulário.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "420px", overflowY: "auto" }}>
              {submissions.map((sub, i) => (
                <div
                  key={sub.id}
                  style={{
                    background: "#0c1322",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "12px",
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ fontSize: "0.88rem", color: "#38bdf8" }}>
                      Inscrição #{submissions.length - i}
                    </strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                      {new Date(sub.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "8px 16px" }}>
                    {Object.entries(sub.data || {}).map(([k, v]) => (
                      <div key={k} style={{ fontSize: "0.82rem" }}>
                        <span style={{ color: "#94a3b8", display: "block", fontSize: "0.74rem" }}>{k}:</span>
                        <strong style={{ color: "#f8fafc" }}>
                          {typeof v === "boolean" ? (
                            v ? "Sim" : "Não"
                          ) : typeof v === "string" && (v.startsWith("/uploads/forms/") || v.startsWith("http")) ? (
                            <a
                              href={v}
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#38bdf8", textDecoration: "underline", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              📎 Ver Anexo (PDF/Foto) ↗
                            </a>
                          ) : (
                            String(v ?? "-")
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              type="button"
              className="pdm-btn-secondary pdm-btn-compact"
              onClick={() => setViewResponsesCampaign(null)}
            >
              Fechar
            </button>
          </div>
        </div>
      </PdmModal>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <PdmConfirmModal
        open={Boolean(deletingCampaign)}
        onClose={() => setDeletingCampaign(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Formulário"
        message={`Tem certeza que deseja excluir o formulário "${deletingCampaign?.title}"? Todas as respostas e anexos serão apagados permanentemente.`}
        confirmLabel="Sim, excluir formulário"
        busy={busy}
      />
    </div>
  );
}
