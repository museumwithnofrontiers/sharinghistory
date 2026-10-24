import { artistLine, removeEndingPoint } from '@museumwnf/viewer-core'

// The item sheet, as a spec: what viewer-layout's `RecordView` renders on
// `/item/:id`. The mechanics — which language the record is read in, what is
// loaded for it, the glossary terms it reaches, how a field becomes a row,
// the credits, the citation, the related records — are the platform's. What
// is declared here is only what is this website's: the field specification
// (legacy `database_item.php`'s two orders, one for a monument and one for
// an object), and the prose sections under it. Every label is an entry
// name, written out so the check that every name resolves can read it.

// Legacy's Location line: the place, then a "Public domain" record's present-day
// country, then the record's country — the country names in the record's own
// language, as legacy printed them ("Vienna, Autriche, Domaine public"), and
// nothing for a name that language lacks.
function locationWithCountry(c) {
  const countryName = (id) => (id ? c.translations('countries')[id]?.name ?? '' : '')
  return [c.text.location, countryName(c.text.country_id_present_days), countryName(c.record.country_id)].filter(Boolean).join(', ')
}

// The "Author" line is the artwork's creator with life dates, joined as
// legacy joined them ("Wolffgang Andreas Matthäus (1660, Chemnitz-1736,
// Augsbourg)"), which the export carries as `artist` and its `artist_*`
// details. Nothing when the page's language has no line, as legacy printed
// nothing. "Author" is this website's own word — no shared entry names it.
function authorWithDates(c) {
  return artistLine(c.text.artist, c.text)
}

// Legacy's free-text Period / Dynasty line, without its ending period as
// legacy printed it (decision D5, inventory-app#2233).
const periodDynasty = (c) => removeEndingPoint(c.text.dynasty)

// Legacy prints an institution twice when it has both names: in English
// (`holder`, which the import fills with the other name when legacy has only
// that one) and in its own language, on a line of its own. The English line
// is the holder only where the two differ.
const englishInstitution = (own) => (c) => (c.text.holder && c.text.holder !== c.text[own] ? c.text.holder : '')

const monumentFacts = [
  { key: 'alsoKnownAs', label: 'sheet.field.alsoKnownAs', value: 'alternate_name' },
  { key: 'location', label: 'sheet.field.location', value: locationWithCountry },
  { key: 'holder', label: 'sharinghistory.sheet.institution', value: englishInstitution('responsible_institution_org'), render: 'custom' },
  { key: 'responsibleInstitutionOriginal', label: 'sharinghistory.sheet.responsibleInstitutionOriginal', value: 'responsible_institution_org' },
  { key: 'date', label: 'sheet.field.dateOfMonument', value: 'dates' },
  { key: 'architects', label: 'sheet.field.architects', value: 'architects' },
  { key: 'patrons', label: 'sheet.field.patrons', value: (c) => c.text.patrons ?? c.text.initial_owner },
]

// The holder is a `custom` row: the partner link under it (`pm_partner.php`
// in legacy) needs the partner index, which the spec does not carry — it is
// rendered by the `holder` slot in ItemDetail.vue instead.
const objectFacts = [
  { key: 'alsoKnownAs', label: 'sheet.field.alsoKnownAs', value: 'alternate_name' },
  { key: 'location', label: 'sheet.field.location', value: locationWithCountry },
  { key: 'holder', label: 'sheet.field.holdingInstitution', value: englishInstitution('holding_institution_org'), render: 'custom' },
  { key: 'holdingInstitutionOriginal', label: 'sharinghistory.sheet.holdingInstitutionOriginal', value: 'holding_institution_org' },
  { key: 'originalOwner', label: 'sheet.field.originalOwner', value: 'initial_owner' },
  { key: 'currentOwner', label: 'sheet.field.currentOwner', value: 'owner' },
  { key: 'date', label: 'sheet.field.dateOfObject', value: 'dates' },
  { key: 'author', label: 'sharinghistory.sheet.author', value: authorWithDates },
  { key: 'scribe', label: 'sheet.field.scribe', value: 'scriber' },
  { key: 'inventoryNumber', label: 'sheet.field.inventoryNumber', value: (c) => c.record.owner_reference },
  { key: 'materials', label: 'sheet.field.materials', value: 'materials' },
  { key: 'dimensions', label: 'sheet.field.dimensions', value: 'dimensions' },
  { key: 'dynasty', label: 'sheet.field.periodDynasty', value: periodDynasty },
  { key: 'workshop', label: 'sheet.field.workshop', value: 'workshop' },
  { key: 'provenance', label: 'sheet.field.provenance', value: 'provenance' },
  { key: 'binding', label: 'sheet.field.binding', value: 'binding_desc' },
  { key: 'placeOfProduction', label: 'sheet.field.placeOfProduction', value: 'place_of_production' },
]

// The prose under the facts, in legacy's order and under its headings: after
// the description, "Type of Object", then the archival reference. A
// monument's Period / Dynasty comes after its description, and the item's
// rights line (`notice_b`, the package's `copyright`) closes both.
const copyright = { key: 'copyright', label: 'sheet.field.copyrightInformation', value: 'copyright' }

const monumentSections = [
  { key: 'history', label: 'sheet.field.history', value: 'history' },
  { key: 'description', label: 'sheet.field.description', value: 'description' },
  { key: 'dynasty', label: 'sheet.field.periodDynasty', value: periodDynasty },
  { key: 'datation', label: 'sheet.field.monumentDatationMethod', value: 'method_for_datation' },
  { key: 'provenanceMethod', label: 'sheet.field.provenanceMethod', value: 'method_for_provenance' },
  { key: 'archival', label: 'sheet.field.archivalReference', value: 'archival' },
  { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  copyright,
]

const objectSections = [
  { key: 'description', label: 'sheet.field.description', value: 'description' },
  { key: 'datation', label: 'sheet.field.datationMethod', value: 'method_for_datation' },
  { key: 'obtention', label: 'sheet.field.obtentionMethod', value: 'obtention' },
  { key: 'provenanceMethod', label: 'sheet.field.provenanceMethod', value: 'method_for_provenance' },
  { key: 'type', label: 'sheet.field.type', value: 'type' },
  { key: 'archival', label: 'sheet.field.archivalReference', value: 'archival' },
  { key: 'bibliography', label: 'sheet.field.bibliography', value: 'bibliography' },
  {
    key: 'catalogue',
    label: 'sheet.field.catalogue',
    value: (c) => (c.text.catalogue_holding_link ? `[${c.text.catalogue_holding_link}](${c.text.catalogue_holding_link})` : ''),
  },
  copyright,
]

const isMonument = (ctx) => ctx.record?.type === 'monument'

export const itemSheetSpec = {
  entity: 'items',
  translations: ['glossary', 'countries'],
  fields: (ctx) => (isMonument(ctx) ? monumentFacts : objectFacts),
  sections: (ctx) => (isMonument(ctx) ? monumentSections : objectSections),
  layout: 'table',
  // Legacy's collapsible short description (`pc_view_sdesc`), folded under
  // the description when the item also carries the shorter text.
  shortDescription: 'short_description',
  shortDescriptionAfter: 'description',
  related: { variant: 'list', heading: 'record.related.items' },
  route: 'item',
  // Legacy's gap under the pictures and under the sheet.
  spaced: true,
}
