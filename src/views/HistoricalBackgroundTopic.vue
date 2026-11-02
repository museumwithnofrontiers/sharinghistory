<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { StandaloneWindow } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'

// A "Read more" topic in its own window, as legacy's about_hb_topics.php:
// "Historical Background" in the band, then the topic's title and, where
// legacy had one, its text (it had none).

const props = defineProps({ id: { type: String, required: true } })

const { t } = useI18n()
const { md, mdInline, tr } = useData()

const text = computed(() => tr('collections', props.id) ?? {})
</script>

<template>
  <StandaloneWindow class="sharinghistory-hbt" :heading="t('sharinghistory.hb.title')" :close-label="t('record.glossary.close')">
    <div class="sharinghistory-hbt__body">
      <!-- eslint-disable vue/no-v-html -- the record's own Markdown, rendered and escaped by viewer-core -->
      <h3 v-html="mdInline(text.title ?? '')"></h3>
      <div v-if="text.description" class="sharinghistory-hbt__text" v-html="md(text.description)"></div>
      <!-- eslint-enable vue/no-v-html -->
    </div>
  </StandaloneWindow>
</template>
