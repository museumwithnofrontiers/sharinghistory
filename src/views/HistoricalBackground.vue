<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText, useI18n } from '@museumwnf/viewer-core'
import HistoricalBackgroundBand from '../components/HistoricalBackgroundBand.vue'
import config from '../historicalBackground.json'
import { historicalPerspectives, historicalProfileCountries, historicalProfileNodeRoute } from '../composables/history.js'
import { useData } from '../composables/data.js'
import { POLITICAL } from '../composables/timeline.js'

// The Historical Background as legacy's historical_background.php: its band
// (About), the mosaic of its twenty portraits — ten columns, each an `a`
// portrait over its `b`, named on the pointer — its word to the visitor,
// the three perspectives' pages, and Related Content: the political
// context timeline, the historical profiles (Austria's first, as legacy
// linked) and the maps. Every word is legacy's own (sharinghistory.hb.*);
// the portraits and their names are the site's (src/historicalBackground.json).

const router = useRouter()
const { t, locale } = useI18n()
const { mdInline, tr } = useData()

const portrait = (key) => ({ key, name: config.portraits[key], src: new URL(`../../theme/assets/hb/${key}.jpg`, import.meta.url).href })
const columns = Array.from({ length: 10 }, (_, i) => [portrait(`a${i + 1}`), portrait(`b${i + 1}`)])

const perspectives = computed(() =>
  historicalPerspectives.value.map((record, index) => ({
    id: record.id,
    title: mdInline(tr('collections', record.id)?.title ?? record.internal_name),
    to: { name: 'historical-background-page', params: { page: index + 1 }, query: { lang: locale.value } },
  })),
)

const austria = computed(() => {
  const record = historicalProfileCountries.value.find((candidate) => candidate.country_id === 'aut')
  return record ? historicalProfileNodeRoute(record) : null
})
const related = computed(() => [
  { label: t('sharinghistory.hb.timeline'), to: { name: 'timeline-results', query: { theme: POLITICAL, lang: locale.value } }, target: '_blank' },
  ...(austria.value ? [{ label: t('sharinghistory.hb.profiles'), to: austria.value, target: '_blank' }] : []),
  ...(router.hasRoute('historical-background-insight')
    ? [{ label: t('sharinghistory.hb.maps'), to: { name: 'historical-background-insight', query: { lang: locale.value } } }]
    : []),
])
</script>

<template>
  <div class="sharinghistory-hb">
    <HistoricalBackgroundBand active="about" />
    <div class="sharinghistory-hb__mosaic">
      <div v-for="(column, index) in columns" :key="index" class="sharinghistory-hb__column">
        <img v-for="p in column" :key="p.key" :src="p.src" :alt="p.name" :title="p.name">
      </div>
    </div>
    <div class="sharinghistory-hb__text">
      <I18nText tag="h3" keypath="sharinghistory.hb.intro" />
      <p class="sharinghistory-hb__pages">
        <template v-for="p in perspectives" :key="p.id">
          <!-- eslint-disable-next-line vue/no-v-html -- the record's own Markdown, rendered and escaped by viewer-core -->
          <RouterLink :to="p.to"><span v-html="p.title"></span></RouterLink><br>
        </template>
      </p>
      <p class="sharinghistory-hb__related">
        <b>{{ t('sharinghistory.tlr.related') }}</b><br>
        <template v-for="link in related" :key="link.label">
          <RouterLink :to="link.to" :target="link.target">{{ link.label }}</RouterLink><br>
        </template>
      </p>
    </div>
  </div>
</template>
