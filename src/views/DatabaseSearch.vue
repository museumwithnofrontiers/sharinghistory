<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText, SEARCH_LANGUAGE_KEY, useI18n, useSearchLanguage } from '@museumwnf/viewer-core'
import { StandaloneDatabaseForm } from '@museumwnf/viewer-layout/standalone'

// The Database entrance as legacy's database.php, the standalone family's
// form (viewer-layout's `StandaloneDatabaseForm`): three keyword rows, each
// searched in a category, the second and third joined by "and"/"or"; the
// period, before 1800 to after 1930; the search language, English or
// French; Go; then the portal's complete listing. Sharing History's own: the
// "About" link in the last column, which opens legacy's word to the visitor,
// and legacy's check before searching (frmSubmit1()). Go writes the query
// the results page reads. Every word is legacy's own (sharinghistory.db.*).

const router = useRouter()
const { t } = useI18n()
const { languages, language } = useSearchLanguage('items')

const labels = computed(() => ({
  criteria: t('sharinghistory.db.criteria'),
  keywords: t('sharinghistory.db.keywords'),
  category: t('sharinghistory.db.category'),
  in: t('sharinghistory.db.in'),
  and: t('sharinghistory.db.and'),
  or: t('sharinghistory.db.or'),
  date: t('sharinghistory.db.date'),
  from: t('sharinghistory.db.from'),
  to: t('sharinghistory.db.to'),
  language: t('sharinghistory.db.language'),
  go: t('sharinghistory.db.go'),
  listing: t('sharinghistory.db.listing'),
  listingTooltip: t('sharinghistory.db.listingTooltip'),
}))

const FIELDS = computed(() => [
  { value: 'keyword', label: t('sharinghistory.dbField.keyword') },
  { value: 'name', label: t('sharinghistory.dbField.name') },
  { value: 'location', label: t('sharinghistory.dbField.location') },
  { value: 'provenance', label: t('sharinghistory.dbField.provenance') },
  { value: 'dynasty', label: t('sharinghistory.dbField.dynasty') },
  { value: 'patron', label: t('sharinghistory.dbField.patron') },
  { value: 'artist', label: t('sharinghistory.dbField.artist') },
  { value: 'material', label: t('sharinghistory.dbField.material') },
  { value: 'other', label: t('sharinghistory.dbField.other') },
])

// Legacy's two search languages, named in the page's language, those the
// package carries.
const LANGUAGE_NAMES = computed(() => ({ en: t('sharinghistory.dbLang.en'), fr: t('sharinghistory.dbLang.fr') }))
const searchLanguages = computed(() =>
  languages.value.filter((code) => code in LANGUAGE_NAMES.value).map((code) => ({ code, name: LANGUAGE_NAMES.value[code] })),
)

// Legacy's periods: before 1800 (0), each decade to 1930, after 1930 (2100).
const YEARS = [{ value: 0, label: 'Before 1800' }, ...Array.from({ length: 14 }, (_, i) => 1800 + 10 * i), { value: 2100, label: 'After 1930' }]

const aboutOpen = ref(false)

function go({ rows, from, to }) {
  // Legacy's frmSubmit1(): a keyword, a language, or both dates.
  if (!rows.some((row) => row.keyword) && !language.value && (from === '' || to === '')) {
    window.alert(t('sharinghistory.db.alertEmpty'))
    return
  }
  const query = {}
  rows.forEach((row, index) => {
    if (!row.keyword) return
    const n = index === 0 ? '' : String(index + 1)
    query[`q${n}`] = row.keyword
    query[`field${n}`] = row.field
    if (index) query[`op${n}`] = row.cond
  })
  if (from !== '') query.from = String(from)
  if (to !== '') query.to = String(to)
  if (language.value) query[SEARCH_LANGUAGE_KEY] = language.value
  return router.push({ name: 'database-results', query })
}

const LISTING = 'https://www.museumwnf.org/database_searchform_res.php'
</script>

<template>
  <StandaloneDatabaseForm
    v-model:language="language"
    class="sharinghistory-db"
    :labels="labels"
    :fields="FIELDS"
    :from-years="YEARS"
    :to-years="YEARS"
    :languages="searchLanguages"
    :listing-href="LISTING"
    @search="go"
  >
    <template #aside>
      <a href="#" class="sharinghistory-db__about" @click.prevent="aboutOpen = true">{{ t('sharinghistory.db.explanation') }}</a>
      <span v-if="aboutOpen" class="sharinghistory-db__intro">
        <button type="button" class="sharinghistory-db__close" :aria-label="t('record.glossary.close')" @click="aboutOpen = false">×</button>
        <I18nText tag="span" keypath="sharinghistory.db.intro" />
      </span>
    </template>
  </StandaloneDatabaseForm>
</template>
