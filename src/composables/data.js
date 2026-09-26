import { computed } from 'vue'
import { useCatalogue } from '@museumwnf/viewer-core'
import { exhibitionAncestry, exhibitionsTree } from './exhibitions.js'

// The website's records, read the one way every website reads them: through
// viewer-core's catalogue data layer, lazily. Each entity is a shared ref
// that stays `null` until a route declaring it in `meta.entities` brings its
// chunk in, so importing this module loads nothing, and a page pays only for
// what it reads. The entity refs and lookups, the labels, the routes, the
// result row, the translations and the Markdown pipeline are
// `useCatalogue`'s. What is this website's own: the timeline and collection
// entities it reads on top, the visible rule below, the hand-written
// exhibition list/theme lookup the catalogue facets and timeline pages still
// read (the six exhibition pages themselves read the `useCollectionTree`
// form in exhibitions.js instead), and the reverse item→exhibition lookup.

// Items legacy kept only to illustrate Historical Background / timeline
// pages (display_status 'N') are excluded from database search and Permanent
// Collection browsing, exactly like the legacy site
// (modules/database_results.php AND o.display_status='A'). Declared once,
// as `visible.items`, so `items`/`catalogue.entity('items')` read it
// automatically. Exported too (as `itemVisible`, from `useData()`):
// viewer-core's own generic entity access — the keyword index,
// `useFeaturedRecord`, this site's own catalogue spec's `scope` — reads the
// raw entity by name and applies no site rule of its own, so each of those
// needs the rule directly, the way `catalogue.js`'s `inScope` re-exports it.
function itemVisible(item) {
  return item.display_status !== 'N'
}

// English is the base language of every catalogue in the platform: every
// list, label and fallback reads it. A record the visitor reads in another
// language is resolved on the sheet itself, by viewer-core's
// `useRecordLanguage`; which languages the site offers is decided once, in
// dataset.config.js, by viewer-core's `offeredLanguages` over this site's
// own declared list.
const defaultLang = 'en'

const catalogue = useCatalogue({
  eager: ['items', 'countries', 'partners', 'timeline_events', 'collections'],
  defaultLanguage: defaultLang,
  visible: {
    items: itemVisible,
  },
})
catalogue.loadEnglish()

const { tr } = catalogue

const timelines = catalogue.entity('timelines')
const timelineEvents = catalogue.entity('timeline_events')
const collections = catalogue.entity('collections')

// ── Exhibitions (the catalogue facets' and timeline pages' own lookup) ─────
//
// Imported as generic Collections, nested under a dedicated "Virtual
// Exhibitions" marker collection (purpose "exhibitions-root", a child of the
// Sharing History project collection, created by the importer's
// sh-exhibition-root-keying step, #1505). From that anchor: exhibitions are
// its children, themes are an exhibition's children, and — unlike the mwnf3
// datasets — a theme's children are SUBTHEMES ("Chapters" in the legacy UI),
// a full third narrative level with its own intro, quotation and item grid.
//
// Section anchors are resolved by `purpose` (#1505); backward_compatibility
// is informational only and never load-bearing here.

// The data package is single-context (one SH project), so each `*-root`
// purpose occurs at most once.
function findByPurpose(purpose) {
  return (collections.value ?? []).find((c) => c.purpose === purpose) ?? null
}

const exhibitions = computed(() => {
  const marker = findByPurpose('exhibitions-root')
  if (!marker) return []
  return (collections.value ?? [])
    .filter((c) => c.parent_id === marker.id)
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
})

// Country-specific "National Context" variants of an exhibition
// (purpose "national-context", type "collection") are attached under the
// exhibition collection but are NOT themes — they carry no English
// translations and legacy renders them through a separate country
// selector. Filtering on type "theme" keeps them out of the theme tree
// naturally (and they stay positively identifiable by purpose if National
// Context is ever rendered).

function exhibitionThemes(exhibitionId) {
  return (collections.value ?? [])
    .filter((c) => c.parent_id === exhibitionId && c.type === 'theme')
    .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999))
    .map((theme) => ({
      ...theme,
      chapters: (collections.value ?? [])
        .filter((c) => c.parent_id === theme.id)
        .sort((a, b) => (a.display_order ?? 9999) - (b.display_order ?? 9999)),
    }))
}

// ── Item cross-links: which exhibitions/themes/chapters feature a given
// item ─────────────────────────────────────────────────────────────────────
//
// No separate export is needed for this: collections.json already lists
// each collection's items[] (used to render Exhibition theme/page grids), so
// "which collections reference this item" is just a client-side reverse
// lookup over the same data.
//
// The reverse lookup — which exhibitions/themes/chapters an item is
// attached to — is `exhibitionsTree.containing(itemId)` (every collection
// that carries the item directly, exhibition tree or not) narrowed by
// `exhibitionAncestry`, which is `null` for a hit outside the exhibitions
// tree (a Historical Background page can carry the same item) and the
// node's exhibition-relative ancestry otherwise: `[]` for an item attached
// to the exhibition itself, one theme for an item on a theme, two for an
// item on a chapter.
function exhibitionLinksForItem(itemId) {
  const links = []
  const seen = new Set()
  for (const node of exhibitionsTree.containing(itemId)) {
    // SH items can be attached at three depths: to the exhibition itself
    // (rel_*_exhibitions), to a theme (rel_*_themes), or to a chapter/
    // subtheme (rel_*_subthemes — handled with chapter granularity by
    // chapterLinksForItem; collapsed to its theme here).
    const ancestry = exhibitionAncestry(node)
    if (!ancestry) continue
    const exhibition = ancestry.length === 0 ? node : ancestry[0]
    // National Context collections (purpose "national-context") sit next to
    // themes under an exhibition but link to the exhibition introduction,
    // not to a theme page — their themeId is null (same as direct attachment).
    const themeId = ancestry.length === 1 && node.purpose === 'national-context'
      ? null
      : ancestry.length === 1 ? node.id : ancestry.length === 2 ? ancestry[1].id : null
    const key = `${exhibition.id}:${themeId ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    links.push({
      exhibitionId: exhibition.id,
      themeId,
      label: tr('collections', exhibition.id).title ?? exhibition.internal_name,
    })
  }
  return links
}

// SH adds a third level: an item can also be attached to a chapter
// (subtheme), which only a two-deep ancestry (exhibition, theme) reaches.
function chapterLinksForItem(itemId) {
  const links = []
  for (const node of exhibitionsTree.containing(itemId)) {
    const ancestry = exhibitionAncestry(node)
    if (!ancestry || ancestry.length !== 2) continue
    const [exhibition, theme] = ancestry
    links.push({
      exhibitionId: exhibition.id,
      themeId: theme.id,
      chapterId: node.id,
      label: tr('collections', node.id).title ?? node.internal_name,
      exhibitionLabel: tr('collections', exhibition.id).title ?? exhibition.internal_name,
    })
  }
  return links
}

export function useData() {
  return {
    ...catalogue,
    timelines,
    timelineEvents,
    collections,
    defaultLang,
    itemVisible,
    exhibitions,
    exhibitionThemes,
    exhibitionLinksForItem,
    chapterLinksForItem,
  }
}
