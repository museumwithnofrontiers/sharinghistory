<script setup>
// Legacy's band above the footer, on every page (`includes/inner_bottom.php`):
// the League of Arab States and the partner institutions, the two strategic
// sponsors, and the links to the other sponsors, MWNF's support page and the
// partner-meetings video. The addresses and logos are legacy's; every text
// comes from legacy through site-i18n.
import { useRouter } from 'vue-router'
import { mdInline, useI18n } from '@museumwnf/viewer-core'
import leagueOfArabStates from '../../theme/assets/logos/headerCoop.png'
import sharjah from '../../theme/assets/sponsors/Economy_Travelling_Sharjah.png'
import yasar from '../../theme/assets/sponsors/yasar.png'

const { t } = useI18n()
const router = useRouter()

const sponsorsHref = router.resolve({ name: 'sponsors' }).href
const partnersHref = router.resolve({ name: 'partners' }).href
</script>

<template>
  <div class="sh-band">
    <div class="sh-band__column">
      <p class="sh-band__title">{{ t('sharinghistory.band.cooperation') }}</p>
      <div class="sh-band__boxes">
        <a class="sh-band__logo" href="https://www.museumwnf.org/league-of-arab-states/" :title="t('sharinghistory.band.leagueOfArabStates')">
          <img :src="leagueOfArabStates" :alt="t('sharinghistory.band.leagueOfArabStates')" />
        </a>
        <a class="sh-band__logo" :href="partnersHref" :title="t('sharinghistory.band.partnersTooltip')">
          <span class="sh-band__partners">
            <i>{{ t('sharinghistory.band.partnersTitle') }}<br />{{ t('sharinghistory.band.partnerInstitutions') }}</i>
          </span>
        </a>
      </div>
    </div>
    <div class="sh-band__column">
      <p class="sh-band__title">{{ t('sharinghistory.band.strategicSponsors') }}</p>
      <div class="sh-band__boxes">
        <a href="http://www.sharjahmuseums.ae/?lang=en-us" target="_blank" rel="noopener" :title="t('sharinghistory.band.sponsorSharjah')">
          <img :src="sharjah" :alt="t('sharinghistory.band.sponsorSharjah')" />
        </a>
        <a href="http://www.yasar.edu.tr/en/" target="_blank" rel="noopener" :title="t('sharinghistory.band.sponsorYasar')">
          <img :src="yasar" :alt="t('sharinghistory.band.sponsorYasar')" />
        </a>
      </div>
    </div>
    <div class="sh-band__column sh-band__column--links">
      <div class="sh-band__boxes">
        <a class="sh-band__link" :href="sponsorsHref"><span>{{ t('sharinghistory.band.otherSponsors') }}</span></a>
        <a class="sh-band__link" href="https://www.museumwnf.org/about/support"><span>{{ t('sharinghistory.band.support') }}</span></a>
        <a
          class="sh-band__link"
          href="https://www.youtube.com/watch?v=_7dcW81lBBc&feature=youtu.be&rel=0"
          target="_blank"
          rel="noopener"
          :title="t('sharinghistory.band.partnerMeetingsVideoTooltip')"
        ><span v-html="mdInline(t('sharinghistory.band.partnerMeetingsVideo'))" /></a>
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
  overflow-wrap: break-word;
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
