<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { I18nText, useI18n } from '@museumwnf/viewer-core'
import HistoricalBackgroundBand from '../components/HistoricalBackgroundBand.vue'
import { historicalProfileCountries, historicalProfileNodeRoute } from '../composables/history.js'
import { useData } from '../composables/data.js'
import { ALL, POLITICAL, timelineCountryOptions } from '../composables/timeline.js'

// Country Insight as legacy's historical_background_insight.php: the band
// (Country Insight), the way back, its word to the visitor, then three
// lists — a country's historical profile, its political context timeline
// (in a new window, over the whole period) and its maps — and, for the
// country chosen, its maps: the first one large with the download and its
// words, the others in thumbnails that show themselves there under the
// pointer. Every word is legacy's own (sharinghistory.hbi.*,
// sharinghistory.hb.*); the maps are the historical profiles' own.

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { collections, labelOf, tr } = useData()

const byLabel = (a, b) => a.label.localeCompare(b.label)
const profiles = computed(() =>
  historicalProfileCountries.value.map((record) => ({ value: record.country_id, label: labelOf('countries', record.country_id), to: historicalProfileNodeRoute(record) })).sort(byLabel),
)

// Each country's maps: its historical profile's pictures of type `map`, in
// their order, each with its words — the profile's `map_descriptions`,
// keyed by legacy's map_id, which is the map's order on every profile — in
// the page's language, else English.
const mapsOf = (country) =>
  (collections.value ?? [])
    .filter((c) => c.country_id === country)
    .flatMap((c) => {
      const words = tr('collections', c.id)?.extra?.map_descriptions ?? {}
      return (c.images ?? [])
        .filter((image) => image.type === 'map')
        .map((image) => {
          const own = words[`map_${image.display_order}`] ?? {}
          return { url: image.url, display_order: image.display_order, words: own[locale.value] ?? own.en ?? '' }
        })
    })
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
const mapCountries = computed(() => {
  const ids = new Set((collections.value ?? []).filter((c) => (c.images ?? []).some((image) => image.type === 'map')).map((c) => c.country_id).filter(Boolean))
  return [...ids].map((id) => ({ value: id, label: labelOf('countries', id) })).sort(byLabel)
})

const mapCountry = computed(() => route.query.mapcountry ?? 'none')
const maps = computed(() => (mapCountry.value === 'none' ? [] : mapsOf(mapCountry.value)))
const shown = ref(0)
watch(mapCountry, () => { shown.value = 0 })
const map = computed(() => maps.value[shown.value] ?? maps.value[0] ?? null)

function openProfile(value) {
  const profile = profiles.value.find((p) => p.value === value)
  if (profile) router.push(profile.to)
}
function openTimeline(value) {
  if (value === 'none') return
  const href = router.resolve({ name: 'timeline-results', query: { country: value, theme: POLITICAL, start: 'Before 1800', end: 'After 1930', lang: locale.value } }).href
  window.open(href, '_blank')
}
function showMaps(value) {
  router.push({ name: 'historical-background-insight', query: { ...route.query, mapcountry: value === 'none' ? undefined : value } })
}
const selectA = computed(() => `${t('sharinghistory.tle.selectA')} ${t('sharinghistory.tle.country')}`)
</script>

<template>
  <div class="sharinghistory-hbi">
    <HistoricalBackgroundBand active="insight" />
    <p class="mwnf-standalone-item__back sharinghistory-hbi__back">
      <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('sharinghistory.pcr.back') }}</button>
    </p>
    <div class="sharinghistory-hbi__body">
      <I18nText tag="div" class="sharinghistory-hbi__intro" keypath="sharinghistory.hbi.intro" />
      <div class="sharinghistory-hbi__lists">
        <div>
          <p><strong>{{ t('sharinghistory.hb.profiles') }}</strong></p>
          <select :title="t('sharinghistory.hbi.countryTooltip')" @change="openProfile($event.target.value)">
            <option value="none">{{ selectA }}</option>
            <option v-for="o in profiles" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div>
          <p><strong>{{ t('sharinghistory.hb.timeline') }}</strong></p>
          <select @change="openTimeline($event.target.value)">
            <option value="none">{{ selectA }}</option>
            <option :value="ALL">{{ t('sharinghistory.tle.allCountries') }}</option>
            <option v-for="o in timelineCountryOptions()" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
        <div>
          <p><strong>{{ t('sharinghistory.hbi.viewMaps') }}</strong></p>
          <select :value="mapCountry" @change="showMaps($event.target.value)">
            <option value="none">{{ selectA }}</option>
            <option v-for="o in mapCountries" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </div>
      </div>
      <div v-if="map" class="sharinghistory-hbi__maps">
        <h3>{{ t('sharinghistory.hb.maps') }} | {{ labelOf('countries', mapCountry) }}</h3>
        <a class="sharinghistory-hbi__map" :href="map.url" target="_blank" rel="noopener"><img :src="map.url" alt=""></a>
        <p><a :href="map.url" target="_blank" rel="noopener"><img class="sharinghistory-hbi__print" src="../../theme/assets/icons/print_dark.gif" alt="" :title="t('sharinghistory.hbi.downloadMap')"></a></p>
        <p v-if="map.words" class="sharinghistory-hbi__words">{{ map.words }}</p>
        <div v-if="maps.length > 1" class="sharinghistory-hbi__thumbs">
          <a v-for="(m, i) in maps" :key="m.url" :href="m.url" @mouseover="shown = i"><img :src="m.url" alt=""></a>
        </div>
      </div>
    </div>
  </div>
</template>
