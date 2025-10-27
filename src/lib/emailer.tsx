import * as React from 'react'
import { EmailLayout } from '@/emails/layout'

let cachedResend: any | undefined

export function getResendClient() {
  if (cachedResend !== undefined) return cachedResend
  try {
    const { Resend } = require('resend')
    const key = process.env.RESEND_API_KEY
    cachedResend = key ? new Resend(key) : null
  } catch {
    cachedResend = null
  }
  return cachedResend
}

export async function renderEmail(props: React.ComponentProps<typeof EmailLayout>) {
  const { renderToStaticMarkup } = await import('react-dom/server')
  return '<!DOCTYPE html>' + renderToStaticMarkup(<EmailLayout {...props} />)
}
