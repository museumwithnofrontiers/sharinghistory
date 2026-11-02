<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import HistoricalBackgroundBand from '../components/HistoricalBackgroundBand.vue'
import { historicalTopics } from '../composables/history.js'
import { useData } from '../composables/data.js'

// "Read more" as legacy's historical_background_readmore.php: the band
// (Read more), "Select a topic", then the topics, each opening its own
// window at legacy's 720 by 530 (about_hb_topics.php). Every word is
// legacy's own (sharinghistory.hb.*).

const router = useRouter()
const { t, locale } = useI18n()
const { mdInline, tr } = useData()

const topics = computed(() =>
  historicalTopics.value.map((topic) => ({ id: topic.id, title: mdInline(tr('collections', topic.id)?.title ?? topic.internal_name) })),
)
const href = (topic) => router.resolve({ name: 'historical-background-topic', params: { id: topic.id }, query: { lang: locale.value } }).href
function open(topic) {
  window.open(href(topic), 'HistoricalBackground', 'scrollbars=auto, resizable=1, width=720, height=530')?.focus()
}
</script>

<template>
  <div class="sharinghistory-hbr">
    <HistoricalBackgroundBand active="read-more" />
    <div class="sharinghistory-hbr__body">
      <h3 class="sharinghistory-hbr__heading">{{ t('sharinghistory.hb.selectTopic') }}</h3>
      <div class="sharinghistory-hbr__topics">
        <p v-for="topic in topics" :key="topic.id">
          <!-- eslint-disable-next-line vue/no-v-html -- the record's own Markdown, rendered and escaped by viewer-core -->
          » <a :href="href(topic)" @click.prevent="open(topic)"><span v-html="topic.title"></span></a>
        </p>
      </div>
    </div>
  </div>
</template>
