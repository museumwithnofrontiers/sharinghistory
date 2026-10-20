<script setup>
// Legacy's two Sponsors pages (`sponsor_detail.php`, the international
// sponsors, and `sponsor_detail_local.php`, the local ones by country):
// the row of links back, the heading, and one row per sponsor with its
// name, legacy's remarks and its logo, linked where legacy links it.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { useData } from '../composables/data.js'
import { internationalSponsors, localSponsors } from '../composables/sponsors.js'
import backArrow from '../../theme/assets/icons/back_arrow.png'

const props = defineProps({
  /** 'international' | 'local' */
  kind: { type: String, required: true },
})

const { t } = useI18n()
const router = useRouter()
const { partners, labelOf, md } = useData()

const local = computed(() => props.kind === 'local')

// A sponsor legacy linked to its own partner page links to the partner's
// page here.
function withLink(sponsor) {
  if (!sponsor.partner) return { ...sponsor, external: true }
  const partner = (partners.value ?? []).find((p) => p.backward_compatibility === sponsor.partner)
  return { ...sponsor, href: partner ? router.resolve({ name: 'partner', params: { id: partner.id } }).href : '', external: false }
}

const groups = computed(() => (local.value
  ? localSponsors(t).map((group) => ({ title: labelOf('countries', group.country), sponsors: group.sponsors.map(withLink) }))
  : [{ title: '', sponsors: internationalSponsors(t).map(withLink) }]))
</script>

<template>
  <div class="sh-sponsors">
    <nav class="sh-sponsors__back">
      <a href="#" @click.prevent="router.back()"><img :src="backArrow" alt="" />{{ t('core.action.back') }}</a>
      <RouterLink v-if="local" :to="{ name: 'sponsors' }"><img :src="backArrow" alt="" />{{ t('sharinghistory.sponsors.international') }}</RouterLink>
      <RouterLink v-else :to="{ name: 'sponsors-local' }"><img :src="backArrow" alt="" />{{ t('sharinghistory.sponsors.local') }}</RouterLink>
      <RouterLink :to="{ name: 'partners' }"><img :src="backArrow" alt="" />{{ t('sharinghistory.sponsors.partnersLink') }}</RouterLink>
    </nav>
    <div class="sh-sponsors__heading">
      <h1 v-if="local">{{ t('sharinghistory.sponsors.local') }}</h1>
      <h1 v-else>{{ t('sharinghistory.sponsors.international') }}</h1>
      <p v-if="local">{{ t('sharinghistory.sponsors.localIntro') }}</p>
    </div>
    <div v-for="group in groups" :key="group.title" class="sh-sponsors__group">
      <p v-if="group.title"><strong>{{ group.title }}</strong></p>
      <div v-for="sponsor in group.sponsors" :key="sponsor.id" class="sh-sponsors__row">
        <div class="sh-sponsors__text">
          <p v-if="local">{{ sponsor.name }}</p>
          <p v-else><strong>{{ sponsor.name }}</strong></p>
          <div v-if="sponsor.remarks" class="mwnf-prose" v-html="md(sponsor.remarks)" />
        </div>
        <div class="sh-sponsors__logo">
          <a
            v-if="sponsor.href"
            :href="sponsor.href"
            :target="sponsor.external ? '_blank' : undefined"
            :rel="sponsor.external ? 'noopener' : undefined"
          ><img :src="sponsor.logo" :alt="sponsor.name" /></a>
          <img v-else :src="sponsor.logo" :alt="sponsor.name" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Legacy's `.inner_left`, `.time_line_con_title` and `.country_head`
   (css/style_inside.css). */
.sh-sponsors__back {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
}
.sh-sponsors__back a {
  color: #222222;
  font-size: 14px;
  text-decoration: none;
}
.sh-sponsors__back img {
  margin-right: 2px;
  vertical-align: middle;
}
.sh-sponsors__heading h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 400;
  color: #222222;
}
.sh-sponsors__row {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin-top: 28px;
}
@media (min-width: 48rem) {
  /* Legacy's col-md-1 (empty), col-md-6 and col-md-4. */
  .sh-sponsors__row {
    grid-template-columns: 6fr 4fr;
    padding-left: calc(100% / 12);
    padding-right: calc(100% / 12);
  }
}
.sh-sponsors__text p {
  margin: 0 0 10px 2px;
}
.sh-sponsors__logo img {
  max-width: 100%;
}
</style>
