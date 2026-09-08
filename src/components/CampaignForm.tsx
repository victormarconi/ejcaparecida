"use client";

import { useState, useEffect } from "react";
import type { DynamicFormField } from "@/lib/forms";

export function CampaignForm({
  campaignId,
  fields,
  title,
  description,
  buttonText = "✍️ Quero me inscrever",
}: {
  campaignId: string;
  fields: DynamicFormField[];
  title?: string;
  description?: string | null;
  buttonText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Record<string, string | boolean | string[]>>({});
  const [status, setStatus] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  
  async function handleFileUpload(fieldId: string, file: File) {
    setUploadingField(fieldId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/forms/upload", {
        method: "POST",
        body: formData,
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Falha no envio do arquivo.");
      setData((prev) => ({ ...prev, [fieldId]: resData.url }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao anexar arquivo.");
    } finally {
      setUploadingField(null);
    }
  }

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

  return (
    <>
      <div className="campaign-cta-box">
        <button
          type="button"
          className="button primary large campaign-open-btn"
          onClick={() => setOpen(true)}
        >
          {buttonText}
        </button>
        <span className="campaign-cta-hint">Vagas limitadas • Preenchimento rápido</span>
      </div>

      {open && (
        <div
          className="form-modal"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="form-modal-card">
            <div className="form-modal-header">
              <div>
                <span className="eyebrow">Formulário de Inscrição</span>
                <h2>{title || "Ficha de Inscrição"}</h2>
                {description && <p className="form-modal-desc">{description}</p>}
              </div>
              <button
                type="button"
                className="form-modal-close"
                onClick={() => setOpen(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {status === "success" ? (
              <div className="form-success-box">
                <div className="success-icon">🎉</div>
                <h3>Inscrição enviada com sucesso!</h3>
                <p>Sua resposta foi registrada no sistema. Em breve a coordenação entrará em contato!</p>
                <button
                  type="button"
                  className="button primary"
                  onClick={() => {
                    setOpen(false);
                    setStatus("idle");
                  }}
                >
                  Fechar janela
                </button>
              </div>
            ) : (
              <form className="form campaign-form" onSubmit={submit} style={{ marginTop: "12px" }}>
                <div className="honeypot" aria-hidden="true">
                  <label>
                    Não preencha
                    <input name="website" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                {fields.map((field) => {
                  if (field.dependsOn) {
                    const parentVal = data[field.dependsOn.fieldId];
                    const matches = Array.isArray(parentVal)
                      ? parentVal.includes(field.dependsOn.value)
                      : typeof parentVal === "boolean"
                      ? (field.dependsOn.value.toLowerCase() === "sim" ? parentVal === true : parentVal === false)
                      : String(parentVal ?? "").trim().toLowerCase() === field.dependsOn.value.trim().toLowerCase();
                    if (!matches) {
                      return null;
                    }
                  }
                  if (field.type === "checkbox") {
                    return (
                      <label className="checkbox-field" key={field.id}>
                        <input
                          type="checkbox"
                          required={field.required}
                          checked={Boolean(data[field.id])}
                          onChange={(event) =>
                            setData({ ...data, [field.id]: event.target.checked })
                          }
                        />
                        <span>
                          {field.label}
                          {field.required ? " *" : ""}
                        </span>
                      </label>
                    );
                  }

                                    if (field.type === "multiselect") {
                    const options = field.options && field.options.length ? field.options : ["Opção 1", "Opção 2"];
                    const rawVal = data[field.id];
                    const currentSelected: string[] = Array.isArray(rawVal)
                      ? rawVal
                      : typeof rawVal === "string"
                      ? rawVal.split(", ").filter(Boolean)
                      : [];

                    return (
                      <div className="field" key={field.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span>
                          {field.label}
                          {field.required ? " *" : ""}
                          <small style={{ color: "var(--muted)", marginLeft: "6px", fontSize: "0.78rem" }}>
                            (selecione uma ou mais opções)
                          </small>
                        </span>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {options.map((opt) => {
                            const isChecked = currentSelected.includes(opt);
                            return (
                              <label
                                key={opt}
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  padding: "8px 14px",
                                  borderRadius: "10px",
                                  background: isChecked ? "rgba(56, 189, 248, 0.15)" : "rgba(255, 255, 255, 0.04)",
                                  border: `1px solid ${isChecked ? "var(--brand)" : "rgba(255, 255, 255, 0.12)"}`,
                                  cursor: "pointer",
                                  fontSize: "0.88rem",
                                  color: isChecked ? "#ffffff" : "var(--muted)",
                                  transition: "all 0.15s ease",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...currentSelected, opt]
                                      : currentSelected.filter((item) => item !== opt);
                                    setData({ ...data, [field.id]: next });
                                  }}
                                  style={{ accentColor: "var(--brand)" }}
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  if (field.type === "radio") {
                    const options = field.options && field.options.length ? field.options : ["Sim", "Não"];
                    return (
                      <div className="field" key={field.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span>
                          {field.label}
                          {field.required ? " *" : ""}
                        </span>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {options.map((opt) => (
                            <label
                              key={opt}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 16px",
                                borderRadius: "8px",
                                background: data[field.id] === opt ? "rgba(2, 132, 199, 0.25)" : "rgba(255, 255, 255, 0.04)",
                                border: data[field.id] === opt ? "1px solid #0284c7" : "1px solid rgba(255, 255, 255, 0.1)",
                                cursor: "pointer",
                                color: data[field.id] === opt ? "#38bdf8" : "#cbd5e1",
                                fontWeight: 600,
                                fontSize: "0.85rem",
                              }}
                            >
                              <input
                                type="radio"
                                name={field.id}
                                value={opt}
                                checked={data[field.id] === opt}
                                onChange={() => setData({ ...data, [field.id]: opt })}
                                required={field.required}
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  if (field.type === "file") {
                    const fileUrl = String(data[field.id] || "");
                    const isUploading = uploadingField === field.id;

                    return (
                      <div className="field" key={field.id} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span>
                          {field.label}
                          {field.required ? " *" : ""}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <label
                            className="button secondary"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              cursor: isUploading ? "wait" : "pointer",
                              margin: 0,
                              fontSize: "0.84rem",
                            }}
                          >
                            <span>{isUploading ? "Enviando arquivo..." : fileUrl ? "Trocar Arquivo" : "Escolher Foto ou PDF"}</span>
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,application/pdf"
                              style={{ display: "none" }}
                              disabled={isUploading}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(field.id, file);
                              }}
                            />
                          </label>
                          {fileUrl && (
                            <span style={{ fontSize: "0.80rem", color: "#34d399", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              ✓ Arquivo anexado com sucesso!
                            </span>
                          )}
                        </div>
                        {field.required && !fileUrl && (
                          <input type="text" value="" required style={{ display: "none" }} tabIndex={-1} readOnly />
                        )}
                      </div>
                    );
                  }

                  return (
                    <label className="field" key={field.id}>
                      <span>
                        {field.label}
                        {field.required ? " *" : ""}
                      </span>
                      {field.type === "select" ? (
                        <select
                          required={field.required}
                          value={String(data[field.id] || "")}
                          onChange={(event) =>
                            setData({ ...data, [field.id]: event.target.value })
                          }
                        >
                          <option value="">Selecione uma opção</option>
                          {field.options?.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type={field.type}
                          required={field.required}
                          value={String(data[field.id] || "")}
                          onChange={(event) =>
                            setData({ ...data, [field.id]: event.target.value })
                          }
                        />
                      )}
                    </label>
                  );
                })}

                {message && status === "error" && (
                  <p className="form-feedback error">{message}</p>
                )}

                <div className="form-actions" style={{ marginTop: "20px" }}>
                  <button
                    type="submit"
                    className="button primary full-width"
                    disabled={status === "busy"}
                  >
                    {status === "busy" ? "Enviando..." : "Confirmar Inscrição"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
