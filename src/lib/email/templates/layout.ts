/**
 * Shared shell for transactional email. Table-based with inline styles, because
 * that is what Outlook and Gmail actually render. The brand tokens are repeated
 * as literal hex here since email clients do not support CSS variables.
 */

export const BRAND = {
  maroon900: '#4A0A14',
  maroon700: '#7A1220',
  maroon500: '#A31E30',
  gold500: '#C9A227',
  gold200: '#E8D9A0',
  cream50: '#FAF7F2',
  ink900: '#1A1A1A',
  ink500: '#6B6B6B',
} as const

export function escapeHtml(value: string | null | undefined): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const SERIF = "'Fraunces', Georgia, 'Times New Roman', serif"
const SANS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"

export function emailLayout({
  title,
  preheader,
  companyName,
  body,
  footer,
}: {
  title: string
  preheader: string
  companyName: string
  body: string
  footer: string
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.cream50};color:${BRAND.ink900};font-family:${SANS};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream50};padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 8px 28px -18px rgba(26,26,26,0.4);">

          <tr>
            <td style="background:${BRAND.maroon900};padding:28px 32px;">
              <div style="font-family:${SERIF};font-size:22px;font-weight:600;color:#ffffff;letter-spacing:-0.01em;">
                ${escapeHtml(companyName)}
              </div>
              <div style="height:2px;width:44px;background:${BRAND.gold500};margin-top:12px;"></div>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>

          <tr>
            <td style="background:${BRAND.maroon900};padding:24px 32px;color:${BRAND.gold200};font-size:12px;line-height:1.7;">
              ${footer}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${SERIF};font-size:24px;font-weight:600;color:${BRAND.maroon900};line-height:1.25;">${escapeHtml(text)}</h1>`
}

export function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:${BRAND.ink900};">${html}</p>`
}

export function goldRule(): string {
  return `<div style="height:1px;background:${BRAND.gold500};opacity:0.4;margin:28px 0;"></div>`
}

export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
    <tr><td style="background:${BRAND.maroon700};border-radius:8px;">
      <a href="${escapeHtml(href)}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(label)}</a>
    </td></tr>
  </table>`
}

/** Two-column label/value block used for "what you told us" summaries. */
export function detailTable(rows: Array<{ label: string; value: string }>): string {
  if (rows.length === 0) return ''
  const cells = rows
    .map(
      ({ label, value }) => `<tr>
        <td style="padding:8px 16px 8px 0;font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.ink500};white-space:nowrap;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:8px 0;font-size:14px;color:${BRAND.ink900};font-weight:500;">${escapeHtml(value)}</td>
      </tr>`,
    )
    .join('')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.cream50};border:1px solid ${BRAND.gold200};border-radius:8px;padding:8px 16px;margin:0 0 20px;">${cells}</table>`
}
