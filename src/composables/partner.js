import { CATALOGUE_PAGE_SIZE, partnerView, removeEndingPoint } from '@museumwnf/viewer-core'
import { resultTile } from './catalogue.js'
import { useData } from './data.js'

// The partner pages: the groups of the partner list on `/partners`, the
// profile's view-model on `/partner/:id` and its items on
// `/partner/:id/items`. The pages are viewer-layout's standalone family's;
// what is declared here is only what is this website's: which partners are
// listed at all (legacy's INNER JOINs on a name translation and a country),
// legacy's grouping, and a partner's items, read from the items that point
// at it (the package models the relation that way round).

const { items, labelOf, md, mdInline, partners, tr } = useData()

// Legacy pm_partner_list.php's INNER JOINs on sh_partner_names +
// mwnf3.countrynames: only a partner with a name translation AND a country
// is listed. Reproduces the live site's 114-partner list (27 main + 87
// associated) out of the 120 the package carries — the rest are placeholder
// rows ("Not know yet", "Public Domain", or nameless).
function listed(partner) {
  return !!tr('partners', partner.id)?.name && !!partner.country_id
}

// Legacy's ORDER BY, as MySQL's utf8_general_ci compares: case and accents
// folded, then character by character.
const folded = (text) => String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
const legacyCompare = (a, b) => {
  const x = folded(a)
  const y = folded(b)
  return x < y ? -1 : x > y ? 1 : 0
}

// The partner list (PartnerList.vue), as legacy's pm_partner_list.php read
// it: per country, by the country's name in the page's language, the
// partners by name, and beside them the country's associated partners by
// name (legacy's further associated tier had no row).
export function partnerListGroups() {
  const name = (partner) => tr('partners', partner.id)?.name ?? ''
  const groups = new Map()
  for (const partner of (partners.value ?? []).filter(listed).sort((a, b) => legacyCompare(name(a), name(b)))) {
    if (!groups.has(partner.country_id)) {
      groups.set(partner.country_id, { label: labelOf('countries', partner.country_id), main: [], associated: [] })
    }
    groups.get(partner.country_id)[partner.level === 'associated_partner' ? 'associated' : 'main'].push(partner)
  }
  return [...groups.values()].sort((a, b) => legacyCompare(a.label, b.label))
}

// ── The partner page ────────────────────────────────────────────────────────
// viewer-layout's `StandalonePartnerPage` (PartnerDetail.vue) renders the
// partner's view-model; what is this website's is the pill to its items and
// the page of those items (PartnerItems.vue, legacy's pm_items.php).

// The partner's items of one kind, as legacy's pm_items.php read them: by
// country, then number (the record's legacy key), twenty a page in the
// Permanent Collection's tile.
const itemsOf = (partnerId, kind) => (items.value ?? []).filter((item) => item.partner_id === partnerId && item.type === kind)
const legacyNumber = (item) => {
  const [, , , country = '', number = ''] = String(item.backward_compatibility ?? '').split(':')
  return { country, number: Number(number) }
}
export function partnerItemsSpec(partnerId, kind) {
  return {
    entity: 'items',
    keys: [],
    scope: (item) => item.partner_id === partnerId && item.type === kind,
    sort: (list) => [...list].sort((a, b) => {
      const x = legacyNumber(a)
      const y = legacyNumber(b)
      return x.country.localeCompare(y.country) || x.number - y.number
    }),
    pageSize: CATALOGUE_PAGE_SIZE,
    record: resultTile,
    summary: () => [],
    empty: 'sharinghistory.pcr.empty',
  }
}

// Where a partner's "View Objects"/"View Monuments" lands: its objects when
// it holds any, else its monuments (legacy's hasobjects_/hasmonuments_).
export function partnerItemsKind(partner) {
  if (!partner) return null
  if (itemsOf(partner.id, 'object').length) return 'object'
  return itemsOf(partner.id, 'monument').length ? 'monument' : null
}
export function partnerObjectsLink(partner) {
  return { name: 'partner-items', params: { id: partner.id }, query: { type: partnerItemsKind(partner) ?? 'object' } }
}
export function partnerItemsLink(partner) {
  const kind = partnerItemsKind(partner)
  if (!kind) return null
  return {
    label: kind === 'monument' ? 'sharinghistory.pp.viewMonuments' : 'sharinghistory.pp.viewObjects',
    to: partnerObjectsLink(partner),
  }
}

// The profile's view-model, read as legacy's pm_partner.php printed it: the
// name, the city and the contact lines without their ending period.
const plain = (value) => (value ? removeEndingPoint(String(value)) : value)
export function partnerProfileView(partner, text) {
  const own = text ?? {}
  const view = partnerViewOf(partner, {
    ...own,
    ...Object.fromEntries(['name', 'city', 'address', 'phone', 'fax', 'email'].map((key) => [key, plain(own[key])])),
  })
  view.persons = view.persons.map((person) =>
    Object.fromEntries(Object.entries(person).map(([key, value]) => [key, typeof value === 'string' ? plain(value) : value])),
  )
  return view
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
