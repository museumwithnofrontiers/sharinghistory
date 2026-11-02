<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { StandaloneTimelineResults } from '@museumwnf/viewer-layout/standalone'
import TimelinePictures from '../components/TimelinePictures.vue'
import { bibliographyLink, hasBibliography } from '../composables/bibliography.js'
import { DECADES } from '../composables/catalogue.js'
import { useData } from '../composables/data.js'
import { historicalProfileCountries, historicalProfileNodeRoute } from '../composables/history.js'
import {
  ALL, POLITICAL, eventRow, periodRunsForward, searchLine, timelineCountryOptions, timelineSearch, timelineThemeOptions, wordFile,
} from '../composables/timeline.js'

// The Timeline results as legacy's hcr_result.php, the standalone family's
// (viewer-layout's `StandaloneTimelineResults`): the band with the search in
// words and its four lists, which search again as soon as one changes; the
// events, ten a page, each its date with its pictures under it, then
// "Country | Theme" and its description; and beside them the Related Content
// column (its bibliography on its own page, Bibliography.vue) and the
// downloads. Every word is legacy's own
// (sharinghistory.tlr.*, sharinghistory.tle.*); the alerts are the ones
// legacy's page script wrote, in English.

const PAGE_SIZE = 10

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { labelOf } = useData()

const query = computed(() => ({
  start: route.query.start ?? 'none',
  end: route.query.end ?? 'none',
  country: route.query.country ?? 'none',
  theme: route.query.theme ?? 'none',
}))
const political = computed(() => query.value.theme === POLITICAL)
const searched = computed(() => ({
  ...query.value,
  country: query.value.country === 'none' ? undefined : query.value.country,
  theme: query.value.theme === 'none' ? undefined : query.value.theme,
}))

const events = computed(() => timelineSearch(searched.value))
const lastPage = computed(() => Math.max(1, Math.ceil(events.value.length / PAGE_SIZE)))
const page = computed(() => Math.min(Math.max(1, Number(route.query.page) || 1), lastPage.value))
const rows = computed(() => events.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE).map((event) => eventRow(event, t)))
const pageInfo = computed(() => ({ currentPage: page.value, lastPage: lastPage.value }))

const decades = (none) => [{ value: 'none', label: `${t('sharinghistory.tle.selectA')} ${none}` }, ...DECADES.map((d) => ({ value: d, label: d }))]
const selects = computed(() => [
  { key: 'start', label: t('sharinghistory.tle.startDate'), value: query.value.start, options: decades(t('sharinghistory.tle.startDate')) },
  { key: 'end', label: t('sharinghistory.tle.endDate'), value: query.value.end, options: decades(t('sharinghistory.tle.endDate')) },
  {
    key: 'country',
    label: t('sharinghistory.tle.country'),
    value: query.value.country,
    options: [
      { value: 'none', label: `${t('sharinghistory.tle.selectA')} ${t('sharinghistory.tle.country')}` },
      { value: ALL, label: t('sharinghistory.tle.allCountries') },
      ...timelineCountryOptions(),
    ],
  },
  {
    key: 'theme',
    label: t('sharinghistory.tle.theme'),
    value: political.value ? 'none' : query.value.theme,
    disabled: political.value,
    options: [
      { value: 'none', label: `${t('sharinghistory.tle.selectA')} ${t('sharinghistory.tle.theme')}` },
      { value: ALL, label: t('sharinghistory.tle.allThemes') },
      ...timelineThemeOptions(),
    ],
  },
])

// Legacy's selectCountry(), selectTheme() and selectTimePeriod(): what a
// change must leave for the page to search again, said in legacy's alerts.
function problem(key, next) {
  if (key === 'start' || key === 'end') {
    if (next.start === 'none') return t('sharinghistory.tlr.alertStart')
    if (next.end === 'none') return t('sharinghistory.tlr.alertEnd')
    return periodRunsForward(next.start, next.end) ? '' : t('sharinghistory.tle.alertPeriod')
  }
  if (next.country === 'none' && next.theme === 'none') return t('sharinghistory.tlr.alertThemeCountry')
  if (next.theme === ALL && next.country === 'none') return t('sharinghistory.tlr.alertCountry')
  if (next.country === ALL && next.theme === 'none') return t('sharinghistory.tlr.alertTheme')
  return ''
}
function change({ key, value }) {
  const next = { ...query.value, [key]: value }
  if (next.country === ALL && next.theme === ALL) next.country = 'none'
  const message = problem(key, next)
  if (message) {
    window.alert(message)
    return
  }
  open(next)
}
function open(next) {
  const kept = Object.fromEntries(Object.entries(next).filter(([, value]) => value && value !== 'none'))
  router.push({ name: 'timeline-results', query: { ...kept, lang: route.query.lang } })
}
function navigate(to) {
  router.push({ name: 'timeline-results', query: { ...route.query, page: String(to) } })
}

const country = computed(() => (query.value.country !== 'none' && query.value.country !== ALL ? query.value.country : null))
const profile = computed(() => {
  const record = country.value ? historicalProfileCountries.value.find((candidate) => candidate.country_id === country.value) : null
  return record ? historicalProfileNodeRoute(record) : null
})
// A country's bibliography: its theme's timeline's, or, every theme or none
// asked, all of its timelines' (legacy's "All Themes").
const bibliography = computed(() =>
  country.value ? { country: country.value, theme: query.value.theme === 'none' ? ALL : query.value.theme } : null,
)
const period = computed(() => ({ start: route.query.start, end: route.query.end }))
const related = computed(() => ({
  heading: t('sharinghistory.tlr.related'),
  links: [
    political.value
      ? { label: t('sharinghistory.tlr.addThematic'), to: { name: 'timeline-results', query: { ...period.value, country: route.query.country, lang: route.query.lang } } }
      : { label: t('sharinghistory.tlr.switchPolitical'), to: { name: 'timeline-results', query: { ...period.value, country: route.query.country, theme: POLITICAL, lang: route.query.lang } } },
    {
      label: t('sharinghistory.tlr.gallery'),
      title: t('sharinghistory.tlr.galleryTooltip'),
      target: '_blank',
      to: { name: 'timeline-gallery', query: { ...route.query, page: undefined } },
    },
    ...(bibliography.value && hasBibliography(bibliography.value)
      ? [{ label: t('sharinghistory.bib.title'), to: bibliographyLink(bibliography.value, route.query.lang) }]
      : []),
    ...(profile.value ? [{ label: `${t('sharinghistory.tlr.historicalProfile')} ${labelOf('countries', country.value)}`, to: profile.value }] : []),
    { label: t('sharinghistory.tlr.aboutHb'), target: '_blank', to: { name: 'historical-background', query: { lang: route.query.lang } } },
  ],
}))

const download = computed(() => ({
  heading: t('sharinghistory.tlr.download'),
  pdf: t('sharinghistory.tlr.pdf'),
  word: t('sharinghistory.tlr.word'),
  title: 'MWNF - Sharing History',
  line: `${t('sharinghistory.nav.timeline').toUpperCase()} / ${searchLine(searched.value, t, ' / ')}`,
  file: wordFile(searched.value),
}))
const back = computed(() => [
  { label: t('sharinghistory.pcr.back'), history: true },
  { label: t('sharinghistory.tlr.startPage'), to: { name: 'timeline', query: { lang: route.query.lang } } },
])
const heads = computed(() => ({
  date: t('sharinghistory.tlr.date'),
  countryDescription: `${t('sharinghistory.tlr.country')} | ${t('sharinghistory.tlr.theme')} | ${t('sharinghistory.tlr.description')}`,
  country: t('sharinghistory.tlr.country'),
  theme: t('sharinghistory.tlr.theme'),
}))
const all = computed(() => events.value.map((event) => {
  const row = eventRow(event, t)
  return { ...row, country: row.place }
}))
</script>

<template>
  <StandaloneTimelineResults
    class="sharinghistory-tlr"
    :heading="t('sharinghistory.nav.timeline')"
    :summary="searchLine(searched, t)"
    :selects="selects"
    :back="back"
    :heads="heads"
    :rows="rows"
    :all="all"
    :empty="t('sharinghistory.tlr.empty')"
    :page-info="pageInfo"
    :previous-label="t('sharinghistory.pcr.previous')"
    :next-label="t('sharinghistory.pcr.next')"
    :related="related"
    :download="download"
    @change="change"
    @navigate="navigate"
  >
    <template #media="{ row }">
      <TimelinePictures :pictures="row.pictures" :see-label="t('sharinghistory.pcr.see')" />
    </template>
  </StandaloneTimelineResults>
</template>
