'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SHIPPING_STATUS_LABELS, SHIPPING_STATUSES } from '@/lib/shipping'

type OrderItem = {
  id: string
  qty: number
  unitPrice: number
  lineTotal: number
  workId: string | null
  workTitle: string
  workSlug: string | null
  artistName: string
  variantLabel: string | null
}

type Order = {
  id: string
  email: string | null
  total: number
  status: string
  shippingStatus: string
  trackingUrl: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

type Toast = { id: string; kind: 'success' | 'error' | 'info'; message: string }

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

function formatCurrency(cents: number) {
  return euro.format((cents ?? 0) / 100)
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [shippingStatuses, setShippingStatuses] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { shippingStatus: string; trackingUrl: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [deleting, setDeleting] = useState<Record<string, boolean>>({})
  const [toasts, setToasts] = useState<Toast[]>([])
  const [sort, setSort] = useState<string>('created_desc')
  const [shippingFilter, setShippingFilter] = useState<string>('')
  const [artistFilter, setArtistFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ limit: '100', sort })
        if (shippingFilter) params.set('shipping', shippingFilter)
        if (artistFilter) params.set('artist', artistFilter)
        if (statusFilter) params.set('status', statusFilter)
        const res = await fetch(`/api/admin/orders?${params.toString()}`, {
          cache: 'no-store',
        })
        if (!active) return
        if (!res.ok) throw new Error('Impossible de charger les commandes')
        const data = await res.json()
        const list: Order[] = Array.isArray(data?.orders) ? data.orders : []
        setOrders(list)
        setShippingStatuses(Array.isArray(data?.shippingStatuses) ? data.shippingStatuses : [])
        setDrafts(
          list.reduce((acc, order) => {
            acc[order.id] = {
              shippingStatus: order.shippingStatus,
              trackingUrl: order.trackingUrl ?? '',
            }
            return acc
          }, {} as Record<string, { shippingStatus: string; trackingUrl: string }>),
        )
      } catch (err: any) {
        if (!active) return
        setError(err?.message || 'Erreur inconnue')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [sort, shippingFilter, artistFilter, statusFilter])

  const addToast = (kind: Toast['kind'], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    setToasts((prev) => [...prev, { id, kind, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, 4000)
  }

  const handleField = (orderId: string, key: 'shippingStatus' | 'trackingUrl', value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [orderId]: {
        shippingStatus: key === 'shippingStatus' ? value : prev[orderId]?.shippingStatus ?? 'pending',
        trackingUrl: key === 'trackingUrl' ? value : prev[orderId]?.trackingUrl ?? '',
      },
    }))
  }

  async function handleSave(orderId: string) {
    const draft = drafts[orderId]
    if (!draft) return
    setSaving((prev) => ({ ...prev, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shippingStatus: draft.shippingStatus,
          trackingUrl: draft.trackingUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || 'Mise à jour impossible')
      }
      const updated: Order | undefined = data?.order
      if (updated) {
        setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)))
        setDrafts((prev) => ({
          ...prev,
          [updated.id]: {
            shippingStatus: updated.shippingStatus,
            trackingUrl: updated.trackingUrl ?? '',
          },
        }))
      }
      addToast('success', 'Commande mise à jour ✅')
    } catch (err: any) {
      addToast('error', err?.message || 'Impossible de mettre à jour')
    } finally {
      setSaving((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  async function handleDelete(orderId: string) {
    const confirmDelete = window.confirm('Supprimer définitivement cette commande ?')
    if (!confirmDelete) return
    setDeleting((prev) => ({ ...prev, [orderId]: true }))
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || 'Suppression impossible')
      }
      setOrders((prev) => prev.filter((order) => order.id !== orderId))
      setDrafts((prev) => {
        const { [orderId]: _removed, ...rest } = prev
        return rest
      })
      setSaving((prev) => {
        const { [orderId]: _s, ...rest } = prev
        return rest
      })
      addToast('success', 'Commande supprimée ✅')
    } catch (err: any) {
      addToast('error', err?.message || 'Suppression impossible')
    } finally {
      setDeleting((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const statusOptions = useMemo(() => {
    return shippingStatuses.length ? shippingStatuses : SHIPPING_STATUSES
  }, [shippingStatuses])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <AdminPageHeader
        title="Commandes"
        subtitle="Suivi des expéditions et numéros de suivi lettre suivie."
        actions={[{ type: 'link', href: '/admin', label: '← Tableau de bord' }]}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-neutral-500">
          {orders.length ? `${orders.length} commande${orders.length > 1 ? 's' : ''}` : 'Aucune commande'}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label htmlFor="orders-sort" className="text-neutral-500">
            Trier
          </label>
          <select
            id="orders-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          >
            <option value="created_desc">Date ↓</option>
            <option value="created_asc">Date ↑</option>
            <option value="total_desc">Montant ↓</option>
            <option value="total_asc">Montant ↑</option>
            <option value="shipping_asc">Statut A→Z</option>
            <option value="shipping_desc">Statut Z→A</option>
          </select>

          <label htmlFor="orders-filter-shipping" className="text-neutral-500">
            Expédition
          </label>
          <select
            id="orders-filter-shipping"
            value={shippingFilter}
            onChange={(e) => setShippingFilter(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          >
            <option value="">Toutes</option>
            {statusOptions.map((status) => (
              <option key={`filter-${status}`} value={status}>
                {SHIPPING_STATUS_LABELS[status as keyof typeof SHIPPING_STATUS_LABELS] ?? status}
              </option>
            ))}
          </select>

          <label htmlFor="orders-filter-status" className="text-neutral-500">
            Paiement
          </label>
          <select
            id="orders-filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          >
            <option value="">Tous</option>
            <option value="pending">En attente</option>
            <option value="paid">Payé</option>
            <option value="cancelled">Annulé</option>
            <option value="refunded">Remboursé</option>
          </select>

          <input
            type="search"
            value={artistFilter}
            onChange={(e) => setArtistFilter(e.target.value)}
            placeholder="Filtrer par artiste"
            className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
          {(shippingFilter || statusFilter || artistFilter) ? (
            <button
              type="button"
              onClick={() => {
                setShippingFilter('')
                setStatusFilter('')
                setArtistFilter('')
              }}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-50"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </div>

      {toasts.length > 0 ? (
        <div className="fixed right-6 top-6 z-[100] flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={[
                'rounded-md px-4 py-2 text-sm text-white shadow-lg',
                toast.kind === 'success' ? 'bg-emerald-500' : '',
                toast.kind === 'error' ? 'bg-red-500' : '',
                toast.kind === 'info' ? 'bg-slate-600' : '',
              ].join(' ')}
            >
              {toast.message}
            </div>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm">
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={`skeleton-${i}`} className="h-20 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 shadow-sm">{error}</div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white/80 p-6 text-sm text-neutral-600 shadow-sm">
          Aucune commande pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const draft = drafts[order.id] ?? { shippingStatus: order.shippingStatus, trackingUrl: order.trackingUrl ?? '' }
            const dirty =
              draft.shippingStatus !== order.shippingStatus || (draft.trackingUrl || '') !== (order.trackingUrl || '')
            return (
              <article key={order.id} className="rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-sm">
                <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">Commande</div>
                    <div className="text-lg font-semibold text-neutral-900">{order.id}</div>
                    <div className="text-xs text-neutral-500">Créée le {new Date(order.createdAt).toLocaleString('fr-FR')}</div>
                    {order.email ? (
                      <div className="mt-1 text-xs text-neutral-500">Client : {order.email}</div>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-end gap-2 text-right text-sm">
                    <div>
                      Paiement : <span className="font-medium text-neutral-900">{order.status}</span>
                    </div>
                    <div>
                      Total : <span className="font-medium text-neutral-900">{formatCurrency(order.total)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(order.id)}
                      disabled={deleting[order.id]}
                      className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deleting[order.id] ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                </header>

                <section className="mt-5 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Œuvres</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-neutral-900">{item.workTitle}</div>
                          <div className="text-xs text-neutral-500">
                            {item.artistName}
                            {item.variantLabel ? ` — ${item.variantLabel}` : ''}
                          </div>
                        </div>
                        <div className="text-right text-xs text-neutral-500">
                          <div>
                            {item.qty} × {formatCurrency(item.unitPrice)}
                          </div>
                          <div className="font-medium text-neutral-900">{formatCurrency(item.lineTotal)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-5 rounded-xl border border-neutral-200 p-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Expédition</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Tous les envois se font en lettre suivie via La Poste. Renseigne le statut et le lien de suivi communiqué au client.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-[200px_1fr_auto]">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600">Statut expédition</label>
                      <select
                        value={draft.shippingStatus}
                        onChange={(e) => handleField(order.id, 'shippingStatus', e.target.value)}
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {SHIPPING_STATUS_LABELS[status as keyof typeof SHIPPING_STATUS_LABELS] ?? status}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-600">Lien de suivi</label>
                      <input
                        type="url"
                        value={draft.trackingUrl}
                        onChange={(e) => handleField(order.id, 'trackingUrl', e.target.value)}
                        placeholder="https://www.laposte.fr/outils/suivre-vos-envois..."
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleSave(order.id)}
                        disabled={saving[order.id] || !dirty}
                        className="w-full rounded-md bg-ink px-4 py-2 text-sm font-medium text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-neutral-300"
                      >
                        {saving[order.id] ? 'Enregistrement…' : dirty ? 'Mettre à jour' : 'À jour'}
                      </button>
                    </div>
                  </div>
                  {order.trackingUrl ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Lien actuel :{' '}
                      <a href={order.trackingUrl} target="_blank" rel="noopener" className="text-ink underline">
                        {order.trackingUrl}
                      </a>
                    </p>
                  ) : null}
                </section>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
