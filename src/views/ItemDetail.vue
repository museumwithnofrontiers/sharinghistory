<script setup>
import { timelineLinkFor, useI18n } from '@museumwnf/viewer-core'
import { OnDisplayIn, PartnerPanel, RelatedMedia, SpecialFeatures } from '@museumwnf/viewer-layout/content'
import { StandaloneItemSheet } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { minisiteHref } from '../composables/exhibitions.js'
import { partnerViewOf } from '../composables/partner.js'
import { itemSheetSpec } from '../composables/sheet.js'

// The item sheet: legacy database_item.php in its three columns, the
// standalone family's `StandaloneItemSheet` over the spec in
// composables/sheet.js. What is this website's fills its slots: legacy's
// italic notice before the name, the holding institution's partner line in
// the sheet, a monument's special features and legacy's closing paragraph
// (`notice_c`) under it, and, in the Related Content column, legacy's blocks
// in legacy's order — the timeline for this item, the related videos, then
// where the item is on display (the exhibitions and the galleries).

defineProps({ id: { type: String, required: true } })

const { exhibitionLinksForItem, mdInline, partnerById, tr } = useData()
const { locale } = useI18n()

const timelineLink = (record) => timelineLinkFor(record, { name: 'timeline-results' })

// The way back, as legacy's breadcrumbs: the previous page, then the
// collections' start page.
const back = [
  { label: 'sharinghistory.item.back', history: true },
  { label: 'sharinghistory.item.collectionStart', to: { name: 'permanent-collection' } },
]

// Related Content's own parts: the related records by type, and Download:
// the browser's print ("As PDF") and legacy's export.php ("As Word"), the
// sheet's texts as a .doc named after the record's legacy key and language
// (sh_objects:awe:pt:102 → object_awe_pt_102_en.doc).
const wordFile = (record, language) => {
  const [, table, ...key] = String(record?.backward_compatibility ?? '').split(':')
  const type = { sh_objects: 'object', sh_monuments: 'monument' }[table] ?? 'item'
  return `${[type, ...key, language].join('_')}.doc`
}

const related = {
  heading: 'sharinghistory.item.relatedContent',
  groups: [
    { heading: 'sharinghistory.item.relatedObjects', type: 'object' },
    { heading: 'sharinghistory.item.relatedMonuments', type: 'monument' },
  ],
  download: {
    heading: 'sharinghistory.item.download',
    print: 'sharinghistory.item.asPdf',
    word: 'sharinghistory.item.asWord',
    title: 'sharinghistory.item.wordTitle',
    wordFile,
  },
}

// The holding institution (decision D3, inventory-app#2035): the holder
// text, then the partner it refers to as `PartnerPanel`'s summary — "About
// {name}, {city}, {country}", legacy's `pm_partner.php` link — when the
// partner is part of the exported set.
function holderPartner(record, language) {
  const partner = partnerById.value.get(record?.partner_id)
  return partner ? partnerViewOf(partner, tr('partners', partner.id, language)) : null
}

// Each exhibition page that places the item, on the exhibition's own website
// (its mini-site), in the site's language, under legacy's heading for the
// Sharing History exhibitions (`gn_rel_exhibition_sh`).
const onDisplayInGroups = (record) => [{
  heading: 'sharinghistory.item.relExhibition',
  links: exhibitionLinksForItem(record.id).map((l) => ({
    label: mdInline(l.label),
    href: minisiteHref(l.exhibitionId, locale.value, l.at) ?? undefined,
  })),
}]

// The THG galleries, by name: the package carries no address for them yet,
// and the legacy page's same-page anchors lead nowhere in this one.
const thgGalleryGroups = (record) => [{
  links: (record.thg_galleries ?? []).map((g) => ({ id: g.name, label: mdInline(g.name) })),
}]
</script>

<template>
  <StandaloneItemSheet :spec="itemSheetSpec" :id="id" :back="back" :related="related">
    <template #notice="{ row, dir, glossary }">
      <em class="sharinghistory-notice" :dir="dir" v-html="mdInline(row.value, { glossary })"></em>
    </template>

    <template #holder="{ row, record, language, dir, glossary }">
      <span v-html="mdInline(row.value, { glossary })"></span>
      <PartnerPanel
        v-if="holderPartner(record, language)"
        variant="summary"
        :partner="holderPartner(record, language)"
        label="partner.info.about"
        :dir="dir"
      />
    </template>

    <template #after-sheet="{ record, text, language, dir, glossary }">
      <p v-if="text.notice_c" class="sharinghistory-notice-c" :dir="dir" v-html="mdInline(text.notice_c, { glossary })"></p>
      <SpecialFeatures
        :features="record.details ?? []"
        :tr="(feature) => tr('items', feature.id, language)"
        :language="language"
        :glossary="glossary"
        :dir="dir"
      />
    </template>

    <template #sidebar="{ record, language, dir }">
      <p v-if="timelineLink(record)" class="sharinghistory-timeline-link">
        <RouterLink :to="timelineLink(record)">{{ $t('sharinghistory.item.timeline') }}</RouterLink>
      </p>
      <RelatedMedia :media="record.media ?? []" :language="language" heading="sharinghistory.item.relatedVideos" :dir="dir" />
      <div v-if="onDisplayInGroups(record)[0].links.length || thgGalleryGroups(record)[0].links.length" class="sharinghistory-on-display">
        <br><p><strong><u>{{ $t('sharinghistory.item.onDisplayIn') }}</u></strong></p>
      </div>
      <OnDisplayIn heading="sharinghistory.item.exhibitions" :groups="onDisplayInGroups(record)" :dir="dir" />
      <OnDisplayIn heading="sharinghistory.item.galleries" :groups="thgGalleryGroups(record)" :dir="dir" />
    </template>
  </StandaloneItemSheet>
</template>

<style scoped>
/* Legacy's "On display in": a line of the column's text, then the words on
   their own line, 16px under the block before them and 10px over the
   exhibitions. */
.sharinghistory-on-display {
  margin: 16px 0 10px;
}
</style>
