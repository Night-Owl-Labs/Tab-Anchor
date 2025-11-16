# Changelog

All notable changes to **Tab Anchor** will be documented in this file.

The format follows the guidelines of  
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/)  
and adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] – 2025-11-16

### Added
- Initial public release of **Tab Anchor**.
- Ability to “drop” an anchor on any monitor to route new tabs and pop-ups to a chosen window.
- **Hyperlinks-only mode** for routing only target=_blank links and pop-ups.
- **Reuse or create new window** toggle for anchor behavior.
- **Anchor focus behavior**: optionally activate the moved tab and focus the anchor window.
- **Anchor area overlay** with blue dashed outline + dark theme preview.
- Fully themed **dark UI** for popup and options pages with Night Owl Labs branding.
- **Context menu command**: “Open Link in Current Window (Ignore Anchor)”.
- **Error-safe handling** when no anchor has been dropped (alerts in both popup and options).
- **Robust background routing engine** with tab placement logic and monitor detection.
- **Extension icons and branding** (blue #5daeff + anchor glyph).
- **Complete folder structure refactor** (`src/html`, `src/js`, `src/icons`).
- CSP-compliant script loading (removed inline scripts).
- Added footer with links to GitHub, Buy Me a Coffee, and Night Owl Labs.

---

## [Unreleased]

### Planned
- Support for per-site routing rules.
- Disable anchor for specific domains or windows.
- Customizable overlay duration and styling.
- Multi-anchor mode for advanced workflows.

---

[1.0.0]: https://github.com/Night-Owl-Labs/Tab-Anchor/releases/tag/v1.0.0
