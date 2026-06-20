"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Cropper from "react-easy-crop";
import { formatDisplay } from "@/lib/phone";
import { CroppedImage, type CropArea } from "../CroppedImage";

type MagnetSize = "2x2" | "2x3";

type ShippingAddress = { street: string; city: string; state: string; zip: string };

type Order = {
  id: string;
  firstName: string;
  phone: string;
  package: string;
  status: string;
  photos: string[];
  magnetSize: MagnetSize;
  createdAt: string;
  updatedAt: string;
  batchId: string | null;
  paymentMethod: "stripe" | "cash";
  paymentStatus: "paid" | "cash_pending" | "cash_confirmed";
  stripePaymentIntentId: string | null;
  orderCode: string;
  smsConsent: boolean;
  orderType: "market" | "shipped";
  lastName: string | null;
  email: string | null;
  shippingAddress: string | null;
  shippingRate: number | null;
  trackingNumber: string | null;
};

function parseAddress(raw: string | null): ShippingAddress | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ShippingAddress;
  } catch {
    return null;
  }
}

function priceForPackage(pkg: string): string {
  return pkg === "9" ? "$25" : "$12";
}

type LibraryDesign = {
  id: string;
  filename: string;
  path: string;
  categoryId: string | null;
  tags: string;
  createdAt: string;
};

type Category = { id: string; name: string; createdAt: string; designCount: number };

// One of the 12 sheet positions.
type Slot =
  | { kind: "empty" }
  | { kind: "order"; orderId: string; photoIndex: number }
  | { kind: "stock"; designId: string; crop?: CropArea };

const SLOTS = 9;

const SHEET_COLORS = [
  "#2B3856", "#8B5E3C", "#6B8E5A", "#D87B5A",
  "#A07848", "#5A6B8E", "#8E5A7B", "#3A6B6B",
];

function emptySlots(): Slot[] {
  return Array.from({ length: SLOTS }, () => ({ kind: "empty" }));
}

function playPing() {
  try {
    const Ctx = (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.18);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
    o.onended = () => ctx.close();
  } catch {
    /* audio blocked — silent */
  }
}

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const [designsCache, setDesignsCache] = useState<Record<string, LibraryDesign>>({});
  const [loading, setLoading] = useState(true);
  const [magnetSize, setMagnetSize] = useState<MagnetSize>("2x2");
  const [inquiryCount, setInquiryCount] = useState<number | null>(null);
  const [librarySize, setLibrarySize] = useState(0);
  const [pickerForSlot, setPickerForSlot] = useState<number | null>(null);
  const [cropForSlot, setCropForSlot] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const knownIdsRef = useRef<Set<string> | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/orders", { cache: "no-store" });
      const j = await res.json();
      const next: Order[] = j.orders || [];
      setOrders(next);

      const incoming = new Set(next.map((o) => o.id));
      const known = knownIdsRef.current;
      if (known) {
        const newPending = next.some((o) => !known.has(o.id) && o.status === "pending");
        if (newPending) playPing();
      }
      knownIdsRef.current = incoming;
    } finally {
      setLoading(false);
    }
  }

  async function refreshInquiryCount() {
    try {
      const res = await fetch("/api/inquiries", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      setInquiryCount((j.inquiries || []).length);
    } catch { /* ignore */ }
  }

  async function refreshLibrarySize() {
    try {
      const res = await fetch("/api/library/categories", { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      setLibrarySize(j.totalDesigns || 0);
    } catch { /* ignore */ }
  }

  useEffect(() => {
    refresh();
    refreshInquiryCount();
    refreshLibrarySize();
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => { if (j.activeMagnetSize) setMagnetSize(j.activeMagnetSize); })
      .catch(() => {});
    const t = setInterval(refresh, 5000);
    const ti = setInterval(refreshInquiryCount, 30000);
    return () => { clearInterval(t); clearInterval(ti); };
  }, []);

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/dashboard/login";
  }

  async function toggleMagnetSize(size: MagnetSize) {
    setMagnetSize(size);
    // Clear crops since the aspect ratio changed
    setSlots((cur) =>
      cur.map((s) => (s.kind === "stock" ? { ...s, crop: undefined } : s))
    );
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeMagnetSize: size }),
    });
  }

  const ordersOnSheet = useMemo(() => {
    const ids = new Set<string>();
    slots.forEach((s) => { if (s.kind === "order") ids.add(s.orderId); });
    return ids;
  }, [slots]);

  const ordersInSheetOrder = useMemo(() => {
    const seen: string[] = [];
    slots.forEach((s) => {
      if (s.kind === "order" && !seen.includes(s.orderId)) seen.push(s.orderId);
    });
    return seen;
  }, [slots]);

  const colorForOrder = useCallback(
    (orderId: string): string => {
      const i = ordersInSheetOrder.indexOf(orderId);
      return SHEET_COLORS[(i < 0 ? 0 : i) % SHEET_COLORS.length];
    },
    [ordersInSheetOrder]
  );

  const emptyCount = useMemo(() => slots.filter((s) => s.kind === "empty").length, [slots]);
  const customerCount = useMemo(() => slots.filter((s) => s.kind === "order").length, [slots]);
  const stockCount = useMemo(() => slots.filter((s) => s.kind === "stock").length, [slots]);

  function canAddOrder(o: Order): boolean {
    if (ordersOnSheet.has(o.id)) return false;
    const need = o.package === "9" ? 9 : 3;
    if (need > emptyCount) return false;
    // With 9 slots, a 9-pack uses the whole sheet — no room for any other
    // customer order alongside it.
    if (o.package === "9" && ordersOnSheet.size > 0) return false;
    const has9Pack = ordersInSheetOrder.some((oid) => {
      const other = orders.find((x) => x.id === oid);
      return other?.package === "9";
    });
    if (has9Pack) return false;
    return true;
  }

  function addOrderToSheet(o: Order) {
    if (!canAddOrder(o)) return;
    const need = o.package === "9" ? 9 : 3;
    setSlots((cur) => {
      const next = [...cur];
      let placed = 0;
      for (let i = 0; i < next.length && placed < need; i++) {
        if (next[i].kind === "empty") {
          next[i] = { kind: "order", orderId: o.id, photoIndex: placed };
          placed++;
        }
      }
      return next;
    });
  }

  function removeOrderFromSheet(orderId: string) {
    setSlots((cur) => cur.map((s) => (s.kind === "order" && s.orderId === orderId ? { kind: "empty" } : s)));
  }

  function emptySlot(slotIndex: number) {
    setSlots((cur) => {
      const next = [...cur];
      next[slotIndex] = { kind: "empty" };
      return next;
    });
  }

  function clearSheet() {
    setSlots(emptySlots());
  }

  function pickDesignForSlot(slotIndex: number, design: LibraryDesign) {
    setDesignsCache((c) => ({ ...c, [design.id]: design }));
    setSlots((cur) => {
      const next = [...cur];
      // If replacing an existing stock slot, drop its old crop (different image).
      next[slotIndex] = { kind: "stock", designId: design.id };
      return next;
    });
  }

  function saveCropForSlot(slotIndex: number, crop: CropArea | null) {
    setSlots((cur) => {
      const slot = cur[slotIndex];
      if (slot.kind !== "stock") return cur;
      const next = [...cur];
      next[slotIndex] = { ...slot, crop: crop || undefined };
      return next;
    });
  }

  function openPrint() {
    const hasAnything = slots.some((s) => s.kind !== "empty");
    if (!hasAnything) return;
    const compact = slots.map((s) => {
      if (s.kind === "empty") return null;
      if (s.kind === "order") return { k: "o", oid: s.orderId, pi: s.photoIndex };
      return { k: "s", did: s.designId, c: s.crop || null };
    });
    const slotsParam = btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    const params = new URLSearchParams({ size: magnetSize, slots: slotsParam });
    window.open(`/print?${params}`, "_blank", "noopener");
  }

  async function markSheetPrinted() {
    const ids = Array.from(ordersOnSheet);
    if (ids.length === 0) return;
    await Promise.all(
      ids.map((id) =>
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
    if (j.sms?.status === "failed" || j.sms?.status === "skipped") {
      alert("SMS failed — notify customer manually.\nOrder still marked Ready.");
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

  async function archiveOrder(o: Order) {
    await fetch(`/api/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "archived" }),
    });
    // Pull it off the print sheet (client-side) if it happened to be placed.
    removeOrderFromSheet(o.id);
    refresh();
  }

  async function unarchiveOrder(o: Order) {
    await fetch(`/api/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
    refresh();
  }

  async function markShipped(o: Order, trackingNumber: string) {
    const res = await fetch("/api/ship", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: o.id, trackingNumber }),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(j.error || "Could not mark order shipped.");
      return;
    }
    if (j.email?.status === "failed") {
      alert("Order marked shipped, but the tracking email failed to send — notify the customer manually.");
    } else if (j.email?.status === "skipped") {
      alert("Order marked shipped. Email is not configured, so the tracking number was saved but not emailed.");
    }
    refresh();
  }

  // Archived orders (any type) are hidden from every active view and the wait
  // estimate. They sit in their own collapsed section until unarchived.
  const archivedOrders = orders.filter((o) => o.status === "archived");
  // Market orders only — online/shipped orders live in their own section and
  // never enter the print sheet builder. Archived excluded.
  const marketOrders = orders.filter((o) => o.orderType !== "shipped" && o.status !== "archived");
  // Cash orders that haven't been confirmed yet — they sit in a separate
  // section and are NOT in the print queue until the operator collects cash.
  const cashPendingOrders = marketOrders.filter((o) => o.paymentStatus === "cash_pending");
  // Regular queue excludes cash_pending and picked-up.
  const activeOrders = marketOrders.filter(
    (o) => o.status !== "picked_up" && o.paymentStatus !== "cash_pending"
  );
  const completedOrders = marketOrders.filter((o) => o.status === "picked_up");

  // Online (shipped) orders. Awaiting shipment first, then already shipped.
  const shippedOrders = orders.filter((o) => o.orderType === "shipped" && o.status !== "archived");
  const awaitingShipment = shippedOrders.filter((o) => o.status !== "shipped");
  const alreadyShipped = shippedOrders.filter((o) => o.status === "shipped");

  async function deleteOrder(o: Order) {
    const res = await fetch(`/api/orders/${o.id}`, { method: "DELETE" });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Could not delete order");
      return;
    }
    // If the order happened to be on the sheet client-side, clear those slots too.
    removeOrderFromSheet(o.id);
    setDeleteTarget(null);
    refresh();
  }

  async function confirmCashPayment(o: Order) {
    if (!confirm(`Confirm you've received $${priceForPackage(o.package).replace("$","")} cash from ${o.firstName} (code ${o.orderCode})?`)) {
      return;
    }
    await fetch(`/api/orders/${o.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "cash_confirmed" }),
    });
    refresh();
  }

  const slotAtIndex = (i: number): Slot => slots[i];
  const orderById = (id: string) => orders.find((o) => o.id === id);

  // Make sure we have library design records for any stock slots (e.g. if state
  // was loaded from elsewhere later). For now state is purely local, so this
  // populates from picks.
  const slotForCrop = cropForSlot !== null ? slotAtIndex(cropForSlot) : null;

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" />
      <header className="px-6 py-4 border-b border-bordercream bg-warmwhite flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">The Magnet Parlor</h1>
          <p className="text-xs text-warmgray uppercase tracking-widest">Operator Dashboard</p>
        </div>
        <div className="flex items-baseline gap-5">
          <Link href="/dashboard/library" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            Library{librarySize ? ` (${librarySize})` : ""}
          </Link>
          <Link href="/dashboard/inquiries" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            Inquiries{inquiryCount !== null ? ` (${inquiryCount})` : ""}
          </Link>
          <div className="text-xs text-warmgray">
            {loading ? "Loading…" : `${activeOrders.length} active · ${completedOrders.length} done`}
          </div>
          <button onClick={signOut} className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[420px_1fr] min-h-0">
        <aside className="border-r border-bordercream bg-cream overflow-y-auto p-4 space-y-3">
          {cashPendingOrders.length > 0 && (
            <section className="rounded-md border-2 border-gold bg-gold/5 p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-serif text-base text-navy">Awaiting Cash Payment</h2>
                <span className="text-[10px] uppercase tracking-widest text-gold">
                  {cashPendingOrders.length}
                </span>
              </div>
              <p className="text-xs text-warmgray uppercase tracking-widest mb-3">
                Match the code shown on the customer&apos;s phone, then confirm.
              </p>
              <div className="space-y-2">
                {cashPendingOrders.map((o) => (
                  <CashPendingCard
                    key={o.id}
                    order={o}
                    onConfirm={() => confirmCashPayment(o)}
                    onDelete={() => setDeleteTarget(o)}
                  />
                ))}
              </div>
            </section>
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-lg text-navy">Market Queue</h2>
              <p className="text-[10px] text-warmgray uppercase tracking-widest">
                In-person orders · {activeOrders.length} active
              </p>
            </div>
            <button onClick={refresh} className="text-xs text-gold uppercase tracking-widest">
              Refresh
            </button>
          </div>
          {activeOrders.length === 0 && !loading && (
            <p className="text-sm text-warmgray italic mt-6 text-center">
              No active market orders yet.
            </p>
          )}
          {activeOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onSheet={ordersOnSheet.has(o.id)}
              canAdd={canAddOrder(o)}
              onAdd={() => addOrderToSheet(o)}
              onRemove={() => removeOrderFromSheet(o.id)}
              onNotify={() => notifyReady(o)}
              onPickedUp={() => markPickedUp(o)}
              onDelete={() => setDeleteTarget(o)}
              onArchive={() => archiveOrder(o)}
            />
          ))}
          {completedOrders.length > 0 && (
            <details className="mt-6">
              <summary className="text-xs text-warmgray uppercase tracking-widest cursor-pointer">
                Picked Up ({completedOrders.length})
              </summary>
              <div className="mt-2 space-y-2 opacity-80">
                {completedOrders.map((o) => (
                  <div key={o.id} className="parlor-card p-2 text-sm flex items-center justify-between">
                    <div>
                      <span className="font-serif text-navy">{o.firstName}</span>{" "}
                      <span className="text-warmgray">· {o.package}-pack</span>
                    </div>
                    <button
                      onClick={() => setDeleteTarget(o)}
                      className="text-xs text-warmgray hover:text-red-700 underline-offset-2 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </details>
          )}

          {archivedOrders.length > 0 && (
            <details className="mt-4">
              <summary className="text-xs text-warmgray uppercase tracking-widest cursor-pointer">
                Archived ({archivedOrders.length})
              </summary>
              <p className="text-[10px] text-warmgray mt-2 mb-2 leading-snug">
                Held out of the active queue and the wait estimate. Unarchive to bring back.
              </p>
              <div className="space-y-2 opacity-90">
                {archivedOrders.map((o) => (
                  <ArchivedOrderCard
                    key={o.id}
                    order={o}
                    onUnarchive={() => unarchiveOrder(o)}
                    onDelete={() => setDeleteTarget(o)}
                  />
                ))}
              </div>
            </details>
          )}
        </aside>

        <section className="overflow-y-auto p-6 bg-warmwhite">
          <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-serif text-2xl text-navy">Print Sheet Builder</h2>
              <p className="text-xs text-warmgray uppercase tracking-widest">
                {customerCount} customer · {stockCount} stock · {emptyCount} empty · {SLOTS} total
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className="btn-outline" onClick={clearSheet}
                disabled={customerCount === 0 && stockCount === 0}>
                Clear
              </button>
              <button className="btn-outline" onClick={markSheetPrinted}
                disabled={ordersOnSheet.size === 0}>
                Mark Printed
              </button>
              <button className="btn-primary" onClick={openPrint}
                disabled={customerCount === 0 && stockCount === 0}>
                Print Sheet →
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-4 parlor-card p-3 flex-wrap">
            <span className="text-xs text-warmgray uppercase tracking-widest">Magnet Size</span>
            <button
              onClick={() => toggleMagnetSize("2x2")}
              className={`px-3 py-1.5 rounded text-sm font-serif transition ${
                magnetSize === "2x2"
                  ? "bg-navy text-warmwhite"
                  : "border border-bordercream text-warmgray hover:border-navy"
              }`}
            >
              2x2 Square
            </button>
            <button
              onClick={() => toggleMagnetSize("2x3")}
              className={`px-3 py-1.5 rounded text-sm font-serif transition ${
                magnetSize === "2x3"
                  ? "bg-navy text-warmwhite"
                  : "border border-bordercream text-warmgray hover:border-navy"
              }`}
            >
              2x3 Rectangle
            </button>
            <span className="text-xs text-warmgray ml-auto">
              Sheet: 8.5 × 11 in portrait · 3 × 3 grid
            </span>
          </div>

          <SheetPreview
            slots={slots}
            magnetSize={magnetSize}
            getOrder={orderById}
            getDesign={(id) => designsCache[id]}
            colorForOrder={colorForOrder}
            onEmptyClick={(i) => setPickerForSlot(i)}
            onStockSwap={(i) => setPickerForSlot(i)}
            onStockCrop={(i) => setCropForSlot(i)}
            onStockRemove={emptySlot}
            onOrderRemove={(orderId) => {
              if (confirm("Remove this order's photos from the sheet?")) {
                removeOrderFromSheet(orderId);
              }
            }}
          />

          <div className="mt-6">
            <h3 className="font-serif text-lg text-navy mb-2">On this sheet</h3>
            {customerCount === 0 && stockCount === 0 ? (
              <p className="text-sm text-warmgray italic">
                Click an order in the queue to add its photos. Click any empty slot to place a library design.
              </p>
            ) : (
              <ul className="space-y-2">
                {ordersInSheetOrder.map((orderId) => {
                  const o = orderById(orderId);
                  if (!o) return null;
                  const color = colorForOrder(orderId);
                  return (
                    <li
                      key={orderId}
                      className="flex items-center justify-between parlor-card p-3"
                      style={{ borderLeft: `4px solid ${color}` }}
                    >
                      <div>
                        <span className="font-serif text-navy">{o.firstName}</span>
                        <span className="text-warmgray text-sm ml-2">
                          · {o.package}-pack · {formatDisplay(o.phone)}
                        </span>
                      </div>
                      <button
                        className="text-xs text-gold uppercase tracking-widest"
                        onClick={() => removeOrderFromSheet(orderId)}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
                {stockCount > 0 && (
                  <li className="parlor-card p-3 border-dashed">
                    <span className="font-serif text-navy">Library picks</span>
                    <span className="text-warmgray text-sm ml-2">
                      · {stockCount} design{stockCount === 1 ? "" : "s"}
                    </span>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="mt-8 parlor-card p-4">
            <h3 className="font-serif text-lg text-navy mb-2">Batch Hopper</h3>
            <p className="text-xs text-warmgray uppercase tracking-widest mb-3">
              3-pack orders waiting to be combined
            </p>
            <BatchHopper orders={activeOrders} onSheet={ordersOnSheet} onAdd={addOrderToSheet} canAdd={canAddOrder} />
          </div>

          {/* Secondary section — online/shipped orders. Kept out of the market
              workflow above and out of the wait-time estimate. */}
          <div className="mt-10 pt-6 border-t-2 border-dashed border-bordercream">
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <div>
                <h2 className="font-serif text-2xl text-navy">Online Orders</h2>
                <p className="text-xs text-warmgray uppercase tracking-widest">
                  Shipped nationwide · secondary · does not affect market wait time
                </p>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-gold">
                {awaitingShipment.length} to ship · {alreadyShipped.length} shipped
              </span>
            </div>

            {shippedOrders.length === 0 ? (
              <p className="text-sm text-warmgray italic">No online orders yet.</p>
            ) : awaitingShipment.length === 0 ? (
              <p className="text-sm text-warmgray italic">No online orders awaiting shipment.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {awaitingShipment.map((o) => (
                  <ShippedOrderCard key={o.id} order={o} onShip={markShipped} onDelete={() => setDeleteTarget(o)} />
                ))}
              </div>
            )}

            {alreadyShipped.length > 0 && (
              <details className="mt-4">
                <summary className="text-xs text-warmgray uppercase tracking-widest cursor-pointer">
                  Shipped ({alreadyShipped.length})
                </summary>
                <div className="grid sm:grid-cols-2 gap-3 mt-3 opacity-90">
                  {alreadyShipped.map((o) => (
                    <ShippedOrderCard key={o.id} order={o} onShip={markShipped} onDelete={() => setDeleteTarget(o)} />
                  ))}
                </div>
              </details>
            )}
          </div>
        </section>
      </div>

      {pickerForSlot !== null && (
        <LibraryPicker
          onClose={() => setPickerForSlot(null)}
          onPick={(design) => {
            pickDesignForSlot(pickerForSlot, design);
            setPickerForSlot(null);
          }}
        />
      )}
      {cropForSlot !== null && slotForCrop?.kind === "stock" && designsCache[slotForCrop.designId] && (
        <CropModal
          design={designsCache[slotForCrop.designId]}
          aspect={magnetSize === "2x3" ? 2 / 3 : 1}
          initialCrop={slotForCrop.crop}
          onClose={() => setCropForSlot(null)}
          onSave={(crop) => {
            saveCropForSlot(cropForSlot, crop);
            setCropForSlot(null);
          }}
          onReset={() => {
            saveCropForSlot(cropForSlot, null);
            setCropForSlot(null);
          }}
        />
      )}
      {deleteTarget && (
        <DeleteOrderModal
          order={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteOrder(deleteTarget)}
        />
      )}
    </main>
  );
}

function statusLabel(s: string): { label: string; color: string } {
  switch (s) {
    case "pending": return { label: "New", color: "#2B3856" };
    case "batched": return { label: "Batched", color: "#A07848" };
    case "printing": return { label: "Printing", color: "#8B5E3C" };
    case "ready": return { label: "Ready", color: "#8B5E3C" };
    case "picked_up": return { label: "Picked Up", color: "#6B6058" };
    default: return { label: s, color: "#6B6058" };
  }
}

function CashPendingCard({
  order, onConfirm, onDelete,
}: {
  order: Order; onConfirm: () => void; onDelete: () => void;
}) {
  return (
    <article className="parlor-card p-3 bg-warmwhite" style={{ borderLeft: "4px solid #8B5E3C" }}>
      <div className="flex items-baseline justify-between">
        <div>
          <p className="font-serif text-navy text-lg">{order.firstName}</p>
          <p className="text-xs text-warmgray">
            {order.package}-pack · <span className="text-gold font-serif">{priceForPackage(order.package)}</span> owed
          </p>
        </div>
      </div>
      <div className="mt-2 text-center bg-cream rounded py-2">
        <p className="text-[10px] uppercase tracking-widest text-warmgray">Order Code</p>
        <p className="font-serif text-navy tracking-[0.2em] leading-none mt-1" style={{ fontSize: "2.25rem" }}>
          {order.orderCode || "----"}
        </p>
      </div>
      <button onClick={onConfirm} className="btn-gold w-full mt-3 text-sm py-2">
        Confirm Payment
      </button>
      <button
        onClick={onDelete}
        className="block mx-auto mt-2 text-xs text-warmgray hover:text-red-700 underline-offset-2 hover:underline"
      >
        Delete
      </button>
    </article>
  );
}

function PaymentBadge({ order }: { order: Order }) {
  if (order.paymentStatus === "cash_pending") return null;
  const label = order.paymentMethod === "stripe" ? "Paid" : "Cash";
  return (
    <span
      className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
      style={{ background: "#6B8E5A", color: "#FFFAF4" }}
      title={order.paymentMethod === "stripe" ? "Paid by card" : "Paid in cash"}
    >
      {label}
    </span>
  );
}

function OrderCard({
  order, onSheet, canAdd, onAdd, onRemove, onNotify, onPickedUp, onDelete, onArchive,
}: {
  order: Order; onSheet: boolean; canAdd: boolean;
  onAdd: () => void; onRemove: () => void; onNotify: () => void; onPickedUp: () => void;
  onDelete: () => void; onArchive: () => void;
}) {
  const s = statusLabel(order.status);
  const borderColor =
    order.status === "ready" ? "#8B5E3C"
    : order.status === "picked_up" ? "#6B6058"
    : order.status === "pending" ? "#2B3856"
    : "#A07848";
  const photoAspect = order.magnetSize === "2x3" ? "aspect-[2/3]" : "aspect-square";

  return (
    <article className="parlor-card p-3" style={{ borderLeft: `4px solid ${borderColor}` }}>
      <div className="flex items-baseline justify-between">
        <div>
          <span className="font-serif text-navy text-lg">{order.firstName}</span>
          <span className="text-warmgray text-sm ml-2">
            {order.package}-pack · {order.magnetSize}
          </span>
        </div>
        <div className="flex gap-1 items-center">
          <PaymentBadge order={order} />
          <span
            className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: s.color, color: "#FFFAF4" }}
          >
            {s.label}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 mt-1.5">
        <a
          href={`sms:${order.phone}`}
          className="inline-flex items-center gap-1.5 font-serif text-navy text-lg leading-none hover:text-gold transition select-all"
          title="Tap to text this customer"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {formatDisplay(order.phone)}
        </a>
        <span className="text-xs text-warmgray shrink-0">{timeAgo(order.createdAt)}</span>
      </div>
      <div className="grid grid-cols-3 gap-1 mt-2">
        {order.photos.slice(0, 9).map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i} src={p} alt=""
            className={`${photoAspect} w-full object-cover rounded border border-bordercream`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-2 mt-3 items-center">
        {!onSheet && order.status !== "ready" && order.status !== "picked_up" && (
          <button onClick={onAdd} disabled={!canAdd}
            className="btn-outline text-sm py-1 px-3 disabled:opacity-40">
            Add to Sheet
          </button>
        )}
        {onSheet && (
          <button onClick={onRemove} className="btn-outline text-sm py-1 px-3">
            Remove from Sheet
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
        <button
          onClick={onArchive}
          title="Move out of the active queue (keeps the order)"
          className="ml-auto text-xs text-warmgray hover:text-navy underline-offset-2 hover:underline"
        >
          Archive
        </button>
        <button
          onClick={onDelete}
          disabled={onSheet}
          title={onSheet ? "Remove from print sheet first" : "Delete this order"}
          className="text-xs text-warmgray hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed underline-offset-2 hover:underline disabled:no-underline"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function ArchivedOrderCard({
  order, onUnarchive, onDelete,
}: {
  order: Order; onUnarchive: () => void; onDelete: () => void;
}) {
  const isShipped = order.orderType === "shipped";
  const name = isShipped ? [order.firstName, order.lastName].filter(Boolean).join(" ") : order.firstName;
  return (
    <article className="parlor-card p-2.5" style={{ borderLeft: "4px solid #6B6058" }}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-serif text-navy">{name || order.firstName}</span>
        <span className="text-xs text-warmgray">
          {order.package}-pack{isShipped ? " · online" : ` · ${order.magnetSize}`}
        </span>
      </div>
      {order.phone && (
        <a href={`sms:${order.phone}`} className="text-xs text-navy hover:text-gold transition select-all">
          {formatDisplay(order.phone)}
        </a>
      )}
      {order.photos.length > 0 && (
        <div className="grid grid-cols-3 gap-1 mt-2">
          {order.photos.slice(0, 9).map((p, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={p} alt="" className="aspect-square w-full object-cover rounded border border-bordercream" />
          ))}
        </div>
      )}
      <div className="flex items-center gap-3 mt-2">
        <button onClick={onUnarchive} className="btn-outline text-sm py-1 px-3">
          Unarchive
        </button>
        <button
          onClick={onDelete}
          className="ml-auto text-xs text-warmgray hover:text-red-700 underline-offset-2 hover:underline"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

function ShippedOrderCard({
  order, onShip, onDelete,
}: {
  order: Order;
  onShip: (o: Order, tracking: string) => Promise<void>;
  onDelete: () => void;
}) {
  const [tracking, setTracking] = useState(order.trackingNumber || "");
  const [busy, setBusy] = useState(false);
  const addr = parseAddress(order.shippingAddress);
  const isShipped = order.status === "shipped";
  const fullName = [order.firstName, order.lastName].filter(Boolean).join(" ");
  const shipDollars = order.shippingRate != null ? order.shippingRate.toFixed(2) : "6.99";

  async function doShip() {
    const t = tracking.trim();
    if (!t) {
      alert("Enter a USPS tracking number first.");
      return;
    }
    setBusy(true);
    try {
      await onShip(order, t);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className="parlor-card p-3 bg-warmwhite"
      style={{ borderLeft: `4px solid ${isShipped ? "#6B8E5A" : "#8B5E3C"}` }}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="font-serif text-navy text-lg">{fullName || order.firstName}</p>
        <div className="flex gap-1 items-center">
          <span
            className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
            style={{ background: "#6B8E5A", color: "#FFFAF4" }}
            title="Paid by card"
          >
            Paid
          </span>
          {isShipped && (
            <span
              className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded"
              style={{ background: "#6B8E5A", color: "#FFFAF4" }}
            >
              Shipped
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-warmgray mt-0.5 break-words">{order.email}</p>
      {order.phone && <p className="text-xs text-warmgray">{formatDisplay(order.phone)}</p>}

      <div className="text-xs text-charcoal mt-2 leading-snug">
        {addr ? (
          <>
            {addr.street}<br />
            {addr.city}, {addr.state} {addr.zip}
          </>
        ) : (
          <span className="text-warmgray italic">No address on file</span>
        )}
      </div>

      <p className="text-xs text-warmgray mt-2">
        {order.package === "9" ? "9 Magnets" : "3 Magnets"} ·{" "}
        <span className="text-gold font-serif">{priceForPackage(order.package)}</span> + ${shipDollars} shipping ·{" "}
        {timeAgo(order.createdAt)}
      </p>

      <div className="grid grid-cols-3 gap-1 mt-2">
        {order.photos.slice(0, 9).map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p} alt="" className="aspect-square w-full object-cover rounded border border-bordercream" />
        ))}
      </div>

      {isShipped ? (
        <div className="mt-3 text-xs">
          <span className="text-warmgray uppercase tracking-widest">Tracking: </span>
          <span className="text-charcoal font-mono break-all">{order.trackingNumber}</span>
        </div>
      ) : (
        <div className="mt-3 flex gap-2 items-center">
          <input
            className="input text-sm py-2 flex-1"
            placeholder="USPS tracking #"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
          <button className="btn-gold text-sm py-2 px-3 whitespace-nowrap" onClick={doShip} disabled={busy}>
            {busy ? "…" : "Mark Shipped"}
          </button>
        </div>
      )}

      <button
        onClick={onDelete}
        className="block mx-auto mt-2 text-xs text-warmgray hover:text-red-700 underline-offset-2 hover:underline"
      >
        Delete
      </button>
    </article>
  );
}

// Layout constants derived directly from the print page's inch dimensions.
// All values are percentages of the *sheet container* (width for x, height for y).
// Both magnet sizes now use a 3×3 grid on portrait 8.5×11 paper.
//
// 2x2 (3×3 of 2.4×2.4 cells on portrait 8.5×11):
//   horizontal: margin 0.25/8.5 = 2.9412%; cell 2.4/8.5 = 28.2353%; col-gap 0.4/8.5 = 4.7059%
//   vertical:   margin 1.5/11 = 13.6364%;  cell 2.4/11 = 21.8182%; row-gap 0.4/11 = 3.6364%
//
// 2x3 (3×3 of 2.25×3.25 cells on portrait 8.5×11):
//   horizontal: margin 0.25/8.5 = 2.9412%; cell 2.25/8.5 = 26.4706%; col-gap 0.625/8.5 = 7.3529%
//   vertical:   margin 0.25/11 = 2.2727%;  cell 3.25/11 = 29.5455%; row-gap 0.375/11 = 3.4091%
const LAYOUT_2x2 = {
  cellW: 28.2353, cellH: 21.8182,
  colGap: 4.7059, rowGap: 3.6364,
  marginX: 2.9412, marginY: 13.6364,
};
const LAYOUT_2x3 = {
  cellW: 26.4706, cellH: 29.5455,
  colGap: 7.3529, rowGap: 3.4091,
  marginX: 2.9412, marginY: 2.2727,
};

function cellPosition(L: typeof LAYOUT_2x2, row: number, col: number): React.CSSProperties {
  return {
    position: "absolute",
    left: `${L.marginX + col * (L.cellW + L.colGap)}%`,
    top: `${L.marginY + row * (L.cellH + L.rowGap)}%`,
    width: `${L.cellW}%`,
    height: `${L.cellH}%`,
  };
}

function SheetPreview({
  slots, magnetSize, getOrder, getDesign, colorForOrder,
  onEmptyClick, onStockSwap, onStockCrop, onStockRemove, onOrderRemove,
}: {
  slots: Slot[];
  magnetSize: MagnetSize;
  getOrder: (id: string) => Order | undefined;
  getDesign: (id: string) => LibraryDesign | undefined;
  colorForOrder: (orderId: string) => string;
  onEmptyClick: (slotIndex: number) => void;
  onStockSwap: (slotIndex: number) => void;
  onStockCrop: (slotIndex: number) => void;
  onStockRemove: (slotIndex: number) => void;
  onOrderRemove: (orderId: string) => void;
}) {
  // Both magnet sizes print on portrait 8.5×11 in the 3×3 layout.
  const sheetAspect = "8.5 / 11";
  const L = magnetSize === "2x2" ? LAYOUT_2x2 : LAYOUT_2x3;

  return (
    <div
      className="mx-auto bg-white border border-bordercream shadow-sm relative overflow-hidden"
      style={{
        width: "min(100%, 720px)",
        aspectRatio: sheetAspect,
      }}
    >
      {slots.map((slot, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const pos = cellPosition(L, row, col);

        if (slot.kind === "empty") {
          return (
            <button
              key={i}
              onClick={() => onEmptyClick(i)}
              className="border-2 border-dashed border-bordercream rounded flex flex-col items-center justify-center text-warmgray hover:border-navy hover:text-navy hover:bg-cream/50 transition overflow-hidden box-border"
              style={pos}
              title="Click to pick a design"
            >
              <span className="text-2xl leading-none">+</span>
              <span className="text-[10px] uppercase tracking-widest mt-1">Slot {i + 1}</span>
            </button>
          );
        }
        if (slot.kind === "order") {
          const order = getOrder(slot.orderId);
          const photo = order?.photos[slot.photoIndex];
          const color = colorForOrder(slot.orderId);
          return (
            <div
              key={i}
              className="rounded overflow-hidden group box-border"
              style={{ ...pos, outline: `3px solid ${color}`, outlineOffset: -3 }}
            >
              {photo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); onOrderRemove(slot.orderId); }}
                className="absolute top-1 right-1 bg-warmwhite/90 text-charcoal rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove this order from the sheet"
                title="Remove this order's photos"
              >×</button>
              <div
                className="absolute bottom-0 left-0 right-0 text-[10px] uppercase tracking-widest text-warmwhite text-center py-0.5"
                style={{ background: color }}
              >
                {order?.firstName || "?"}
              </div>
            </div>
          );
        }
        // stock
        const design = getDesign(slot.designId);
        return (
          <div
            key={i}
            className="rounded overflow-hidden group box-border"
            style={{ ...pos, outline: "3px dashed #6B6058", outlineOffset: -3 }}
          >
            {design && (
              <CroppedImage src={design.path} crop={slot.crop} />
            )}
            <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition">
              <button
                onClick={() => onStockCrop(i)}
                className="bg-warmwhite/90 text-charcoal rounded w-5 h-5 text-[11px] flex items-center justify-center"
                title="Adjust crop"
                aria-label="Adjust crop"
              >✎</button>
              <button
                onClick={() => onStockSwap(i)}
                className="bg-warmwhite/90 text-charcoal rounded w-5 h-5 text-[11px] flex items-center justify-center"
                title="Swap design"
                aria-label="Swap design"
              >↻</button>
              <button
                onClick={() => onStockRemove(i)}
                className="bg-warmwhite/90 text-charcoal rounded-full w-5 h-5 text-xs flex items-center justify-center"
                title="Remove from sheet"
                aria-label="Remove from sheet"
              >×</button>
            </div>
            <div
              className="absolute bottom-0 left-0 right-0 text-[10px] uppercase tracking-widest text-warmwhite text-center py-0.5"
              style={{ background: "#6B6058" }}
            >
              Stock
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BatchHopper({
  orders, onSheet, onAdd, canAdd,
}: {
  orders: Order[];
  onSheet: Set<string>;
  onAdd: (o: Order) => void;
  canAdd: (o: Order) => boolean;
}) {
  const threes = orders.filter(
    (o) =>
      o.package === "3" &&
      !onSheet.has(o.id) &&
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

function LibraryPicker({
  onClose, onPick,
}: {
  onClose: () => void;
  onPick: (d: LibraryDesign) => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [designs, setDesigns] = useState<LibraryDesign[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/library/categories", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => setCategories(j.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: "200" });
        if (categoryId) params.set("categoryId", categoryId);
        if (search.trim()) params.set("search", search.trim());
        const res = await fetch(`/api/library/designs?${params}`, { cache: "no-store" });
        if (!res.ok) return;
        const j = await res.json();
        setDesigns(j.designs || []);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(t);
  }, [categoryId, search]);

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 flex items-start justify-center pt-12 px-4 overflow-y-auto" onClick={onClose}>
      <div className="parlor-card p-5 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-serif text-xl text-navy">Pick a Design</h3>
          <button onClick={onClose} className="text-warmgray hover:text-navy text-xl">×</button>
        </div>
        <div className="flex gap-2 mb-4 flex-wrap">
          <select
            className="input text-sm py-2 max-w-xs"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.designCount})</option>
            ))}
          </select>
          <input
            type="search"
            placeholder="Search filename or tags…"
            className="input text-sm py-2 flex-1 min-w-[200px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading && designs.length === 0 ? (
          <p className="text-sm text-warmgray italic">Loading…</p>
        ) : designs.length === 0 ? (
          <p className="text-sm text-warmgray italic">
            {categories.length === 0
              ? "No designs in the library yet. Upload some at /dashboard/library."
              : "No matching designs."}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 max-h-[60vh] overflow-y-auto">
            {designs.map((d) => (
              <button
                key={d.id}
                onClick={() => onPick(d)}
                className="aspect-square border border-bordercream rounded overflow-hidden bg-cream hover:border-navy focus:outline-none focus:ring-2 focus:ring-navy"
                title={d.filename}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.path} alt={d.filename} loading="lazy" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CropModal({
  design, aspect, initialCrop, onClose, onSave, onReset,
}: {
  design: LibraryDesign;
  aspect: number;
  initialCrop?: CropArea;
  onClose: () => void;
  onSave: (crop: CropArea) => void;
  onReset: () => void;
}) {
  // react-easy-crop uses an internal coordinate system. We can't seed a perfect
  // initial state from a saved CropArea without doing math; in practice operators
  // re-crop when they want to adjust, so we start fresh each time.
  void initialCrop;

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [areaPx, setAreaPx] = useState<CropArea | null>(null);

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 flex items-start justify-center pt-12 px-4 overflow-y-auto" onClick={onClose}>
      <div className="parlor-card p-5 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-serif text-xl text-navy truncate pr-3">Crop “{design.filename}”</h3>
          <button onClick={onClose} className="text-warmgray hover:text-navy text-xl">×</button>
        </div>
        <div className="relative bg-charcoal" style={{ height: 400 }}>
          <Cropper
            image={design.path}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_a, areaPx) => setAreaPx(areaPx)}
            showGrid
          />
        </div>
        <div className="p-4 space-y-3">
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom"
          />
          <div className="flex gap-2">
            <button className="btn-outline" onClick={onReset}>Reset to default</button>
            <div className="flex-1" />
            <button className="btn-outline" onClick={onClose}>Cancel</button>
            <button
              className="btn-primary"
              onClick={() => areaPx && onSave(areaPx)}
              disabled={!areaPx}
            >
              Save crop
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeleteOrderModal({
  order, onClose, onConfirm,
}: {
  order: Order;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const isStripePaid = order.paymentMethod === "stripe" && order.paymentStatus === "paid";
  const paymentLabel =
    order.paymentMethod === "stripe"
      ? "Paid by card (Stripe)"
      : order.paymentStatus === "cash_pending"
      ? "Awaiting cash payment"
      : order.paymentStatus === "cash_confirmed"
      ? "Cash received"
      : "Cash (legacy)";

  async function doDelete() {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-charcoal/60 flex items-start justify-center pt-24 px-4 overflow-y-auto"
      onClick={onClose}
    >
      <div className="parlor-card p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-serif text-xl text-navy">Delete this order?</h3>
          <button onClick={onClose} className="text-warmgray hover:text-navy text-xl" aria-label="Close">×</button>
        </div>

        <dl className="grid grid-cols-[6rem_1fr] gap-y-2 gap-x-3 text-sm">
          <dt className="text-xs uppercase tracking-widest text-warmgray self-baseline">Customer</dt>
          <dd className="font-serif text-navy">{order.firstName}</dd>
          <dt className="text-xs uppercase tracking-widest text-warmgray self-baseline">Package</dt>
          <dd className="text-charcoal">{order.package === "9" ? "9 Magnets" : "3 Magnets"}</dd>
          <dt className="text-xs uppercase tracking-widest text-warmgray self-baseline">Amount</dt>
          <dd className="text-charcoal">{priceForPackage(order.package)}.00</dd>
          <dt className="text-xs uppercase tracking-widest text-warmgray self-baseline">Payment</dt>
          <dd className="text-charcoal">{paymentLabel}</dd>
        </dl>

        {isStripePaid && (
          <div className="mt-4 p-3 bg-gold/10 border border-gold/30 rounded text-sm">
            <p className="font-serif text-navy">Stripe charge already collected.</p>
            <p className="text-warmgray mt-1 leading-relaxed">
              Deleting this order here does <strong>not</strong> refund the customer.
              Issue the refund in the Stripe Dashboard first if needed.
            </p>
          </div>
        )}

        <p className="text-xs text-warmgray mt-4 leading-relaxed">
          This permanently removes the order from the queue and deletes the uploaded photos from the server.
          This can&apos;t be undone.
        </p>

        <div className="flex gap-2 mt-5">
          <button className="btn-outline flex-1" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button
            className="flex-1 py-3 px-4 rounded font-serif tracking-wider bg-red-700 text-warmwhite hover:bg-red-800 disabled:opacity-50"
            onClick={doDelete}
            disabled={busy}
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
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
