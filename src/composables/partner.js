import { partnerView } from '@museumwnf/viewer-core'
import { inScope, itemSummary } from './catalogue.js'
import { useData } from './data.js'

// The partner pages, as specs: what viewer-layout's `PartnerListView` renders
// on `/partners/results` and `RecordView` on `/partner/:id`. The engine —
// the country grouping, the tiers, the field sheet, the media gallery, the
// content language — is the platform's; what is declared here is only what
// is this website's: which partners are listed at all (legacy's INNER JOINs
// on a name translation and a country), the associated-under-parent nesting
// legacy's own list carried, and the partner's view-model with this
// website's routes, plus the held items a partner's own record does not
// declare as a relation (the package models it the other way, an item
// pointing at its partner, so it is read the same way the original page
// scanned for it).

const { items, labelOf, md, mdInline, tr } = useData()

// Legacy pm_partner_list.php's INNER JOINs on sh_partner_names +
// mwnf3.countrynames: only a partner with a name translation AND a country
// is listed. Reproduces the live site's 114-partner list (27 main + 87
// associated) out of the 120 the package carries — the rest are placeholder
// rows ("Not know yet", "Public Domain", or nameless).
function listed(partner) {
  return !!tr('partners', partner.id)?.name && !!partner.country_id
}

export const partnersResultsSpec = {
  scope: (partner) => listed(partner),
  group: { tier: 'level' },
  // Legacy nested an associated partner under the main partner it belongs
  // to; the package's `parent_id` (post G.1) is that relationship. The
  // "Partners found" count is the view's own (`PartnersResults.vue`'s
  // `#before`): the view's built-in count does not add a nested child back
  // in, so it would undercount here.
  nested: true,
  label: (countryId) => labelOf('countries', countryId),
  route: 'partner',
  empty: 'sharinghistory.partner.noPartners',
}

// ── The partner page ────────────────────────────────────────────────────────
// `RecordView` carries the record's language, its load and the not-found
// case; the page's body is viewer-layout's `PartnerPanel`
// (inventory-app#2035), rendering the partner's view-model — the About/
// Contact/Logo tabs, the homepage link, the pictures and the map. So the
// sheet declares nothing of its own: no field, no media gallery (the
// pictures are the panel's), no citation, no `related`.

// Where a partner's "View Objects"/"View Monuments" lands: the Permanent
// Collection, filtered on the partner.
export function partnerObjectsLink(partner) {
  return { path: '/permanent-collection/results', query: { partner: partner.id } }
}

// The partner's view-model, which `PartnerPanel` renders on the partner page
// and under an item's holder text: this website's country label, its
// renderers (the glossary-bound ones) and its two routes.
export function partnerViewOf(partner, text) {
  return partnerView(partner, text, {
    countryLabel: (id) => labelOf('countries', id),
    md,
    mdInline,
    route: (p) => ({ name: 'partner', params: { id: p.id } }),
    objectsRoute: partnerObjectsLink,
  })
}
// The items a partner holds — `item.partner_id`, the package's own relation,
// read in reverse; `related` (a record's own declared references) does not
// apply here, so this feeds the `#related` slot directly rather than the
// spec's `related` option. Shared row shape with the timeline gallery
// (`itemSummary`, composables/catalogue.js).
export function heldItems(partner) {
  return (items.value ?? []).filter((item) => inScope(item) && item.partner_id === partner.id)
}
export function heldItemRows(partner) {
  return heldItems(partner).map(itemSummary)
}

export const partnerSheetSpec = {
  entity: 'partners',
  fields: [],
  media: () => [],
  citation: false,
  related: false,
}