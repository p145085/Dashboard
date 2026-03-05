# Notification Dashboard

A Firefox extension that aggregates browser tab notifications into a single dashboard. Instead of scanning your tabs for unread counts, open the dashboard and see everything at a glance — click any entry to jump straight to that tab.

## Features

- Detects unread notification counts from tab titles across all open tabs
- Deduplicates multiple tabs from the same site into a single entry
- Ignores discarded (suspended) tabs to avoid stale counts
- Recognises local/private network addresses as "Local Network"
- Click any notification entry to switch focus to that tab
- `Alt+Shift+D` hotkey to open or focus the dashboard

## Installation

This extension is not yet published to the Firefox Add-ons store. To load it manually:

1. Open Firefox and navigate to `about:debugging`
2. Click **This Firefox** in the left panel
3. Click **Load Temporary Add-on...**
4. Select the `manifest.json` file from this repository

The extension will remain loaded until Firefox is restarted. Repeat these steps after each restart.

## Usage

- Press **`Alt+Shift+D`** or click the toolbar button to open the dashboard tab
- Each card shows the site name, unread count badge, page title, and URL
- Click a card to switch directly to that tab
- Use the **↻** button in the top-right to manually refresh

### Tip — use with the Claude sidebar

Open the Claude sidebar (`Ctrl+Shift+A`) while the dashboard tab is active to have notifications and Claude visible side by side.

## How notification detection works

Tab titles are scanned for common unread count patterns:

| Pattern | Example |
|---|---|
| `(N) Title` | `(3) Inbox - Gmail` |
| `[N] Title` | `[2] Reddit` |
| `N \| Title` | `5 \| GitHub` |
| `• Title` | `• Discord` |
| `Title (N)` | `LinkedIn (4)` |

## Supported sites

Gmail, Google, Facebook, Messenger, Twitter, X, Reddit, GitHub, YouTube, Outlook, WhatsApp, Slack, Discord, Instagram, LinkedIn, Microsoft Teams, Twitch, Pinterest, TikTok, Traderie, Acurast, Avanza, Kraken, PayPal, Stack Overflow, Loopia, Bokio, Kalmar, Linktree, Klarna, Alienaa, Private Email, and any local network address.

Any unlisted site will fall back to its domain name automatically.

## Customising the hotkey

Go to `about:addons` → click the cog icon → **Manage Extension Shortcuts** to change `Alt+Shift+D` to a combination of your choice.
