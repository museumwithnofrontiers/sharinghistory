import { DECADES, collectionTitle, itemIdsUnder, resultTile } from './catalogue.js'
import { unpublishedItemsUnder } from './exhibitions.js'
import { useData } from './data.js'

// Legacy's timeline (hcr_home.php, hcr_result.php, hcr_gallery.php): the
// lists of its two forms, its search, its rows with their pictures, the
// lines of words over the results and in the Word file, and its gallery.

const { timelines, timelineEvents, exhibitions, itemById, labelOf, tr, md } = useData()

function timelineOf(event) {
  return (timelines.value ?? []).find((row) => row.id === event.timeline_id) ?? null
}

// ── Legacy's timeline (hcr_home.php, hcr_result.php) ───────────────────────
//
// A query of four keys: `start` and `end`, legacy's periods (DECADES);
// `country`, a country's id or every country (ALL); `theme`, an exhibition's
// id, the political context (POLITICAL, legacy's exhibition 2) or every
// theme (ALL). A key left out is legacy's "none".

export const ALL = 'all'
export const POLITICAL = 'pc'
const BEFORE = DECADES[0]
const AFTER = DECADES[DECADES.length - 1]

// Legacy's ORDER BY on a name, as MySQL's utf8_general_ci compares.
const folded = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const byLabel = (a, b) => (folded(a.label) < folded(b.label) ? -1 : folded(a.label) > folded(b.label) ? 1 : 0)

/** The countries of the timelines, by name. */
export function timelineCountryOptions() {
  const ids = new Set((timelines.value ?? []).map((row) => row.country_id).filter(Boolean))
  return [...ids].map((id) => ({ value: id, label: labelOf('countries', id) })).sort(byLabel)
}

/** The exhibitions that have a timeline, by title. */
export function timelineThemeOptions() {
  return boundExhibitions().map((e) => ({ value: e.id, label: collectionTitle(e) })).sort(byLabel)
}

/** Whether a period runs forward: an end before its start is refused. */
export function periodRunsForward(start, end) {
  const from = DECADES.indexOf(start && start !== 'none' ? start : BEFORE)
  const to = DECADES.indexOf(end && end !== 'none' ? end : AFTER)
  return from <= to
}

// Legacy's SearchData(): the events of the period (its six cases), of the
// theme and of the country asked, by date.
function inLegacyPeriod(event, start, end) {
  const from = event.year_from
  const to = event.year_to ?? event.year_from
  if (start === BEFORE && end === BEFORE) return from < 1800 && to < 1800
  if (start === AFTER && end === AFTER) return from > 1930 && to > 1930
  if (start === BEFORE && end === AFTER) return true
  if (start === BEFORE) return from <= Number(end) && to <= Number(end)
  if (end === AFTER) return from >= Number(start)
  return from >= Number(start) && to <= Number(end)
}
/** The query's period, legacy's "none" read as its widest. */
export function periodOf(query) {
  return {
    start: query.start && query.start !== 'none' ? query.start : BEFORE,
    end: query.end && query.end !== 'none' ? query.end : AFTER,
  }
}

// Legacy printed a theme through ucwords(strtolower()).
const ucwords = (text) => String(text ?? '').toLowerCase().replace(/(^|\s)(\S)/g, (match, space, letter) => space + letter.toUpperCase())
function themeTitle(timeline, t) {
  if (!timeline?.collection_id) return t('sharinghistory.timeline.politicalContext')
  const exhibition = (exhibitions.value ?? []).find((e) => e.id === timeline.collection_id)
  return exhibition ? collectionTitle(exhibition) : ''
}
function queryThemeTitle(theme, t) {
  if (theme === POLITICAL) return t('sharinghistory.timeline.politicalContext')
  if (theme === ALL) return t('sharinghistory.tle.allThemes')
  const exhibition = (exhibitions.value ?? []).find((e) => e.id === theme)
  return exhibition ? collectionTitle(exhibition) : ''
}
function queryCountry(country, t) {
  if (country === ALL) return t('sharinghistory.tle.allCountries')
  return country && country !== 'none' ? labelOf('countries', country) : ''
}

/** Legacy's line over the results: "Before 1800 to After 1930 | AUSTRIA | POLITICAL CONTEXT". */
export function searchLine(query, t, separator = ' | ') {
  const { start, end } = periodOf(query)
  return [`${start} ${t('sharinghistory.tlr.to')} ${end}`, queryCountry(query.country, t), queryThemeTitle(query.theme, t)]
    .filter(Boolean)
    .map((part, index) => (index ? part.toUpperCase() : part))
    .join(separator)
}

/** The Word file's name, as legacy's export_hcr_content.php named it. */
export function wordFile(query) {
  const { start, end } = periodOf(query)
  const key = (record) => String(record?.backward_compatibility ?? '').split(':').pop()
  const theme = query.theme === POLITICAL ? '2' : query.theme === ALL ? 'All-Themes' : key((exhibitions.value ?? []).find((e) => e.id === query.theme)) || 'none'
  const country = query.country === ALL ? 'All-Countries' : query.country || 'none'
  return `${theme}-${country}-${start.replace(/ /g, '-')}-${end.replace(/ /g, '-')}-con.doc`
}

// An event's pictures, as legacy's sh_hcr_images listed them: its own
// pictures, then those of the items it shows, each with its words — the
// detail's justification, else the picture's caption, else the item's name —
// and an item's way to its sheet.
const plainText = (html) => String(html ?? '').replace(/<[^>]*>/g, '').trim()
function eventPictures(event) {
  const own = [...(event.images ?? [])]
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    .map((image) => ({ image: image.url, caption: plainText(image.alt_text), to: null }))
  const shown = (event.item_ids ?? []).map((id) => itemById.value.get(id)).filter((item) => item?.images?.length).map((item) => {
    const extra = Object.values(event.item_extras?.[item.id]?.texts ?? {})[0] ?? {}
    return {
      image: item.images[0].url,
      caption: plainText(extra.detail_justification || item.images[0].alt_text || labelOf('items', item.id)),
      to: { name: 'item', params: { id: item.id } },
    }
  })
  return [...own, ...shown]
}

/** One event as legacy's row: its date, "Country | Theme", its description and its pictures. */
export function eventRow(event, t) {
  const text = tr('timeline_events', event.id) ?? {}
  const from = text.date_from_description || String(event.year_from ?? '')
  const to = text.date_to_description || (event.year_to != null ? String(event.year_to) : '')
  const country = labelOf('countries', event.country_id)
  const theme = ucwords(themeTitle(timelineOf(event), t))
  return {
    id: event.id,
    date: !to || to === from ? from : `${from} - ${to}`,
    country: `${country}\u00a0|\u00a0${theme}`,
    place: country,
    theme,
    html: text.description ? md(text.description) : '',
    pictures: eventPictures(event),
  }
}

export function timelineSearch({ start, end, country, theme }) {
  const s = start && start !== 'none' ? start : BEFORE
  const e = end && end !== 'none' ? end : AFTER
  return (timelineEvents.value ?? [])
    .filter((event) => {
      const timeline = timelineOf(event)
      if (!timeline) return false
      if (theme === POLITICAL && timeline.collection_id) return false
      if (theme && theme !== POLITICAL && theme !== ALL && timeline.collection_id !== theme) return false
      if (country && country !== ALL && event.country_id !== country) return false
      return inLegacyPeriod(event, s, e)
    })
    .sort((a, b) => a.year_from - b.year_from || String(a.date_from ?? '').localeCompare(String(b.date_from ?? '')))
}

// Exhibitions that actually have a timeline bound to them — the legacy
// toggle only ever offered a thematic choice for one that exists.
function boundExhibitions() {
  const boundIds = new Set((timelines.value ?? []).map((row) => row.collection_id).filter(Boolean))
  return (exhibitions.value ?? []).filter((e) => boundIds.has(e.id))
}

// ── The timeline gallery (hcr_gallery.php) ─────────────────────────────────
//
// The records the theme's exhibition places — its own, its themes' and its
// chapters' — of the country, in legacy's period,
// by date. The political context's exhibition is one legacy did not list
// (the timelines' `exhibition_id`, `published: false`); a package without it
// keeps decision D1's scope, the country's records of the period.

const politicalExhibition = () => (timelines.value ?? []).find((row) => !row.collection_id && row.exhibition_id)?.exhibition_id ?? null

function itemInLegacyPeriod(item, start, end) {
  const from = item.start_date
  const to = item.end_date ?? item.start_date
  if (start === BEFORE && end === AFTER) return true
  if (!Number.isFinite(from)) return false
  if (start === BEFORE && end === BEFORE) return from < 1800 && to < 1800
  if (start === AFTER && end === AFTER) return from > 1930 && to > 1930
  if (start === BEFORE) return from <= Number(end) && to <= Number(end)
  if (end === AFTER) return from >= Number(start)
  return from >= Number(start) && to <= Number(end)
}

export function timelineGallerySpec(query) {
  const { start, end } = periodOf(query)
  const exhibition = query.theme && query.theme !== POLITICAL && query.theme !== ALL ? query.theme : null
  const political = query.theme === POLITICAL ? politicalExhibition() : null
  const under = exhibition ? itemIdsUnder(exhibition) : political ? unpublishedItemsUnder(political) : null
  const country = query.country && query.country !== ALL && query.country !== 'none' ? query.country : null
  return {
    entity: 'items',
    keys: [],
    scope: (item) => (!under || under.has(item.id)) && (!country || item.country_id === country) && itemInLegacyPeriod(item, start, end),
    // Legacy's ORDER BY: the start, the end, the date's words, then the
    // record's country and number.
    sort: (list) => [...list].sort((a, b) => {
      const x = String(a.backward_compatibility ?? '').split(':')
      const y = String(b.backward_compatibility ?? '').split(':')
      return (a.start_date ?? 0) - (b.start_date ?? 0) || (a.end_date ?? 0) - (b.end_date ?? 0)
        || String(tr('items', a.id)?.dates ?? '').localeCompare(String(tr('items', b.id)?.dates ?? ''))
        || String(x[3] ?? '').localeCompare(String(y[3] ?? '')) || Number(x[4]) - Number(y[4])
    }),
    pageSize: 20,
    record: resultTile,
    summary: () => [],
    empty: 'sharinghistory.tlr.empty',
  }
}

// ── The item's timeline window (hcr.php) ───────────────────────────────────

/** Whether a country has events: legacy offered "Timeline for this item" then. */
export function hasEvents(country) {
  return Boolean(country) && (timelineEvents.value ?? []).some((event) => event.country_id === country)
}

/** "1850 - 1900 A.D.", legacy's AD term. */
export const yearLabel = (t, years) => t('sharinghistory.hcr.ad').replace('[DATE]', String(years))

// The window's search: the country and century it was changed to, else the
// item's own country and dates; a chosen century runs a hundred years.
export function itemTimelineSearch(item, query) {
  const country = query.country || item?.country_id || ''
  if (query.start !== undefined && query.start !== '') return { country, start: Number(query.start), end: Number(query.start) + 100 }
  return { country, start: Number(item?.start_date) || 0, end: Number(item?.end_date) || 0 }
}

// Its time range, as legacy listed it: the centuries from the country's
// earliest event end up to the period, the period itself, then on to its
// latest event's start.
export function rangeOptions(search, t) {
  const events = (timelineEvents.value ?? []).filter((event) => event.country_id === search.country)
  const min = events.length ? Math.min(...events.map((event) => Number(event.year_to ?? event.year_from) || 0)) : 0
  const max = events.length ? Math.max(...events.map((event) => Number(event.year_from) || 0)) : 0
  const option = (value, from, to) => ({ value, label: yearLabel(t, `${from} - ${to}`) })
  const list = []
  let year = Math.floor(min / 100) * 100
  while (year + 100 < search.start) {
    list.push(option(year, year, year + 100))
    year += 100
  }
  list.push(option(year, year, search.start))
  list.push(option(search.start, search.start, search.end))
  for (year = search.end; year < max; year += 100) list.push(option(year, year, year + 100))
  return list
}

// HCRList::getObjects(): of the country, an event with an end running into
// the period, one without falling inside it, by its first year.
export function hcrEvents(search, t) {
  return (timelineEvents.value ?? [])
    .filter((event) => {
      if (event.country_id !== search.country) return false
      const from = Number(event.year_from) || 0
      const to = Number(event.year_to) || 0
      return to ? to > search.start && from < search.end : from > search.start && from < search.end
    })
    .sort((a, b) => a.year_from - b.year_from)
    .map((event) => {
      const text = tr('timeline_events', event.id) ?? {}
      const years = event.year_to ? `${event.year_from} - ${event.year_to}` : String(event.year_from)
      return { id: event.id, date: yearLabel(t, years), country: '', html: text.description ? md(text.description) : '' }
    })
}
