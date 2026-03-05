const SITE_NAMES = {
  'mail.google.com': 'Gmail',
  'inbox.google.com': 'Gmail',
  'www.facebook.com': 'Facebook',
  'facebook.com': 'Facebook',
  'www.messenger.com': 'Messenger',
  'twitter.com': 'Twitter',
  'x.com': 'X',
  'www.reddit.com': 'Reddit',
  'reddit.com': 'Reddit',
  'github.com': 'GitHub',
  'www.youtube.com': 'YouTube',
  'outlook.live.com': 'Outlook',
  'outlook.office.com': 'Outlook',
  'outlook.office365.com': 'Outlook',
  'web.whatsapp.com': 'WhatsApp',
  'app.slack.com': 'Slack',
  'discord.com': 'Discord',
  'www.instagram.com': 'Instagram',
  'www.linkedin.com': 'LinkedIn',
  'teams.microsoft.com': 'Teams',
  'www.twitch.tv': 'Twitch',
  'www.pinterest.com': 'Pinterest',
  'www.tiktok.com': 'TikTok',
}

function getSiteName(url) {
  try {
    const hostname = new URL(url).hostname
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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

async function refresh() {
  const tabs = await browser.tabs.query({})
  const notifications = []

  for (const tab of tabs) {
    if (!tab.title || !tab.url) continue
    if (tab.url.startsWith('about:') || tab.url.startsWith('moz-extension:')) continue

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

  if (notifications.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <div class="empty-icon">&#10003;</div>
        <p>No tab notifications</p>
      </div>
    `
    return
  }

  container.innerHTML = notifications
    .map(
      (n) => `
      <div class="card" data-tab-id="${n.tabId}" data-window-id="${n.windowId}">
        <div class="card-icon">
          ${n.favIconUrl
            ? `<img src="${escapeHtml(n.favIconUrl)}" alt="" class="favicon" onerror="this.style.display='none'">`
            : '<div class="favicon-placeholder"></div>'}
        </div>
        <div class="card-content">
          <div class="card-meta">
            <span class="site-name">${escapeHtml(n.site)}</span>
            ${n.count > 0 ? `<span class="badge">${n.count}</span>` : ''}
          </div>
          <div class="card-title">${escapeHtml(n.title)}</div>
          <div class="card-url">${escapeHtml(n.url)}</div>
        </div>
      </div>
    `
    )
    .join('')

  container.querySelectorAll('.card').forEach((card) => {
    card.addEventListener('click', () => {
      const tabId = parseInt(card.dataset.tabId)
      const windowId = parseInt(card.dataset.windowId)
      browser.tabs.update(tabId, { active: true })
      browser.windows.update(windowId, { focused: true })
    })
  })
}

refresh()
document.getElementById('refresh').addEventListener('click', refresh)

browser.tabs.onUpdated.addListener(refresh)
browser.tabs.onRemoved.addListener(refresh)
browser.tabs.onCreated.addListener(refresh)
