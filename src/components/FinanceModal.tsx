"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

export function FinanceModal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pdm-modal-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="pdm-modal-backdrop" onClick={onClose} />
      <div ref={panelRef} className="pdm-modal-panel">
        <div className="pdm-modal-header">
          <div>
            <h2 className="pdm-modal-title">{title}</h2>
            {subtitle && <p className="pdm-modal-subtitle">{subtitle}</p>}
          </div>
          <button className="pdm-modal-close" type="button" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </div>
        <div className="pdm-modal-body">{children}</div>
      </div>
    </div>
  );
}
