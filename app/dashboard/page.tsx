"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDisplay } from "@/lib/phone";

type Order = {
  id: string;
  firstName: string;
  phone: string;
  package: string;
  status: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
  batchId: string | null;
};

const SHEET_COLORS = ["#2B3856", "#8B5E3C", "#6B6058"];

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [sheetOrderIds, setSheetOrderIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const j = await res.json();
      setOrders(j.orders || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, []);

  const sheetOrders = useMemo(
    () => sheetOrderIds.map((id) => orders.find((o) => o.id === id)).filter(Boolean) as Order[],
    [sheetOrderIds, orders]
  );
  const slotsUsed = sheetOrders.reduce((sum, o) => sum + (o.package === "9" ? 9 : 3), 0);

  const cells: { photo: string; orderId: string; orderName: string; color: string }[] = [];
  sheetOrders.forEach((o, idx) => {
    const color = SHEET_COLORS[idx % SHEET_COLORS.length];
    o.photos.forEach((p) => cells.push({
      photo: p, orderId: o.id, orderName: o.firstName, color,
    }));
  });

  function canAdd(o: Order): boolean {
    if (sheetOrderIds.includes(o.id)) return false;
    const need = o.package === "9" ? 9 : 3;
    if (slotsUsed + need > 9) return false;
    if (o.package === "9" && sheetOrders.length > 0) return false;
    if (sheetOrders.some((s) => s.package === "9")) return false;
    return true;
  }

  function addToSheet(o: Order) {
    if (!canAdd(o)) return;
    setSheetOrderIds((ids) => [...ids, o.id]);
  }

  function removeFromSheet(id: string) {
    setSheetOrderIds((ids) => ids.filter((x) => x !== id));
  }

  function clearSheet() {
    setSheetOrderIds([]);
  }

  function openPrint() {
    if (sheetOrderIds.length === 0) return;
    const url = `/print?ids=${sheetOrderIds.join(",")}`;
    window.open(url, "_blank", "noopener");
  }

  async function markSheetPrinted() {
    if (sheetOrderIds.length === 0) return;
    await Promise.all(
      sheetOrderIds.map((id) =>
        fetch(`/api/orders/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "printing" }),
        })
      )
    );
    clearSheet();
    refresh();
  }

  async function notifyReady(o: Order) {
    if (!confirm(`Text ${o.firstName} at ${formatDisplay(o.phone)}?`)) return;
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: o.id }),
    });
    const j = await res.json();
    if (j.sms?.status === "failed") {
      alert(`SMS failed: ${j.sms.error}\nOrder still marked Ready.`);
    } else if (j.sms?.status === "skipped") {
      alert("Twilio not configured — order marked Ready, but no SMS sent.");
    }
    refresh();
  }

  async function markPickedUp(o: Order) {
    await fetch(`/api/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "picked_up" }),
    });
    refresh();
  }

  const activeOrders = orders.filter((o) => o.status !== "picked_up");
  const completedOrders = orders.filter((o) => o.status === "picked_up");

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" />
      <header className="px-6 py-4 border-b border-bordercream bg-warmwhite flex items-baseline justify-between">
        <div>
          <h1 className="font-serif text-2xl text-navy">The Magnet Parlor</h1>
          <p className="text-xs text-warmgray uppercase tracking-widest">Operator Dashboard</p>
        </div>
        <div className="text-xs text-warmgray">
          {loading ? "Loading…" : `${activeOrders.length} active · ${completedOrders.length} done`}
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] min-h-0">
        <aside className="border-r border-bordercream bg-cream overflow-y-auto p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy">Order Queue</h2>
            <button onClick={refresh} className="text-xs text-gold uppercase tracking-widest">
              Refresh
            </button>
          </div>
          {activeOrders.length === 0 && !loading && (
            <p className="text-sm text-warmgray italic mt-6 text-center">
              No active orders yet.
            </p>
          )}
          {activeOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onSheet={sheetOrderIds.includes(o.id)}
              canAdd={canAdd(o)}
              onAdd={() => addToSheet(o)}
              onRemove={() => removeFromSheet(o.id)}
              onNotify={() => notifyReady(o)}
              onPickedUp={() => markPickedUp(o)}
            />
          ))}
          {completedOrders.length > 0 && (
            <details className="mt-6">
              <summary className="text-xs text-warmgray uppercase tracking-widest cursor-pointer">
                Picked Up ({completedOrders.length})
              </summary>
              <div className="mt-2 space-y-2 opacity-60">
                {completedOrders.map((o) => (
                  <div key={o.id} className="parlor-card p-2 text-sm">
                    <span className="font-serif text-navy">{o.firstName}</span> ·{" "}
                    <span className="text-warmgray">{o.package}-pack</span>
                  </div>
                ))}
              </div>
            </details>
          )}
        </aside>

        <section className="overflow-y-auto p-6 bg-warmwhite">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h2 className="font-serif text-2xl text-navy">Print Sheet Builder</h2>
              <p className="text-xs text-warmgray uppercase tracking-widest">
                {slotsUsed} of 9 slots filled
              </p>
            </div>
            <div className="flex gap-2">
              <button className="btn-outline" onClick={clearSheet} disabled={sheetOrderIds.length === 0}>
                Clear
              </button>
              <button className="btn-outline" onClick={markSheetPrinted} disabled={sheetOrderIds.length === 0}>
                Mark Printed
              </button>
              <button className="btn-primary" onClick={openPrint} disabled={sheetOrderIds.length === 0}>
                Print Sheet →
              </button>
            </div>
          </div>

          <SheetPreview cells={cells} />

          <div className="mt-6">
            <h3 className="font-serif text-lg text-navy mb-2">On this sheet</h3>
            {sheetOrders.length === 0 ? (
              <p className="text-sm text-warmgray italic">
                Click an order in the queue to add it to the sheet.
              </p>
            ) : (
              <ul className="space-y-2">
                {sheetOrders.map((o, i) => (
                  <li
                    key={o.id}
                    className="flex items-center justify-between parlor-card p-3"
                    style={{ borderLeft: `4px solid ${SHEET_COLORS[i % SHEET_COLORS.length]}` }}
                  >
                    <div>
                      <span className="font-serif text-navy">{o.firstName}</span>
                      <span className="text-warmgray text-sm ml-2">
                        · {o.package}-pack · {formatDisplay(o.phone)}
                      </span>
                    </div>
                    <button
                      className="text-xs text-gold uppercase tracking-widest"
                      onClick={() => removeFromSheet(o.id)}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-8 parlor-card p-4">
            <h3 className="font-serif text-lg text-navy mb-2">Batch Hopper</h3>
            <p className="text-xs text-warmgray uppercase tracking-widest mb-3">
              3-pack orders waiting to be combined
            </p>
            <BatchHopper orders={activeOrders} sheetIds={sheetOrderIds} onAdd={addToSheet} canAdd={canAdd} />
          </div>
        </section>
      </div>
    </main>
  );
}

function statusLabel(s: string): { label: string; color: string } {
  switch (s) {
    case "pending":
      return { label: "New", color: "#2B3856" };
    case "batched":
      return { label: "Batched", color: "#A07848" };
    case "printing":
      return { label: "Printing", color: "#8B5E3C" };
    case "ready":
      return { label: "Ready", color: "#8B5E3C" };
    case "picked_up":
      return { label: "Picked Up", color: "#6B6058" };
    default:
      return { label: s, color: "#6B6058" };
  }
}

function OrderCard({
  order,
  onSheet,
  canAdd,
  onAdd,
  onRemove,
  onNotify,
  onPickedUp,
}: {
  order: Order;
  onSheet: boolean;
  canAdd: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onNotify: () => void;
  onPickedUp: () => void;
}) {
  const s = statusLabel(order.status);
  const borderColor =
    order.status === "ready"
      ? "#8B5E3C"
      : order.status === "pending"
      ? "#2B3856"
      : "#A07848";

  return (
    <article
      className="parlor-card p-3"
      style={{ borderLeft: `4px solid ${borderColor}` }}
    >
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-serif text-navy text-lg">{order.firstName}</span>
          <span className="text-warmgray text-sm ml-2">{order.package}-pack</span>
        </div>
        <span
          className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
          style={{ background: s.color, color: "#FFFAF4" }}
        >
          {s.label}
        </span>
      </div>
      <p className="text-xs text-warmgray mt-1">
        {formatDisplay(order.phone)} · {timeAgo(order.createdAt)}
      </p>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {order.photos.slice(0, 9).map((p, i) => (
          <img
            key={i}
            src={p}
            alt=""
            className="aspect-square w-full object-cover rounded border border-bordercream"
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        {!onSheet && order.status !== "ready" && order.status !== "picked_up" && (
          <button
            onClick={onAdd}
            disabled={!canAdd}
            className="btn-outline text-sm py-1 px-3 disabled:opacity-40"
          >
            + Add to Sheet
          </button>
        )}
        {onSheet && (
          <button onClick={onRemove} className="btn-outline text-sm py-1 px-3">
            On Sheet ✓ (remove)
          </button>
        )}
        {order.status !== "ready" && order.status !== "picked_up" && (
          <button onClick={onNotify} className="btn-gold text-sm py-1 px-3">
            Ready for Pickup
          </button>
        )}
        {order.status === "ready" && (
          <button onClick={onPickedUp} className="btn-primary text-sm py-1 px-3">
            Picked Up
          </button>
        )}
      </div>
    </article>
  );
}

function SheetPreview({
  cells,
}: {
  cells: { photo: string; orderId: string; orderName: string; color: string }[];
}) {
  return (
    <div
      className="mx-auto bg-white border border-bordercream shadow-sm"
      style={{ width: "min(100%, 510px)", aspectRatio: "8.5 / 11", padding: "5%" }}
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-[3%] h-full">
        {Array.from({ length: 9 }).map((_, i) => {
          const cell = cells[i];
          if (!cell) {
            return (
              <div
                key={i}
                className="border-2 border-dashed border-bordercream rounded flex items-center justify-center text-warmgray text-2xl font-serif"
              >
                {i + 1}
              </div>
            );
          }
          return (
            <div
              key={i}
              className="rounded overflow-hidden relative"
              style={{ outline: `3px solid ${cell.color}`, outlineOffset: -3 }}
            >
              <img src={cell.photo} alt="" className="w-full h-full object-cover" />
              <div
                className="absolute bottom-0 left-0 right-0 text-[10px] uppercase tracking-widest text-warmwhite text-center py-0.5"
                style={{ background: cell.color }}
              >
                {cell.orderName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BatchHopper({
  orders,
  sheetIds,
  onAdd,
  canAdd,
}: {
  orders: Order[];
  sheetIds: string[];
  onAdd: (o: Order) => void;
  canAdd: (o: Order) => boolean;
}) {
  const threes = orders.filter(
    (o) =>
      o.package === "3" &&
      !sheetIds.includes(o.id) &&
      o.status !== "ready" &&
      o.status !== "picked_up"
  );
  if (threes.length === 0) {
    return <p className="text-sm text-warmgray italic">No 3-packs waiting.</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {threes.map((o) => (
        <button
          key={o.id}
          className="text-left parlor-card p-2 hover:border-navy disabled:opacity-40"
          onClick={() => onAdd(o)}
          disabled={!canAdd(o)}
        >
          <div className="font-serif text-navy">{o.firstName}</div>
          <div className="text-xs text-warmgray">3-pack · {timeAgo(o.createdAt)}</div>
        </button>
      ))}
    </div>
  );
}

function timeAgo(iso: string): string {
  const t = new Date(iso.replace(" ", "T") + "Z").getTime();
  const diff = Date.now() - t;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
