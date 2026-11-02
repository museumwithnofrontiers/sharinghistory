import { artistLine, removeEndingPoint, renderPlain, useDataPackage } from '@museumwnf/viewer-core'

// The item sheet, as a spec: what viewer-layout's `RecordView` renders on
// `/item/:id`, inside the standalone family's sheet (ItemDetail.vue). The
// mechanics — which language the record is read in, what is loaded for it,
// the glossary terms it reaches, how a field becomes a row, the credits, the
// citation — are the platform's. What is declared here is only what is this
// website's: legacy `database_item.php`'s two orders, one for a monument and
// one for an object, each row under the word legacy printed for it in the
// record's own language (its `sh_db_` term, sharinghistory.sheet.*, from
// legacy's translation table), the prose under them, the citation and the
// working number. Every label is an entry name, written out so the check
// that every name resolves can read it.

// A field legacy printed without its ending period (removeEndingPoint in
// modules/database_item.php); the others it printed as written.
const plain = (key) => (c) => removeEndingPoint(String(c.text[key] ?? ''))

// Legacy's Location line: a monument's address, the place, the province, then
// a "Public domain" record's present-day country, then the record's country —
// each a field of its own in the package, without its final period as legacy
// printed them, the country names in the record's own language ("Vienna,
// Autriche, Domaine public"), and nothing for a name that language lacks.
function locationWithCountry(c) {
  const countryName = (id) => (id ? c.translations('countries')[id]?.name ?? '' : '')
  const address = c.record?.type === 'monument' ? c.text.monument_contact?.address : ''
  return [address, c.text.location, c.text.province]
    .map((part) => removeEndingPoint(part ?? ''))
    .concat(countryName(c.text.country_id_present_days), countryName(c.record.country_id))
    .filter(Boolean)
    .join(', ')
}

// The "Author" line is the artwork's creator with life dates, joined as
// legacy joined them ("Wolffgang Andreas Matthäus (1660, Chemnitz-1736,
// Augsbourg)"), which the export carries as `artist` and its `artist_*`
// details. Nothing when the page's language has no line, as legacy printed
// nothing.
const authorWithDates = (c) => artistLine(c.text.artist, c.text)

// Legacy prints an institution twice when it has both names: in English
// (`holder`) and in its own language, on a line of its own. The English line
// is the holder only where the two differ.
const englishInstitution = (own) => (c) => (c.text.holder && c.text.holder !== c.text[own] ? c.text.holder : '')

// Legacy's unheaded paragraph in italics before the name (`notice`): a row
// with no word of its own, drawn by ItemDetail.vue's `notice` slot.
const notice = { key: 'notice', label: 'sharinghistory.sheet.notice', value: 'notice', render: 'custom' }

const monumentFacts = [
  notice,
  { key: 'name', label: 'sharinghistory.sheet.nameOfMonument', value: plain('name') },
  { key: 'alsoKnownAs', label: 'sharinghistory.sheet.alsoKnownAs', value: plain('alternate_name') },
  { key: 'secondName', label: 'sharinghistory.sheet.secondNameMonument', value: plain('second_name') },
  { key: 'originalName', label: 'sharinghistory.sheet.thirdNameMonument', value: plain('third_name') },
  { key: 'location', label: 'sharinghistory.sheet.location', value: locationWithCountry },
  // The holder text, then the partner it refers to (`PartnerPanel`'s summary),
  // rendered by ItemDetail.vue's `holder` slot (decision D3).
  { key: 'holder', label: 'sharinghistory.sheet.institution', value: englishInstitution('responsible_institution_org'), render: 'custom' },
  { key: 'responsibleInstitutionOriginal', label: 'sharinghistory.sheet.responsibleInstitutionOriginal', value: 'responsible_institution_org' },
  { key: 'date', label: 'sharinghistory.sheet.dateOfMonument', value: plain('dates') },
  { key: 'architects', label: 'sharinghistory.sheet.architects', value: 'architects' },
  { key: 'patrons', label: 'sharinghistory.sheet.patrons', value: (c) => c.text.patrons ?? c.text.initial_owner },
]

const objectFacts = [
  notice,
  { key: 'name', label: 'sharinghistory.sheet.nameOfObject', value: plain('name') },
  { key: 'alsoKnownAs', label: 'sharinghistory.sheet.alsoKnownAs', value: plain('alternate_name') },
  { key: 'secondName', label: 'sharinghistory.sheet.secondNameObject', value: plain('second_name') },
  { key: 'originalName', label: 'sharinghistory.sheet.thirdNameObject', value: plain('third_name') },
  { key: 'location', label: 'sharinghistory.sheet.location', value: locationWithCountry },
  { key: 'holder', label: 'sharinghistory.sheet.holdingInstitution', value: englishInstitution('holding_institution_org'), render: 'custom' },
  { key: 'holdingInstitutionOriginal', label: 'sharinghistory.sheet.holdingInstitutionOriginal', value: plain('holding_institution_org') },
  { key: 'originalOwner', label: 'sharinghistory.sheet.originalOwner', value: 'initial_owner' },
  { key: 'currentOwner', label: 'sharinghistory.sheet.currentOwner', value: 'owner' },
  { key: 'date', label: 'sharinghistory.sheet.dateOfObject', value: plain('dates') },
  { key: 'author', label: 'sharinghistory.sheet.author', value: authorWithDates },
  { key: 'inventoryNumber', label: 'sharinghistory.sheet.inventoryNumber', value: (c) => removeEndingPoint(String(c.record.owner_reference ?? '')) },
  { key: 'materials', label: 'sharinghistory.sheet.materials', value: 'materials' },
  { key: 'dimensions', label: 'sharinghistory.sheet.dimensions', value: plain('dimensions') },
  { key: 'dynasty', label: 'sharinghistory.sheet.periodDynasty', value: plain('dynasty') },
  { key: 'workshop', label: 'sharinghistory.sheet.workshop', value: 'workshop' },
  { key: 'provenance', label: 'sharinghistory.sheet.provenance', value: 'provenance' },
]

// The prose under the facts, in legacy's order and under its headings: the
// second description under the same heading as the first; after an object's
// descriptions its type; a monument's Period / Dynasty after its
// descriptions. The item's rights line (`notice_b`, the package's
// `copyright`) closes both.
const copyright = { key: 'copyright', label: 'sharinghistory.sheet.copyrightInformation', value: 'copyright' }

const monumentSections = [
  { key: 'history', label: 'sharinghistory.sheet.history', value: 'history' },
  { key: 'description', label: 'sharinghistory.sheet.description', value: 'description' },
  { key: 'description2', label: 'sharinghistory.sheet.description', value: 'description2' },
  { key: 'dynasty', label: 'sharinghistory.sheet.periodDynasty', value: plain('dynasty') },
  { key: 'datation', label: 'sharinghistory.sheet.monumentDatationMethod', value: 'method_for_datation' },
  { key: 'bibliography', label: 'sharinghistory.sheet.bibliography', value: 'bibliography' },
  copyright,
]

const objectSections = [
  { key: 'description', label: 'sharinghistory.sheet.description', value: 'description' },
  { key: 'description2', label: 'sharinghistory.sheet.description', value: 'description2' },
  { key: 'type', label: 'sharinghistory.sheet.typeOfObject', value: plain('type') },
  { key: 'obtention', label: 'sharinghistory.sheet.obtentionMethod', value: 'obtention' },
  { key: 'datation', label: 'sharinghistory.sheet.datationMethod', value: 'method_for_datation' },
  { key: 'provenanceMethod', label: 'sharinghistory.sheet.provenanceMethod', value: 'method_for_provenance' },
  { key: 'archival', label: 'sharinghistory.sheet.archival', value: 'archival' },
  { key: 'bibliography', label: 'sharinghistory.sheet.bibliography', value: 'bibliography' },
  copyright,
]

// The credits as legacy printed them: each author type's `sh_db_` word.
const credits = [
  { field: 'author', label: 'sharinghistory.sheet.preparedBy' },
  { field: 'copy_editor', label: 'sharinghistory.sheet.copyeditedBy' },
  { field: 'translator', label: 'sharinghistory.sheet.translationBy' },
  { field: 'translation_copy_editor', label: 'sharinghistory.sheet.translationCopyeditedBy' },
]

const isMonument = (ctx) => ctx.record?.type === 'monument'

// Legacy's citation (modules/database_item.php): the writers' names as their
// English record spells them, the name without its ending period in quotes,
// legacy's phrase for the project in the record's language, the year, then
// the page's address in italics on a line of its own.
const escapeHtml = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export function legacyCitation(c, { permalink, year }) {
  const english = useDataPackage().tr('items', c.record.id, 'en')
  const writers = removeEndingPoint(renderPlain(String(english.author ?? ''))).trim()
  const name = removeEndingPoint(renderPlain(String(c.text.name ?? c.record.internal_name ?? ''))).trim()
  const phrase = escapeHtml(c.tIn('sharinghistory.sheet.citationIn'))
  const sentence = `${[escapeHtml(writers), `"${escapeHtml(name)}"`].filter(Boolean).join(' ')} ${phrase} ${year}.`
  return permalink ? `${sentence} <br><i>${escapeHtml(permalink)}</i>` : sentence
}

export const itemSheetSpec = {
  entity: 'items',
  translations: ['glossary', 'countries'],
  fields: (ctx) => (isMonument(ctx) ? monumentFacts : objectFacts),
  sections: (ctx) => (isMonument(ctx) ? monumentSections : objectSections),
  // Legacy's sheet: each label over its value (modules/database_item.php's
  // h3 and p), each in the record's language as db_GetTERM printed it.
  layout: 'list',
  labelsInRecordLanguage: true,
  // Legacy's collapsible short description (`pc_view_sdesc`), folded under
  // the description when the item also carries the shorter text.
  shortDescription: 'short_description',
  shortDescriptionAfter: 'description',
  related: { variant: 'list', heading: 'record.related.items' },
  credits,
  citation: { heading: 'sharinghistory.sheet.citation', format: legacyCitation },
  workingNumberLabel: 'sharinghistory.sheet.workingNumber',
  route: 'item',
  // Legacy's gap under the pictures and under the sheet.
  spaced: true,
}
