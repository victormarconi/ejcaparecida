"use client";

import { useState } from "react";
import type { DynamicFormField } from "@/lib/forms";

export function CampaignForm({ campaignId, fields }: { campaignId: string; fields: DynamicFormField[] }) {
  const [data, setData] = useState<Record<string, string | boolean>>({});
  const [status, setStatus] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("busy");
    setMessage("");
    try {
      const form = new FormData(event.currentTarget);
      const response = await fetch(`/api/forms/${campaignId}/submit`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data, website: form.get("website") }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Não foi possível enviar sua resposta.");
      setData({});
      setStatus("success");
      setMessage("Resposta enviada. Obrigado!");
    } catch (reason) {
      setStatus("error");
      setMessage(reason instanceof Error ? reason.message : "Não foi possível enviar sua resposta.");
    }
  }

  if (!fields.length) return null;
  return <form className="form campaign-form" onSubmit={submit}>
    <div className="honeypot" aria-hidden="true"><label>Não preencha<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    {fields.map((field) => field.type === "checkbox" ? <label className="checkbox-field" key={field.id}>
      <input type="checkbox" required={field.required} checked={Boolean(data[field.id])} onChange={(event) => setData({ ...data, [field.id]: event.target.checked })} />
      <span>{field.label}{field.required ? " *" : ""}</span>
    </label> : <label className="field" key={field.id}>{field.label}{field.required ? " *" : ""}
      {field.type === "select" ? <select required={field.required} value={String(data[field.id] ?? "")} onChange={(event) => setData({ ...data, [field.id]: event.target.value })}>
        <option value="">Selecione</option>{field.options?.map((option) => <option value={option} key={option}>{option}</option>)}
      </select> : <input type={field.type} required={field.required} value={String(data[field.id] ?? "")} onChange={(event) => setData({ ...data, [field.id]: event.target.value })} />}
    </label>)}
    {message && <p className={status === "error" ? "error" : "success-message"} role="status">{message}</p>}
    <button className="button" type="submit" disabled={status === "busy"}>{status === "busy" ? "Enviando…" : "Enviar resposta"}</button>
  </form>;
}

