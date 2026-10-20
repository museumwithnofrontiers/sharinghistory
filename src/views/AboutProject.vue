<script setup>
// Legacy's About page (`about.php`): the strip of About pages, the pictures
// on the left, and on the right the project's heading, its name, its About
// text and the related content. Every text is legacy's, through
// inventory-app's site-i18n, and a block whose text isn't there yet is left
// out (composables/texts.js). Legacy's "Download as Word" is not carried
// over: it was a document the PHP site generated on request.
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import AboutTabs from '../components/AboutTabs.vue'
import { ABOUT_PICTURES } from '../composables/aboutPictures.js'
import { useData } from '../composables/data.js'
import { hasText } from '../composables/texts.js'
import arrow from '../../theme/assets/icons/flip_black.png'
import speech from '../../theme/assets/documents/Extract_Ulrike_Al-Khamis_SMD.pdf?url'

const { t } = useI18n()
const { items, labelOf, md, mdInline, mdStrip } = useData()
const has = (key) => hasText(t, key)
const text = (key) => (has(key) ? t(key) : '')

const files = import.meta.glob('../../theme/assets/about/*.jpg', { eager: true, import: 'default' })
const fileUrl = (name) => files[`../../theme/assets/about/${name}`]

const pictures = computed(() => {
  const byLegacyKey = new Map((items.value ?? []).map((item) => [item.backward_compatibility, item]))
  return ABOUT_PICTURES.map((picture) => {
    const item = picture.item ? byLegacyKey.get(picture.item) : null
    const name = item ? mdStrip(labelOf('items', item.id)) : ''
    return { file: picture.file, src: fileUrl(picture.file), item, name }
  })
})

const relatedSpeech = computed(() => text('sharinghistory.about.relatedSpeech'))
const relatedVideo = computed(() => text('sharinghistory.about.relatedVideo'))
const hasRelated = computed(() => has('sharinghistory.about.relatedContent') && Boolean(relatedSpeech.value || relatedVideo.value))
</script>

<template>
  <div class="sh-about">
    <AboutTabs />
    <div class="sh-about__columns">
      <div class="sh-about__pictures">
        <template v-for="picture in pictures" :key="picture.file">
          <RouterLink
            v-if="picture.item"
            class="sh-about__picture"
            :to="{ name: 'item', params: { id: picture.item.id } }"
            :title="picture.name"
          ><img :src="picture.src" :alt="picture.name" /></RouterLink>
          <span v-else class="sh-about__picture"><img :src="picture.src" alt="" /></span>
        </template>
      </div>
      <div class="sh-about__text">
        <div v-if="has('sharinghistory.about.heading') || has('sharinghistory.about.projectName')" class="sh-about__heading">
          <h1 v-if="has('sharinghistory.about.heading')" class="sh-about__title">{{ t('sharinghistory.about.heading') }}</h1>
          <p v-if="has('sharinghistory.about.projectName')" class="sh-about__name">{{ t('sharinghistory.about.projectName') }}</p>
        </div>
        <div v-if="has('sharinghistory.about.body')" class="mwnf-prose" v-html="md(t('sharinghistory.about.body'))" />
        <template v-if="hasRelated">
          <p><b>{{ t('sharinghistory.about.relatedContent') }}</b></p>
          <p v-if="relatedSpeech"><img :src="arrow" alt="" /><a :href="speech" target="_blank" rel="noopener">{{ relatedSpeech }}</a></p>
          <p v-if="relatedVideo"><img :src="arrow" alt="" /><span v-html="mdInline(relatedVideo)" /></p>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sh-about {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.sh-about__columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 48rem) {
  /* Legacy's col-md-4 and col-md-6. */
  .sh-about__columns {
    grid-template-columns: 4fr 6fr;
    padding-right: calc(100% / 6);
  }
}
.sh-about__pictures {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-content: start;
}
.sh-about__picture img {
  display: block;
  width: 100%;
  height: auto;
}
/* Legacy's `h3.big_text` and `p.big_p` (css/style_inside.css). */
.sh-about__title {
  margin: 0;
  font-size: 24px;
  font-style: italic;
  font-weight: 500;
  color: #990000;
}
.sh-about__name {
  margin: 0;
  font-size: 16px;
  font-style: italic;
  font-weight: 500;
  color: #990000;
}
.sh-about__heading {
  margin-bottom: 15px;
}
.sh-about__text img {
  margin-right: 4px;
  vertical-align: middle;
}
</style>
