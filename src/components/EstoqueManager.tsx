"use client";

import { useState } from "react";
import { Plus, Edit2, Trash2, Package, ArrowUpRight, CheckCircle2, RotateCcw, FileText } from "lucide-react";
import { PdmModal, PdmConfirmModal } from "@/components/PdmModal";

export type InventoryItem = {
  id: string;
  name: string;
  notes: string | null;
  totalQuantity: number;
  availableQuantity: number;
  condition: string | null;
  photoUrl: string | null;
  active: boolean;
  rentals?: Array<{ quantity: number }>;
};

export type Rental = {
  id: string;
  inventoryItemId: string | null;
  itemName: string;
  quantity: number;
  lenderName: string;
  takenBy: string;
  borrowerPhone: string | null;
  rentedAt: string;
  dueAt: string;
  description: string | null;
  conditionNote: string | null;
  initialConditionPhoto: string | null;
  conditionCaption: string | null;
  status: string;
  returnedAt: string | null;
};

const conditions: Record<string, string> = {
  GOOD: "Bom",
  FAIR: "Regular",
  MAINTENANCE: "Em manutenção",
  UNUSABLE: "Inutilizável",
};

export function EstoqueManager({
  initialItems,
  initialRentals = [],
}: {
  initialItems: InventoryItem[];
  initialRentals?: Rental[];
}) {
  const [tab, setTab] = useState<"items" | "rentals">("items");
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [rentals, setRentals] = useState<Rental[]>(initialRentals);

  // Item Modal State
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [itemQuantity, setItemQuantity] = useState("1");
  const [itemCondition, setItemCondition] = useState("GOOD");
  const [itemPhotoUrl, setItemPhotoUrl] = useState("");

  // Rental Modal State
  const [rentalModalOpen, setRentalModalOpen] = useState(false);
  const [rentalItemId, setRentalItemId] = useState("");
  const [rentalQty, setRentalQty] = useState("1");
  const [rentalLender, setRentalLender] = useState("");
  const [rentalTakenBy, setRentalTakenBy] = useState("");
  const [rentalPhone, setRentalPhone] = useState("");
  const [rentalDueAt, setRentalDueAt] = useState("");
  const [rentalDesc, setRentalDesc] = useState("");

  // Delete modal
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [deletingRental, setDeletingRental] = useState<Rental | null>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openCreateItem() {
    setEditingItemId(null);
    setItemName("");
    setItemNotes("");
    setItemQuantity("1");
    setItemCondition("GOOD");
    setItemPhotoUrl("");
    setError("");
    setItemModalOpen(true);
  }

  function openEditItem(item: InventoryItem) {
    setEditingItemId(item.id);
    setItemName(item.name);
    setItemNotes(item.notes || "");
    setItemQuantity(String(item.totalQuantity));
    setItemCondition(item.condition || 'GOOD');
    setItemPhotoUrl(item.photoUrl || "");
    setError("");
    setItemModalOpen(true);
  }

  function openLendItem(item?: InventoryItem) {
    setRentalItemId(item?.id || (items[0]?.id ?? ""));
    setRentalQty("1");
    setRentalLender("");
    setRentalTakenBy("");
    setRentalPhone("");
    // Default dueAt to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setRentalDueAt(tomorrow.toISOString().slice(0, 16));
    setRentalDesc("");
    setError("");
    setRentalModalOpen(true);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        name: itemName.trim(),
        description: itemNotes.trim() || null,
        quantity: Number(itemQuantity),
        condition: itemCondition,
        photoUrl: itemPhotoUrl.trim() || null,
        active: true,
      };

      const url = "/api/admin/patrimonio/itens";
      const method = editingItemId ? "PUT" : "POST";
      const body = editingItemId ? JSON.stringify({ ...payload, id: editingItemId }) : JSON.stringify(payload);

      const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar item");

      if (editingItemId) {
        setItems((prev) => prev.map((i) => (i.id === editingItemId ? { ...i, ...data.item } : i)));
      } else {
        setItems((prev) => [data.item, ...prev]);
      }
      setItemModalOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao salvar");
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteItem() {
    if (!deletingItem) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/patrimonio/itens", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: deletingItem.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao excluir");

      setItems((prev) => prev.filter((i) => i.id !== deletingItem.id));
      setDeletingItem(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveRental(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        inventoryItemId: rentalItemId,
        quantity: Number(rentalQty),
        lenderName: rentalLender.trim(),
        takenBy: rentalTakenBy.trim(),
        borrowerPhone: rentalPhone.trim() || null,
        rentedAt: new Date().toISOString(),
        dueAt: new Date(rentalDueAt).toISOString(),
        description: rentalDesc.trim() || null,
      };

      const res = await fetch("/api/admin/aluguel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar empréstimo");

      setRentals((prev) => [data.rental, ...prev]);
      // Update item borrowed count in memory
      setItems((prev) =>
        prev.map((i) =>
          i.id === rentalItemId
            ? { ...i, rentals: [...(i.rentals || []), { quantity: Number(rentalQty) }] }
            : i
        )
      );
      setRentalModalOpen(false);
      setTab("rentals");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Falha ao registrar empréstimo");
    } finally {
      setBusy(false);
    }
  }

  async function handleReturnRental(rental: Rental) {
    if (!confirm(`Confirmar devolução de ${rental.quantity}x "${rental.itemName}"?`)) return;
    setBusy(true);
    try {
      const res = await fetch("/api/admin/aluguel", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: rental.id, action: "RETURN" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar devolução");

      setRentals((prev) =>
        prev.map((r) => (r.id === rental.id ? { ...r, status: "RETURNED", returnedAt: new Date().toISOString() } : r))
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Falha na devolução");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* TOPO COM TÍTULO E BOTÕES COMPACTOS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "18px",
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, color: "#fff" }}>
            Estoque da Paróquia
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.86rem", color: "#94a3b8" }}>
            Controle unificado de itens materiais, quantidades e saídas/empréstimos.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            className="pdm-btn-secondary pdm-btn-compact"
            onClick={() => openLendItem()}
          >
            <ArrowUpRight size={15} />
            <span>Novo Empréstimo</span>
          </button>
          <button
            type="button"
            className="pdm-btn-primary pdm-btn-compact"
            onClick={openCreateItem}
          >
            <Plus size={16} />
            <span>Novo Item no Estoque</span>
          </button>
        </div>
      </div>

      {/* ABAS COMPACTAS PADRÃO PDM1 */}
      <div className="module-tabs" role="tablist" style={{ margin: "0 0 16px 0" }}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "items"}
          onClick={() => setTab("items")}
        >
          Itens em Estoque ({items.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "rentals"}
          onClick={() => setTab("rentals")}
        >
          Empréstimos / Saídas ({rentals.length})
        </button>
      </div>

      {/* TABELA DE ITENS */}
      {tab === "items" && (
        items.length === 0 ? (
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
            <Package size={42} style={{ color: "#64748b", margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.1rem" }}>
              Nenhum item cadastrado no estoque
            </h3>
            <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "0.88rem" }}>
              Cadastre instrumentos, toalhas, cabos, velas, som e materiais do EJC.
            </p>
            <button
              type="button"
              className="pdm-btn-primary pdm-btn-compact"
              onClick={openCreateItem}
            >
              <Plus size={15} />
              <span>Cadastrar Primeiro Item</span>
            </button>
          </div>
        ) : (
          <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantidade</th>
                  <th>Disponível</th>
                  <th>Condição</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const borrowedCount = item.rentals?.reduce((sum, r) => sum + r.quantity, 0) || 0;
                  const available = Math.max(0, item.totalQuantity - borrowedCount);

                  return (
                    <tr key={item.id}>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                          <strong style={{ color: "#f8fafc", fontSize: "0.92rem" }}>
                            {item.name}
                          </strong>
                          {item.notes && (
                            <small style={{ color: "#94a3b8", fontSize: "0.78rem" }}>
                              {item.notes}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#cbd5e1" }}>{item.totalQuantity} un</strong>
                      </td>
                      <td>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            color: available > 0 ? "#34d399" : "#f87171",
                            fontWeight: 700,
                            fontSize: "0.85rem",
                          }}
                        >
                          {available} un
                          {borrowedCount > 0 && (
                            <small style={{ color: "#94a3b8", fontWeight: 400 }}>
                              ({borrowedCount} emprestado{borrowedCount > 1 ? "s" : ""})
                            </small>
                          )}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`pdm-badge ${
                            (item.condition || "GOOD") === "GOOD"
                              ? "active"
                              : "inactive"
                          }`}
                        >
                          {conditions[item.condition || "GOOD"] || item.condition || "Bom"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="table-action-btn"
                            style={{
                              background: "rgba(56, 189, 248, 0.1)",
                              color: "#38bdf8",
                              borderColor: "rgba(56, 189, 248, 0.2)",
                            }}
                            onClick={() => openLendItem(item)}
                            title="Emprestar este item"
                          >
                            <ArrowUpRight size={13} />
                            <span>Emprestar</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-btn edit"
                            onClick={() => openEditItem(item)}
                            title="Editar item"
                          >
                            <Edit2 size={13} />
                            <span>Editar</span>
                          </button>
                          <button
                            type="button"
                            className="table-action-btn delete"
                            onClick={() => setDeletingItem(item)}
                            title="Excluir item"
                          >
                            <Trash2 size={13} />
                            <span>Excluir</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* TABELA DE EMPRÉSTIMOS */}
      {tab === "rentals" && (
        rentals.length === 0 ? (
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
            <RotateCcw size={40} style={{ color: "#64748b", margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.05rem" }}>
              Nenhum empréstimo registrado
            </h3>
            <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "0.86rem" }}>
              Quando alguém pegar algum item emprestado, registre a saída para manter o controle.
            </p>
            <button
              type="button"
              className="pdm-btn-primary pdm-btn-compact"
              onClick={() => openLendItem()}
            >
              <Plus size={15} />
              <span>Registrar Empréstimo</span>
            </button>
          </div>
        ) : (
          <div className="card table-card compact-table" style={{ borderRadius: "14px" }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quem Retirou</th>
                  <th>Datas</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => {
                  const isBorrowed = rental.status === "BORROWED";
                  return (
                    <tr key={rental.id}>
                      <td>
                        <strong style={{ color: "#f8fafc", fontSize: "0.92rem" }}>
                          {rental.quantity}x {rental.itemName}
                        </strong>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.84rem", color: "#cbd5e1" }}>
                          <div>{rental.takenBy}</div>
                          {rental.borrowerPhone && (
                            <small style={{ color: "#94a3b8" }}>{rental.borrowerPhone}</small>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.78rem", color: "#cbd5e1" }}>
                          <div>
                            <span style={{ color: "#64748b" }}>Retirado:</span>{" "}
                            {new Date(rental.rentedAt).toLocaleDateString("pt-BR")}
                          </div>
                          <div>
                            <span style={{ color: "#64748b" }}>Devolução:</span>{" "}
                            {new Date(rental.dueAt).toLocaleDateString("pt-BR")}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`pdm-badge ${isBorrowed ? "inactive" : "active"}`}>
                          {isBorrowed ? "Emprestado" : "Devolvido"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {isBorrowed && (
                          <button
                            type="button"
                            className="table-action-btn"
                            style={{
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#34d399",
                              borderColor: "rgba(16, 185, 129, 0.25)",
                            }}
                            onClick={() => handleReturnRental(rental)}
                            title="Confirmar devolução do item"
                          >
                            <CheckCircle2 size={13} />
                            <span>Devolver</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* MODAL DE ITEM NO ESTOQUE */}
      <PdmModal
        open={itemModalOpen}
        onClose={() => setItemModalOpen(false)}
        title={editingItemId ? "Editar Item do Estoque" : "Novo Item no Estoque"}
        subtitle="Cadastre o item, quantidade total e estado de conservação."
        maxWidth="580px"
      >
        <form onSubmit={handleSaveItem} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label className="field">
            Nome do Item *
            <input
              required
              maxLength={160}
              placeholder="Ex: Microfone Sem Fio, Toalha Vermelha de Altar, Caixa de Som"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              Quantidade Total *
              <input
                type="number"
                min={1}
                required
                value={itemQuantity}
                onChange={(e) => setItemQuantity(e.target.value)}
              />
            </label>
            <label className="field">
              Condição / Estado *
              <select
                value={itemCondition}
                onChange={(e) => setItemCondition(e.target.value)}
              >
                <option value="GOOD">Bom estado</option>
                <option value="FAIR">Regular</option>
                <option value="MAINTENANCE">Em manutenção</option>
                <option value="UNUSABLE">Inutilizável</option>
              </select>
            </label>
          </div>
          <label className="field">
            Descrição / Localização
            <textarea
              rows={2}
              placeholder="Ex: Guardado no armário da sacristia, prateleira 2..."
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
            />
          </label>
          <label className="field">
            URL da Foto (Opcional)
            <input
              placeholder="https://..."
              value={itemPhotoUrl}
              onChange={(e) => setItemPhotoUrl(e.target.value)}
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="pdm-btn-secondary pdm-btn-compact"
              onClick={() => setItemModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pdm-btn-primary pdm-btn-compact"
              disabled={busy}
            >
              {busy ? "Salvando..." : editingItemId ? "Salvar Alterações" : "Cadastrar Item"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* MODAL DE REGISTRAR EMPRÉSTIMO */}
      <PdmModal
        open={rentalModalOpen}
        onClose={() => setRentalModalOpen(false)}
        title="Novo Empréstimo / Saída de Material"
        subtitle="Informe quem está retirando o item e a data prevista de devolução."
        maxWidth="580px"
      >
        <form onSubmit={handleSaveRental} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <label className="field">
            Item a Emprestar *
            <select
              required
              value={rentalItemId}
              onChange={(e) => setRentalItemId(e.target.value)}
            >
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.totalQuantity} un totais)
                </option>
              ))}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              Quantidade *
              <input
                type="number"
                min={1}
                required
                value={rentalQty}
                onChange={(e) => setRentalQty(e.target.value)}
              />
            </label>
            <label className="field">
              Data de Devolução Prevista *
              <input
                type="datetime-local"
                required
                value={rentalDueAt}
                onChange={(e) => setRentalDueAt(e.target.value)}
              />
            </label>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <label className="field">
              Quem Retirou (Nome) *
              <input
                required
                placeholder="Ex: João Silva (Equipe Música)"
                value={rentalTakenBy}
                onChange={(e) => setRentalTakenBy(e.target.value)}
              />
            </label>
            <label className="field">
              Telefone / WhatsApp
              <input
                placeholder="Ex: (83) 99999-9999"
                value={rentalPhone}
                onChange={(e) => setRentalPhone(e.target.value)}
              />
            </label>
          </div>
          <label className="field">
            Responsável que Entregou *
            <input
              required
              placeholder="Ex: Equipe de Patrimônio / EJC"
              value={rentalLender}
              onChange={(e) => setRentalLender(e.target.value)}
            />
          </label>
          <label className="field">
            Observações
            <textarea
              rows={2}
              placeholder="Finalidade do empréstimo (Ex: Retirado para o Encontro de Jovens)..."
              value={rentalDesc}
              onChange={(e) => setRentalDesc(e.target.value)}
            />
          </label>

          {error && <p className="error" role="alert">{error}</p>}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="pdm-btn-secondary pdm-btn-compact"
              onClick={() => setRentalModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="pdm-btn-primary pdm-btn-compact"
              disabled={busy}
            >
              {busy ? "Registrando..." : "Confirmar Empréstimo"}
            </button>
          </div>
        </form>
      </PdmModal>

      {/* CONFIRMAÇÃO DE EXCLUSÃO */}
      <PdmConfirmModal
        open={Boolean(deletingItem)}
        onClose={() => setDeletingItem(null)}
        onConfirm={handleDeleteItem}
        title="Excluir Item do Estoque"
        message={`Tem certeza que deseja excluir "${deletingItem?.name}" do estoque?`}
        confirmLabel="Sim, excluir item"
        busy={busy}
      />
    </div>
  );
}
