<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'

// The Historical Background pages' band (section.language_option.hstr_bg):
// About, Country Insight and Read more, the page's own on red; "» About the
// Project" on the right. Country Insight shows once its page exists.

const props = defineProps({
  /** 'about', 'insight' or 'read-more'. */
  active: { type: String, required: true },
})

const router = useRouter()
const { t, locale } = useI18n()

const tabs = computed(() =>
  [
    { key: 'about', label: t('sharinghistory.hb.about'), name: 'historical-background' },
    { key: 'insight', label: t('sharinghistory.hb.insight'), name: 'historical-background-insight' },
    { key: 'read-more', label: t('sharinghistory.hb.readMore'), name: 'historical-background-read-more' },
  ].filter((tab) => router.hasRoute(tab.name)),
)
</script>

<template>
  <nav class="sharinghistory-hbb">
    <ul class="sharinghistory-hbb__tabs">
      <li v-for="tab in tabs" :key="tab.key" :class="{ 'sharinghistory-hbb__tab--active': tab.key === props.active }">
        <RouterLink :to="{ name: tab.name, query: { lang: locale } }">{{ tab.label }}</RouterLink>
      </li>
    </ul>
    <RouterLink class="sharinghistory-hbb__project" :to="{ name: 'about', query: { lang: locale } }">{{ t('sharinghistory.hb.aboutProject') }}</RouterLink>
  </nav>
</template>
