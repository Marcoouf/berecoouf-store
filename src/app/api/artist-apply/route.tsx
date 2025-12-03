import * as React from 'react'
import { NextResponse } from 'next/server'
import { getResendClient, renderEmail } from '@/lib/emailer'
import { Buffer } from 'buffer'

type Payload = {
  name: string
  email: string
  portfolio?: string
  social?: string
  city?: string
  works?: string
  message: string
}

const adminEmail = (process.env.CONTACT_EMAIL || process.env.SALES_NOTIF_OVERRIDE || 'contact@vague-galerie.store').trim()
const fromEmail = (process.env.RESEND_FROM || 'Vague <no-reply@vague-galerie.store>').trim()

const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export async function POST(req: Request) {
  const formData = await req.formData().catch(() => null)
  if (!formData) {
    return NextResponse.json({ error: 'invalid_payload', message: 'Payload invalide.' }, { status: 400 })
  }

  const payload: Payload = {
    name: clean(formData.get('name')),
    email: clean(formData.get('email')),
    portfolio: clean(formData.get('portfolio')),
    social: clean(formData.get('social')),
    city: clean(formData.get('city')),
    works: clean(formData.get('works')),
    message: clean(formData.get('message')),
  }

  const file = formData.get('portfolioFile')
  let attachment: Awaited<ReturnType<typeof buildAttachment>> | null = null
  if (file && file instanceof File) {
    try {
      attachment = await buildAttachment(file)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fichier invalide (PDF, 5 Mo max).'
      return NextResponse.json({ error: 'invalid_file', message }, { status: 400 })
    }
  }

  if (!payload.name || !payload.email || !payload.message) {
    return NextResponse.json(
      { error: 'missing_fields', message: 'Champs requis manquants (nom, email, message).' },
      { status: 400 },
    )
  }

  const resend = getResendClient()
  if (!resend) {
    return NextResponse.json(
      { error: 'email_not_configured', message: 'Service email non configuré. Ajoutez RESEND_API_KEY.' },
      { status: 500 },
    )
  }

  const textLines = [
    `Nouvelle demande artiste sur VAGUE`,
    ``,
    `Nom : ${payload.name}`,
    `Email : ${payload.email}`,
    payload.portfolio ? `Portfolio : ${payload.portfolio}` : null,
    payload.social ? `Réseaux : ${payload.social}` : null,
    payload.city ? `Ville / pays : ${payload.city}` : null,
    payload.works ? `Types d’œuvres : ${payload.works}` : null,
    attachment ? `Fichier joint : ${attachment.filename}` : null,
    ``,
    `Message :`,
    payload.message,
  ].filter(Boolean)

  const html = await renderEmail({
    title: 'Nouvelle demande artiste',
    intro: (
      <p>
        Un artiste a rempli le formulaire pour rejoindre VAGUE. Répondez directement à <strong>{payload.email}</strong>.
      </p>
    ),
    children: (
      <table width="100%" cellPadding={0} cellSpacing={0} role="presentation" style={{ fontSize: 14, lineHeight: '22px' }}>
        <tbody>
          <Row label="Nom">{payload.name}</Row>
          <Row label="Email">{payload.email}</Row>
          {payload.portfolio ? <Row label="Portfolio / site">{payload.portfolio}</Row> : null}
          {payload.social ? <Row label="Réseaux">{payload.social}</Row> : null}
          {payload.city ? <Row label="Ville / pays">{payload.city}</Row> : null}
          {payload.works ? <Row label="Types d’œuvres">{payload.works}</Row> : null}
          {attachment ? <Row label="Fichier joint">{attachment.filename}</Row> : null}
          <Row label="Message">
            <div style={{ whiteSpace: 'pre-line' }}>{payload.message}</div>
          </Row>
        </tbody>
      </table>
    ),
  })

  try {
    await resend.emails.send({
      from: fromEmail,
      to: adminEmail,
      subject: `Demande artiste — ${payload.name}`,
      html,
      text: textLines.join('\n'),
      attachments: attachment ? [attachment] : undefined,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('artist-apply email error', err)
    return NextResponse.json(
      { error: 'email_send_failed', message: 'Impossible d’envoyer l’email pour le moment.' },
      { status: 500 },
    )
  }
}

async function buildAttachment(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Fichier trop volumineux (max 5 Mo).')
  }
  if (file.type && file.type !== 'application/pdf') {
    throw new Error('Seuls les fichiers PDF sont acceptés.')
  }
  const buf = Buffer.from(await file.arrayBuffer())
  return {
    filename: file.name || 'portfolio.pdf',
    content: buf.toString('base64'),
    type: file.type || 'application/pdf',
  }
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <tr>
      <td style={{ padding: '6px 0', color: '#6b7280', width: '35%', verticalAlign: 'top' }}>{label}</td>
      <td style={{ padding: '6px 0', color: '#111827' }}>{children}</td>
    </tr>
  )
}
