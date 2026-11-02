import { useData } from './data.js'
import { ALL, POLITICAL, byLegacyText } from './timeline.js'

// Legacy's bibliography page (bibliography.php, modules/bibliography.php):
// the bibliography of one record — an item, a historical profile — or of a
// country's timelines — one theme's, the political context's, or all of
// them — in each language legacy has it in. A query of one of three shapes:
// `item`, an item's id; `profile`, a historical profile's id; `country` with
// `theme`, as the timeline's own query (composables/timeline.js).
//
// Each list is in the order legacy listed it, which is the package's own; a
// country's timelines together, legacy listed once each, by text.

const { collections, entity, labelOf, timelines, translations, tr } = useData()

// The package keys a timeline's lists by language id (ISO 639-3), and an
// item's and a profile's by code; the page reads codes.
function byCode(lists) {
  const codes = new Map((entity('languages').value ?? []).map((row) => [row.id, row.code]))
  return Object.fromEntries(
    Object.entries(lists ?? {})
      .map(([key, list]) => [codes.get(key) ?? key, Array.isArray(list) ? list.filter((entry) => typeof entry === 'string' && entry.trim()) : []])
      .filter(([, list]) => list.length),
  )
}

/** The country's timelines the query names. */
function timelinesOf({ country, theme }) {
  return (timelines.value ?? []).filter((row) => {
    if (row.country_id !== country) return false
    if (theme === ALL) return true
    if (theme === POLITICAL) return !row.collection_id
    return row.collection_id === theme
  })
}

function itemLists(id, languages) {
  // Every translation of the item carries the same lists.
  for (const code of languages) {
    const lists = translations('items', code)?.[id]?.structured_bibliography
    if (lists) return byCode(lists)
  }
  return {}
}

/** The query's lists, by language code. */
export function bibliographyOf(query, itemLanguages = []) {
  if (query.item) return itemLists(query.item, itemLanguages)
  if (query.profile) return byCode(tr('collections', query.profile)?.extra?.bibliography)
  if (!query.country || query.country === ALL || !query.theme) return {}
  const rows = timelinesOf(query)
  if (query.theme !== ALL) return byCode(rows[0]?.extra?.bibliography)
  const merged = {}
  for (const row of rows) {
    for (const [code, list] of Object.entries(byCode(row.extra?.bibliography))) merged[code] = [...(merged[code] ?? []), ...list]
  }
  return Object.fromEntries(
    Object.entries(merged).map(([code, list]) => [code, [...new Set(list)].sort((a, b) => byLegacyText(a, b))]),
  )
}

/** Whether the query has a bibliography, as legacy's link to it asks. */
export function hasBibliography(query, itemLanguages) {
  return Object.keys(bibliographyOf(query, itemLanguages)).length > 0
}

/**
 * The line over the list: nothing for an item; "Historical Profiles |
 * country" for a profile; "theme | country" for timelines, the theme
 * "All Themes" when every theme is asked.
 */
export function bibliographyTitle(query, t) {
  if (query.profile) {
    const record = (collections.value ?? []).find((c) => c.id === query.profile)
    return `${t('sharinghistory.bib.profiles')} | ${record?.country_id ? labelOf('countries', record.country_id) : ''}`
  }
  if (!query.country) return ''
  const country = labelOf('countries', query.country)
  if (query.theme === ALL) return `${t('sharinghistory.tle.allThemes')} | ${country}`
  const exhibitionId = query.theme === POLITICAL ? timelinesOf(query)[0]?.exhibition_id : query.theme
  const exhibition = (collections.value ?? []).find((c) => c.id === exhibitionId)
  const theme = exhibition
    ? tr('collections', exhibition.id)?.title ?? exhibition.internal_name
    : query.theme === POLITICAL ? t('sharinghistory.timeline.politicalContext') : ''
  return `${theme} | ${country}`
}

/** The page's address for a query. */
export function bibliographyLink(query, lang) {
  return { name: 'bibliography', query: { ...query, lang } }
}
