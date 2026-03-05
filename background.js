const DASHBOARD_URL = browser.runtime.getURL('sidebar.html')

async function openOrFocusDashboard() {
  const tabs = await browser.tabs.query({ url: DASHBOARD_URL })
  if (tabs.length > 0) {
    await browser.tabs.update(tabs[0].id, { active: true })
    await browser.windows.update(tabs[0].windowId, { focused: true })
  } else {
    await browser.tabs.create({ url: DASHBOARD_URL })
  }
}

browser.browserAction.onClicked.addListener(openOrFocusDashboard)
browser.commands.onCommand.addListener((command) => {
  if (command === 'open-dashboard') openOrFocusDashboard()
})
