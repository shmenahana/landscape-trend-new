"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

type Category = { id: string; name: string; createdAt: string; designCount: number };
type Design = {
  id: string;
  filename: string;
  path: string;
  categoryId: string | null;
  tags: string;
  createdAt: string;
};

type FilterView = string; // category id, or "all", or "recent", or "" for uncategorized

export default function LibraryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalDesigns, setTotalDesigns] = useState(0);
  const [uncategorized, setUncategorized] = useState(0);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [filter, setFilter] = useState<FilterView>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selected, setSelected] = useState<Design | null>(null);

  const reloadCategories = useCallback(async () => {
    const res = await fetch("/api/library/categories", { cache: "no-store" });
    if (!res.ok) return;
    const j = await res.json();
    setCategories(j.categories || []);
    setTotalDesigns(j.totalDesigns ?? 0);
    setUncategorized(j.uncategorized ?? 0);
  }, []);

  const reloadDesigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter === "recent") {
        params.set("limit", "60");
      } else if (filter === "all") {
        // no filter
      } else if (filter === "") {
        params.set("categoryId", "");
      } else {
        params.set("categoryId", filter);
      }
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/library/designs?${params}`, { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      setDesigns(j.designs || []);
    } finally {
      setLoading(false);
    }
  }, [filter, search]);

  useEffect(() => {
    reloadCategories();
  }, [reloadCategories]);

  useEffect(() => {
    const t = setTimeout(reloadDesigns, 150); // debounce search
    return () => clearTimeout(t);
  }, [reloadDesigns]);

  async function signOut() {
    await fetch("/api/auth", { method: "DELETE" });
    window.location.href = "/dashboard/login";
  }

  async function addCategory() {
    const name = prompt("New category name?");
    if (!name?.trim()) return;
    const res = await fetch("/api/library/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Could not add category");
      return;
    }
    reloadCategories();
  }

  async function renameCategory(c: Category) {
    const name = prompt("Rename category to:", c.name);
    if (!name?.trim() || name.trim() === c.name) return;
    const res = await fetch(`/api/library/categories/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error || "Could not rename");
      return;
    }
    reloadCategories();
  }

  async function deleteCategory(c: Category) {
    if (!confirm(`Delete "${c.name}"? Its ${c.designCount} designs will become uncategorized (not deleted).`)) return;
    const res = await fetch(`/api/library/categories/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not delete");
      return;
    }
    if (filter === c.id) setFilter("all");
    reloadCategories();
    reloadDesigns();
  }

  const filteredHeader = useMemo(() => {
    if (filter === "all") return `All Designs (${totalDesigns})`;
    if (filter === "recent") return "Recently Added";
    if (filter === "") return `Uncategorized (${uncategorized})`;
    const c = categories.find((x) => x.id === filter);
    return c ? `${c.name} (${c.designCount})` : "Designs";
  }, [filter, totalDesigns, uncategorized, categories]);

  return (
    <main className="min-h-screen flex flex-col">
      <div className="awning" aria-hidden />
      <header className="px-6 py-4 border-b border-bordercream bg-warmwhite flex items-baseline justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-navy">The Magnet Parlor</h1>
          <p className="text-xs text-warmgray uppercase tracking-widest">Design Library</p>
        </div>
        <div className="flex items-baseline gap-5">
          <Link href="/dashboard" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            ← Dashboard
          </Link>
          <Link href="/dashboard/inquiries" className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            Inquiries
          </Link>
          <button onClick={signOut} className="text-xs text-gold uppercase tracking-widest hover:text-navy">
            Sign Out
          </button>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-0">
        <aside className="border-r border-bordercream bg-cream overflow-y-auto p-4 space-y-1">
          <SidebarItem
            label={`All Designs`}
            count={totalDesigns}
            active={filter === "all"}
            onClick={() => setFilter("all")}
          />
          <SidebarItem
            label="Recently Added"
            active={filter === "recent"}
            onClick={() => setFilter("recent")}
          />
          {uncategorized > 0 && (
            <SidebarItem
              label="Uncategorized"
              count={uncategorized}
              active={filter === ""}
              onClick={() => setFilter("")}
            />
          )}
          <div className="pt-4 pb-1 px-2 text-xs uppercase tracking-widest text-warmgray flex items-center justify-between">
            <span>Categories</span>
            <button onClick={addCategory} className="text-gold hover:text-navy" title="Add category">+</button>
          </div>
          {categories.map((c) => (
            <SidebarItem
              key={c.id}
              label={c.name}
              count={c.designCount}
              active={filter === c.id}
              onClick={() => setFilter(c.id)}
              onRename={() => renameCategory(c)}
              onDelete={() => deleteCategory(c)}
            />
          ))}

          <div className="mt-6 pt-4 border-t border-bordercream">
            <p className="text-xs text-warmgray leading-snug">
              Fill any empty slot on the print sheet by clicking it in the Print Sheet Builder — you&apos;ll be able to search, filter by category, and pick the exact design for that slot.
            </p>
          </div>
        </aside>

        <section className="overflow-y-auto p-6 bg-warmwhite">
          <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
            <h2 className="font-serif text-2xl text-navy">{filteredHeader}</h2>
            <div className="flex items-center gap-3">
              <input
                type="search"
                placeholder="Search filename or tags…"
                className="input text-sm py-2 w-64"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                onClick={() => setUploadOpen(true)}
                className="btn-primary text-sm py-2 px-4"
              >
                Upload Designs
              </button>
            </div>
          </div>

          {loading && designs.length === 0 ? (
            <p className="text-sm text-warmgray italic">Loading…</p>
          ) : designs.length === 0 ? (
            <p className="text-sm text-warmgray italic">
              {search ? "No designs match your search." : "No designs yet. Click Upload to add some."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {designs.map((d) => (
                <DesignThumb
                  key={d.id}
                  design={d}
                  categoryName={categories.find((c) => c.id === d.categoryId)?.name}
                  onClick={() => setSelected(d)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {uploadOpen && (
        <UploadModal
          categories={categories}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => {
            reloadCategories();
            reloadDesigns();
          }}
        />
      )}
      {selected && (
        <DesignModal
          design={selected}
          categories={categories}
          onClose={() => setSelected(null)}
          onChanged={() => {
            reloadCategories();
            reloadDesigns();
          }}
          onDeleted={() => {
            setSelected(null);
            reloadCategories();
            reloadDesigns();
          }}
        />
      )}
    </main>
  );
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  onRename,
  onDelete,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={`group flex items-center justify-between px-3 py-2 rounded cursor-pointer transition ${
        active ? "bg-navy text-warmwhite" : "hover:bg-bordercream/40 text-charcoal"
      }`}
      onClick={onClick}
    >
      <span className="font-serif text-sm truncate">{label}</span>
      <span className="flex items-center gap-1.5 shrink-0">
        {count !== undefined && (
          <span className={`text-xs ${active ? "text-warmwhite/80" : "text-warmgray"}`}>
            {count}
          </span>
        )}
        {(onRename || onDelete) && !active && (
          <span className="opacity-0 group-hover:opacity-100 transition flex gap-1">
            {onRename && (
              <button
                onClick={(e) => { e.stopPropagation(); onRename(); }}
                className="text-[10px] text-gold hover:text-navy"
                title="Rename"
              >✎</button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="text-[10px] text-gold hover:text-red-700"
                title="Delete"
              >×</button>
            )}
          </span>
        )}
      </span>
    </div>
  );
}

function DesignThumb({
  design,
  categoryName,
  onClick,
}: {
  design: Design;
  categoryName?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left group focus:outline-none focus:ring-2 focus:ring-navy rounded"
    >
      <div className="aspect-square border border-bordercream rounded overflow-hidden bg-cream relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={design.path}
          alt={design.filename}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="mt-1 text-xs leading-tight">
        <p className="text-charcoal truncate" title={design.filename}>{design.filename}</p>
        <p className="text-warmgray text-[10px] uppercase tracking-widest truncate">
          {categoryName || "Uncategorized"}
        </p>
      </div>
    </button>
  );
}

function UploadModal({
  categories,
  onClose,
  onUploaded,
}: {
  categories: Category[];
  onClose: () => void;
  onUploaded: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ inserted: number; rejected: { name: string; reason: string }[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function pickFiles(list: FileList | null | undefined) {
    if (!list) return;
    const next = Array.from(list).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...next]);
  }

  async function upload() {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const fd = new FormData();
      if (categoryId) fd.append("categoryId", categoryId);
      for (const f of files) fd.append("files", f, f.name);
      const res = await fetch("/api/library/designs", { method: "POST", body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error || "Upload failed");
        return;
      }
      setResult({ inserted: (j.inserted || []).length, rejected: j.rejected || [] });
      setFiles([]);
      onUploaded();
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 flex items-start justify-center pt-20 px-4 overflow-y-auto" onClick={onClose}>
      <div className="parlor-card p-6 max-w-xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-serif text-xl text-navy">Upload Designs</h3>
          <button onClick={onClose} className="text-warmgray hover:text-navy text-xl">×</button>
        </div>
        <label className="label">Category</label>
        <select
          className="input mb-4"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">— Uncategorized —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            pickFiles(e.dataTransfer.files);
          }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded p-8 text-center cursor-pointer transition ${
            dragOver ? "border-navy bg-cream" : "border-bordercream hover:border-navy"
          }`}
        >
          <p className="font-serif text-navy">Drop image files here or click to choose</p>
          <p className="text-xs text-warmgray mt-1">JPG, PNG, WebP, or GIF — up to 50 files</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => pickFiles(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-4 max-h-40 overflow-y-auto text-sm">
            <p className="text-xs uppercase tracking-widest text-warmgray mb-1">
              {files.length} file{files.length === 1 ? "" : "s"} queued
            </p>
            <ul className="text-charcoal text-xs space-y-0.5">
              {files.slice(0, 10).map((f, i) => (
                <li key={i} className="truncate">• {f.name} <span className="text-warmgray">({(f.size/1024).toFixed(0)} KB)</span></li>
              ))}
              {files.length > 10 && <li className="text-warmgray">…and {files.length - 10} more</li>}
            </ul>
          </div>
        )}

        {result && (
          <div className="mt-4 text-sm">
            <p className="text-charcoal">Uploaded {result.inserted} file{result.inserted === 1 ? "" : "s"}.</p>
            {result.rejected.length > 0 && (
              <details className="mt-1">
                <summary className="text-warmgray text-xs cursor-pointer">{result.rejected.length} rejected</summary>
                <ul className="text-xs text-warmgray mt-1">
                  {result.rejected.map((r, i) => <li key={i}>• {r.name}: {r.reason}</li>)}
                </ul>
              </details>
            )}
          </div>
        )}

        <div className="flex gap-2 mt-6">
          <button className="btn-outline flex-1" onClick={onClose}>Close</button>
          <button
            className="btn-primary flex-1"
            onClick={upload}
            disabled={uploading || files.length === 0}
          >
            {uploading ? "Uploading…" : `Upload ${files.length || ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function DesignModal({
  design,
  categories,
  onClose,
  onChanged,
  onDeleted,
}: {
  design: Design;
  categories: Category[];
  onClose: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>(design.categoryId || "");
  const [tags, setTags] = useState(design.tags);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/library/designs/${design.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: categoryId || null, tags }),
      });
      onChanged();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!confirm(`Delete "${design.filename}"? This removes the file from disk.`)) return;
    await fetch(`/api/library/designs/${design.id}`, { method: "DELETE" });
    onDeleted();
  }

  return (
    <div className="fixed inset-0 z-50 bg-charcoal/60 flex items-start justify-center pt-12 px-4 overflow-y-auto" onClick={onClose}>
      <div className="parlor-card p-6 max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between mb-4">
          <h3 className="font-serif text-xl text-navy truncate pr-3">{design.filename}</h3>
          <button onClick={onClose} className="text-warmgray hover:text-navy text-xl">×</button>
        </div>
        <div className="aspect-square border border-bordercream rounded overflow-hidden bg-cream mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={design.path} alt={design.filename} className="w-full h-full object-contain" />
        </div>
        <label className="label">Category</label>
        <select
          className="input mb-4"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">— Uncategorized —</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <label className="label">Tags <span className="text-warmgray font-normal lowercase text-xs">(comma-separated)</span></label>
        <input
          className="input mb-4"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="bigfoot, sasquatch, funny, outdoors"
        />
        <div className="flex gap-2">
          <button className="btn-outline" onClick={del}>Delete</button>
          <div className="flex-1" />
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
