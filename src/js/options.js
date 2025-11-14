const KEY_TARGET_BOUNDS    = "targetBounds";
const KEY_REUSE_EXISTING   = "reuseExisting";
const KEY_ANCHOR_WINDOW_ID = "anchorWindowId";
const KEY_HYPERLINKS_ONLY  = "hyperlinksOnly";
const KEY_FOCUS_MOVED      = "focusMoved";

document.addEventListener("DOMContentLoaded", () => {
  // Query after DOM is ready
  const boundsEl          = document.getElementById("bounds");
  const reuseEl           = document.getElementById("reuseExisting");
  const hyperlinksOnlyEl  = document.getElementById("hyperlinksOnly");
  const focusMovedEl      = document.getElementById("focusMoved");
  const useCurrentBtn     = document.getElementById("useCurrent");
  const resetBtn          = document.getElementById("reset");
  const showBoundsBtn     = document.getElementById("showBounds");

  // Guard: if any critical element is missing, bail with a clear log
  if (!boundsEl || !reuseEl || !hyperlinksOnlyEl || !focusMovedEl || !useCurrentBtn || !resetBtn || !showBoundsBtn) {
    console.error("[Tab Anchor] Options: one or more elements not found. Check IDs in options.html.");
    return;
  }

  async function refresh() {
    const { targetBounds, reuseExisting, hyperlinksOnly, focusMoved } =
      await chrome.storage.local.get({
        targetBounds:  null,
        reuseExisting: true,
        hyperlinksOnly:true,
        focusMoved:    true
      });

    boundsEl.textContent = targetBounds
      ? JSON.stringify(targetBounds, null, 2)
      : "None";

    reuseEl.checked          = !!reuseExisting;
    hyperlinksOnlyEl.checked = !!hyperlinksOnly;
    focusMovedEl.checked     = !!focusMoved;
  }

  reuseEl.addEventListener("change", async () => {
    await chrome.storage.local.set({ reuseExisting: reuseEl.checked });
  });

  hyperlinksOnlyEl.addEventListener("change", async () => {
    await chrome.storage.local.set({ hyperlinksOnly: hyperlinksOnlyEl.checked });
  });

  focusMovedEl.addEventListener("change", async () => {
    await chrome.storage.local.set({ focusMoved: focusMovedEl.checked });
  });

  useCurrentBtn.addEventListener("click", async () => {
    const w = await chrome.windows.getCurrent();
    if (typeof w.left !== "number" || typeof w.top !== "number") {
      alert("Could not read window position on this platform.");
      return;
    }
    const targetBounds = {
      left:   w.left,
      top:    w.top,
      width:  w.width  || 1200,
      height: w.height || 800
    };
    await chrome.storage.local.set({
      [KEY_TARGET_BOUNDS]:    targetBounds,
      [KEY_ANCHOR_WINDOW_ID]: null
    });
    await refresh();

    alert(
      "Anchor dropped!\n\n" +
      "Links and pop-ups will now be opened here."
    );
  });

  resetBtn.addEventListener("click", async () => {
    await chrome.storage.local.set({
      [KEY_TARGET_BOUNDS]:    null,
      [KEY_ANCHOR_WINDOW_ID]: null
    });
    await refresh();
    alert("Saved anchor cleared.");
  });

  // Show anchor area overlay with a local check first
  showBoundsBtn.addEventListener("click", async () => {
    try {
      const { targetBounds } = await chrome.storage.local.get({ targetBounds: null });

      const hasAnchor =
        targetBounds &&
        typeof targetBounds.left   === "number" &&
        typeof targetBounds.top    === "number" &&
        typeof targetBounds.width  === "number" &&
        typeof targetBounds.height === "number";

      if (!hasAnchor) {
        alert(
          "No anchor has been dropped yet.\n\n" +
          'Open the window on the monitor you want new tabs to appear on, then click “Anchor tabs here.”'
        );
        return;
      }

      const resp = await chrome.runtime.sendMessage({ type: "SHOW_BOUNDS" });

      if (resp && resp.ok === false) {
        const msg = resp?.error || resp?.message || "(unknown)";
        console.warn("Failed showing bounds:", msg);
      }
    } catch (err) {
      console.error("Show bounds error:", err);
    }
  });

  // Initial paint
  refresh();

  // Set dynamic year without inline script (CSP-safe)
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});
