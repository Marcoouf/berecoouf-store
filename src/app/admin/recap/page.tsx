'use client'

import React, { Suspense, useEffect, useMemo, useState } from 'react'
import { euro } from '@/lib/format'

type ArtistLite = { id: string; name: string }

type ArtworkLite = {
  id: string
  slug: string
  title: string
  artistId: string
  price: number
  year?: number
  technique?: string
  paper?: string
  size?: string
  edition?: string
}

function AdminRecapPageInner() {
  const [artistsState, setArtistsState] = useState<ArtistLite[]>([])
  const [artworksState, setArtworksState] = useState<ArtworkLite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch('/api/catalog')
      .then(r => r.json())
      .then((data) => {
        if (!active) return
        setArtistsState(Array.isArray(data.artists) ? data.artists : [])
        setArtworksState(Array.isArray(data.artworks) ? data.artworks : [])
      })
      .catch(console.error)
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const [q, setQ] = useState('')

  function artistNameFrom(list: ArtistLite[], artistId: string) {
    const a = list.find(x => x.id === artistId)
    return a ? a.name : 'Artiste'
  }

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    const aName = (id: string) => artistNameFrom(artistsState, id)

    return artworksState
      .filter(w => {
        if (!needle) return true
        return [
          w.title,
          w.slug,
          w.year?.toString() ?? '',
          w.technique ?? '',
          w.paper ?? '',
          w.size ?? '',
          w.edition ?? '',
          aName(w.artistId),
        ]
          .join(' ')
          .toLowerCase()
          .includes(needle)
      })
      .map(w => ({
        title: w.title,
        artist: aName(w.artistId),
        price: euro(w.price),
        year: w.year ?? '—',
        technique: w.technique ?? '—',
        paper: w.paper ?? '—',
        size: w.size ?? '—',
        edition: w.edition ?? '—',
        slug: w.slug,
      }))
  }, [q, artworksState, artistsState])

  const copyCSV = async () => {
    const header = [
      'Titre',
      'Artiste',
      'Prix',
      'Année',
      'Technique',
      'Papier',
      'Dimensions',
      'Édition',
      'Slug',
    ]
    const esc = (s: any) =>
      `"${String(s ?? '').replace(/"/g, '""')}"`
    const csv =
      [header.join(','), ...rows.map(r => [
        r.title, r.artist, r.price, r.year, r.technique, r.paper, r.size, r.edition, r.slug,
      ].map(esc).join(','))].join('\n')

    try {
      await navigator.clipboard.writeText(csv)
      alert('CSV copié dans le presse-papiers ✅')
    } catch {
      alert('Impossible de copier. (Navigateur?)')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-medium tracking-tight">Récap des œuvres</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Rechercher titre, artiste, technique…"
            className="w-64 rounded-lg border px-3 py-2 text-sm"
          />
          <button onClick={copyCSV} className="rounded-lg border border-accent-300 px-3 py-2 text-sm text-accent-700 hover:bg-accent-100">
            Copier CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="p-6 text-sm text-neutral-500">Chargement…</div>
      )}

      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-neutral-50/60 text-neutral-600">
            <tr>
              <Th>Titre</Th>
              <Th>Artiste</Th>
              <Th align="right">Prix</Th>
              <Th>Année</Th>
              <Th>Technique</Th>
              <Th>Papier</Th>
              <Th>Dimensions</Th>
              <Th>Édition</Th>
              <Th>Slug</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.slug}-${i}`} className="border-t">
                <Td>{r.title}</Td>
                <Td>{r.artist}</Td>
                <Td align="right" className="tabular-nums">{r.price}</Td>
                <Td>{r.year}</Td>
                <Td>{r.technique}</Td>
                <Td>{r.paper}</Td>
                <Td>{r.size}</Td>
                <Td>{r.edition}</Td>
                <Td><code className="text-xs">{r.slug}</code></Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-neutral-500">
                  Aucun résultat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-neutral-500">
        Astuce : tape un mot-clé (ex. “sérigraphie”, “Hahnemühle”, un artiste…), puis “Copier CSV”.
      </p>
    </div>
  )
}

export default function AdminRecapPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-neutral-500">Chargement…</div>}>
      <AdminRecapPageInner />
    </Suspense>
  )
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center' }) {
  return (
    <th className={`px-3 py-2 text-xs font-medium uppercase tracking-wider ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      {children}
    </th>
  )
}
function Td({ children, align = 'left', className = '' }: { children: React.ReactNode; align?: 'left' | 'right' | 'center'; className?: string }) {
  return (
    <td className={`px-3 py-2 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'} ${className}`}>
      {children}
    </td>
  )
}