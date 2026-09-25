import {
  CATALOGUE_DATE_MODE, CATALOGUE_PAGE_SIZE, centuryPresets, objectsAndMonumentsSummary, searchFieldOptions,
  searchFields, searchRowKeys, searchSummary, useFieldSearch,
} from '@museumwnf/viewer-core'
import { exhibitionTree } from './exhibitions.js'
import { useData } from './data.js'

// The catalogue spec: what this website's lists filter and search on. The
// engine — query state, options, dates, pages, the keyword grammar, the
// fields of the legacy search form, the keyword rows, the index, the
// "searched for" summary, the result row — is viewer-core's catalogue layer
// and viewer-layout's views; what is declared here is only what is this
// website's: the scope rule, the two record facets of the Permanent
// Collection, and the exhibition scope legacy's pclist_all.php offered as
// "Theme / Subtheme / Chapter", folded into the `permanentCollection` spec
// below that viewer-layout's `CatalogueResultsView` renders directly. Two
// entrances and one results page read this one declaration.

const {
  collections, countries, exhibitions, exhibitionThemes, itemRow, itemVisible, labelOf, mdStrip, partners, tr,
} = useData()

// The predicate declared once, as `visible.items`, in data.js — re-exported
// under this name because viewer-core's own generic entity access (the
// keyword index below, `useFeaturedRecord` on dataset.config.js's `home`,
// this spec's own `scope`) reads the raw entity by name and applies no site
// rule of its own, so each of those needs the rule directly rather than
// through the composable's already-filtered `items`.
export const inScope = itemVisible

// The eight fields of database.php: Sharing History's form is the one with
// no period/dynasty field (Islamic Art's has one). `text` is the record's
// translation in the search language, with English behind it; `keyword` and
// `location` also carry `item.country_id` — legacy's own rule for these two
// fields (`database_results.php`'s keyword/location country match) —
// Decision D3's `countryExpansion` turns a typed country name into its id,
// and a field only benefits from that when its own haystack has the id to
// match against.
export const SEARCH_FIELDS = searchFields()

// ── The facets of the Permanent Collection ─────────────────────────────────
//
// Countries and institutions by name. A value the reference entity does not
// carry is not offered: the label would be an id.

export const FACETS = {
  country: {
    field: 'country_id',
    label: (id) => labelOf('countries', id),
    include: (id) => (countries.value ?? []).some((c) => c.id === id),
  },
  partner: {
    field: 'partner_id',
    label: (id) => labelOf('partners', id),
    include: (id) => (partners.value ?? []).some((p) => p.id === id),
  },
}

// ── The exhibition scope ───────────────────────────────────────────────────
//
// Legacy pclist_all.php filters the Permanent Collection by exhibition
// ("Theme"), exhibition theme ("Subtheme") and subtheme ("Chapter").
// Membership is the collections' items[] lists; an exhibition-level filter
// covers the exhibition and every theme/chapter below it. Country-specific
// National Context variants (purpose "national-context", #1505) hang under
// exhibitions but are not part of the theme tree, so their items stay out.

// National Context collections (purpose "national-context", #1505) carry no
// title in any language — the importer writes only the internal name and the
// country (sh-national-context-importer.ts) — because legacy never named
// them on their own either: every list joined the country name instead
// (class.nationalcontext.inc.php). Read through `labelOf`, not `tr(...).title`,
// so a missing English translation still resolves.
export function collectionTitle(collection) {
  if (collection.purpose === 'national-context') return labelOf('countries', collection.country_id)
  return mdStrip(tr('collections', collection.id)?.title ?? collection.internal_name)
}

/** `[{ value, label }]` of the exhibitions, by title. */
export function exhibitionOptions() {
  return (exhibitions.value ?? [])
    .map((e) => ({ value: e.id, label: collectionTitle(e) }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

/** The themes of one exhibition, in their order. */
export function themeOptions(exhibitionId) {
  if (!exhibitionId) return []
  return exhibitionThemes(exhibitionId).map((theme) => ({ value: theme.id, label: collectionTitle(theme) }))
}

/** The chapters of one theme of one exhibition, in their order. */
export function chapterOptions(exhibitionId, themeId) {
  if (!exhibitionId || !themeId) return []
  const theme = exhibitionThemes(exhibitionId).find((candidate) => candidate.id === themeId)
  return (theme?.chapters ?? []).map((chapter) => ({ value: chapter.id, label: collectionTitle(chapter) }))
}

/**
 * Every item id attached to `collectionId` or any descendant, national
 * context excluded — `exhibitionTree.itemsUnder` (exhibitions.js), which
 * already stops at the same National Context boundary (`childType` keeps
 * only `theme`/`subtheme` children, so a National Context sibling, type
 * `collection`, is never walked into). Wrapped in a `Set` here only because
 * the filter cascade below tests membership by id, not because the tree
 * itself needs one.
 */
export function itemIdsUnder(collectionId) {
  return new Set(exhibitionTree.itemsUnder(collectionId))
}

export function collectionById(id) {
  return (collections.value ?? []).find((c) => c.id === id) ?? null
}

// ── The Permanent Collection, as a spec ─────────────────────────────────────
//
// What viewer-layout's `CatalogueResultsView` renders on
// `/permanent-collection/results`: the two facets above over every record,
// as legacy offered them, the two years, the standalone date rule,
// chronological order, twenty rows a page, and legacy's count phrased as "[N
// objects, M monuments]". The exhibition scope is `scope`, not a facet,
// because it narrows the record set by an id tree rather than by a value the
// record itself carries; the cascade's own options (exhibitionOptions /
// themeOptions / chapterOptions, above) stay out of the spec for the same
// reason and render in the view's `filters` slot instead. Every text is an
// entry name; the check that every name resolves reads them here.

// `scope` runs once per record, and the exhibition subtree it filters
// against does not change between those calls within one pass — only
// `scopedItemIds` is memoised, so a full page of records costs one walk of
// the collection tree rather than one per record.
let scopeCache = { collections: null, id: null, ids: null }
function scopedItemIds(id) {
  const current = collections.value
  if (scopeCache.collections !== current || scopeCache.id !== id) {
    scopeCache = { collections: current, id, ids: itemIdsUnder(id) }
  }
  return scopeCache.ids
}

// The shared record shape (`RecordList`/`RecordGrid`/`RelatedRecords`'
// contract) for one item, name/country/date only — no holder, unlike the
// Permanent Collection's own row, since a caller that already knows the
// holder (a partner's own held items) has no reason to repeat it. Shared by
// the timeline gallery and the partner sheet's held-items grid.
export const itemSummary = (item) => itemRow(item, ['country', 'dates'])

export const permanentCollection = {
  entity: 'items',
  keys: ['country', 'exhibition', 'theme', 'chapter', 'partner', 'begin', 'end'],
  facets: FACETS,
  facetScope: 'all',
  scope: (item, filters) => {
    if (!inScope(item)) return false
    const scopeId = filters.chapter || filters.theme || filters.exhibition
    return !scopeId || scopedItemIds(scopeId).has(item.id)
  },
  controls: [
    { key: 'country', label: 'catalogue.facet.country', anyLabel: 'catalogue.facet.any' },
    { key: 'partner', label: 'catalogue.facet.holdingInstitution', anyLabel: 'catalogue.facet.any' },
    { key: 'begin', type: 'year', label: 'catalogue.facet.fromYear', placeholder: 'timeline.form.fromYearHint' },
    { key: 'end', type: 'year', label: 'catalogue.facet.toYear', placeholder: 'timeline.form.toYearHint' },
  ],
  filterMode: 'apply',
  filterTitle: 'catalogue.filter.heading',
  dates: { mode: CATALOGUE_DATE_MODE },
  sort: 'chronological',
  pageSize: CATALOGUE_PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsFilter',
  pagination: { window: 7 },

  // The row: the thumbnail, the name, the country, the date and the holder,
  // the holder only when the package carries the partner, so a label is
  // never an id.
  record: (item) => itemRow(item, ['country', 'dates', 'holder']),

  summary: objectsAndMonumentsSummary,
}

// ── The search entrance and the keyword results ────────────────────────────
//
// `DatabaseSearch.vue`'s `SearchFormView` spec (legacy database.php's shape,
// decision D2: three keyword rows, the century date boundaries, the search
// language) and `DatabaseResults.vue`'s `CatalogueResultsView` spec. The
// index behind the results page — a live composable tied to the results
// page's own search language, decision D3's `rank: 'hits'` and the glossary/
// country expansions — is `useFieldSearch`'s, kept here so the module holds
// one instance for the site's life rather than one per mount.

export const databaseSearch = {
  mode: 'rows',
  entity: 'items',
  fields: searchFieldOptions(SEARCH_FIELDS),
  dates: { presets: centuryPresets },
  language: 'items',
  target: 'database-results',
}

const { narrow } = useFieldSearch({ fields: SEARCH_FIELDS })

export const databaseResults = {
  entity: 'items',
  keys: [...searchRowKeys(), 'from', 'to', 'lang'],
  scope: (item) => inScope(item),
  narrow,
  dates: { mode: CATALOGUE_DATE_MODE, begin: 'from', end: 'to' },
  // `rank: 'hits'` already ordered the matches (or the entity order stood,
  // on an empty query); resorting here would discard that order.
  sort: false,
  pageSize: CATALOGUE_PAGE_SIZE,
  variant: 'list',
  recordRoute: 'item',
  empty: 'catalogue.results.noResultsSearch',
  filterTitle: 'catalogue.search.refineHint',
  pagination: { window: 7 },
  // Legacy database_results.php's own row: the country, the date and the
  // location, distinct from the Permanent Collection's.
  record: (item) => itemRow(item, ['country', 'dates', 'location']),
  summary: searchSummary,
}
