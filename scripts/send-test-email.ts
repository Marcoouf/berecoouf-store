import 'dotenv/config'
import { Resend } from 'resend'

type Args = { to?: string; subject?: string }

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i++) {
    const current = argv[i]
    if (current === '--to' && argv[i + 1]) {
      args.to = argv[++i]
      continue
    }
    if (current === '--subject' && argv[i + 1]) {
      args.subject = argv[++i]
      continue
    }
  }
  return args
}

async function main() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('❌ Variable RESEND_API_KEY manquante. Ajoute-la dans ton environnement.')
    process.exitCode = 1
    return
  }

  const from = process.env.RESEND_FROM
  if (!from) {
    console.error('❌ Variable RESEND_FROM manquante. Exemple : "Vague <noreply@vague.art>".')
    process.exitCode = 1
    return
  }

  const args = parseArgs(process.argv.slice(2))
  const to = args.to ?? process.env.TEST_EMAIL_TO ?? process.env.SALES_NOTIF_OVERRIDE
  if (!to) {
    console.error('❌ Aucun destinataire. Passe --to email@example.com ou définis TEST_EMAIL_TO.')
    process.exitCode = 1
    return
  }

  const resend = new Resend(apiKey)
  const subject = args.subject ?? 'Test email Vague'
  const now = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })

  try {
    const result = await resend.emails.send({
      from,
      to,
      subject,
      text: `Email de test envoyé le ${now}. Si tu reçois ce message, la configuration Resend fonctionne.`,
      html: `<p>Email de test envoyé le <strong>${now}</strong>.</p><p>Si tu vois ce message, la configuration Resend fonctionne ✅.</p>`,
    })
    if (result.error) {
      console.error('❌ Échec de l’envoi :', result.error.message ?? result.error)
      process.exitCode = 1
    } else {
      console.log('✅ Email de test envoyé.')
      console.log(`   ID: ${result.data?.id ?? '(id inconnu)'}`)
      console.log(`   To: ${to}`)
    }
  } catch (err: any) {
    console.error('❌ Échec de l’envoi :', err?.message ?? err)
    process.exitCode = 1
  }
}

main()
