"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// --- Types ---
type ArtistRow = {
  id: string;
  name: string;
  slug: string;
  isArchived: boolean;
  isHidden: boolean;
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
  isHidden?: boolean;
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
    isHidden: artist.isHidden ?? false,
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
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null);
  const formDisabled = formLoading || saving;
  const toastRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(null), 3500);
    // force scroll pour rendre le toast visible
    if (toastRef.current) {
      toastRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    return () => window.clearTimeout(id);
  }, [toast]);

  const showToast = (message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ kind, message });
  };

  function startCreate() {
    setEditing({ name: "", slug: "", bio: "", image: "", portrait: "", contactEmail: "", socials: [], isHidden: false });
    setCoverPreview(null);
    setPortraitPreview(null);
    setFormLoading(false);
    setSaving(false);
  }
  async function startEditById(id: string) {
    const r = rows.find((x) => x.id === id);
    if (!r) return;
    setFormLoading(true);
    setEditing({ id: r.id, name: r.name, slug: r.slug, bio: "", image: "", portrait: "", contactEmail: "", socials: [], isHidden: r.isHidden });
    setCoverPreview(null);
    setPortraitPreview(null);
    try {
      const full = await apiGet(r.id);
      setEditing(full);
      setCoverPreview(full.image ?? null);
      setPortraitPreview(full.portrait ?? null);
    } catch (e: any) {
      showToast(e?.message || "Impossible de charger l’artiste", 'error');
    } finally {
      setFormLoading(false);
      setSaving(false);
    }
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    const payload: ArtistFull = {
      name: editing.name.trim(),
      slug: editing.slug.trim(),
      bio: editing.bio?.trim() || null,
      image: editing.image?.trim() || null,
      portrait: editing.portrait?.trim() || null,
      contactEmail: editing.contactEmail?.trim() || null,
      socials: editing.socials ?? [],
      isHidden: editing.isHidden ?? false,
    };
    try {
      if (isEditing && editing.id) await apiUpdate(editing.id, payload);
      else await apiCreate(payload);
      setEditing(null);
      await refresh();
      showToast(isEditing ? "Artiste mis à jour ✅" : "Artiste créé ✅", 'success');
    } catch (e: any) {
      showToast(e?.message || "Échec de l’enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  }

  async function onArchive(id: string) {
    try {
      await apiArchive(id); refresh(); showToast('Artiste archivé ✅', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Action impossible', 'error');
    }
  }
  async function onRestore(id: string) {
    try {
      await apiRestore(id); refresh(); showToast('Artiste restauré ✅', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Action impossible', 'error');
    }
  }
  async function onToggleHidden(id: string, hide: boolean) {
    try {
      await apiUpdate(id, { isHidden: hide });
      await refresh();
      showToast(hide ? 'Artiste masqué ✅' : 'Artiste visible ✅', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Action refusée', 'error');
    }
  }
  async function onDelete(id: string) {
    if (!confirm("Supprimer l’artiste ? (refus si des œuvres existent)")) return;
    try {
      await apiDelete(id); refresh(); showToast('Artiste supprimé ✅', 'success');
    } catch (e: any) {
      showToast(e?.message || 'Suppression impossible', 'error');
    }
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-medium">Admin · Artistes</h1>
        <button
          onClick={startCreate}
          className="w-full rounded border px-3 py-2 text-sm font-medium hover:bg-neutral-50 sm:w-auto"
        >
          + Ajouter
        </button>
      </div>

      {toast && (
        <div
          ref={toastRef}
          className={clsx(
            'mt-4 rounded-md border px-3 py-2 text-sm shadow-sm',
            toast.kind === 'success' ? 'border-green-200 bg-green-50 text-green-700' : 'border-red-200 bg-red-50 text-red-700'
          )}
        >
          {toast.message}
        </div>
      )}

      {error && <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-neutral-500">Chargement…</div>
        ) : sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white/80 p-6 text-sm text-neutral-500">
            Aucun artiste. Clique sur « Ajouter » pour en créer un.
          </div>
        ) : (
          <div className="grid gap-3">
            {sorted.map((artist) => (
              <article key={artist.id} className="rounded-xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{artist.name}</div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                      <code className="rounded bg-neutral-100 px-2 py-0.5 text-xs">/{artist.slug}</code>
                      {artist.isHidden && (
                        <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs text-neutral-700">Masqué</span>
                      )}
                      {artist.isArchived && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs text-amber-800">Archivé</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                      onClick={() => startEditById(artist.id)}
                    >
                      Éditer
                    </button>
                    <button
                      className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                      onClick={() => onToggleHidden(artist.id, !artist.isHidden)}
                    >
                      {artist.isHidden ? 'Afficher' : 'Masquer'}
                    </button>
                    {!artist.isArchived ? (
                      <button
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                        onClick={() => onArchive(artist.id)}
                      >
                        Archiver
                      </button>
                    ) : (
                      <button
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50"
                        onClick={() => onRestore(artist.id)}
                      >
                        Restaurer
                      </button>
                    )}
                    <button
                      className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
                      onClick={() => onDelete(artist.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Drawer/Form */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-6"
          onClick={() => setEditing(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="text-base font-semibold text-neutral-900">{isEditing ? "Éditer l’artiste" : "Nouvel artiste"}</div>
              <button type="button" className="rounded-md border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 transition hover:bg-neutral-50" onClick={() => setEditing(null)}>Fermer</button>
            </div>

            <div className="max-h-[85vh] overflow-y-auto px-5 py-4 sm:px-6">
              {formLoading && (
                <div className="mb-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs text-neutral-600">
                  Chargement des informations…
                </div>
              )}

              <form onSubmit={submit} className="space-y-6">
                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-800">Informations générales</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-neutral-600">Nom *</span>
                      <input
                        className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        value={editing.name}
                        disabled={formDisabled}
                        onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), name: e.target.value }))}
                        required
                      />
                    </label>
                    <label className="grid gap-1">
                      <span className="text-xs font-medium text-neutral-600">Slug *</span>
                      <input
                        className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        value={editing.slug}
                        disabled={formDisabled}
                        onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), slug: e.target.value }))}
                        pattern="[a-z0-9-]+"
                        required
                      />
                    </label>
                  </div>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-neutral-600">Email de contact (notification commandes)</span>
                    <input
                      className="rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                      type="email"
                      placeholder="artiste@example.com"
                      value={editing.contactEmail ?? ""}
                      disabled={formDisabled}
                      onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), contactEmail: e.target.value || null }))}
                    />
                    <span className="text-[11px] text-neutral-500">Utilisé pour avertir l’artiste lors d’une commande réussie.</span>
                  </label>
                  <label className="flex items-start gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={Boolean(editing.isHidden)}
                      disabled={formDisabled}
                      onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), isHidden: e.target.checked }))}
                    />
                    <span>
                      Masquer cet artiste du site public
                      <span className="block text-xs text-neutral-500">
                        Les œuvres restent visibles dans l’admin et pour l’auteur, mais ne s’affichent plus sur le site.
                      </span>
                    </span>
                  </label>
                  <label className="grid gap-1">
                    <span className="text-xs font-medium text-neutral-600">Biographie</span>
                    <textarea
                      className="min-h-[120px] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                      disabled={formDisabled}
                      value={editing.bio ?? ""}
                      onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), bio: e.target.value }))}
                    />
                  </label>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-800">Visuels</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                      <div className="text-xs font-medium text-neutral-600">Image de couverture (16:9)</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverFileChange}
                        disabled={formDisabled}
                        className="block w-full text-xs"
                      />
                      {coverPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverPreview} alt="Prévisualisation couverture" className="mt-2 h-24 w-full rounded-md border object-cover" />
                      )}
                      <input
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="https://…"
                        value={editing.image ?? ""}
                        disabled={formDisabled}
                        onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), image: e.target.value || null }))}
                      />
                      {uploadingCover && <div className="text-[11px] text-neutral-500">Upload couverture en cours…</div>}
                    </div>
                    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
                      <div className="text-xs font-medium text-neutral-600">Portrait (carré)</div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePortraitFileChange}
                        disabled={formDisabled}
                        className="block w-full text-xs"
                      />
                      {portraitPreview && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={portraitPreview} alt="Prévisualisation portrait" className="mt-2 h-24 w-24 rounded-full border object-cover" />
                      )}
                      <input
                        className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="https://…"
                        value={editing.portrait ?? ""}
                        disabled={formDisabled}
                        onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), portrait: e.target.value || null }))}
                      />
                      {uploadingPortrait && <div className="text-[11px] text-neutral-500">Upload portrait en cours…</div>}
                    </div>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-800">Réseaux sociaux</h3>
                  <textarea
                    className="min-h-[100px] rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-2 focus:ring-black/10"
                    rows={3}
                    disabled={formDisabled}
                    value={socialsToTextarea(editing.socials)}
                    onChange={(e) => setEditing((s) => ({ ...(s as ArtistFull), socials: parseSocials(e.target.value) }))}
                  />
                  <p className="text-[11px] text-neutral-500">Ajoute une adresse par ligne (Instagram, site, e-mail…)</p>
                </section>

                <div className="flex justify-end gap-2 border-t border-neutral-200 pt-3">
                  <button type="button" className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50" onClick={() => setEditing(null)}>Annuler</button>
                  <button type="submit" disabled={formDisabled} className={clsx("rounded-md px-4 py-2 text-sm font-medium text-white transition", formDisabled ? "bg-neutral-400" : "bg-black hover:bg-neutral-800")}>{saving ? 'Enregistrement…' : isEditing ? "Enregistrer" : "Créer"}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
