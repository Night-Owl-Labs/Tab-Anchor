(async () => {
  const logoEl = document.getElementById('anchorLogo');
  const boundsEl = document.getElementById('bounds');

  try {
    // Ensure Tab-Anchor/icons/anchor.png exists
    logoEl.src = chrome.runtime.getURL('src/icons/anchor.png');

    const { targetBounds } = await chrome.storage.local.get({ targetBounds: null });
    if (!targetBounds) {
      boundsEl.textContent = 'None';
    } else {
      const { left, top, width, height } = targetBounds;
      boundsEl.textContent = JSON.stringify({ left, top, width, height }, null, 2);
    }
  } catch (err) {
    boundsEl.textContent = `Error: ${String(err)}`;
    console.error(err);
  }

  // Give the image/bounds a moment to display
  // setTimeout(() => window.close(), 5000);
})();
