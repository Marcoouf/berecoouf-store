'use client'

import { useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { SHIPPING_STATUS_LABELS, SHIPPING_STATUSES } from '@/lib/shipping'

type OrderItem = {
  id: string
  qty: number
  unitPrice: number
  lineTotal: number
  workTitle: string
  workSlug: string | null
  artistName: string
  variantLabel: string | null
}

type Order = {
  id: string
  email: string | null
  total: number
  shippingAmount: number
  status: string
  shippingStatus: string
  trackingUrl: string | null
  createdAt: string
  updatedAt: string
  items: OrderItem[]
}

type Toast = { id: string; kind: 'success' | 'error' | 'info'; message: string }

const euro = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

function formatCurrency(cents: number) {
  return euro.format((cents ?? 0) / 100)
}

export default function OrdersClient() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [drafts, setDrafts] = useState<Record<string, { shippingStatus: string; trackingUrl: string }>>({})
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [sort, setSort] = useState<string>('created_desc')
  const [shippingFilter, setShippingFilter] = useState<string>('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ sort })
        if (shippingFilter) params.set('shipping', shippingFilter)
        const res = await fetch(`/api/author/orders?${params.toString()}`, { cache: 'no-store' })
        if (!active) return
        if (!res.ok) throw new Error('Impossible de charger les commandes')
        const data = await res.json()
        const list: Order[] = Array.isArray(data?.orders) ? data.orders : []
        setOrders(list)
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
  }, [sort, shippingFilter])

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
      const res = await fetch(`/api/author/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingStatus: draft.shippingStatus, trackingUrl: draft.trackingUrl }),
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
      addToast('success', 'Statut d’expédition mis à jour ✅')
    } catch (err: any) {
      addToast('error', err?.message || 'Impossible de mettre à jour')
    } finally {
      setSaving((prev) => ({ ...prev, [orderId]: false }))
    }
  }

  const shippingOptions = useMemo(() => SHIPPING_STATUSES, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <AdminPageHeader
        title="Mes commandes"
        subtitle="Suivi des expéditions des œuvres vendues."
        actions={[{ type: 'link', href: '/dashboard', label: '← Retour au tableau de bord' }]}
      />

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

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
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
            {shippingOptions.map((status) => (
              <option key={`shipping-${status}`} value={status}>
                {SHIPPING_STATUS_LABELS[status as keyof typeof SHIPPING_STATUS_LABELS] ?? status}
              </option>
            ))}
          </select>
        </div>
      </div>

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
          Aucune commande à afficher pour le moment.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const draft = drafts[order.id] ?? { shippingStatus: order.shippingStatus, trackingUrl: order.trackingUrl ?? '' }
            const dirty =
              draft.shippingStatus !== order.shippingStatus || (draft.trackingUrl || '') !== (order.trackingUrl || '')
            return (
              <article key={order.id} className="rounded-2xl border border-neutral-200 bg-white/85 p-6 shadow-sm">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-neutral-500">Commande</div>
                    <div className="text-lg font-semibold text-neutral-900">{order.id}</div>
                    <div className="text-xs text-neutral-500">Créée le {dateFormatter.format(new Date(order.createdAt))}</div>
                  </div>
                  <div className="text-right text-sm">
                    <div>
                      Montant : <span className="font-medium text-neutral-900">{formatCurrency(order.total)}</span>
                    </div>
                    <div>
                      Paiement : <span className="font-medium text-neutral-900">{order.status}</span>
                    </div>
                    <div className="text-xs text-neutral-500">
                      Livraison :{' '}
                      <span className="font-medium text-neutral-800">
                        {order.shippingAmount > 0 ? formatCurrency(order.shippingAmount) : 'Offerte'}
                      </span>
                    </div>
                  </div>
                </header>

                <section className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Œuvres concernées</h3>
                  <ul className="mt-3 space-y-2 text-sm">
                    {order.items.map((item) => (
                      <li key={item.id} className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <div className="font-medium text-neutral-900">{item.workTitle}</div>
                          <div className="text-xs text-neutral-500">
                            {item.variantLabel ? `${item.variantLabel} · ` : ''}
                            {item.qty} × {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Total : <span className="font-medium text-neutral-900">{formatCurrency(item.lineTotal)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="mt-4 rounded-xl border border-neutral-200 p-4">
                  <h3 className="text-sm font-semibold text-neutral-800">Expédition</h3>
                  <p className="mt-1 text-xs text-neutral-500">
                    Mets à jour le statut et colle le lien de suivi La Poste (lettre suivie) lorsque tu reçois l’information.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-[200px_1fr_auto]">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600">Statut d’expédition</label>
                      <select
                        value={draft.shippingStatus}
                        onChange={(e) => handleField(order.id, 'shippingStatus', e.target.value)}
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/10"
                      >
                        {shippingOptions.map((status) => (
                          <option key={`status-${status}`} value={status}>
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
