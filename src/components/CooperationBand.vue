<script setup>
// Legacy's band above the footer, on every page (`includes/inner_bottom.php`):
// the League of Arab States and the partner institutions, the two strategic
// sponsors, and the links to the other sponsors, MWNF's support page and the
// partner-meetings video. The addresses and logos are legacy's; every text
// comes from legacy through site-i18n. On the home page (`shTemplate.php`)
// the band is wider, its thirds are 4, 3 and 5 twelfths, and the social
// icons sit in it rather than in the footer.
import { useRouter } from 'vue-router'
import { mdInline, useI18n } from '@museumwnf/viewer-core'
import { SocialLinks, mwnfSocialLinks } from '@museumwnf/viewer-layout'
import leagueOfArabStates from '../../theme/assets/logos/headerCoop.png'
import sharjah from '../../theme/assets/sponsors/Economy_Travelling_Sharjah.png'
import yasar from '../../theme/assets/sponsors/yasar.png'

defineProps({
  home: { type: Boolean, default: false },
})

const { t } = useI18n()
const router = useRouter()

const sponsorsHref = router.resolve({ name: 'sponsors' }).href
const partnersHref = router.resolve({ name: 'partners' }).href
</script>

<template>
  <div class="sh-band" :class="{ 'sh-band--home': home }">
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
      <div class="sh-band__boxes sh-band__boxes--sponsors">
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
      <SocialLinks v-if="home" class="sh-band__social" :links="mwnfSocialLinks" />
    </div>
  </div>
</template>

<style scoped>
/* Legacy's `section.cooperation`, `.logos`, `.logs` and `.socialIcons`
   (css/style.css, css/responsive_style.css). */
/* Three thirds (col-md-4), each title a line of 24px 10px above its boxes;
   the third column's boxes level with the others, under an empty line. */
.sh-band {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: start;
  column-gap: 30px;
  color: #ffffff;
}
.sh-band__column {
  position: relative;
  min-width: 0;
}
.sh-band__column--links {
  padding-top: 34px;
}
.sh-band__title {
  margin: 0 0 10px;
  font: 400 14px/24px Roboto, sans-serif;
}
.sh-band__boxes {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 15px;
}
/* The two sponsors' pictures stand on one line, centred on each other, a
   space apart. */
.sh-band__boxes--sponsors {
  gap: 0.2476em; /* Roboto's space */
}
.sh-band__boxes--sponsors img {
  display: block;
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
  line-height: normal;
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
/* The home page's band: 98.2% of the page wide, its columns 4, 3 and 5
   twelfths, each 15px in; the icons 5px up from the foot of the third,
   14px in from its right. */
.sh-band--home {
  grid-template-columns: 4fr 3fr 5fr;
  column-gap: 0;
  margin-inline: calc(50% - 49.1cqw);
}
.sh-band--home .sh-band__column {
  padding-inline: 15px;
}
.sh-band .sh-band__social {
  position: absolute;
  top: auto;
  right: 14px;
  bottom: 4px; /* the icons' 16px line, 5px up */
  gap: 0;
  margin: 0;
  padding: 0 15px;
}
.sh-band .sh-band__social :deep(li) {
  margin: 0 5px;
  line-height: 1;
}
.sh-band .sh-band__social :deep(a) {
  display: block;
  color: #ffffff;
}
/* A phone: one column under another, each title 10px down. */
@media (max-width: 767px) {
  .sh-band,
  .sh-band--home {
    grid-template-columns: 1fr;
  }
  .sh-band__column--links {
    padding-top: 34px;
  }
  .sh-band--home {
    margin-inline: -15px;
  }
  .sh-band--home .sh-band__column {
    padding-inline: 0;
  }
  /* Legacy's icons box stands taller than its icons there, so they show
     at the top of the third column, against its right edge. */
  .sh-band .sh-band__social {
    top: -6px;
    right: -5px;
    bottom: auto;
  }
}
/* Up to 420px: smaller boxes, 11px words, and every title 10px down. */
@media (max-width: 420px) {
  .sh-band__title {
    margin-top: 10px;
  }
  .sh-band__column--links {
    padding-top: 44px;
  }
  .sh-band__logo {
    height: 70px;
    padding: 6px 10px;
  }
  .sh-band__logo img,
  .sh-band__boxes--sponsors img {
    height: 50px;
    max-height: none;
  }
  .sh-band__link {
    width: 60px;
    height: 60px;
  }
  .sh-band__link span {
    font-size: 11px;
  }
}
</style>
