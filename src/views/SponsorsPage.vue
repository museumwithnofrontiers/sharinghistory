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
          <p>
            <a
              v-if="sponsor.href"
              :href="sponsor.href"
              :target="sponsor.external ? '_blank' : undefined"
              :rel="sponsor.external ? 'noopener' : undefined"
            ><img :src="sponsor.logo" :alt="sponsor.name" /></a>
            <img v-else :src="sponsor.logo" :alt="sponsor.name" />
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Legacy's `.inner_left`, `.time_line_con_title` and `.country_head`
   (css/style_inside.css); its section's 30px under them (20 are the
   content area's). */
.sh-sponsors {
  padding-bottom: 10px;
}
.sh-sponsors__back {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 15px;
}
/* 15px and the space between legacy's links. */
.sh-sponsors__back a {
  margin: 0 calc(15px + 0.2476em) 5px 0;
  color: #222222;
  font-size: 14px;
  font-weight: 500;
  line-height: normal;
  text-decoration: none;
}
/* Legacy's `.short_heading`: the local page's words under the heading,
   half the row wide, and 15px before the sponsors. */
.sh-sponsors__heading {
  display: flow-root;
  margin-bottom: 15px;
}
.sh-sponsors__heading h1 {
  margin: 0;
  font-size: 19px;
  font-weight: 400;
  line-height: normal;
  color: #222222;
}
.sh-sponsors__heading p,
.sh-sponsors__group > p {
  margin: 0 0 10px;
  font-size: 16px;
  line-height: 22px;
}
.sh-sponsors__heading p {
  max-width: calc((100% + 30px) / 2 - 30px);
}
.sh-sponsors__group > p strong {
  font-weight: 500;
}
/* Legacy's row of col-md-1 (empty), col-md-6 and col-md-4, each column
   padded 15px inside a row pulled out by as much. */
.sh-sponsors__row {
  display: grid;
  grid-template-columns: 1fr 6fr 4fr 1fr;
  margin: 28px -15px 0;
}
.sh-sponsors__text,
.sh-sponsors__logo {
  padding-inline: 15px;
}
.sh-sponsors__text {
  grid-column: 2;
}
.sh-sponsors__logo {
  grid-column: 3;
}
.sh-sponsors__text p,
.sh-sponsors__text :deep(.mwnf-prose p),
.sh-sponsors__logo p {
  margin: 0 0 10px 2px;
  padding-left: 12px;
  font-size: 16px;
  line-height: 22px;
}
.sh-sponsors__text strong {
  font-weight: 500;
}
.sh-sponsors__logo img {
  display: block;
  max-width: 100%;
}
/* Legacy's phone: one column, the bold heading, and a rule under each
   sponsor. */
@media (max-width: 767px) {
  .sh-sponsors__back {
    margin-bottom: 30px;
  }
  .sh-sponsors__heading {
    margin-bottom: 10px;
  }
  .sh-sponsors__heading h1 {
    font-size: 16px;
    font-weight: 500;
  }
  .sh-sponsors__heading p {
    max-width: none;
  }
  .sh-sponsors__group > p {
    margin-left: -5px;
  }
  .sh-sponsors__row {
    grid-template-columns: 1fr;
    margin: 10px -5px 0;
    /* Legacy's empty col-md-1 still stands 1px tall. */
    padding: 21px 0 20px;
    border-bottom: 2px solid #e9e9e9;
  }
  .sh-sponsors__row + .sh-sponsors__row {
    margin-top: 0;
  }
  .sh-sponsors__text,
  .sh-sponsors__logo {
    grid-column: 1;
    margin-bottom: 15px;
    padding-inline: 5px;
  }
}
</style>
