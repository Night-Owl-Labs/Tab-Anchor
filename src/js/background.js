// Tab Anchor v1.0.0
// Storage keys
const KEY_TARGET_BOUNDS   = "targetBounds";      // { left, top, width, height }
const KEY_REUSE_EXISTING  = "reuseExisting";     // boolean
const KEY_ANCHOR_WINDOW_ID= "anchorWindowId";    // persistent window id when reusing
const KEY_HYPERLINKS_ONLY = "hyperlinksOnly";    // boolean (default true)
const KEY_FOCUS_MOVED     = "focusMoved";        // focus moved/created tab (default true)

// In-session ignore list for context-menu opens
const sessionIgnore = new Set();

async function getSettings() {
  const {
    targetBounds, reuseExisting, anchorWindowId,
    hyperlinksOnly, focusMoved
  } = await chrome.storage.local.get({
    targetBounds: null,
    reuseExisting: true,
    anchorWindowId: null,
    hyperlinksOnly: true,
    focusMoved: true
  });
  return { targetBounds, reuseExisting, anchorWindowId, hyperlinksOnly, focusMoved };
}

async function setSettings(update) {
  await chrome.storage.local.set(update);
}

// NOTE: no more "onSameMonitor" guessing for anchor selection.
// We'll always use the specific anchor window id if available,
// otherwise create a new window at the saved bounds.
async function getOrCreateAnchorWindow(targetBounds, forceNew = false) {
  if (!targetBounds) return null;

  const { anchorWindowId } = await getSettings();

  if (!forceNew && anchorWindowId) {
    try {
      const w = await chrome.windows.get(anchorWindowId, { populate: false });
      // If we can still read it, treat it as our anchor window
      return w;
    } catch {
      // Window might be gone; fall through and create a new one
    }
  }

  // Create a brand-new anchor window pinned to the saved bounds
  const created = await chrome.windows.create({
    url: "chrome://newtab",
    left:   targetBounds.left,
    top:    targetBounds.top,
    width:  targetBounds.width,
    height: targetBounds.height,
    focused: true
  });

  await setSettings({ anchorWindowId: created.id });
  return created;
}

// Focus helper
async function focusTabAndWindow(winId, tabId) {
  const { focusMoved } = await getSettings();
  if (!focusMoved) return;
  try {
    if (Number.isInteger(tabId)) {
      await chrome.tabs.update(tabId, { active: true });
    }
    if (Number.isInteger(winId)) {
      await chrome.windows.update(winId, { focused: true, drawAttention: false });
    }
  } catch {}
}

// Core opener that respects reuseExisting flag.
async function placeTabAccordingToMode(tabId, url = null) {
  const { targetBounds, reuseExisting } = await getSettings();
  if (!targetBounds) return;

  if (reuseExisting) {
    const win = await getOrCreateAnchorWindow(targetBounds, false);
    if (!win) return;
    try {
      await chrome.tabs.move(tabId, { windowId: win.id, index: -1 });
      if (url) await chrome.tabs.update(tabId, { url });
      await focusTabAndWindow(win.id, tabId);
    } catch {}
  } else {
    try {
      if (url && Number.isInteger(tabId)) {
        const w = await chrome.windows.create({
          tabId,
          left:   targetBounds.left,
          top:    targetBounds.top,
          width:  targetBounds.width,
          height: targetBounds.height,
          focused: true
        });
        await chrome.tabs.update(tabId, { url });
        await focusTabAndWindow(w.id, tabId);
      } else if (Number.isInteger(tabId)) {
        const w = await chrome.windows.create({
          tabId,
          left:   targetBounds.left,
          top:    targetBounds.top,
          width:  targetBounds.width,
          height: targetBounds.height,
          focused: true
        });
        await focusTabAndWindow(w.id, tabId);
      } else if (url) {
        const w = await chrome.windows.create({
          url,
          left:   targetBounds.left,
          top:    targetBounds.top,
          width:  targetBounds.width,
          height: targetBounds.height,
          focused: true
        });
        // Active tab is already focused in the new window
      }
    } catch {}
  }
}

// Context menu: open link in CURRENT window (ignore anchor)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openInCurrentWindowIgnoreAnchor",
    title: "Open Link in Current Window (Ignore Anchor)",
    contexts: ["link"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== "openInCurrentWindowIgnoreAnchor" || !info.linkUrl) return;
  if (!tab || typeof tab.windowId !== "number") return;

  const created = await chrome.tabs.create({
    windowId: tab.windowId,
    url: info.linkUrl,
    active: true
  });
  if (created && typeof created.id === "number") {
    sessionIgnore.add(created.id);
  }
});

// Hyperlink/pop-up hook
chrome.webNavigation.onCreatedNavigationTarget.addListener(async (details) => {
  await placeTabAccordingToMode(details.tabId, details.url);
});

// New tab/duplicate hook (only when hyperlinksOnly is false), skip context-menu bypasses
chrome.tabs.onCreated.addListener(async (tab) => {
  const { hyperlinksOnly } = await getSettings();
  if (sessionIgnore.has(tab.id)) {
    sessionIgnore.delete(tab.id);
    return;
  }
  if (hyperlinksOnly) return;

  await placeTabAccordingToMode(tab.id, tab.pendingUrl || null);
});

// Keep anchorWindowId honest
chrome.windows.onRemoved.addListener(async (windowId) => {
  const { anchorWindowId } = await getSettings();
  if (anchorWindowId === windowId) {
    await setSettings({ anchorWindowId: null });
  }
});

// Show bounds overlay via temporary popup
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg && msg.type === "SHOW_BOUNDS") {
    try {
      const { targetBounds } = await getSettings();
      if (!targetBounds) {
        sendResponse({ ok: false, error: "NO_ANCHOR" });
        return true;
      }
      await chrome.windows.create({
        url: chrome.runtime.getURL("src/html/overlay.html"),
        type: "popup",
        left:   targetBounds.left,
        top:    targetBounds.top,
        width:  Math.max(200, targetBounds.width),
        height: Math.max(150, targetBounds.height),
        focused: true
      });
      sendResponse({ ok: true });
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
    return true;
  }
});
