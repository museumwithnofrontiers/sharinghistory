<script setup>
// Legacy's band above the footer, on every page (`includes/inner_bottom.php`):
// the League of Arab States and the partner institutions, the two strategic
// sponsors, and the links to the other sponsors, MWNF's support page and the
// partner-meetings video. The addresses and logos are legacy's; every text
// comes from legacy through site-i18n, and an entry whose text isn't there
// yet is left out (composables/texts.js).
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { hasText } from '../composables/texts.js'
import leagueOfArabStates from '../../theme/assets/logos/headerCoop.png'
import sharjah from '../../theme/assets/sponsors/Economy_Travelling_Sharjah.png'
import yasar from '../../theme/assets/sponsors/yasar.png'

const { t } = useI18n()
const router = useRouter()
const has = (key) => hasText(t, key)

const cooperation = computed(() => (has('sharinghistory.band.cooperation')
  ? {
      title: t('sharinghistory.band.cooperation'),
      league: has('sharinghistory.band.leagueOfArabStates')
        ? { href: 'https://www.museumwnf.org/league-of-arab-states/', logo: leagueOfArabStates, name: t('sharinghistory.band.leagueOfArabStates') }
        : null,
      partners: has('sharinghistory.band.partnersTitle') && has('sharinghistory.band.partnerInstitutions')
        ? {
            href: router.resolve({ name: 'partners' }).href,
            lines: [t('sharinghistory.band.partnersTitle'), t('sharinghistory.band.partnerInstitutions')],
            tooltip: has('sharinghistory.band.partnersTooltip') ? t('sharinghistory.band.partnersTooltip') : undefined,
          }
        : null,
    }
  : null))

const strategic = computed(() => {
  if (!has('sharinghistory.band.strategicSponsors')) return null
  const sponsors = [
    { key: 'sharinghistory.band.sponsorSharjah', href: 'http://www.sharjahmuseums.ae/?lang=en-us', logo: sharjah },
    { key: 'sharinghistory.band.sponsorYasar', href: 'http://www.yasar.edu.tr/en/', logo: yasar },
  ].filter((sponsor) => has(sponsor.key)).map((sponsor) => ({ ...sponsor, name: t(sponsor.key) }))
  return { title: t('sharinghistory.band.strategicSponsors'), sponsors }
})

// The sponsors pages aren't built yet (inventory-app#2233 T5, pending the
// decision whether their content is inventory data); the link appears with
// the route.
const links = computed(() => [
  router.hasRoute('sponsors') ? { key: 'sharinghistory.band.otherSponsors', href: router.resolve({ name: 'sponsors' }).href } : null,
  { key: 'sharinghistory.band.support', href: 'https://www.museumwnf.org/about/support' },
  { key: 'sharinghistory.band.partnerMeetingsVideo', href: 'https://www.youtube.com/watch?v=_7dcW81lBBc&feature=youtu.be&rel=0', external: true, tooltipKey: 'sharinghistory.band.partnerMeetingsVideoTooltip' },
].filter((link) => link && has(link.key)).map((link) => ({
  ...link,
  label: t(link.key),
  tooltip: link.tooltipKey && has(link.tooltipKey) ? t(link.tooltipKey) : undefined,
})))

const visible = computed(() => Boolean(cooperation.value || strategic.value || links.value.length))
</script>

<template>
  <div v-if="visible" class="sh-band">
    <div v-if="cooperation" class="sh-band__column">
      <p class="sh-band__title">{{ cooperation.title }}</p>
      <div class="sh-band__boxes">
        <a v-if="cooperation.league" class="sh-band__logo" :href="cooperation.league.href" :title="cooperation.league.name">
          <img :src="cooperation.league.logo" :alt="cooperation.league.name" />
        </a>
        <a v-if="cooperation.partners" class="sh-band__logo" :href="cooperation.partners.href" :title="cooperation.partners.tooltip">
          <span class="sh-band__partners">
            <i>{{ cooperation.partners.lines[0] }}<br />{{ cooperation.partners.lines[1] }}</i>
          </span>
        </a>
      </div>
    </div>
    <div v-if="strategic" class="sh-band__column">
      <p class="sh-band__title">{{ strategic.title }}</p>
      <div class="sh-band__boxes">
        <a
          v-for="sponsor in strategic.sponsors"
          :key="sponsor.key"
          :href="sponsor.href"
          target="_blank"
          rel="noopener"
          :title="sponsor.name"
        ><img :src="sponsor.logo" :alt="sponsor.name" /></a>
      </div>
    </div>
    <div v-if="links.length" class="sh-band__column sh-band__column--links">
      <div class="sh-band__boxes">
        <a
          v-for="link in links"
          :key="link.key"
          class="sh-band__link"
          :href="link.href"
          :target="link.external ? '_blank' : undefined"
          :rel="link.external ? 'noopener' : undefined"
          :title="link.tooltip"
        ><span>{{ link.label }}</span></a>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Legacy's `section.cooperation`, `.logos` and `.logs` (css/style.css). */
.sh-band {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2rem;
  justify-content: space-between;
  color: #ffffff;
}
.sh-band__column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.sh-band__column--links {
  justify-content: flex-end;
}
.sh-band__title {
  margin: 0;
  font-size: 1rem;
}
.sh-band__boxes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}
.sh-band a {
  color: #ffffff;
  text-decoration: none;
}
.sh-band__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  padding: 10px;
  box-sizing: border-box;
  background: #990000;
  border-radius: 10px;
}
.sh-band__logo img {
  max-height: 60px;
}
.sh-band__partners,
.sh-band__link span {
  display: inline-block;
  max-width: 60px;
  font-size: 12px;
  text-align: center;
}
.sh-band__link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  border: 1px solid #990000;
  border-radius: 10px;
  box-sizing: border-box;
}
</style>
