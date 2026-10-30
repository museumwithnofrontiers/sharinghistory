<script setup>
import { timelineLinkFor, useI18n } from '@museumwnf/viewer-core'
import {
  BackLink, OnDisplayIn, PartnerPanel, RecordLanguages, RelatedMedia, SourceCredit, SpecialFeatures,
} from '@museumwnf/viewer-layout/content'
import { RecordView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { minisiteHref } from '../composables/exhibitions.js'
import { partnerViewOf } from '../composables/partner.js'
import { itemSheetSpec } from '../composables/sheet.js'

// The item sheet is the platform's composed record page, rendering the spec
// in composables/sheet.js. What fills the page's slots is this website's own:
// the header — the way back, the timeline link, the type badge — the holder
// text and its partner's summary, and, after the sheet, the platform's
// item-page blocks fed with this website's records: a monument's special
// features, the related media, the exhibitions and chapters the item is on
// display in. Legacy's two unheaded paragraphs frame the sheet: `notice`, in
// italics, before it, and `notice_c` after the credits (database_item.php).

defineProps({ id: { type: String, required: true } })

const { exhibitionLinksForItem, mdInline, partnerById, tr } = useData()
const { locale } = useI18n()

const timelineLink = (record) => timelineLinkFor(record, { name: 'timeline-results' })

// The holding institution (decision D3, inventory-app#2035): the holder
// text, then the partner it refers to as `PartnerPanel`'s summary — "About
// {name}, {city}, {country}", legacy's `pm_partner.php` link — when the
// partner is part of the exported set.
function holderPartner(record, language) {
  const partner = partnerById.value.get(record?.partner_id)
  return partner ? partnerViewOf(partner, tr('partners', partner.id, language)) : null
}

// Each exhibition page that places the item, on the exhibition's own website
// (its mini-site), in the site's language.
const onDisplayInGroups = (record) => [{
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
  <RecordView :spec="itemSheetSpec" :id="id" class="detail mwnf-panel">
    <template #header="{ record, text, language, languages, select, dir, glossary }">
      <!-- Two links sharing a header row is this page's own layout; only the
           tokens (colour, hover) come from the shared bar class. -->
      <div class="detail-top">
        <BackLink variant="bar" label="record.action.backToResults" :to="{ name: 'home' }" />
        <RouterLink v-if="timelineLink(record)" :to="timelineLink(record)" class="mwnf-back-bar mwnf-back-bar--link">{{ $t('record.action.viewOnTimeline') }} →</RouterLink>
      </div>
      <!-- In a block of its own: the view lays the header out as a column,
           and a badge placed directly in it would stretch to the full width. -->
      <div><span class="detail-type-badge">{{ record.type }}</span></div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
      <h1 class="detail-title" :dir="dir" v-html="mdInline(text.name ?? record.internal_name ?? record.id, { glossary })"></h1>
    </template>

    <template #before-sheet="{ text, dir, glossary }">
      <p v-if="text.notice" class="detail-notice" :dir="dir"><em v-html="mdInline(text.notice, { glossary })"></em></p>
    </template>

    <template #holder="{ row, record, language, dir, glossary }">
      <span v-html="mdInline(row.value, { glossary })"></span>
      <template v-for="partner in [holderPartner(record, language)]" :key="partner?.id ?? 'holder-partner'">
        <PartnerPanel v-if="partner" variant="summary" :partner="partner" label="partner.info.about" :dir="dir" />
      </template>
    </template>

    <template #source="{ text, dir, glossary }">
      <p v-if="text.notice_c" class="detail-notice-c" :dir="dir" v-html="mdInline(text.notice_c, { glossary })"></p>
      <SourceCredit />
    </template>

    <template #after-sheet="{ record, language, dir, glossary }">
      <SpecialFeatures
        :features="record.details ?? []"
        :tr="(feature) => tr('items', feature.id, language)"
        :language="language"
        :glossary="glossary"
        :dir="dir"
      />
      <RelatedMedia :media="record.media ?? []" :language="language" heading="record.related.video" :dir="dir" />
      <OnDisplayIn :groups="onDisplayInGroups(record)" :dir="dir" />
      <OnDisplayIn heading="record.related.galleries" :groups="thgGalleryGroups(record)" :dir="dir" />
    </template>
  </RecordView>
</template>

<style scoped>
.detail-top { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 10px; }

.detail-type-badge {
  display: inline-block;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--mwnf-heading-color);
  border: 1px solid var(--site-rule-color);
  padding: 2px 8px;
  margin-bottom: 10px;
}

.detail-title {
  font-size: 24px;
  font-weight: 400;
  color: var(--mwnf-heading-color);
  margin: 10px 0 16px;
  line-height: 1.3;
}
</style>
