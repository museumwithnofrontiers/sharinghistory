<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { languageLabels, useI18n, useRecordLanguage } from '@museumwnf/viewer-core'
import { RecordLanguages } from '@museumwnf/viewer-layout/content'
import { StandalonePagination } from '@museumwnf/viewer-layout/standalone'
import { bibliographyOf, bibliographyTitle } from '../composables/bibliography.js'
import { useData } from '../composables/data.js'

// The bibliography as legacy's bibliography.php: the band (Bibliography),
// the languages legacy has it in — the page's language when it has it,
// English when it does not, as legacy fell back — the way back, the line
// naming what it is the bibliography of, then its entries, fifteen a page,
// legacy's "No data found" when it has none. Every word is legacy's own
// (sharinghistory.bib.*); the entries are the package's
// (composables/bibliography.js).

const PAGE_SIZE = 15

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { itemById, loadTranslations, mdInline } = useData()

const query = computed(() => ({
  item: route.query.item,
  profile: route.query.profile,
  country: route.query.country,
  theme: route.query.theme,
}))

// An item may carry no English: its lists are in its own translations.
const itemLanguages = computed(() => (query.value.item ? itemById.value.get(query.value.item)?.languages ?? [] : []))
watchEffect(() => itemLanguages.value.forEach((code) => loadTranslations('items', code)))

const lists = computed(() => bibliographyOf(query.value, itemLanguages.value))
// The language chosen holds while the page shows the same bibliography.
const shownKey = () => Object.values(query.value).join('|')
const { language, languages, select } = useRecordLanguage(shownKey, { languages: () => Object.keys(lists.value) })
const entries = computed(() => lists.value[language.value] ?? [])
const title = computed(() => bibliographyTitle(query.value, t))

const lastPage = computed(() => Math.max(1, Math.ceil(entries.value.length / PAGE_SIZE)))
const page = computed(() => Math.min(Math.max(1, Number(route.query.page) || 1), lastPage.value))
const shown = computed(() => entries.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE))
function navigate(to) {
  router.push({ name: 'bibliography', query: { ...route.query, page: String(to) } })
}
</script>

<template>
  <div class="sharinghistory-bib">
    <RecordLanguages class="sharinghistory-bib__languages" :languages="languageLabels(languages)" :language="language" :from="1" @select="select" />
    <p class="mwnf-standalone-item__back sharinghistory-bib__back">
      <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('sharinghistory.bib.back') }}</button>
    </p>
    <h3 class="sharinghistory-bib__title">{{ title }}</h3>
    <div class="sharinghistory-bib__entries" :lang="language">
      <!-- eslint-disable-next-line vue/no-v-html -- the package's own Markdown, rendered and escaped by viewer-core -->
      <p v-for="(entry, i) in shown" :key="i" v-html="mdInline(entry)"></p>
      <p v-if="!entries.length" class="sharinghistory-bib__empty">{{ t('sharinghistory.bib.empty') }}</p>
    </div>
    <StandalonePagination
      :page-info="{ currentPage: page, lastPage }"
      :previous-label="t('sharinghistory.bib.previous')"
      :next-label="t('sharinghistory.bib.next')"
      @navigate="navigate"
    />
  </div>
</template>
