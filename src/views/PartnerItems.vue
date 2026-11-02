<script setup>
import { computed } from 'vue'
import { removeEndingPoint, useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneResultsGrid } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { partnerItemsSpec } from '../composables/partner.js'

// A partner's objects or monuments as legacy's pm_items.php: the way back,
// the partner's name with its city and country, the Permanent Collection's
// tiles with "Partner Profile" beside them, and legacy's pages under both.
// Every word is legacy's own (sharinghistory.pp.*, sharinghistory.pcr.*);
// the layout is the standalone family's (viewer-layout's
// `mwnf-standalone-pmi`).

const props = defineProps({
  id: { type: String, required: true },
  type: { type: String, default: 'object' },
})

const { t, locale } = useI18n()
const { labelOf, partnerById, tr } = useData()

const partner = computed(() => partnerById.value.get(props.id) ?? null)
const spec = computed(() => partnerItemsSpec(props.id, props.type === 'monument' ? 'monument' : 'object'))
const text = computed(() => tr('partners', props.id))
// "Roma, Italy": the city, then the country in the page's language.
const place = computed(() =>
  [removeEndingPoint(text.value.city ?? ''), partner.value?.country_id ? labelOf('countries', partner.value.country_id) : '']
    .filter(Boolean)
    .join(', '),
)
</script>

<template>
  <CatalogueResultsView :spec="spec" class="mwnf-standalone-pcr mwnf-standalone-pmi">
    <template #before>
      <p class="mwnf-standalone-item__back mwnf-standalone-pcr__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('sharinghistory.pcr.back') }}</button>
        <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'partners', query: { lang: locale } }">{{ t('sharinghistory.pp.allPartners') }}</RouterLink>
      </p>
      <div class="mwnf-standalone-pmi__heading">
        <h3 class="mwnf-standalone-pcr__heading">{{ removeEndingPoint(text.name ?? partner?.internal_name ?? '') }}</h3>
        <p><i>{{ place }}</i></p>
      </div>
    </template>

    <template #records="{ rows, empty }">
      <StandaloneResultsGrid :rows="rows" :see-label="t('sharinghistory.pcr.see')" :empty="empty" />
    </template>

    <!-- Legacy's pages run under both columns: drawn after them. -->
    <template #pagination></template>

    <template #aside>
      <div class="mwnf-standalone-pcr__related">
        <p><RouterLink :to="{ name: 'partner', params: { id }, query: { lang: locale } }">{{ t('sharinghistory.pp.profile') }}</RouterLink></p>
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
