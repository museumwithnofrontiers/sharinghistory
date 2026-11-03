<script setup>
// Legacy's About page (`about.php`): the strip of About pages, the pictures
// on the left, and on the right the project's heading, its name, its About
// text and the related content. Every text is legacy's, through
// inventory-app's site-i18n. Legacy's "Download as Word" is not carried
// over: it was a document the PHP site generated on request.
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import AboutTabs from '../components/AboutTabs.vue'
import { ABOUT_PICTURES } from '../composables/aboutPictures.js'
import { useData } from '../composables/data.js'
import arrow from '../../theme/assets/icons/flip_black.png'
import speech from '../../theme/assets/documents/Extract_Ulrike_Al-Khamis_SMD.pdf?url'

const { t } = useI18n()
const { items, labelOf, md, mdInline, mdStrip } = useData()

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
        <div class="sh-about__heading">
          <h1 class="sh-about__title">{{ t('sharinghistory.about.heading') }}</h1>
          <p class="sh-about__name">{{ t('sharinghistory.about.projectName') }}</p>
        </div>
        <div class="mwnf-prose" v-html="md(t('sharinghistory.about.body'))" />
        <p><b>{{ t('sharinghistory.about.relatedContent') }}</b></p>
        <p><img :src="arrow" alt="" /><a :href="speech" target="_blank" rel="noopener">{{ t('sharinghistory.about.relatedSpeech') }}</a></p>
        <p><img :src="arrow" alt="" /><span v-html="mdInline(t('sharinghistory.about.relatedVideo'))" /></p>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 30px under the content (legacy's `inner_contents`); on a phone 45px, the
   column's 15px margin with it. */
.sh-about {
  display: flex;
  flex-direction: column;
  gap: 23px;
  padding-bottom: 10px;
}
@media (max-width: 750px) {
  .sh-about {
    padding-bottom: 25px;
  }
}
.sh-about__columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 48rem) {
  /* Legacy's col-md-4 and col-md-6, 30px apart; the pictures three across
     on the first's whole width. */
  .sh-about__columns {
    grid-template-columns: calc((100% + 30px) / 3 - 30px) calc((100% + 30px) / 2 - 30px);
    column-gap: 30px;
  }
  .sh-about__columns .sh-about__pictures {
    grid-template-columns: repeat(3, 108px);
    justify-self: stretch;
  }
}
/* Legacy's `.about_left_bg`: two columns of 108 × 83 pictures, each
   stretched to its cell, on the band's oxblood. */
.sh-about__pictures {
  display: grid;
  grid-template-columns: repeat(2, 108px);
  grid-auto-rows: 83px;
  gap: 10px;
  align-content: start;
  align-self: start;
  justify-self: start;
  padding: 10px;
  background: #750101;
}
.sh-about__picture img {
  display: block;
  width: 100%;
  height: 100%;
}
/* On a phone legacy's pictures span the column: three across at 31% of it
   (30% up to 335px), five at 17% from 391px to 620px, 10px apart, their
   height their own; the words 15px under them. */
@media (max-width: 620px) {
  .sh-about__columns {
    row-gap: 15px;
  }
  .sh-about__pictures {
    grid-template-columns: repeat(5, min(17%, 108px));
    grid-auto-rows: auto;
    justify-self: stretch;
  }
  .sh-about__picture img {
    height: auto;
    aspect-ratio: 108 / 83;
  }
}
@media (max-width: 390px) {
  .sh-about__pictures {
    grid-template-columns: repeat(3, 31%);
  }
}
@media (max-width: 335px) {
  .sh-about__pictures {
    grid-template-columns: repeat(3, 30%);
  }
}
/* Legacy's `h3.big_text` and `p.big_p` (css/style_inside.css). */
.sh-about__title {
  margin: 0;
  font-size: 24px;
  font-style: italic;
  font-weight: 500;
  line-height: normal;
  color: #990000;
}
.sh-about__name {
  margin: 0;
  font-size: 16px;
  font-style: italic;
  font-weight: 500;
  line-height: 22px;
  color: #990000;
}
/* Legacy's body text, 16px on 22px lines, its bold 500. */
.sh-about__text,
.sh-about__text :deep(.mwnf-prose) {
  font-size: 16px;
  line-height: 22px;
}
.sh-about__text :deep(b),
.sh-about__text :deep(strong) {
  font-weight: 500;
}
/* Its paragraphs a blank line apart (legacy's <br/><br/>), its list 20px
   in with no space between the entries, its links in the text's colour. */
.sh-about__text :deep(.mwnf-prose p) {
  margin: 0 0 22px;
}
.sh-about__text :deep(.mwnf-prose p:has(+ ul)) {
  margin-bottom: 10px;
}
.sh-about__text :deep(.mwnf-prose ul) {
  margin: 0 0 10px;
  padding-left: 20px;
}
.sh-about__text :deep(.mwnf-prose li) {
  margin: 0;
}
.sh-about__text :deep(.mwnf-prose a) {
  color: #222;
}
.sh-about__heading {
  margin-bottom: 15px;
}
@media (max-width: 750px) {
  .sh-about__heading {
    margin-bottom: 10px;
  }
}
/* The related content's paragraphs 10px apart. */
.sh-about__text > p {
  margin: 0 0 10px;
}
/* The arrow (12 by 10) right against its link, as legacy's. */
.sh-about__text img {
  width: 12px;
  height: 10px;
  vertical-align: middle;
}
</style>
