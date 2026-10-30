<script setup>
import { computed, watchEffect } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { useData } from '../composables/data.js'
import { minisiteHref } from '../composables/exhibitions.js'

// An exhibition's pages left this site: each exhibition is a website of its
// own (its mini-site, src/minisites.json). The addresses this site gave them
// lead there — an exhibition to the mini-site's home, its introduction and
// further reading to the mini-site's own, a theme and a chapter to the same
// page on the mini-site.
const props = defineProps({
  exhibitionId: { type: String, required: true },
  themeId: { type: String, default: null },
  chapterId: { type: String, default: null },
  page: { type: String, default: null },
})
const { t, locale } = useI18n()
const { minisitePlace } = useData()

const target = computed(() => {
  if (props.page) return minisiteHref(props.exhibitionId, locale.value, props.page)
  const nodeId = props.chapterId ?? props.themeId
  if (!nodeId) return minisiteHref(props.exhibitionId, locale.value)
  const at = minisitePlace(nodeId)
  return at?.theme ? minisiteHref(props.exhibitionId, locale.value, at) : null
})

watchEffect(() => {
  if (target.value) window.location.replace(target.value)
})
</script>

<template>
  <div class="mwnf-panel">
    <p v-if="target"><a :href="target">{{ t('standalone.nav.exhibitions') }}</a></p>
    <p v-else>{{ t('standalone.notFound.exhibitions') }}</p>
  </div>
</template>
