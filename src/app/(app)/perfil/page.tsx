"use client";

import { useState } from "react";
import Link from "next/link";

export default function ProfilePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "A nova senha precisa ter pelo menos 6 caracteres." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "A confirmação de senha não confere." });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/perfil/senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao atualizar senha.");
      }
      setMessage({ type: "success", text: "Senha alterada com sucesso!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Erro inesperado." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "540px", margin: "0 auto", padding: "10px 0" }}>
      <header className="page-heading">
        <span className="eyebrow">Segurança da Conta</span>
        <h1>Alterar Senha</h1>
        <p>Atualize sua senha de acesso ao sistema do EJC Aparecida.</p>
      </header>

      <div className="card" style={{ padding: "28px", borderRadius: "18px" }}>
        {message && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "0.9rem",
              fontWeight: "600",
              background: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
              color: message.type === "success" ? "#34d399" : "#f87171",
              border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
            }}
          >
            {message.text}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <label className="field">
            Senha Atual
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Digite sua senha atual"
              required
            />
          </label>

          <label className="field">
            Nova Senha
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </label>

          <label className="field">
            Confirmar Nova Senha
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a nova senha"
              required
            />
          </label>

          <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
            <button className="button" type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Nova Senha"}
            </button>
            <Link className="button secondary" href="/admin/financas">
              Voltar para Finanças
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
