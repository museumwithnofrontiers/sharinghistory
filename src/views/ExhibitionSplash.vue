<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { AppHyperlinks } from '@museumwnf/viewer-layout'
import { BackLink, SectionCards } from '@museumwnf/viewer-layout/content'
import { exhibitionsTree } from '../composables/exhibitions.js'
import { relatedContentLinks } from '../composables/exhibitionSpecs.js'
import { useData } from '../composables/data.js'

// The exhibition homepage: not this site's shape for `EssayView` (there is
// no tree node "above" an exhibition to navigate from), so a thin page of
// its own — the teaser, a `SectionCards` list of the way in (introduction,
// then themes), and the "Related Content" box legacy's own homepage,
// introduction and theme pages all carried.

const route = useRoute()
const { t } = useI18n()
const { md, mdInline, mdStrip, timelines, tr } = useData()

const exhibitionId = computed(() => decodeURIComponent(route.params.exhibitionId))
const exhibition = computed(() => exhibitionsTree.byId.value.get(exhibitionId.value) ?? null)
const text = computed(() => (exhibition.value ? (tr('collections', exhibition.value.id) ?? {}) : {}))

// "Introduction" is not a theme — it's the exhibition's own "About the
// Exhibition" text (the SH importer merges the legacy sh_exhibitionnames
// subtitle + introduction + curated_by into description) plus items attached
// directly to the exhibition collection (not to any theme/chapter).
const hasIntroduction = computed(() => {
  const e = exhibition.value
  if (!e) return false
  return (
    (e.items?.length ?? 0) > 0 ||
    !!text.value.description ||
    !!text.value.extra?.intro_text ||
    !!text.value.extra?.intro_header
  )
})

// The splash shows only the legacy subtitle teaser — the description's
// first paragraph (the importer writes the subtitle first). The full text
// lives on the introduction page, like legacy's exhibition homepage vs
// exh_introduction.php.
const teaser = computed(() => (text.value.description ?? '').split('\n\n')[0] ?? '')

const themes = computed(() => (exhibition.value ? exhibitionsTree.children(exhibition.value.id) : []))

const cards = computed(() => {
  const list = []
  if (hasIntroduction.value) {
    list.push({
      title: mdStrip(t('exhibition.nav.introduction')),
      to: { name: 'exhibition-introduction', params: { exhibitionId: exhibitionId.value } },
    })
  }
  for (const theme of themes.value) {
    list.push({
      title: mdStrip(tr('collections', theme.id)?.title ?? theme.internal_name),
      to: { name: 'exhibition-theme', params: { exhibitionId: exhibitionId.value, themeId: theme.id } },
    })
  }
  return list
})

// ── "Related Content" — legacy exh_items.php sidebar ──

const hasThematicTimeline = computed(
  () => !!exhibition.value && timelines.value.some((tl) => tl.collection_id === exhibition.value.id),
)

// The importer injects the legacy per-exhibition bibliography into every
// translation's extra.bibliography as the same language-keyed map.
const hasFurtherReading = computed(() => {
  const bib = text.value.extra?.bibliography
  return !!bib && Object.values(bib).some((entries) => entries?.length)
})

const relatedLinks = computed(() =>
  relatedContentLinks({
    exhibitionId: exhibitionId.value,
    hasThematicTimeline: hasThematicTimeline.value,
    hasFurtherReading: hasFurtherReading.value,
    t,
  }),
)
</script>

<template>
  <div v-if="!exhibition" class="mwnf-panel not-found">
    <p>{{ t('sharinghistory.notFound.exhibition') }}</p>
    <router-link to="/exhibitions">← {{ t('exhibition.chapter.returnToExhibitions') }}</router-link>
  </div>

  <div v-else>
    <BackLink variant="bar" label="exhibition.chapter.returnToExhibitions" :to="{ name: 'exhibitions' }" />

    <h1 class="mwnf-heading" v-html="mdInline(text.title ?? exhibition.internal_name)" />

    <div class="mwnf-panel intro-box">
      <h2 v-if="text.extra?.subtitle" class="intro-subtitle" v-html="mdInline(text.extra.subtitle)" />
      <div v-if="teaser" class="mwnf-prose" v-html="md(teaser)" />
      <p v-if="text.extra?.credits" class="intro-credits" v-html="mdInline(text.extra.credits)" />
    </div>

    <SectionCards :cards="cards" variant="rows" />
    <p v-if="!cards.length" class="no-results">{{ t('standalone.exhibition.empty') }}</p>

    <AppHyperlinks :title="t('record.related.title')" :links="relatedLinks" />
  </div>
</template>

<style scoped>
.not-found { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

.intro-box { border-top: 3px solid var(--accent); }
.intro-subtitle {
  font-size: 16px;
  font-weight: 400;
  color: var(--heading);
  margin-bottom: 12px;
  font-family: 'Roboto', sans-serif;
}
.intro-credits {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  font-size: 12px;
  font-style: italic;
  color: var(--muted);
  font-family: 'Roboto', sans-serif;
  white-space: pre-line;
}

.no-results { color: var(--muted); font-family: 'Roboto', sans-serif; font-size: 13px; padding: 20px 0; }
</style>
