<script setup>
import { computed, ref, watch, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderInline, useI18n } from '@museumwnf/viewer-core'
import { bibliographyLink, hasBibliography } from '../composables/bibliography.js'
import { historicalProfileCountries, historicalProfileNodeRoute, historicalProfilesTree } from '../composables/history.js'
import { resultTile } from '../composables/catalogue.js'
import { useData } from '../composables/data.js'
import { POLITICAL } from '../composables/timeline.js'

// A country's historical profile as legacy's hb_result.php: the way back,
// every profile's country (this one in red), the country's band with
// "« Previous | Page 1 of 3 | Next »", then the page's pictures with the
// caption of the one shown and "See Database Entry", the page's title and
// text, and the red Related Content column (the Historical Background, the
// country's political context timeline, its bibliography, its maps, then
// Download). Every word is legacy's own.

const props = defineProps({
  recordId: { type: String, required: true },
  pageId: { type: String, default: null },
})

const route = useRoute()
const router = useRouter()
const { t, locale } = useI18n()
const { itemById, labelOf, md, mdInline, tr } = useData()

const record = computed(() => historicalProfilesTree.byId.value.get(props.recordId) ?? null)
const pages = computed(() => (record.value ? historicalProfilesTree.children(record.value.id) : []))

// A bare record address, or a bookmarked `?page=N` one (legacy's own query
// pagination), canonicalised once onto the record's own explicit page
// address — the address `historicalProfileNodeRoute` and every card linking
// here already hand out directly.
watchEffect(() => {
  if (props.pageId || !pages.value.length) return
  const ordinal = Number.parseInt(String(route.query.page ?? '1'), 10)
  const index = Number.isInteger(ordinal) && ordinal >= 1 && ordinal <= pages.value.length ? ordinal - 1 : 0
  router.replace({
    name: 'historical-profile',
    params: { recordId: props.recordId, pageId: pages.value[index].id },
    query: { lang: route.query.lang },
  })
})

const index = computed(() => pages.value.findIndex((page) => page.id === props.pageId))
const page = computed(() => pages.value[index.value] ?? null)
const pageText = computed(() => (page.value ? tr('collections', page.value.id) : {}))
const country = computed(() => (record.value?.country_id ? labelOf('countries', record.value.country_id) : ''))
const pageRoute = (at) => ({ name: 'historical-profile', params: { recordId: props.recordId, pageId: pages.value[at].id }, query: { lang: locale.value } })

// Every profile's country by its name, as legacy's #hbCnList.
const countries = computed(() =>
  historicalProfileCountries.value
    .map((profile) => ({ id: profile.id, label: labelOf('countries', profile.country_id), to: { ...historicalProfileNodeRoute(profile), query: { lang: locale.value } } }))
    .sort((a, b) => a.label.localeCompare(b.label)),
)

// The page's pictures, each its item's first, captioned as legacy's: the
// name, the date, then the holding museum with the place.
const pictures = computed(() =>
  (page.value?.items ?? [])
    .map((entry) => itemById.value.get(entry.id))
    .filter((item) => item?.images?.length)
    .map((item) => {
      const tile = resultTile(item, { tr, renderInline })
      return {
        id: item.id,
        url: item.images[0].url,
        caption: [tile.name, ...tile.lines, [tile.holder, tile.location].filter(Boolean).join(', ')].filter(Boolean),
        to: tile.to,
      }
    }),
)
const shown = ref(0)
watch(() => props.pageId, () => { shown.value = 0 })
const picture = computed(() => pictures.value[shown.value] ?? null)

const bibliography = computed(() => ({ profile: props.recordId }))
const politicalTimeline = computed(() => ({
  name: 'timeline-results',
  query: { start: 'Before 1800', end: 'After 1930', country: record.value?.country_id, theme: POLITICAL, lang: locale.value },
}))
const maps = computed(() => ({ name: 'historical-background-insight', query: { mapcountry: record.value?.country_id, lang: locale.value } }))

function print() {
  window.print()
}

// Legacy's export_hb_content.php: "HISTORICAL BACKGROUND / COUNTRY", then
// each page's title and text, as a .doc.
function asWord() {
  const body = pages.value
    .map((each) => {
      const text = tr('collections', each.id)
      return `<tr><td><b>${mdInline(text.title ?? '')}</b></td></tr><tr><td>&nbsp;</td></tr><tr><td style="padding-right:25px;">${md(text.description ?? '')}</td></tr><tr><td>&nbsp;</td></tr>`
    })
    .join('')
  const html = `<html><title>MWNF - Sharing History</title><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><body>
<div><b>${t('sharinghistory.section.historicalBackground').toUpperCase()} / ${country.value.toUpperCase()}</b></div><br>
<table border="0" width="100%">${body}</table>
</body></html>`
  const url = URL.createObjectURL(new window.Blob(['﻿', html], { type: 'application/msword' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: `Historical-background-${record.value?.country_id ?? ''}-con.doc` })
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div v-if="!record" class="mwnf-panel not-found">
    <p>{{ t('sharinghistory.notFound.profile') }}</p>
    <router-link to="/historical-profiles">← {{ t('sharinghistory.profile.returnLink') }}</router-link>
  </div>

  <div v-else-if="page" class="sh-hp">
    <p class="mwnf-standalone-item__back sh-hp__back">
      <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('sharinghistory.item.back') }}</button>
    </p>
    <p class="sh-hp__countries">
      <template v-for="(entry, i) in countries" :key="entry.id">
        <span v-if="entry.id === record.id" class="sh-hp__country">{{ entry.label }}</span>
        <router-link v-else :to="entry.to">{{ entry.label }}</router-link>
        <template v-if="i < countries.length - 1"> | </template>
      </template>
    </p>

    <div class="sh-hp__band">
      <p class="sh-hp__name"><span>{{ country }}</span></p>
      <p class="sh-hp__pages">
        <span>
          <span class="sh-hp__arrow" aria-hidden="true">«</span>&nbsp;<router-link v-if="index > 0" :to="pageRoute(index - 1)">{{ t('sharinghistory.bib.previous') }}</router-link><template v-else>{{ t('sharinghistory.bib.previous') }}</template>&nbsp;&nbsp;|&nbsp;&nbsp;{{ t('sharinghistory.hp.page') }}&nbsp;{{ index + 1 }}&nbsp;{{ t('sharinghistory.hp.of') }}&nbsp;{{ pages.length }}&nbsp;&nbsp;|&nbsp;&nbsp;<router-link v-if="index < pages.length - 1" :to="pageRoute(index + 1)">{{ t('sharinghistory.bib.next') }}</router-link><template v-else>{{ t('sharinghistory.bib.next') }}</template>&nbsp;<span class="sh-hp__arrow" aria-hidden="true">»</span>
        </span>
      </p>
    </div>

    <div class="sh-hp__body">
      <div class="sh-hp__pictures">
        <template v-if="picture">
          <img class="sh-hp__picture" :src="picture.url" alt="" />
          <p class="sh-hp__thumbs">
            <button v-for="(each, i) in pictures" :key="each.id" type="button" :aria-pressed="i === shown" @click="shown = i">
              <img :src="each.url" alt="" />
            </button>
          </p>
          <p class="sh-hp__caption">
            <template v-for="(line, i) in picture.caption" :key="i"><span v-html="line"></span><br v-if="i < picture.caption.length - 1" /></template>
          </p>
          <p class="sh-hp__see"><router-link :to="picture.to">{{ t('sharinghistory.pcr.see') }}</router-link></p>
        </template>
      </div>
      <div class="sh-hp__text">
        <h3 v-html="mdInline(pageText.title ?? '')"></h3>
        <div v-html="md(pageText.description ?? '')"></div>
      </div>
      <aside class="mwnf-standalone-related sh-hp__related">
        <p class="mwnf-standalone-related__heading"><strong>{{ t('sharinghistory.item.relatedContent') }}</strong></p>
        <p><router-link to="/historical-background">{{ t('sharinghistory.hb.title') }}</router-link></p>
        <p v-if="record.country_id"><router-link :to="politicalTimeline">{{ t('sharinghistory.related.politicalContextTimeline') }} {{ country }}</router-link></p>
        <p v-if="hasBibliography(bibliography)"><router-link :to="bibliographyLink(bibliography, locale)">{{ t('sharinghistory.bib.title') }}</router-link></p>
        <p v-if="record.images?.length"><router-link :to="maps">{{ t('sharinghistory.hbi.viewMaps') }}</router-link></p>
        <div class="mwnf-standalone-related__download">
          <p class="mwnf-standalone-related__download-heading">{{ t('sharinghistory.item.download') }}</p>
          <button type="button" class="mwnf-standalone-related__print" @click="print">{{ t('sharinghistory.item.asPdf') }}</button>
          <button type="button" class="mwnf-standalone-related__print mwnf-standalone-related__word" @click="asWord">{{ t('sharinghistory.item.asWord') }}</button>
        </div>
      </aside>
    </div>
  </div>

  <p v-else class="mwnf-essay__status">{{ t('core.status.loading') }}</p>
</template>

<style scoped>
.not-found { color: var(--mwnf-color-muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

/* Legacy's column ends 10px under the pictures, then its section's 30px. */
.sh-hp { padding-bottom: 20px; }

/* Legacy's back link on its 16px line, then #hbCnList: 15px names on 24px
   lines, justified, 25px over and under, this country red. */
.sh-hp__back { height: 16px; min-height: 0; margin: 0; line-height: 16px; }
.sh-hp__countries {
  margin: 0;
  padding: 25px 4px 25px 0;
  font: 500 15px/24px Roboto, sans-serif;
  color: #222;
  text-align: justify;
}
.sh-hp__countries a { color: inherit; text-decoration: none; }
.sh-hp__countries a:hover { text-decoration: underline; }
.sh-hp__country { color: #900000; }

/* The band (.time_line_date): a 2px red rule, the country in a red tab on
   the left (col-md-4), the pages in one on the right (col-md-8). */
.sh-hp__band {
  display: grid;
  grid-template-columns: calc((100% + 30px) / 3 - 15px) 1fr;
  border-top: 2px solid #900;
}
.sh-hp__band p { margin: 0 0 10px; font: 300 16px/22px Roboto, sans-serif; }
.sh-hp__band p > span {
  display: inline-block;
  margin-top: -2px;
  padding: 2px 10px;
  color: #fff;
  background: #900;
}
/* The pages' tab: 34.5% of the band's right part, its words centred, its
   arrows FontAwesome's 9px angles. */
.sh-hp__pages { text-align: right; }
.sh-hp__pages > span { box-sizing: border-box; width: 34.5%; text-align: center; }
.sh-hp__arrow { display: inline-block; width: 9px; text-align: center; }
.sh-hp__pages a { color: inherit; text-decoration: none; }
.sh-hp__pages a:hover { text-decoration: underline; }

/* The pictures (col-md-4), the text (col-md-5), Related Content (col-md-3). */
.sh-hp__body {
  display: grid;
  grid-template-columns: calc((100% + 30px) / 3 - 30px) calc((100% + 30px) * 5 / 12 - 30px) calc((100% + 30px) / 4 - 30px);
  column-gap: 30px;
  align-items: start;
}
.sh-hp__picture { display: block; max-width: 317px; max-height: 240px; margin-top: 5px; }
.sh-hp__thumbs { display: flex; flex-wrap: wrap; margin: 0; }
.sh-hp__thumbs button { margin: 10px 10px 0 0; padding: 0; border: 0; background: none; cursor: pointer; }
.sh-hp__thumbs img { display: block; width: 50px; height: 50px; object-fit: cover; }
.sh-hp__caption { margin: 3px 0 10px; font: 400 16px/22px Roboto, sans-serif; color: #222; }
.sh-hp__see { margin: 0; }
.sh-hp__see a {
  display: inline-block;
  margin: 0 15px 5px 0;
  padding-left: 12px;
  font: 500 14px/22px Roboto, sans-serif;
  color: #222;
  text-decoration: none;
  background: var(--mwnf-standalone-bullet, none) no-repeat 0 6px;
}
.sh-hp__text h3 { margin: 0; font: 500 16px/22px Roboto, sans-serif; color: #000; }
.sh-hp__text :deep(p) { margin: 0 0 22px; font: 400 16px/22px Roboto, sans-serif; color: #222; }
.sh-hp__text :deep(p:last-child) { margin-bottom: 10px; }
/* Legacy's .item_colr_bg.hb_result: moved 20px down without moving the
   page, a 30px cap from 15px over its top, 15px under its last link; its
   links light, one a 20px line, "Download" 15px under them. */
.sh-hp__related { position: relative; top: 20px; margin: 0; padding: 0 20px 15px; }
.sh-hp__related::before {
  content: '';
  position: absolute;
  top: -15px;
  left: 0;
  width: 100%;
  height: 30px;
  background-color: inherit;
}
.sh-hp__related p { position: relative; margin: 0; }
.sh-hp__related .mwnf-standalone-related__heading { padding-top: 0; }
.sh-hp__related .mwnf-standalone-related__heading strong { font-weight: 400; line-height: 22px; }
.sh-hp__related a { display: block; font: 300 16px/20px Roboto, sans-serif; }
.sh-hp__related .mwnf-standalone-related__download { position: relative; margin-top: 15px; padding-top: 0; }
.sh-hp__related .mwnf-standalone-related__print { font-weight: 300; line-height: 20px; }

@media (max-width: 991px) {
  .sh-hp__body { grid-template-columns: calc((100% + 30px) / 3 - 30px) 1fr; }
  .sh-hp__related { grid-column: 1 / -1; }
}
@media (max-width: 767px) {
  .sh-hp__band { grid-template-columns: 1fr 2fr; }
  .sh-hp__body { grid-template-columns: 1fr; }
}
</style>
