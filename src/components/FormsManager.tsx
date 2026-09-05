/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { FORM_FIELD_TYPES, parseFormFields, type DynamicFormField } from "@/lib/forms";

type Campaign = {
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

type CampaignFormState = {
  title: string;
  description: string;
  bannerUrl: string;
  active: boolean;
  expiresAt: string;
  fields: DynamicFormField[];
};

type Submission = { id: string; createdAt: string; data: Record<string, unknown> };
type ResponseView = { campaign: { id: string; title: string; fields: DynamicFormField[] }; items: Submission[] };

const typeLabels: Record<(typeof FORM_FIELD_TYPES)[number], string> = { text: "Texto", number: "Número", select: "Lista de opções", checkbox: "Caixa de seleção" };
const emptyForm: CampaignFormState = { title: "", description: "", bannerUrl: "", active: true, expiresAt: "", fields: [] };

function inputDate(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function responseValue(value: unknown) {
  if (value === true) return "Sim";
  if (value === false) return "Não";
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

async function responseBody<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as T & { error?: string };
  if (!response.ok) throw new Error(body.error || "Não foi possível concluir a operação.");
  return body;
}

function newField(): DynamicFormField {
  return { id: crypto.randomUUID(), label: "", type: "text", required: false };
}

export function FormsManager({ initialCampaigns }: { initialCampaigns: Campaign[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [form, setForm] = useState<CampaignFormState>(emptyForm);
  const [editing, setEditing] = useState<string | null>(null);
  const [view, setView] = useState<"campaigns" | "responses">("campaigns");
  const [responses, setResponses] = useState<ResponseView | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function clearForm() {
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setForm(emptyForm);
    setEditing(null);
    setBanner(null);
    setBannerPreview(null);
    setError("");
  }

  function chooseBanner(file: File | null) {
    if (bannerPreview?.startsWith("blob:")) URL.revokeObjectURL(bannerPreview);
    setBanner(file);
    setBannerPreview(file ? URL.createObjectURL(file) : form.bannerUrl || null);
  }

  function updateField(index: number, patch: Partial<DynamicFormField>) {
    setForm((current) => ({ ...current, fields: current.fields.map((field, fieldIndex) => fieldIndex === index ? { ...field, ...patch } : field) }));
  }

  function moveField(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.fields.length) return;
    const fields = [...form.fields];
    [fields[index], fields[target]] = [fields[target], fields[index]];
    setForm({ ...form, fields });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      let bannerUrl = form.bannerUrl || null;
      if (banner) {
        const upload = new FormData();
        upload.set("file", banner);
        upload.set("kind", "banner");
        bannerUrl = (await responseBody<{ url: string }>(await fetch("/api/admin/uploads", { method: "POST", body: upload }))).url;
      }
      const payload = { ...form, bannerUrl, description: form.description || null, expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null };
      const body = await responseBody<{ item: Campaign }>(await fetch("/api/admin/formularios", {
        method: editing ? "PUT" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { ...payload, id: editing } : payload),
      }));
      setCampaigns((current) => {
        const normalized = body.item.active ? current.map((item) => ({ ...item, active: false })) : current;
        const next = editing ? normalized.map((item) => item.id === editing ? body.item : item) : [body.item, ...normalized];
        return next.sort((left, right) => Number(right.active) - Number(left.active) || right.createdAt.localeCompare(left.createdAt));
      });
      clearForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível salvar a campanha.");
    } finally {
      setBusy(false);
    }
  }

  function edit(campaign: Campaign) {
    setView("campaigns");
    setEditing(campaign.id);
    setForm({ title: campaign.title, description: campaign.description || "", bannerUrl: campaign.bannerUrl || "", active: campaign.active, expiresAt: inputDate(campaign.expiresAt), fields: parseFormFields(campaign.fieldsJson) });
    setBanner(null);
    setBannerPreview(campaign.bannerUrl);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(campaign: Campaign) {
    if (!confirm(`Excluir “${campaign.title}” e suas ${campaign._count.submissions} resposta(s)?`)) return;
    setBusy(true);
    setError("");
    try {
      await responseBody<{ ok: boolean }>(await fetch("/api/admin/formularios", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: campaign.id }) }));
      setCampaigns((current) => current.filter((item) => item.id !== campaign.id));
      if (editing === campaign.id) clearForm();
      if (responses?.campaign.id === campaign.id) setResponses(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir a campanha.");
    } finally {
      setBusy(false);
    }
  }

  async function openResponses(campaign: Campaign) {
    setBusy(true);
    setError("");
    try {
      const body = await responseBody<ResponseView>(await fetch(`/api/admin/formularios/${campaign.id}/respostas`));
      setResponses(body);
      setView("responses");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível carregar as respostas.");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="module-tabs" role="tablist" aria-label="Gestão de formulários"><button type="button" role="tab" aria-selected={view === "campaigns"} onClick={() => setView("campaigns")}>Campanhas</button><button type="button" role="tab" aria-selected={view === "responses"} disabled={!responses} onClick={() => responses && setView("responses")}>Respostas</button></div>
    {error && <p className="error" role="alert">{error}</p>}
    {view === "campaigns" && <div className="admin-grid forms-admin-grid">
      <form className="card form admin-form campaign-editor" onSubmit={save}>
        <div className="form-heading"><h2>{editing ? "Editar campanha" : "Nova campanha"}</h2>{editing && <button className="button secondary small" type="button" onClick={clearForm}>Cancelar</button>}</div>
        <label className="field">Título<input required maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
        <label className="field">Descrição<textarea rows={3} maxLength={4000} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
        <label className="field">Banner<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => chooseBanner(event.target.files?.[0] || null)} /><small>JPEG, PNG ou WebP · até 5 MB</small></label>
        {bannerPreview && <div className="banner-preview"><img src={bannerPreview} alt="Prévia do banner" /><button className="button secondary small" type="button" onClick={() => { chooseBanner(null); setForm({ ...form, bannerUrl: "" }); }}>Remover</button></div>}
        <div className="form-row"><label className="field field-grow">Validade<input type="datetime-local" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></label><label className="checkbox-field active-campaign"><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /><span>Exibir no topo do site</span></label></div>
        <div className="field-builder-heading"><div><strong>Campos do formulário</strong><small>Sem campos, a campanha funciona somente como banner.</small></div><button className="button secondary small" type="button" onClick={() => setForm({ ...form, fields: [...form.fields, newField()] })}>+ Adicionar campo</button></div>
        <div className="field-builder">{form.fields.map((field, index) => <fieldset key={field.id} className="dynamic-field-card"><legend>Campo {index + 1}</legend><div className="form-row"><label className="field field-grow">Pergunta<input required maxLength={160} value={field.label} onChange={(event) => updateField(index, { label: event.target.value })} /></label><label className="field">Tipo<select value={field.type} onChange={(event) => { const type = event.target.value as DynamicFormField["type"]; updateField(index, { type, options: type === "select" ? field.options || [] : undefined }); }}>{FORM_FIELD_TYPES.map((type) => <option value={type} key={type}>{typeLabels[type]}</option>)}</select></label></div>{field.type === "select" && <label className="field">Opções (uma por linha)<textarea required rows={3} value={(field.options || []).join("\n")} onChange={(event) => updateField(index, { options: event.target.value.split("\n").map((value) => value.trim()).filter(Boolean) })} /></label>}<div className="field-actions"><label className="checkbox-field"><input type="checkbox" checked={Boolean(field.required)} onChange={(event) => updateField(index, { required: event.target.checked })} /><span>Obrigatório</span></label><div className="actions"><button className="button secondary small" type="button" disabled={index === 0} onClick={() => moveField(index, -1)} aria-label="Mover campo para cima">↑</button><button className="button secondary small" type="button" disabled={index === form.fields.length - 1} onClick={() => moveField(index, 1)} aria-label="Mover campo para baixo">↓</button><button className="button danger small" type="button" onClick={() => setForm({ ...form, fields: form.fields.filter((_, fieldIndex) => fieldIndex !== index) })}>Remover</button></div></div></fieldset>)}</div>
        <button className="button" type="submit" disabled={busy}>{busy ? "Salvando…" : editing ? "Salvar alterações" : "Criar campanha"}</button>
      </form>
      <div className="campaign-admin-list">{campaigns.map((campaign) => <article className="card campaign-admin-card" key={campaign.id}>{campaign.bannerUrl && <img src={campaign.bannerUrl} alt="" />}<div><div className="campaign-card-heading"><span className={`badge ${campaign.active ? "positive" : ""}`}>{campaign.active ? "Ativa" : "Inativa"}</span><span className="muted">{campaign._count.submissions} resposta(s)</span></div><h3>{campaign.title}</h3><p>{campaign.description || "Sem descrição."}</p><small>{parseFormFields(campaign.fieldsJson).length} campo(s){campaign.expiresAt ? ` · válida até ${displayDate(campaign.expiresAt)}` : " · sem validade"}</small><div className="actions"><button className="button secondary small" type="button" disabled={busy} onClick={() => edit(campaign)}>Editar</button><button className="button secondary small" type="button" disabled={busy} onClick={() => openResponses(campaign)}>Ver respostas</button><a className="button secondary small" href={`/api/admin/formularios/${campaign.id}/export`}>Exportar CSV</a><button className="button danger small" type="button" disabled={busy} onClick={() => remove(campaign)}>Excluir</button></div></div></article>)}{!campaigns.length && <div className="card empty">Nenhuma campanha cadastrada.</div>}</div>
    </div>}
    {view === "responses" && responses && <section className="responses-panel"><div className="section-heading compact"><div><span className="eyebrow">Respostas</span><h2>{responses.campaign.title}</h2></div><div className="actions"><a className="button" href={`/api/admin/formularios/${responses.campaign.id}/export`}>Exportar CSV / Excel</a><button className="button secondary" type="button" onClick={() => setView("campaigns")}>Voltar</button></div></div><p className="muted">Exibindo até as 200 respostas mais recentes. O CSV contém o histórico completo.</p><div className="card table-card responses-table"><table><thead><tr><th>Enviado em</th>{responses.campaign.fields.map((field) => <th key={field.id}>{field.label}</th>)}</tr></thead><tbody>{responses.items.map((submission) => <tr key={submission.id}><td>{displayDate(submission.createdAt)}</td>{responses.campaign.fields.map((field) => <td key={field.id}>{responseValue(submission.data[field.id])}</td>)}</tr>)}</tbody></table>{!responses.items.length && <div className="empty">Nenhuma resposta recebida.</div>}</div></section>}
  </>;
}
