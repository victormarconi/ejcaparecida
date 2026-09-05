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
  const [data, setData] = useState<Record<string, string | boolean>>({});
  const [status, setStatus] = useState<"idle" | "busy" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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

                {fields.map((field) =>
                  field.type === "checkbox" ? (
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
                  ) : (
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
                  )
                )}

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
