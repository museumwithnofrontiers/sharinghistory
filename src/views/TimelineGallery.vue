<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneResultsGrid } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { ALL, POLITICAL, periodOf, timelineGallerySpec } from '../composables/timeline.js'
import { collectionById, collectionTitle } from '../composables/catalogue.js'

// The timeline's gallery as legacy's hcr_gallery.php, opened in a window of
// its own: Close and the Timeline start page, the search in words with
// "Gallery", the Collections' tiles, twenty a page, beside "See Timeline"
// and the country. Every word is legacy's own (sharinghistory.tlg.*,
// sharinghistory.tlr.*); the layout is the standalone family's
// (viewer-layout's `mwnf-standalone-pmi`).

const route = useRoute()
const { t } = useI18n()
const { labelOf } = useData()

const query = computed(() => ({ start: route.query.start, end: route.query.end, country: route.query.country, theme: route.query.theme }))
const spec = computed(() => timelineGallerySpec(query.value))

// Legacy's "Timeline | 1850 to 1900 | Austria | Economy and Trade | Gallery".
const line = computed(() => {
  const { start, end } = periodOf(query.value)
  const { country, theme } = query.value
  const parts = [`${start} ${t('sharinghistory.tlr.to')} ${end}`]
  if (country && country !== ALL) parts.push(labelOf('countries', country))
  if (theme === POLITICAL) parts.push(t('sharinghistory.timeline.politicalContext'))
  else if (theme && theme !== ALL && collectionById(theme)) parts.push(collectionTitle(collectionById(theme)))
  return [...parts, t('sharinghistory.tlg.gallery')].join(' | ')
})
const country = computed(() => (query.value.country && query.value.country !== ALL ? labelOf('countries', query.value.country) : ''))
const close = () => window.close()
</script>

<template>
  <CatalogueResultsView :spec="spec" class="mwnf-standalone-pcr mwnf-standalone-pmi sharinghistory-tlg">
    <template #before>
      <p class="mwnf-standalone-item__back mwnf-standalone-pcr__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="close">{{ t('sharinghistory.tlg.close') }}</button>
        <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'timeline', query: { lang: route.query.lang } }" :title="t('sharinghistory.tlg.startPageTooltip')">{{ t('sharinghistory.tlr.startPage') }}</RouterLink>
      </p>
      <h3 class="mwnf-standalone-pcr__heading"><b>{{ t('sharinghistory.nav.timeline') }}</b> | {{ line }}</h3>
    </template>

    <template #records="{ rows, empty }">
      <StandaloneResultsGrid :rows="rows" :see-label="t('sharinghistory.pcr.see')" :empty="empty" />
    </template>

    <!-- Legacy's pages run under both columns: drawn after them. -->
    <template #pagination></template>

    <template #aside>
      <div class="mwnf-standalone-pcr__related">
        <p><RouterLink :to="{ name: 'timeline-results', query: { ...route.query, page: undefined } }">{{ t('sharinghistory.tlg.seeTimeline') }}&nbsp;{{ country }}</RouterLink></p>
      </div>
    </template>

    <template #after="{ pageInfo, goToPage }">
      <StandalonePagination
        :page-info="pageInfo"
        :previous-label="t('sharinghistory.pcr.previous')"
        :next-label="t('sharinghistory.pcr.next')"
        @navigate="goToPage"
      />
    </template>
  </CatalogueResultsView>
</template>
