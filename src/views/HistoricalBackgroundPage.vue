<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import HistoricalBackgroundBand from '../components/HistoricalBackgroundBand.vue'
import config from '../historicalBackground.json'
import { historicalPerspectives, historicalProfileCountries, historicalProfileNodeRoute } from '../composables/history.js'
import { useData } from '../composables/data.js'
import { POLITICAL, timelineCountryOptions } from '../composables/timeline.js'

// A perspective as legacy's historical_background_pages.php: the band
// (About), the page's portraits two by two on dark red, the other
// perspectives on the right, the title and the text, then the countries of
// the perspective — their historical profiles and their political context
// timelines — and "As Word". Every word is legacy's own
// (sharinghistory.hb.*, sharinghistory.tlr.*); the portraits and countries
// of each page are the site's (src/historicalBackground.json), by country
// code where legacy matched names some of which have since changed.

const props = defineProps({ page: { type: Number, required: true } })

const { t, locale } = useI18n()
const { labelOf, md, mdInline, tr } = useData()

const index = computed(() => props.page - 1)
const record = computed(() => historicalPerspectives.value[index.value] ?? null)
const setting = computed(() => config.perspectives[index.value] ?? { portraits: [], countries: [] })
const portraits = computed(() =>
  setting.value.portraits.map((key) => ({ key, name: config.portraits[key], src: new URL(`../../theme/assets/hb/${key}.jpg`, import.meta.url).href })),
)
const title = computed(() => (record.value ? tr('collections', record.value.id)?.title ?? record.value.internal_name : ''))
const others = computed(() =>
  historicalPerspectives.value
    .map((other, i) => ({ id: other.id, title: mdInline(tr('collections', other.id)?.title ?? other.internal_name), page: i + 1 }))
    .filter((other) => other.page !== props.page),
)

const byName = (a, b) => a.label.localeCompare(b.label)
const profiles = computed(() =>
  historicalProfileCountries.value
    .filter((country) => setting.value.countries.includes(country.country_id))
    .map((country) => ({ id: country.country_id, label: labelOf('countries', country.country_id), to: historicalProfileNodeRoute(country) }))
    .sort(byName),
)
const timelines = computed(() =>
  timelineCountryOptions()
    .filter((country) => setting.value.countries.includes(country.value))
    .map((country) => ({ id: country.value, label: country.label, to: { name: 'timeline-results', query: { country: country.value, theme: POLITICAL, lang: locale.value } } })),
)

// Legacy's export_historical_background_content.php: the title, the text,
// then the two lists of countries, as a .doc named after the title.
function asWord() {
  const lines = (label, list) => (list.length ? `<b>${label}: </b>${list.map((c) => c.label).join(' | ')}` : '')
  const html = `<html><title>MWNF - Sharing History</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><body>
<div class="hb_content_pages_title"><b>${mdInline(title.value)}</b></div><br>
<div>${md(tr('collections', record.value.id)?.description ?? '')}</div>
<div>${lines(t('sharinghistory.hb.profiles'), profiles.value)}</div>
<div><br/>${lines(t('sharinghistory.tle.political'), timelines.value)}<br/></div>
</body></html>`
  const url = URL.createObjectURL(new window.Blob(['﻿', html], { type: 'application/msword' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: `${title.value.replace(/ /g, '-')}.doc` })
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
</script>

<template>
  <div class="sharinghistory-hbp">
    <HistoricalBackgroundBand active="about" />
    <div v-if="record" class="sharinghistory-hbp__body">
      <div class="sharinghistory-hbp__portraits">
        <img v-for="p in portraits" :key="p.key" :src="p.src" :alt="p.name" :title="p.name">
      </div>
      <div class="sharinghistory-hbp__main">
        <p class="sharinghistory-hbp__others">
          <template v-for="(other, i) in others" :key="other.id">
            <template v-if="i"> | </template>
            <!-- eslint-disable-next-line vue/no-v-html -- the record's own Markdown, rendered and escaped by viewer-core -->
            <RouterLink :to="{ name: 'historical-background-page', params: { page: other.page }, query: { lang: locale } }"><span v-html="other.title"></span></RouterLink>
          </template>
        </p>
        <div class="sharinghistory-hbp__text">
          <!-- eslint-disable vue/no-v-html -- the record's own Markdown, rendered and escaped by viewer-core -->
          <h2 v-html="mdInline(title)"></h2>
          <div class="sharinghistory-hbp__description" v-html="md(tr('collections', record.id)?.description ?? '')"></div>
          <!-- eslint-enable vue/no-v-html -->
          <div class="sharinghistory-hbp__countries">
            <p v-if="profiles.length">
              <b>{{ t('sharinghistory.hb.profiles') }}: </b>
              <template v-for="(c, i) in profiles" :key="c.id"><template v-if="i"> | </template><RouterLink :to="c.to" target="_blank">{{ c.label }}</RouterLink></template>
            </p>
            <p v-if="timelines.length">
              <b>{{ t('sharinghistory.tle.political') }}: </b>
              <template v-for="(c, i) in timelines" :key="c.id"><template v-if="i"> | </template><RouterLink :to="c.to" target="_blank">{{ c.label }}</RouterLink></template>
            </p>
          </div>
          <p class="sharinghistory-hbp__download">
            {{ t('sharinghistory.tlr.download') }}<br>
            <a href="#" @click.prevent="asWord">{{ t('sharinghistory.tlr.word') }}</a>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
