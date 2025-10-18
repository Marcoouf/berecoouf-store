import React from 'react'
import Link from 'next/link'

type Action =
  | { type: 'link'; label: string; href: string }
  | { type: 'button'; label: string; onClick: () => void; variant?: 'primary' | 'secondary' }

type Props = {
  title: string
  subtitle?: string
  actions?: Action[]
}

export function AdminPageHeader({ title, subtitle, actions }: Props) {
  return (
    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>
        {subtitle ? <p className="text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
      {actions && actions.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action, index) => {
            if (action.type === 'link') {
              return (
                <Link
                  key={`${action.href}-${index}`}
                  href={action.href}
                  className="rounded-md border border-neutral-300 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  {action.label}
                </Link>
              )
            }
            return (
              <button
                key={`btn-${index}`}
                type="button"
                onClick={action.onClick}
                className={[
                  'rounded-md px-3 py-2 text-sm font-medium',
                  action.variant === 'primary'
                    ? 'bg-ink text-white hover:bg-ink/90'
                    : 'border border-neutral-300 text-neutral-700 hover:bg-neutral-50',
                ].join(' ')}
              >
                {action.label}
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default AdminPageHeader
