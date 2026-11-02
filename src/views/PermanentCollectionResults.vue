<script setup>
import { computed } from 'vue'
import { useFacets, useI18n } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { StandalonePagination, StandaloneResultsGrid } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import {
  DECADES, FACETS, chapterOptions, collectionById, collectionTitle, exhibitionOptions, permanentCollectionResultsSpec,
  themeOptions,
} from '../composables/catalogue.js'
import { minisiteHref } from '../composables/exhibitions.js'
import { historicalProfileCountries, historicalProfileNodeRoute } from '../composables/history.js'

// The Collections results as legacy's pclist_all.php: the way back, the
// selection in words with its count and "Navigation by", legacy's tiles with
// "Change your selection" and "Related Content" beside them, and legacy's
// pages under both — the standalone family's results page (viewer-layout's
// `mwnf-standalone-pcr`). The query and the pages are viewer-layout's
// `CatalogueResultsView` (composables/catalogue.js's spec); every word is
// legacy's own (sharinghistory.pcr.*, sharinghistory.pc.*).

const { t, locale } = useI18n()
const { items, labelOf } = useData()

const options = useFacets(items, FACETS)
const countries = computed(() => [...(options.value.country ?? [])].sort((a, b) => a.label.localeCompare(b.label, locale.value)))
const exhibitions = computed(() => exhibitionOptions())
const title = (id) => (id ? collectionTitle(collectionById(id) ?? { internal_name: '' }) : '')
const picked = (value) => Boolean(value) && value !== 'none'

// "Collections | Portugal | Theme | Subtheme | Chapter | 1820 to 1850": the
// country, the theme and the period bold, the subtheme bold italic, the
// chapter italic, as legacy wrote them.
function selection(filters) {
  const parts = []
  if (filters.country) parts.push({ text: labelOf('countries', filters.country), bold: true })
  if (filters.exhibition) parts.push({ text: title(filters.exhibition), bold: true })
  if (filters.theme) parts.push({ text: title(filters.theme), bold: true, italic: true })
  if (filters.chapter) parts.push({ text: title(filters.chapter), italic: true })
  if (picked(filters.start) || picked(filters.end)) {
    const from = picked(filters.start) ? filters.start : 'Before 1800'
    const to = picked(filters.end) ? filters.end : 'After 1930'
    parts.push({ text: `${from} to ${to}`, bold: true })
  }
  return parts
}

// "[49 Objects, 17 Monuments]", each part only when it counts something.
function count(matching) {
  const monuments = matching.filter((item) => item.type === 'monument').length
  const objects = matching.length - monuments
  const parts = []
  if (objects) parts.push(`${objects} ${t('sharinghistory.pcr.objects')}`)
  if (monuments) parts.push(`${monuments} ${t('sharinghistory.pcr.monuments')}`)
  return parts.length ? `[${parts.join(', ')}]` : ''
}

// "Navigation by Country" or "by Theme", as the selection started.
function navigation(filters) {
  if (filters.country) return `${t('sharinghistory.pcr.viewBy')} ${t('sharinghistory.pc.country')}`
  if (filters.exhibition) return `${t('sharinghistory.pcr.viewBy')} ${t('sharinghistory.pc.theme')}`
  return ''
}

// Legacy's lists: a new country keeps the rest; a new theme drops the
// subtheme and chapter; a new subtheme drops the chapter; a period keeps the
// rest and is refused, with legacy's alert, when it ends before it starts.
function choose(apply, filters, key, value) {
  const next = { ...filters }
  if (key === 'exhibition') Object.assign(next, { exhibition: value, theme: '', chapter: '' })
  else if (key === 'theme') Object.assign(next, { theme: value, chapter: '' })
  else next[key] = value
  const years = [next.start, next.end].map(Number)
  if ((key === 'start' || key === 'end') && years.every((year) => Number.isFinite(year)) && years[0] > years[1]) {
    window.alert(t('sharinghistory.pcr.alertPeriod'))
    return
  }
  apply(next)
}

const profileRoute = (country) => {
  const record = historicalProfileCountries.value.find((candidate) => candidate.country_id === country)
  return record ? historicalProfileNodeRoute(record) : null
}
const timelineLink = (country) => ({ name: 'timeline-results', query: { country, lang: locale.value } })
// A theme's own introduction: legacy opened it in a window; the exhibition
// is a website of its own now, which opens on it.
const introduction = (filters) => {
  if (filters.country || !filters.exhibition) return null
  const level = filters.chapter
    ? t('sharinghistory.pcr.introductionChapter')
    : filters.theme ? t('sharinghistory.pcr.introductionSubtheme') : t('sharinghistory.pcr.introductionTheme')
  const href = minisiteHref(filters.exhibition, locale.value)
  return href ? { href, label: `${t('sharinghistory.pcr.introduction')} ${level}` } : null
}
</script>

<template>
  <CatalogueResultsView :spec="permanentCollectionResultsSpec" class="mwnf-standalone-pcr sharinghistory-pcr">
    <template #before="{ filters, matching }">
      <p class="mwnf-standalone-item__back mwnf-standalone-pcr__back">
        <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('sharinghistory.pcr.back') }}</button>
        <RouterLink class="mwnf-standalone-item__back-link" :to="{ name: 'permanent-collection', query: { lang: locale } }">{{ t('sharinghistory.pcr.startPage') }}</RouterLink>
      </p>
      <div class="sharinghistory-pcr__head">
        <h3 class="mwnf-standalone-pcr__heading">
          {{ t('sharinghistory.pcr.title') }}<template v-for="part in selection(filters)" :key="part.text"> | <b v-if="part.bold"><i v-if="part.italic">{{ part.text }}</i><template v-else>{{ part.text }}</template></b><i v-else-if="part.italic">{{ part.text }}</i><template v-else>{{ part.text }}</template></template>
          <template v-if="count(matching)">{{ ' ' }}<span class="mwnf-standalone-pcr__count">{{ count(matching) }}</span></template>
        </h3>
        <p v-if="navigation(filters)" class="sharinghistory-pcr__navigation">{{ navigation(filters) }}</p>
      </div>
    </template>

    <template #records="{ rows, empty }">
      <StandaloneResultsGrid :rows="rows" :see-label="t('sharinghistory.pcr.see')" :empty="empty" />
    </template>

    <!-- Legacy's pages run under both columns: drawn after them. -->
    <template #pagination></template>

    <template #aside="{ filters, apply }">
      <form class="mwnf-standalone-pcr__panel" @submit.prevent>
        <p>
          <strong>{{ t('sharinghistory.pcr.changeSelection') }}</strong>
          <template v-if="filters.country">
            <select :value="filters.country" @change="choose(apply, filters, 'country', $event.target.value)">
              <option v-for="o in countries" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
            <select :value="filters.exhibition || ''" @change="choose(apply, filters, 'exhibition', $event.target.value)">
              <option value="">{{ t('sharinghistory.pc.theme') }}</option>
              <option v-for="o in exhibitions" :key="o.value" :value="o.value">{{ o.label }}</option>
            </select>
          </template>
          <select v-else-if="filters.exhibition" :value="filters.exhibition" @change="choose(apply, filters, 'exhibition', $event.target.value)">
            <option v-for="o in exhibitions" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <select v-if="filters.exhibition" :value="filters.theme || ''" @change="choose(apply, filters, 'theme', $event.target.value)">
            <option value="">{{ t('sharinghistory.pcr.subtheme') }}</option>
            <option v-for="o in themeOptions(filters.exhibition)" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <select v-if="filters.exhibition && filters.theme" :value="filters.chapter || ''" @change="choose(apply, filters, 'chapter', $event.target.value)">
            <option value="">{{ t('sharinghistory.pcr.chapter') }}</option>
            <option v-for="o in chapterOptions(filters.exhibition, filters.theme)" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </p>
        <p>
          <span class="mwnf-standalone-pcr__date">
            <select :value="filters.start || 'none'" @change="choose(apply, filters, 'start', $event.target.value)">
              <option value="none">{{ t('sharinghistory.pc.startDate') }}</option>
              <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
            </select>
          </span>
          <span class="mwnf-standalone-pcr__date">
            <select :value="filters.end || 'none'" @change="choose(apply, filters, 'end', $event.target.value)">
              <option value="none">{{ t('sharinghistory.pc.endDate') }}</option>
              <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
            </select>
          </span>
        </p>
      </form>
      <div v-if="filters.country || filters.exhibition" class="mwnf-standalone-pcr__related">
        <p><strong>{{ t('sharinghistory.pcr.related') }}</strong></p>
        <template v-if="filters.country">
          <p v-if="profileRoute(filters.country)">
            <RouterLink :to="profileRoute(filters.country)">{{ t('sharinghistory.pcr.historicalProfile') }} | {{ labelOf('countries', filters.country) }}</RouterLink>
          </p>
          <p v-if="!filters.exhibition">
            <RouterLink :to="timelineLink(filters.country)" :title="t('sharinghistory.pcr.timelineTooltip')">{{ t('sharinghistory.pcr.timeline') }} | {{ labelOf('countries', filters.country) }}</RouterLink>
          </p>
        </template>
        <p v-else-if="introduction(filters)"><a :href="introduction(filters).href">{{ introduction(filters).label }}</a></p>
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
