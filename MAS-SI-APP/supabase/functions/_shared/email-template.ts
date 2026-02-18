const LOGO_URL = 'https://ugc.production.linktr.ee/e3KxJRUJTu2zELiw7FCf_hH45sO9R0guiKEY2?io=true&size=avatar-v3_0'

type HighlightColor = 'green' | 'amber' | 'blue'

type Section =
  | { type: 'text'; content: string }
  | { type: 'highlight-box'; label: string; sublabel?: string; color: HighlightColor }
  | { type: 'details-table'; title?: string; rows: { label: string; value: string }[] }
  | { type: 'steps-list'; title: string; steps: string[] }
  | { type: 'dua'; content: string }
  | { type: 'image'; src: string; alt: string }

interface EmailOptions {
  title: string
  subtitle?: string
  greeting: string
  sections: Section[]
  signature?: { line1: string; line2: string; line3?: string }
}

const HIGHLIGHT_STYLES: Record<HighlightColor, { bg: string; border: string; textColor: string; labelColor: string }> = {
  green: { bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '#86efac', textColor: '#166534', labelColor: '#15803d' },
  amber: { bg: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 100%)', border: '#fde68a', textColor: '#92400e', labelColor: '#a16207' },
  blue: { bg: 'linear-gradient(135deg, #f0f7ff 0%, #e8f0fe 100%)', border: '#d0e3f7', textColor: '#1d4681', labelColor: '#6B7280' },
}

function renderSection(section: Section): string {
  switch (section.type) {
    case 'text':
      return `<p>${section.content}</p>`

    case 'highlight-box': {
      const s = HIGHLIGHT_STYLES[section.color]
      return `
        <div style="background:${s.bg};padding:22px;border-radius:12px;text-align:center;margin:28px 0;border:1px solid ${s.border};">
          <p style="font-size:20px;font-weight:700;color:${s.textColor};margin:0;">${section.label}</p>
          ${section.sublabel ? `<p style="font-size:13px;color:${s.labelColor};margin-top:6px;font-weight:500;">${section.sublabel}</p>` : ''}
        </div>`
    }

    case 'details-table':
      return `
        <div style="background-color:#f9fafb;padding:18px 20px;border-radius:10px;margin:24px 0;border:1px solid #e5e7eb;">
          ${section.title ? `<h3 style="margin-top:0;color:#1d4681;font-size:15px;font-weight:700;">${section.title}</h3>` : ''}
          <table style="width:100%;border-collapse:collapse;">
            ${section.rows.map(r => `<tr><td style="padding:8px 0;font-size:14px;font-weight:600;color:#1d4681;width:140px;">${r.label}</td><td style="padding:8px 0;font-size:14px;color:#374151;">${r.value}</td></tr>`).join('')}
          </table>
        </div>`

    case 'steps-list':
      return `
        <div style="background-color:#f0f7ff;border:1px solid #d0e3f7;border-radius:10px;padding:20px;margin:24px 0;">
          <h3 style="margin-top:0;color:#1d4681;font-size:15px;">${section.title}</h3>
          <ol style="margin:8px 0 0;padding-left:20px;">
            ${section.steps.map(s => `<li style="margin-bottom:8px;font-size:14px;color:#374151;">${s}</li>`).join('')}
          </ol>
        </div>`

    case 'dua':
      return `
        <div style="background-color:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:20px;margin:24px 0;text-align:center;">
          <p style="margin:0;font-size:15px;color:#92400e;font-style:italic;line-height:1.6;">${section.content}</p>
        </div>`

    case 'image':
      return `<img src="${section.src}" alt="${section.alt}" style="max-width:100%;border-radius:8px;margin:16px 0;">`

    default:
      return ''
  }
}

export function generateEmailHtml(options: EmailOptions): string {
  const { title, subtitle, greeting, sections, signature } = options
  const sig = signature || { line1: 'With warm regards,', line2: 'MAS Staten Island', line3: 'Muslim American Society' }
  const year = new Date().getFullYear()

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { padding: 40px 20px; }
    .email-container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); overflow: hidden; }
    .logo-bar { background-color: #ffffff; text-align: center; padding: 32px 20px 16px; }
    .logo-bar img { width: 100px; height: 100px; border-radius: 24px; box-shadow: 0 2px 12px rgba(29,70,129,0.15); }
    .header { background: linear-gradient(135deg, #1d4681 0%, #2a5d9e 100%); color: #ffffff; text-align: center; padding: 32px 24px; }
    .header h1 { margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.3px; }
    .header p { margin: 8px 0 0; font-size: 15px; opacity: 0.9; }
    .content { padding: 36px 28px; color: #333333; line-height: 1.7; font-size: 15px; }
    .greeting { font-size: 17px; font-weight: 600; color: #1d4681; margin-bottom: 4px; }
    .footer { background-color: #1d4681; padding: 24px; text-align: center; }
    .footer p { color: rgba(255,255,255,0.8); font-size: 12px; margin: 4px 0; }
    .footer .org { color: #ffffff; font-weight: 600; font-size: 13px; letter-spacing: 0.5px; }
  </style>
</head>
<body>
  <div class="wrapper">
  <div class="email-container">
    <div class="logo-bar">
      <img src="${LOGO_URL}" alt="MAS Staten Island">
    </div>
    <div class="header">
      <h1>${title}</h1>
      ${subtitle ? `<p>${subtitle}</p>` : ''}
    </div>
    <div class="content">
      <p class="greeting">${greeting}</p>
      ${sections.map(renderSection).join('\n')}
      <div style="margin-top:28px;">
        <p style="margin:2px 0;">${sig.line1}</p>
        <p style="margin:2px 0;font-weight:700;color:#1d4681;">${sig.line2}</p>
        ${sig.line3 ? `<p style="margin:2px 0;font-size:13px;color:#6B7280;">${sig.line3}</p>` : ''}
      </div>
    </div>
    <div class="footer">
      <p class="org">MAS Staten Island</p>
      <p>Muslim American Society</p>
      <p>&copy; ${year} MAS Staten Island. All Rights Reserved.</p>
    </div>
  </div>
  </div>
</body>
</html>`
}
