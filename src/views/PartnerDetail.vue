<script setup>
import { BackLink, PartnerPanel, RecordLanguages, RelatedRecords } from '@museumwnf/viewer-layout/content'
import { RecordView } from '@museumwnf/viewer-layout/views'
import { heldItemRows, partnerObjectsLink, partnerSheet, partnerViewOf } from '../composables/partner.js'

// The partner profile: the platform's composed record page (the record's
// language, its load, the not-found case), with viewer-layout's
// `PartnerPanel` as its body — the name and location, the About/Contact/
// Logo tabs and the homepage link (decision D2, inventory-app#2035), the
// pictures, the map. What is this website's: the way back and the record's
// languages, the type badge, the "View Objects/Monuments" link the Permanent
// Collection reads `?partner=` from, and the held-items grid (the package
// models the relation the other way round, an item pointing at its partner,
// so `related` — a record's own declared references — does not reach it).

defineProps({ id: { type: String, required: true } })
</script>

<template>
  <RecordView :spec="partnerSheet" :id="id" class="detail mwnf-panel">
    <template #header="{ language, languages, select }">
      <div class="detail-top">
        <BackLink variant="bar" label="partner.nav.back" :to="{ name: 'partners' }" />
      </div>
      <RecordLanguages :languages="languages" :language="language" @select="select" />
    </template>

    <template #before-sheet="{ record, text, dir }">
      <PartnerPanel variant="full" :partner="partnerViewOf(record, text)" :heading="1" :dir="dir">
        <template #badge>
          <div><span class="detail-type-badge">{{ record.type === 'institution' ? $t('partner.info.typeInstitution') : $t('partner.info.typeMuseum') }}</span></div>
        </template>
        <template #actions>
          <RouterLink v-if="record.item_count" :to="partnerObjectsLink(record)" class="mwnf-button">
            {{ record.type === 'institution' ? $t('partner.action.viewMonuments') : $t('partner.action.viewObjects') }} ({{ record.item_count }}) →
          </RouterLink>
        </template>
      </PartnerPanel>
    </template>

    <template #related="{ record }">
      <RelatedRecords :heading="$t('record.related.items')" :records="heldItemRows(record)" variant="list" />
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
  color: var(--heading);
  border: 1px solid var(--accent);
  padding: 2px 8px;
  font-family: 'Roboto', sans-serif;
}
</style>
