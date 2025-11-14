const KEY_TARGET_BOUNDS = "targetBounds";
const KEY_ANCHOR_WINDOW_ID = "anchorWindowId";

const useCurrentBtn = document.getElementById("useCurrent");
const openOptionsBtn = document.getElementById("openOptions");
const showBoundsBtn = document.getElementById("showBounds");

// Save current window as anchor
useCurrentBtn.addEventListener("click", async () => {
  const w = await chrome.windows.getCurrent();
  if (typeof w.left !== "number" || typeof w.top !== "number") {
    alert("Could not read window position on this platform.");
    return;
  }
  const targetBounds = {
    left: w.left,
    top: w.top,
    width: w.width || 1200,
    height: w.height || 800
  };
  await chrome.storage.local.set({
    [KEY_TARGET_BOUNDS]: targetBounds,
    [KEY_ANCHOR_WINDOW_ID]: null
  });

  alert(
    "Anchor dropped!\n\n" +
    "Links and pop-ups will now be opened here."
  );
});

// Open full options page
openOptionsBtn.addEventListener("click", async () => {
  await chrome.runtime.openOptionsPage();
});

// Show anchor area overlay (same as Options “Show anchor area”)
showBoundsBtn.addEventListener("click", async () => {
  // 1) Check locally first
  const { targetBounds } = await chrome.storage.local.get({ targetBounds: null });

  if (!targetBounds) {
    alert(
      "No anchor has been dropped yet.\n\n" +
      'Open the window on the monitor you want new tabs to appear on, then click “Anchor tabs here.”'
    );
    return;
  }

  // 2) Anchor exists → ask background to open the overlay
  const resp = await chrome.runtime.sendMessage({ type: "SHOW_BOUNDS" });

  if (resp && resp.ok === false) {
    const msg = resp.error || resp.message || "(unknown)";
    console.warn("Failed showing bounds:", msg);
  }
});


