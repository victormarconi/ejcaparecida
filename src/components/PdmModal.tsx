"use client";

import { useEffect, useRef } from "react";
import { X, AlertTriangle } from "lucide-react";

export function PdmModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "620px",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && open) {
        onClose();
      }
    }
    if (open) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="pdm-modal-overlay"
      onMouseDown={(e) => {
        mouseDownTargetRef.current = e.target;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownTargetRef.current === e.currentTarget) {
          onClose();
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="pdm-modal-card pdm-modal-panel"
        ref={modalRef}
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pdm-modal-header">
          <div>
            <h3 className="pdm-modal-title">{title}</h3>
            {subtitle && <p className="pdm-modal-subtitle">{subtitle}</p>}
          </div>
          <button
            type="button"
            className="pdm-modal-close"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="pdm-modal-body">{children}</div>
      </div>
    </div>
  );
}

export function PdmConfirmModal({
  open,
  onClose,
  onConfirm,
  title = "Confirmar exclusão",
  message = "Tem certeza que deseja excluir este item? Esta ação não poderá ser desfeita.",
  confirmLabel = "Sim, excluir",
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  busy?: boolean;
}) {
  return (
    <PdmModal open={open} onClose={onClose} title={title} maxWidth="440px">
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            background: "rgba(239, 68, 68, 0.08)",
            padding: "14px",
            borderRadius: "12px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
          }}
        >
          <AlertTriangle size={22} style={{ color: "#ef4444", flexShrink: 0, marginTop: "2px" }} />
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#f87171", lineHeight: 1.4 }}>
            {message}
          </p>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
          }}
        >
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={onClose}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="pdm-btn-danger pdm-btn-compact"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Excluindo..." : confirmLabel}
          </button>
        </div>
      </div>
    </PdmModal>
  );
}
