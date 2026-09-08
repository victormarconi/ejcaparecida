"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Edit2, Trash2, Camera, ZoomIn, Check, Users, FileText } from "lucide-react";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  photoUrl: string | null;
  sortOrder: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export function TeamManager({ initialMembers }: { initialMembers: TeamMember[] }) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [bio, setBio] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [active, setActive] = useState(true);
  const [photoUrl, setPhotoUrl] = useState("");

  // Photo cropper state
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPan, setCropPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Delete modal
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreate() {
    setEditingMember(null);
    setName("");
    setRole("");
    setBio("");
    setSortOrder(String(members.length + 1));
    setActive(true);
    setPhotoUrl("");
    setCropImageSrc(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(member: TeamMember) {
    setEditingMember(member);
    setName(member.name);
    setRole(member.role);
    setBio(member.bio || "");
    setSortOrder(String(member.sortOrder));
    setActive(member.active);
    setPhotoUrl(member.photoUrl || "");
    setCropImageSrc(null);
    setError("");
    setModalOpen(true);
  }

  // Handle file select for photo
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setCropImageSrc(src);
      setCropZoom(1);
      setCropPan({ x: 0, y: 0 });
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageRef.current = img;
        drawCropper(img, 1, { x: 0, y: 0 });
      };
    };
    reader.readAsDataURL(file);
  }

  function drawCropper(img: HTMLImageElement, zoom: number, pan: { x: number; y: number }) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 300;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);

    const scale = Math.max(size / img.width, size / img.height) * zoom;
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (size - w) / 2 + pan.x;
    const y = (size - h) / 2 + pan.y;

    ctx.save();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();
  }

  useEffect(() => {
    if (imageRef.current && cropImageSrc) {
      drawCropper(imageRef.current, cropZoom, cropPan);
    }
  }, [cropZoom, cropPan, cropImageSrc]);

  function handleMouseDown(e: React.MouseEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPan.x, y: e.clientY - cropPan.y });
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return;
    setCropPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }

  function handleMouseUp() {
    setIsDragging(false);
  }

  async function applyCroppedPhoto() {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setUploadingPhoto(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Erro ao processar imagem.");

      const formData = new FormData();
      formData.append("file", blob, "avatar.jpg");
      formData.append("kind", "asset");

      const res = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha no upload da imagem");

      setPhotoUrl(data.url);
      setCropImageSrc(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao aplicar foto");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload = {
        name: name.trim(),
        role: role.trim(),
        bio: bio.trim() || null,
        photoUrl: photoUrl.trim() || null,
        sortOrder: Number(sortOrder),
        active,
      };

      const url = "/api/admin/equipe";
      const method = editingMember ? "PUT" : "POST";
      const body = editingMember
        ? JSON.stringify({ ...payload, id: editingMember.id })
        : JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar integrante");

      if (editingMember) {
        setMembers((prev) =>
          prev.map((m) => (m.id === editingMember.id ? { ...m, ...data.item } : m))
        );
      } else {
        setMembers((prev) => [...prev, data.item]);
      }

      setModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteConfirm() {
    if (!deletingMember) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/equipe", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deletingMember.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");

      setMembers((prev) => prev.filter((m) => m.id !== deletingMember.id));
      setDeletingMember(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir integrante");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* CABEÇALHO PADRÃO PDM1 COM BOTÃO NOVO */}
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
            Equipe Dirigente
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#94a3b8" }}>
            Cadastre nomes, funções, fotos de perfil enquadradas e ordem de exibição.
          </p>
        </div>
        <button
          type="button"
          className="pdm-btn-primary pdm-btn-compact"
          onClick={openCreate}
        >
          <Plus size={16} />
          <span>Novo Integrante</span>
        </button>
      </div>

      {/* TABELA DE MEMBROS DA EQUIPE */}
      {members.length === 0 ? (
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
          <Users size={42} style={{ color: "#64748b", margin: "0 auto 12px" }} />
          <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.1rem" }}>
            Nenhum membro cadastrado
          </h3>
          <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "0.88rem" }}>
            Adicione os coordenadores, tios e jovens dirigentes do EJC.
          </p>
          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={openCreate}
          >
            <Plus size={15} />
            <span>Cadastrar Primeiro Integrante</span>
          </button>
        </div>
      ) : (
        <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
          <table>
            <thead>
              <tr>
                <th>Integrante</th>
                <th>Função / Setor</th>
                <th>Ordem</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {member.photoUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={member.photoUrl}
                          alt={member.name}
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "1px solid rgba(255, 255, 255, 0.15)",
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 700,
                            fontSize: "0.82rem",
                          }}
                        >
                          {member.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <strong style={{ color: "#f8fafc", fontSize: "0.92rem", display: "block" }}>
                          {member.name}
                        </strong>
                        {member.bio && (
                          <small style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                            {member.bio.slice(0, 60)}
                            {member.bio.length > 60 ? "..." : ""}
                          </small>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: "3px 8px",
                        background: "rgba(56, 189, 248, 0.1)",
                        color: "#38bdf8",
                        borderRadius: "6px",
                        fontWeight: 600,
                        fontSize: "0.80rem",
                        border: "1px solid rgba(56, 189, 248, 0.2)",
                      }}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: "#94a3b8", fontSize: "0.84rem" }}>#{member.sortOrder}</span>
                  </td>
                  <td>
                    <span className={`pdm-badge ${member.active ? "active" : "inactive"}`}>
                      {member.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <button
                        type="button"
                        className="table-action-btn edit"
                        onClick={() => openEdit(member)}
                        title="Editar integrante"
                      >
                        <Edit2 size={13} />
                        <span>Editar</span>
                      </button>
                      <button
                        type="button"
                        className="table-action-btn delete"
                        onClick={() => setDeletingMember(member)}
                        title="Excluir integrante"
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

      {/* MODAL PADRÃO PDM1 DE CRIAR/EDITAR INTEGRANTE */}
      <PdmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingMember ? "Editar Integrante" : "Novo Integrante da Equipe"}
        subtitle="Informe o nome, função e adicione a foto com enquadramento perfeito."
        maxWidth="620px"
      >
        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* ÁREA DE FOTO COM RECORTE / ENQUADRAMENTO */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              padding: "14px",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            {photoUrl ? (
              <div style={{ position: "relative" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photoUrl}
                  alt="Foto"
                  style={{
                    width: "74px",
                    height: "74px",
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #38bdf8",
                  }}
                />
              </div>
            ) : (
              <div
                style={{
                  width: "74px",
                  height: "74px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "2px dashed rgba(255, 255, 255, 0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#94a3b8",
                }}
              >
                <Camera size={26} />
              </div>
            )}

            <div style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#f1f5f9" }}>
                Foto de Perfil
              </span>
              <p style={{ margin: "2px 0 8px", fontSize: "0.78rem", color: "#94a3b8" }}>
                Envie uma foto do seu celular/PC para enquadrar no formato redondo.
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <label className="pdm-btn-secondary pdm-btn-small" style={{ cursor: "pointer", margin: 0 }}>
                  <Camera size={13} />
                  <span>Escolher Foto</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                </label>
                {photoUrl && (
                  <button
                    type="button"
                    className="pdm-btn-danger pdm-btn-small"
                    onClick={() => setPhotoUrl("")}
                  >
                    Remover Foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* FERRAMENTA INTERATIVA DE CORTE / ENQUADRAMENTO */}
          {cropImageSrc && (
            <div
              style={{
                padding: "16px",
                borderRadius: "12px",
                background: "#050911",
                border: "1px solid #0284c7",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "0.84rem", fontWeight: 700, color: "#38bdf8" }}>
                Enquadre a Foto (Arraste para posicionar e use o zoom)
              </span>

              <div
                style={{
                  position: "relative",
                  width: "260px",
                  height: "260px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
                  border: "2px solid #38bdf8",
                  cursor: isDragging ? "grabbing" : "grab",
                  touchAction: "none",
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
              </div>

              {/* CONTROLE DE ZOOM */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", maxWidth: "320px" }}>
                <ZoomIn size={16} style={{ color: "#94a3b8" }} />
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(Number(e.target.value))}
                  style={{ flex: 1, accentColor: "#0284c7" }}
                />
                <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>{cropZoom.toFixed(1)}x</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                <button
                  type="button"
                  className="pdm-btn-secondary pdm-btn-small"
                  onClick={() => setCropImageSrc(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="pdm-btn-primary pdm-btn-small"
                  onClick={applyCroppedPhoto}
                  disabled={uploadingPhoto}
                >
                  <Check size={13} />
                  <span>{uploadingPhoto ? "Cortando..." : "Cortar e Usar Esta Foto"}</span>
                </button>
              </div>
            </div>
          )}

          {/* CAMPOS DE TEXTO */}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px" }}>
            <label className="field">
              Nome do Integrante *
              <input
                required
                maxLength={100}
                placeholder="Ex: Maria Eduarda ou Tio Roberto & Tia Lúcia"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <label className="field">
              Função / Setor *
              <input
                required
                maxLength={100}
                placeholder="Ex: Coordenação Geral, Finanças, Espiritualidade"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              Ordem de Exibição
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              />
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "22px" }}>
              <input
                id="memberActive"
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                style={{ width: "18px", height: "18px", accentColor: "var(--brand)" }}
              />
              <label htmlFor="memberActive" style={{ margin: 0, cursor: "pointer", fontSize: "0.86rem", color: "#e2e8f0" }}>
                <strong>Exibir no site público</strong>
              </label>
            </div>
          </div>

          <label className="field">
            Biografia / Mensagem (Opcional)
            <textarea
              rows={2}
              placeholder="Uma breve apresentação pastoral do integrante..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </label>

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
              disabled={busy || uploadingPhoto}
            >
              {busy ? "Salvando..." : editingMember ? "Salvar Alterações" : "Cadastrar Integrante"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <PdmConfirmModal
        open={Boolean(deletingMember)}
        onClose={() => setDeletingMember(null)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Integrante"
        message={`Tem certeza que deseja remover "${deletingMember?.name}" da equipe dirigente?`}
        confirmLabel="Sim, excluir"
        busy={busy}
      />
    </div>
  );
}
