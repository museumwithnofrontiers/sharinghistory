import { computed } from 'vue'
import { useCollectionTree } from '@museumwnf/viewer-core'
import minisites from '../minisites.json'

// The exhibition tree — exhibitions → themes → chapters — replaces the
// hand-written parent_id walk this file used to be part of (the
// historical-background and profiles subtrees' own walk moved the same way,
// into composables/history.js, #39).
//
// `childType` is depth-indexed against THIS tree's own root, the
// exhibitions-root marker — not against "an exhibition" as viewer-core's own
// doc comment's two-element example (`['theme', 'subtheme']`) illustrates.
// The marker's children are a level this site's other trees don't have: the
// exhibitions themselves. Verified against the package directly (see the
// pull request description) — a two-element array leaves every node
// unfiltered from depth 2 on, which reads as "every type", but
// `useCollectionTree`'s `children(id)` indexes by the DEPTH OF THE PARENT
// being listed, not of the children returned, so depth 0 (the marker)
// governs the exhibitions themselves: a two-element array filters the
// exhibitions to type `theme` and finds none, and the tree comes back
// empty. Three elements — one per level below the marker — is what this
// tree's own shape needs; it also doubles as the National Context filter:
// the country-specific "National Context" collections sit next to the real
// themes under an exhibition but carry type `collection`, not `theme`, so
// filtering an exhibition's children to `theme` keeps them out.
const rawTree = useCollectionTree({
  purpose: 'exhibitions-root',
  childType: ['exhibition', 'theme', 'subtheme'],
})

// `rawTree.parents`/`.breadcrumb` walk a record's true ancestry past the
// tree's own root by design (a breadcrumb elsewhere wants that). Here the
// marker this tree hangs from is itself nested a level under the package's
// project collection (the importer's sh-exhibition-root-keying step, #1505),
// so the true ancestry of every exhibition, theme and chapter carries two
// extra, unrelated crumbs — the project collection and the marker itself —
// ahead of "exhibition › theme". Bounded here to the marker, once, so every
// consumer (the cross-links, the mini-site addresses) sees only
// exhibition-relative ancestry.
//
// Returns `null` for a node that is not under the marker at all — the
// cross-link scans below need to tell that apart from "this node IS the
// exhibition" (an empty, but real, ancestry).
function ancestryWithin(id) {
  const rootId = rawTree.root.value?.id
  if (!rootId || id === rootId) return null
  const all = rawTree.parents(id)
  const index = all.findIndex((node) => node.id === rootId)
  return index === -1 ? null : all.slice(index + 1)
}

/**
 * The exhibition tree: `children`, `itemsUnder`, `containing`, `walk`
 * unchanged from `useCollectionTree`; `parents`/`breadcrumb` bounded to this
 * tree's own root (see above).
 */
export const exhibitionsTree = {
  ...rawTree,
  parents: (id) => ancestryWithin(id) ?? [],
  breadcrumb: (id) => {
    const node = rawTree.byId.value.get(id)
    const ancestry = ancestryWithin(id)
    if (!node) return []
    return ancestry ? [...ancestry, node] : [node]
  },
}

/** The exhibitions themselves: the tree root's own children. */
export const exhibitionList = computed(() => {
  const root = exhibitionsTree.root.value
  return root ? exhibitionsTree.children(root.id) : []
})

// Each exhibition is a website of its own now, a mini-site
// (inventory-app#2359): this site lists the exhibitions and links to them,
// and its package keeps of them only what it shows — each exhibition's,
// theme's and chapter's title, and which items each one places (the
// Permanent Collection's exhibition filter, an item sheet's "on display in").
// Where each one lives is this site's own configuration, src/minisites.json
// (exhibition id → its address).

/**
 * An exhibition's mini-site, in the page language: its home page, one of its
 * own pages by name (`at`: 'introduction', 'further-reading'), or a theme's
 * overview or chapter by their 1-based numbers (`at`: `{ theme, page }`, page
 * 0 the overview). Null for an exhibition with no mini-site.
 */
export function minisiteHref(exhibitionId, language, at = null) {
  const base = minisites[exhibitionId]
  if (!base) return null
  const query = language ? `?lang=${encodeURIComponent(language)}` : ''
  if (typeof at === 'string') return `${base}#/${at}${query}`
  if (at?.theme) return `${base}#/theme/${at.theme}${at.page ? `/${at.page}` : ''}${query}`
  return `${base}#/${query}`
}

/**
 * Where a theme or a chapter is on its exhibition's mini-site,
 * `{ theme, page }`: the mini-site numbers only the pages legacy listed,
 * those with a title (`titled`). Null for anything else.
 */
export function minisiteAt(node, titled) {
  const ancestry = ancestryWithin(node.id)
  const number = (parent, id) => exhibitionsTree.children(parent.id).filter(titled).findIndex((n) => n.id === id) + 1
  if (ancestry?.length === 1) return { theme: number(ancestry[0], node.id), page: 0 }
  if (ancestry?.length === 2) return { theme: number(ancestry[0], ancestry[1].id), page: number(ancestry[1], node.id) }
  return null
}

/**
 * The ancestry of `node` within the exhibition tree, or `null` when it is
 * not under the exhibitions-root marker at all (the reverse-lookup helpers
 * below scan every collection an item is attached to, exhibition-related or
 * not, and need to tell the two apart).
 */
export function exhibitionAncestry(node) {
  return ancestryWithin(node.id)
}
