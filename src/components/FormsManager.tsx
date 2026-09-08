"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Eye, Download, CheckCircle2, XCircle, FileText } from "lucide-react";
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
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);
  const [fields, setFields] = useState<DynamicFormField[]>([
    { id: "nome", label: "Nome Completo", type: "text", required: true },
    { id: "whatsapp", label: "WhatsApp / Telefone", type: "text", required: true },
  ]);

  // Respostas modal
  const [viewResponsesCampaign, setViewResponsesCampaign] = useState<AdminFormCampaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Delete modal
  const [deletingCampaign, setDeletingCampaign] = useState<AdminFormCampaign | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setBannerUrl("");
    setExpiresAt("");
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
      alert(err instanceof Error ? err.message : "Erro ao alterar status");
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
        title,
        description: description.trim() || null,
        bannerUrl: bannerUrl.trim() || null,
        active,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        fields,
      };

      const url = "/api/admin/formularios";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? JSON.stringify({ ...payload, id: editingId }) : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body,
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
    const id = `campo_${Date.now().toString().slice(-4)}`;
    setFields((prev) => [...prev, { id, label: "Novo Campo", type: "text", required: false }]);
  }

  function removeField(index: number) {
    setFields((prev) => prev.filter((_, i) => i !== index));
  }

  function updateField(index: number, patch: Partial<DynamicFormField>) {
    setFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...patch } : f))
    );
  }

  return (
    <div>
      {/* CABEÇALHO PADRÃO PDM1 COM BOTÃO DE CRIAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
            Formulários e Campanhas
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#94a3b8" }}>
            Crie campanhas de inscrição, eventos e controle respostas recebidas.
          </p>
        </div>
        <button
          type="button"
          className="pdm-btn-primary pdm-btn-compact"
          onClick={openCreate}
        >
          <Plus size={16} />
          <span>Novo Formulário</span>
        </button>
      </div>

      {/* TABELA PADRÃO PDM1 */}
      {campaigns.length === 0 ? (
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
          <FileText size={42} style={{ color: "#64748b", margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.1rem" }}>
            Nenhum formulário cadastrado
          </h3>
          <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "0.88rem" }}>
            Clique no botão acima para criar sua primeira campanha ou formulário de inscrição.
          </p>
          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={openCreate}
          >
            <Plus size={15} />
            <span>Criar Formulário Agora</span>
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
                      style={{ cursor: "pointer", border: "none" }}
                      title="Clique para alternar ativação no topo do site"
                    >
                      {camp.active ? (
                        <>
                          <CheckCircle2 size={12} /> Ativo no site
                        </>
                      ) : (
                        <>
                          <XCircle size={12} /> Inativo
                        </>
                      )}
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-action-btn"
                      style={{
                        background: "rgba(147, 51, 234, 0.12)",
                        color: "#c084fc",
                        borderColor: "rgba(147, 51, 234, 0.25)",
                      }}
                      onClick={() => openResponses(camp)}
                    >
                      <Eye size={13} />
                      <span>{camp._count?.submissions ?? 0} respostas</span>
                    </button>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <button
                        type="button"
                        className="table-action-btn edit"
                        onClick={() => openEdit(camp)}
                        title="Editar formulário"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        onClick={() => setDeletingCampaign(camp)}
                        title="Excluir formulário"
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

      {/* MODAL PADRÃO PDM1 DE CRIAR / EDITAR FORMULÁRIO */}
      <PdmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Editar Formulário" : "Novo Formulário"}
        subtitle="Defina o título, datas de início/término e campos a serem preenchidos."
        maxWidth="680px"
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-row" style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
            <label className="field">
              Nome do Formulário / Campanha *
              <input
                required
                maxLength={180}
                placeholder="Ex: Inscrições EJC Aparecida 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="field">
              Descrição / Orientações
              <textarea
                rows={2}
                placeholder="Explique o objetivo do formulário ou informações para quem vai se inscrever..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div className="field">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span>Data de Término / Validade</span>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    className="pdm-btn-secondary pdm-btn-small"
                    style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                    onClick={() => {
                      const now = new Date();
                      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                      const monthStr = String(lastDay.getMonth() + 1).padStart(2, "0");
                      const dayStr = String(lastDay.getDate()).padStart(2, "0");
                      setExpiresAt(`${lastDay.getFullYear()}-${monthStr}-${dayStr}T23:59`);
                    }}
                    title="Definir até o último dia do mês atual"
                  >
                    Fim do Mês
                  </button>
                  <button
                    type="button"
                    className="pdm-btn-secondary pdm-btn-small"
                    style={{ fontSize: "0.68rem", padding: "1px 6px" }}
                    onClick={() => setExpiresAt("")}
                  >
                    Sem Limite
                  </button>
                </div>
              </div>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
              <small style={{ color: "#94a3b8", fontSize: "0.70rem" }}>
                Atenção aos dias do mês (ex: Setembro tem 30 dias).
              </small>
            </div>
            <label className="field">
              URL da Imagem / Banner (Opcional)
              <input
                placeholder="https://..."
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
              />
            </label>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 14px",
              borderRadius: "10px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <input
              id="activeCampaign"
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              style={{ width: "18px", height: "18px", accentColor: "var(--brand)" }}
            />
            <label htmlFor="activeCampaign" style={{ margin: 0, cursor: "pointer", fontSize: "0.86rem", color: "#e2e8f0" }}>
              <strong>Destacar e ativar formulário no topo do site oficial</strong>
            </label>
          </div>

          {/* CAMPOS DINÂMICOS */}
          <div style={{ marginTop: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#cbd5e1" }}>
                Campos do Formulário ({fields.length})
              </span>
              <button
                type="button"
                className="pdm-btn-secondary pdm-btn-small"
                onClick={addField}
              >
                <Plus size={13} />
                <span>Adicionar Campo</span>
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "320px", overflowY: "auto", paddingRight: "4px" }}>
              {fields.map((field, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    padding: "10px 12px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1.2fr 1fr auto auto",
                      gap: "8px",
                      alignItems: "center",
                    }}
                  >
                    <input
                      value={field.label}
                      placeholder="Nome do campo"
                      onChange={(e) => updateField(idx, { label: e.target.value })}
                      style={{ fontSize: "0.82rem", padding: "6px 8px" }}
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
                        updateField(idx, patch);
                      }}
                      style={{ fontSize: "0.82rem", padding: "6px 8px" }}
                    >
                      <option value="text">Texto curto</option>
                      <option value="number">Número</option>
                      <option value="select">Lista de opções (Dropdown)</option>
                      <option value="radio">Sim ou Não (Escolha única)</option>
                      <option value="checkbox">Caixa de marcar</option>
                      <option value="file">Anexo (Foto ou PDF)</option>
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#94a3b8", cursor: "pointer", margin: 0 }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateField(idx, { required: e.target.checked })}
                      />
                      Obrigatório
                    </label>
                    <button
                      type="button"
                      className="pdm-btn-danger pdm-btn-small"
                      onClick={() => removeField(idx)}
                      title="Remover campo"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Configuração de opções para Select e Radio */}
                  {(field.type === "select" || field.type === "radio") && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(56, 189, 248, 0.05)", padding: "6px 10px", borderRadius: "8px", border: "1px solid rgba(56, 189, 248, 0.15)" }}>
                      <span style={{ fontSize: "0.76rem", color: "#38bdf8", whiteSpace: "nowrap", fontWeight: 600 }}>
                        {field.type === "radio" ? "Opções (ex: Sim, Não):" : "Opções da lista (separadas por vírgula):"}
                      </span>
                      <input
                        value={field.options?.join(", ") || ""}
                        placeholder={field.type === "radio" ? "Sim, Não" : "Ex: Círculo Vermelho, Círculo Azul, Círculo Amarelo, Círculo Verde"}
                        onChange={(e) => {
                          const opts = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
                          updateField(idx, { options: opts });
                        }}
                        style={{ fontSize: "0.80rem", padding: "4px 8px", flex: 1 }}
                      />
                    </div>
                  )}

                  {/* Informação sobre campo de anexo */}
                  {field.type === "file" && (
                    <div style={{ fontSize: "0.76rem", color: "#38bdf8", padding: "4px 8px", background: "rgba(56, 189, 248, 0.06)", borderRadius: "6px" }}>
                      📎 Permite anexar <strong>comprovante Pix, foto ou PDF</strong> de até 10 MB.
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
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

      {/* MODAL PADRÃO PDM1 DE VER RESPOSTAS */}
      <PdmModal
        open={Boolean(viewResponsesCampaign)}
        onClose={() => setViewResponsesCampaign(null)}
        title={`Respostas: ${viewResponsesCampaign?.title || ""}`}
        subtitle={`${submissions.length} resposta(s) enviada(s) até o momento.`}
        maxWidth="760px"
      >
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "14px",
            }}
          >
            {viewResponsesCampaign && (
              <a
                href={`/api/admin/formularios/${viewResponsesCampaign.id}/export`}
                className="pdm-btn-secondary pdm-btn-compact"
                target="_blank"
                rel="noreferrer"
                download
              >
                <Download size={14} />
                <span>Baixar Planilha (Excel/CSV)</span>
              </a>
            )}
          </div>

          {loadingSubmissions ? (
            <div style={{ textAlign: "center", padding: "30px", color: "#94a3b8" }}>
              Carregando respostas...
            </div>
          ) : submissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 12px", color: "#94a3b8" }}>
              Nenhuma resposta recebida para este formulário ainda.
            </div>
          ) : (
            <div
              style={{
                maxHeight: "380px",
                overflowY: "auto",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                borderRadius: "10px",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.04)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#94a3b8" }}>Data</th>
                    <th style={{ padding: "10px 12px", textAlign: "left", color: "#94a3b8" }}>Dados Enviados</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.04)" }}>
                      <td style={{ padding: "10px 12px", verticalAlign: "top", whiteSpace: "nowrap", color: "#cbd5e1" }}>
                        {new Date(sub.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 12px", verticalAlign: "top" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          {Object.entries(sub.data).map(([k, v]) => {
                            const strVal = String(v || "");
                            const isFile = strVal.startsWith("/uploads/") || strVal.endsWith(".pdf") || Boolean(strVal.match(/\.(jpg|jpeg|png|webp)$/i));
                            return (
                              <div key={k} style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ color: "#94a3b8", textTransform: "capitalize", minWidth: "120px" }}>{k}: </span>
                                {isFile ? (
                                  <a
                                    href={strVal}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="table-action-btn"
                                    style={{
                                      background: "rgba(56, 189, 248, 0.12)",
                                      color: "#38bdf8",
                                      borderColor: "rgba(56, 189, 248, 0.25)",
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                  >
                                    📎 Ver Anexo ({strVal.endsWith(".pdf") ? "PDF" : "Foto"}) ↗
                                  </a>
                                ) : (
                                  <strong style={{ color: "#f1f5f9" }}>{strVal}</strong>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px" }}>
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

      {/* CONFIRMAÇÃO DE EXCLUSÃO PADRÃO PDM1 */}
      <PdmConfirmModal
        open={Boolean(deletingCampaign)}
        onClose={() => setDeletingCampaign(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Formulário"
        message={`Tem certeza que deseja excluir o formulário "${deletingCampaign?.title}"? Todas as respostas associadas serão apagadas permanentemente.`}
        confirmLabel="Sim, excluir formulário"
        busy={busy}
      />
    </div>
  );
}
