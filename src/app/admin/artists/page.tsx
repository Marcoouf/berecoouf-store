"use client";

import { useEffect, useMemo, useState } from "react";

// --- Types ---
type ArtistRow = {
  id: string;
  name: string;
  slug: string;
  isArchived: boolean;
};

type ArtistFull = {
  id?: string;
  name: string;
  slug: string;
  bio?: string | null;
  image?: string | null;     // cover
  portrait?: string | null;  // avatar
  contactEmail?: string | null;
  socials?: string[];
};

// --- Small helpers ---
function clsx(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(" ");
}
function parseSocials(input: string): string[] {
  return input.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean);
}
function socialsToTextarea(arr?: string[]): string {
  return (arr ?? []).join("\n");
}

// --- API ---
async function apiList(): Promise<ArtistRow[]> {
  const res = await fetch("/api/admin/artists", { cache: "no-store" });
  if (!res.ok) throw new Error("GET /artists failed");
  return res.json();
}
async function apiCreate(payload: ArtistFull) {
  const res = await fetch("/api/admin/artists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : { error: await res.text() };
  if (!res.ok) throw new Error(body?.error || "Création échouée");
  return body as { id: string; slug: string; name: string };
}
async function apiUpdate(id: string, payload: Partial<ArtistFull>) {
  const res = await fetch(`/api/admin/artists/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : { error: await res.text() };
  if (!res.ok) throw new Error(body?.error || "Mise à jour échouée");
  return body as { id: string; slug: string; name: string };
}
async function apiGet(id: string): Promise<ArtistFull> {
  const res = await fetch(`/api/admin/artists/${encodeURIComponent(id)}`, { cache: "no-store" });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : { error: await res.text() };
  if (!res.ok) throw new Error(body?.error || "Lecture échouée");
  const artist = body as ArtistFull & { isArchived?: boolean };
  return {
    id: artist.id,
    name: artist.name,
    slug: artist.slug,
    bio: artist.bio ?? "",
    image: artist.image ?? null,
    portrait: artist.portrait ?? null,
    contactEmail: artist.contactEmail ?? null,
    socials: artist.socials ?? [],
  };
}
async function apiArchive(id: string) {
  const res = await fetch(`/api/admin/artists/${encodeURIComponent(id)}/archive`, { method: "POST" });
  if (!res.ok) throw new Error("Archive échouée");
}
async function apiRestore(id: string) {
  const res = await fetch(`/api/admin/artists/${encodeURIComponent(id)}/restore`, { method: "POST" });
  if (!res.ok) throw new Error("Restore échouée");
}
async function apiDelete(id: string) {
  const res = await fetch(`/api/admin/artists/${encodeURIComponent(id)}`, { method: "DELETE" });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : { error: await res.text() };
  if (!res.ok) throw new Error(body?.error || "Suppression échouée");
}

// --- Upload util (robuste) ---
async function uploadToArtistBlob(file: File, filenameHint: string) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", "artists");
  fd.append("filename", filenameHint || file.name);

  const res = await fetch("/api/admin/uploads/artist", { method: "POST", body: fd });
  const ct = res.headers.get("content-type") || "";

  if (res.ok && ct.includes("application/json")) {
    const json = await res.json();
    if (!json?.url) throw new Error("Réponse invalide (pas d’URL)");
    return json.url as string;
  }

  // Lecture erreur lisible (HTML → texte)
  const text = await res.text().catch(() => "");
  let msg = "Upload échoué";
  try {
    const j = JSON.parse(text);
    msg = j?.error || msg;
  } catch {
    // garde "text" si HTML/trace
    if (text) msg = text.replace(/<[^>]+>/g, "").slice(0, 500);
  }
  throw new Error(msg);
}

export default function AdminArtistsPage() {
  const [rows, setRows] = useState<ArtistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // form state
  const [editing, setEditing] = useState<ArtistFull | null>(null);
  const isEditing = Boolean(editing?.id);

  // upload UI state
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [portraitPreview, setPortraitPreview] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPortrait, setUploadingPortrait] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const formDisabled = formLoading && isEditing;

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const list = await apiList();
      setRows(list);
    } catch (e: any) {
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, []);

  function startCreate() {
    setEditing({ name: "", slug: "", bio: "", image: "", portrait: "", contactEmail: "", socials: [] });
    setCoverPreview(null);
    setPortraitPreview(null);
    setFormLoading(false);
  }
  async function startEditById(id: string) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    setFormLoading(true);
    setEditing({ id: r.id, name: r.name, slug: r.slug, bio: "", image: "", portrait: "", contactEmail: "", socials: [] });
    setCoverPreview(null);
    setPortraitPreview(null);
    try {
      const full = await apiGet(r.id);
      setEditing(full);
      setCoverPreview(full.image ?? null);
      setPortraitPreview(full.portrait ?? null);
    } catch (e: any) {
      alert(e?.message || "Impossible de charger l’artiste");
    } finally {
      setFormLoading(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const payload: ArtistFull = {
      name: editing.name.trim(),
      slug: editing.slug.trim(),
      bio: editing.bio?.trim() || null,
      image: editing.image?.trim() || null,
      portrait: editing.portrait?.trim() || null,
      contactEmail: editing.contactEmail?.trim() || null,
      socials: editing.socials ?? [],
    };
    try {
      if (isEditing && editing.id) await apiUpdate(editing.id, payload);
      else await apiCreate(payload);
      setEditing(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message || "Échec de l’enregistrement");
    }
  }

  async function onArchive(id: string) {
    try { await apiArchive(id); refresh(); } catch (e: any) { alert(e?.message); }
  }
  async function onRestore(id: string) {
    try { await apiRestore(id); refresh(); } catch (e: any) { alert(e?.message); }
  }
  async function onDelete(id: string) {
    if (!confirm("Supprimer l’artiste ? (refus si des œuvres existent)")) return;
    try { await apiDelete(id); refresh(); } catch (e: any) { alert(e?.message); }
  }

  const sorted = useMemo(() => rows.slice().sort((a,b) => a.name.localeCompare(b.name, "fr")), [rows]);

  // --- Handlers upload ---
  function handleCoverFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    setCoverPreview(URL.createObjectURL(f));
    setUploadingCover(true);
    uploadToArtistBlob(f, `cover-${editing?.slug || "artist"}.jpg`)
      .then((url) => setEditing((s) => ({ ...(s as ArtistFull), image: url })))
      .catch((e) => alert(e?.message || "Upload couverture échoué"))
      .finally(() => setUploadingCover(false));
  }
  function handlePortraitFileChange(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0];
    if (!f) return;
    setPortraitPreview(URL.createObjectURL(f));
    setUploadingPortrait(true);
    uploadToArtistBlob(f, `portrait-${editing?.slug || "artist"}.jpg`)
      .then((url) => setEditing((s) => ({ ...(s as ArtistFull), portrait: url })))
      .catch((e) => alert(e?.message || "Upload portrait échoué"))
      .finally(() => setUploadingPortrait(false));
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium">Admin · Artistes</h1>
        <button onClick={startCreate} className="rounded border px-3 py-1.5 text-sm hover:bg-neutral-50">+ Ajouter</button>
      </div>

      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-neutral-500">Chargement…</div>
        ) : (
          <div className="divide-y rounded-lg border">
            {sorted.length === 0 && (
              <div className="p-4 text-sm text-neutral-500">Aucun artiste. Cliquez « Ajouter » pour en créer un.</div>
            )}

            {sorted.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-3 py-2">
                <div>
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-neutral-500">{a.slug} {a.isArchived ? "· archivé" : ""}</div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded border px-2 py-1 text-sm" onClick={() => startEditById(a.id)}>Éditer</button>
                  {!a.isArchived ? (
                    <button className="rounded border px-2 py-1 text-sm" onClick={() => onArchive(a.id)}>Archiver</button>
                  ) : (
                    <button className="rounded border px-2 py-1 text-sm" onClick={() => onRestore(a.id)}>Restaurer</button>
                  )}
                  <button className="rounded border px-2 py-1 text-sm" onClick={() => onDelete(a.id)}>Supprimer</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drawer/Form */}
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setEditing(null)}>
          <div className="w-full max-w-2xl rounded-xl border bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="text-base font-medium">{isEditing ? "Éditer l’artiste" : "Nouvel artiste"}</div>
              <button className="rounded border px-2 py-1 text-sm" onClick={() => setEditing(null)}>Fermer</button>
            </div>

            <form onSubmit={submit} className="mt-3 grid gap-3">
              {formLoading && <div className="text-xs text-neutral-500">Chargement des informations…</div>}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-neutral-600">Nom *</span>
                  <input className="rounded border px-2 py-1" value={editing.name}
                         disabled={formDisabled}
                         onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), name: e.target.value }))}
                         required />
                </label>
                <label className="grid gap-1">
                  <span className="text-xs text-neutral-600">Slug *</span>
                  <input className="rounded border px-2 py-1" value={editing.slug}
                         disabled={formDisabled}
                         onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), slug: e.target.value }))}
                         pattern="[a-z0-9-]+" required />
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs text-neutral-600">Email de contact (notification commandes)</span>
                <input
                  className="rounded border px-2 py-1"
                  type="email"
                  placeholder="artiste@example.com"
                  value={editing.contactEmail ?? ""}
                  disabled={formDisabled}
                  onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), contactEmail: e.target.value || null }))}
                />
                <span className="text-[11px] text-neutral-500">Utilisé pour avertir l’artiste lors d’une commande réussie.</span>
              </label>

              <label className="grid gap-1">
                <span className="text-xs text-neutral-600">Bio</span>
                <textarea className="rounded border px-2 py-1" rows={4}
                          disabled={formDisabled}
                          value={editing.bio ?? ""}
                          onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), bio: e.target.value }))} />
              </label>

              {/* Upload & URLs : Couverture */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="grid gap-1">
                  <span className="text-xs text-neutral-600">
                    Image de couverture (upload ou URL)
                    <span className="ml-1 text-[11px] text-neutral-500">(max 2,5 Mo)</span>
                  </span>
                  <input type="file" accept="image/*" onChange={handleCoverFileChange}
                         disabled={formDisabled}
                         className="block w-full text-sm" />
                  {coverPreview && (
                    // aperçus locaux (blob:) → next/image incompatible
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={coverPreview} alt="Prévisualisation couverture" className="mt-2 h-24 w-24 rounded border object-cover" />
                  )}
                  <input className="mt-2 rounded border px-2 py-1" placeholder="https://…"
                         value={editing.image ?? ""}
                         disabled={formDisabled}
                         onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), image: e.target.value || null }))} />
                  {uploadingCover && <div className="text-xs text-neutral-500 mt-1">Upload couverture en cours…</div>}
                </label>

                {/* Upload & URLs : Portrait */}
                <label className="grid gap-1">
                  <span className="text-xs text-neutral-600">
                    Portrait (upload ou URL)
                    <span className="ml-1 text-[11px] text-neutral-500">(max 2,5 Mo)</span>
                  </span>
                  <input type="file" accept="image/*" onChange={handlePortraitFileChange}
                         disabled={formDisabled}
                         className="block w-full text-sm" />
                  {portraitPreview && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={portraitPreview} alt="Prévisualisation portrait" className="mt-2 h-24 w-24 rounded-full border object-cover" />
                  )}
                  <input className="mt-2 rounded border px-2 py-1" placeholder="https://…"
                         value={editing.portrait ?? ""}
                         disabled={formDisabled}
                         onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), portrait: e.target.value || null }))} />
                  {uploadingPortrait && <div className="text-xs text-neutral-500 mt-1">Upload portrait en cours…</div>}
                </label>
              </div>

              <label className="grid gap-1">
                <span className="text-xs text-neutral-600">Réseaux (1 par ligne ou séparés par virgule)</span>
                <textarea className="rounded border px-2 py-1" rows={3}
                          disabled={formDisabled}
                          value={socialsToTextarea(editing.socials)}
                          onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), socials: parseSocials(e.target.value) }))} />
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => setEditing(null)}>Annuler</button>
                <button type="submit" disabled={formDisabled} className={clsx("rounded px-3 py-1.5 text-sm text-white", "bg-black hover:bg-neutral-800 disabled:opacity-60 disabled:cursor-not-allowed")}>{isEditing ? "Enregistrer" : "Créer"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
