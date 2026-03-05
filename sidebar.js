const SITE_NAMES = {
  'mail.google.com': 'Gmail',
  'inbox.google.com': 'Gmail',
  'www.google.com': 'Google',
  'google.com': 'Google',
  'www.facebook.com': 'Facebook',
  'facebook.com': 'Facebook',
  'www.messenger.com': 'Messenger',
  'twitter.com': 'Twitter',
  'x.com': 'X',
  'www.reddit.com': 'Reddit',
  'reddit.com': 'Reddit',
  'github.com': 'GitHub',
  'www.github.com': 'GitHub',
  'www.youtube.com': 'YouTube',
  'outlook.live.com': 'Outlook',
  'outlook.office.com': 'Outlook',
  'outlook.office365.com': 'Outlook',
  'web.whatsapp.com': 'WhatsApp',
  'app.slack.com': 'Slack',
  'discord.com': 'Discord',
  'www.instagram.com': 'Instagram',
  'instagram.com': 'Instagram',
  'www.linkedin.com': 'LinkedIn',
  'linkedin.com': 'LinkedIn',
  'teams.microsoft.com': 'Teams',
  'www.twitch.tv': 'Twitch',
  'www.pinterest.com': 'Pinterest',
  'www.tiktok.com': 'TikTok',
  'traderie.com': 'Traderie',
  'www.traderie.com': 'Traderie',
  'acurast.com': 'Acurast',
  'www.acurast.com': 'Acurast',
  'avanza.se': 'Avanza',
  'www.avanza.se': 'Avanza',
  'kraken.com': 'Kraken',
  'www.kraken.com': 'Kraken',
  'paypal.com': 'PayPal',
  'www.paypal.com': 'PayPal',
  'stackoverflow.com': 'Stack Overflow',
  'www.stackoverflow.com': 'Stack Overflow',
  'loopia.se': 'Loopia',
  'www.loopia.se': 'Loopia',
  'bokio.se': 'Bokio',
  'www.bokio.se': 'Bokio',
  'kalmar.se': 'Kalmar',
  'www.kalmar.se': 'Kalmar',
  'linktr.ee': 'Linktree',
  'www.linktr.ee': 'Linktree',
  'klarna.se': 'Klarna',
  'www.klarna.se': 'Klarna',
  'klarna.com': 'Klarna',
  'www.klarna.com': 'Klarna',
  'alienaa.com': 'Alienaa',
  'www.alienaa.com': 'Alienaa',
  'privateemail.com': 'Private Email',
  'www.privateemail.com': 'Private Email',
}

const PRIVATE_IP = /^(localhost|127\.\d+\.\d+\.\d+|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/

function getSiteName(url) {
  try {
    const hostname = new URL(url).hostname
    if (PRIVATE_IP.test(hostname)) return 'Local Network'
    return SITE_NAMES[hostname] || hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

// Detects notification counts from tab titles.
// Supports: "(3) Title", "[3] Title", "3 | Title", "• Title", "Title (3)"
function parseNotificationCount(title) {
  let m

  m = title.match(/^\((\d+)\)\s*/)
  if (m) return { count: parseInt(m[1]), cleanTitle: title.slice(m[0].length) }

  m = title.match(/^\[(\d+)\]\s*/)
  if (m) return { count: parseInt(m[1]), cleanTitle: title.slice(m[0].length) }

  m = title.match(/^(\d+)\s*\|\s*/)
  if (m) return { count: parseInt(m[1]), cleanTitle: title.slice(m[0].length) }

  m = title.match(/^[•·]\s*/)
  if (m) return { count: 1, cleanTitle: title.slice(m[0].length) }

  m = title.match(/\s*\((\d+)\)$/)
  if (m) return { count: parseInt(m[1]), cleanTitle: title.slice(0, title.length - m[0].length) }

  return null
}

async function refresh() {
  const tabs = await browser.tabs.query({})
  const notifications = []

  for (const tab of tabs) {
    if (!tab.title || !tab.url) continue
    if (tab.url.startsWith('about:') || tab.url.startsWith('moz-extension:')) continue
    if (tab.discarded) continue

    const parsed = parseNotificationCount(tab.title)
    if (parsed) {
      notifications.push({
        tabId: tab.id,
        windowId: tab.windowId,
        title: parsed.cleanTitle,
        url: tab.url,
        favIconUrl: tab.favIconUrl || '',
        count: parsed.count,
        site: getSiteName(tab.url),
      })
    }
  }

  // Deduplicate by domain: collapse multiple tabs from the same site into one
  // entry, keeping the one with the highest notification count.
  const byDomain = new Map()
  for (const n of notifications) {
    try {
      const hostname = new URL(n.url).hostname
      const existing = byDomain.get(hostname)
      if (!existing || n.count > existing.count) {
        byDomain.set(hostname, n)
      }
    } catch {
      // malformed URL, keep as-is under its own key
      byDomain.set(n.url, n)
    }
  }

  render(Array.from(byDomain.values()))
}

function render(notifications) {
  const container = document.getElementById('notifications')
  const countEl = document.getElementById('count')

  countEl.textContent = `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`

  while (container.firstChild) container.removeChild(container.firstChild)

  if (notifications.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'empty'
    const icon = document.createElement('div')
    icon.className = 'empty-icon'
    icon.textContent = '✓'
    const text = document.createElement('p')
    text.textContent = 'No tab notifications'
    empty.appendChild(icon)
    empty.appendChild(text)
    container.appendChild(empty)
    return
  }

  for (const n of notifications) {
    const card = document.createElement('div')
    card.className = 'card'

    const iconDiv = document.createElement('div')
    iconDiv.className = 'card-icon'
    if (n.favIconUrl) {
      const img = document.createElement('img')
      img.src = n.favIconUrl
      img.alt = ''
      img.className = 'favicon'
      img.addEventListener('error', () => { img.style.display = 'none' })
      iconDiv.appendChild(img)
    } else {
      const placeholder = document.createElement('div')
      placeholder.className = 'favicon-placeholder'
      iconDiv.appendChild(placeholder)
    }

    const content = document.createElement('div')
    content.className = 'card-content'

    const meta = document.createElement('div')
    meta.className = 'card-meta'

    const siteName = document.createElement('span')
    siteName.className = 'site-name'
    siteName.textContent = n.site
    meta.appendChild(siteName)

    if (n.count > 0) {
      const badge = document.createElement('span')
      badge.className = 'badge'
      badge.textContent = n.count
      meta.appendChild(badge)
    }

    const title = document.createElement('div')
    title.className = 'card-title'
    title.textContent = n.title

    const url = document.createElement('div')
    url.className = 'card-url'
    url.textContent = n.url

    content.appendChild(meta)
    content.appendChild(title)
    content.appendChild(url)
    card.appendChild(iconDiv)
    card.appendChild(content)

    card.addEventListener('click', () => {
      browser.tabs.update(n.tabId, { active: true })
      browser.windows.update(n.windowId, { focused: true })
    })

    container.appendChild(card)
  }
}

refresh()
document.getElementById('refresh').addEventListener('click', refresh)

browser.tabs.onUpdated.addListener(refresh)
browser.tabs.onRemoved.addListener(refresh)
browser.tabs.onCreated.addListener(refresh)
