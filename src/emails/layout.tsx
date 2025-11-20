import * as React from 'react'

type EmailLayoutProps = {
  title: string
  intro?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}

const rawSiteUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://vague-galerie.store').trim()
const siteUrl = rawSiteUrl.replace(/\/$/, '')
const siteHostname = (() => {
  try {
    return new URL(siteUrl).hostname
  } catch {
    return siteUrl.replace(/^https?:\/\//, '')
  }
})()

function EmailLayout({ title, intro, children, footer }: EmailLayoutProps) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, padding: 0, fontFamily: '\'Inter\', sans-serif', backgroundColor: '#f6f6f6' }}>
        <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ backgroundColor: '#f6f6f6' }}>
          <tbody>
            <tr>
              <td align="center" style={{ padding: '24px 16px' }}>
                <table
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  role="presentation"
                  style={{
                    maxWidth: 600,
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <tbody>
                    <tr>
                      <td style={{ padding: '32px 32px 16px' }}>
                        <h1 style={{ margin: 0, fontSize: 20, lineHeight: '28px', color: '#111827' }}>{title}</h1>
                      </td>
                    </tr>
                    {intro ? (
                      <tr>
                        <td style={{ padding: '0 32px 24px', fontSize: 14, lineHeight: '22px', color: '#4b5563' }}>{intro}</td>
                      </tr>
                    ) : null}
                    <tr>
                      <td style={{ padding: '0 32px 32px', fontSize: 14, lineHeight: '22px', color: '#1f2937' }}>{children}</td>
                    </tr>
                    {footer ? (
                      <tr>
                        <td
                          style={{
                            padding: '20px 32px',
                            backgroundColor: '#f9fafb',
                            fontSize: 12,
                            lineHeight: '20px',
                            color: '#6b7280',
                          }}
                        >
                          {footer}
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
                <p style={{ marginTop: 16, fontSize: 12, color: '#9ca3af' }}>
                  Vague — 12 rue d’Hauteville, 75010 Paris ·{' '}
                  <a href={siteUrl} style={{ color: '#2563eb' }}>
                    {siteHostname}
                  </a>
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  )
}

export { EmailLayout }
