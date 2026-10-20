// A text legacy doesn't have is dropped, never written (D2,
// inventory-app#2233): every static text of this site comes from legacy
// through inventory-app's `scripts/site-i18n`. viewer-core's `t()` returns
// the entry name itself when no catalogue holds the entry, so that is how
// a missing text shows, and the element that would carry it is left out
// rather than printing its own name.
export function hasText(t, key) {
  return Boolean(key) && t(key) !== key
}

// The links of a menu or a link list whose label is a text legacy has.
export function withTexts(t, links) {
  return Array.isArray(links) ? links.filter((link) => hasText(t, link.label)) : links
}
