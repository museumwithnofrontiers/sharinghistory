<script setup>
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSearchFieldOptions } from '@museumwnf/viewer-core'
import { CatalogueResultsView } from '@museumwnf/viewer-layout/views'
import { useData } from '../composables/data.js'
import { SEARCH_FIELDS, databaseResults } from '../composables/catalogue.js'

// The database results run on the platform's composed `CatalogueResultsView`
// (composables/catalogue.js's `databaseResults`): the query in the URL, the
// pages, the summary line, the rows and the index itself are declared there.
// What stays this wrapper's own is the search-language translations watch —
// a side effect the spec itself has no lifecycle to run, the same one
// legacy's own `database_results.php` ran before it searched a language's
// translations — and the refine row under the summary.

const route = useRoute()
const { loadTranslations } = useData()
const fieldOptions = useSearchFieldOptions(SEARCH_FIELDS)

// The search language is read straight off the URL, not the composed
// view's own staged filters, so a language chosen on the entrance loads
// before this page's first render rather than after an Apply click.
watch(() => route.query.lang, (lang) => { if (lang) loadTranslations('items', lang) }, { immediate: true })
</script>

<template>
  <CatalogueResultsView :spec="databaseResults" class="mwnf-panel">
    <template #before>
      <h1 class="mwnf-heading">{{ $t('sharinghistory.nav.database') }} — {{ $t('catalogue.results.heading') }}</h1>
    </template>

    <template #actions>
      <RouterLink :to="{ name: 'database' }" class="mwnf-button mwnf-button--secondary small">{{ $t('catalogue.search.newSearch') }}</RouterLink>
    </template>

    <template #filters="{ filters }">
      <select v-model="filters.op4" class="mwnf-select cond">
        <option value="AND">{{ $t('catalogue.search.and') }}</option>
        <option value="OR">{{ $t('catalogue.search.or') }}</option>
      </select>
      <select v-model="filters.field4" class="mwnf-select field">
        <option v-for="f in fieldOptions" :key="f.value" :value="f.value">{{ f.label }}</option>
      </select>
      <input v-model="filters.q4" type="text" class="mwnf-select keyword" :placeholder="$t('catalogue.search.keywordPlaceholder')" />
    </template>

    <template #empty>
      {{ $t('catalogue.results.noResultsSearch') }}
      <RouterLink :to="{ name: 'database' }">{{ $t('catalogue.search.tryNewSearch') }}</RouterLink>
    </template>
  </CatalogueResultsView>
</template>

<style scoped>
/* The refine row's fourth keyword field is this page's own — small enough
   a variant that it stays a one-off on top of the shared button/select. */
.mwnf-button.small { font-size: 12px; padding: 4px 12px; text-decoration: none; }
.mwnf-button.small + .mwnf-button.small { margin-left: 8px; }
.cond { width: 60px; }
.field { width: 200px; }
.keyword { width: 200px; }
</style>
