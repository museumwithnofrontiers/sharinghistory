<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useI18n, useSiteConfig } from '@museumwnf/viewer-core'
import { chromeSource } from '@museumwnf/viewer-layout'
import { exhibitionList, minisiteHref } from '../composables/exhibitions.js'
import { useData } from '../composables/data.js'

// Legacy's Virtual Exhibitions landing page (exhibitions/AWE/index.php): under
// the site's header and menu, its picture (#backgroundImage) with the title,
// the subheading and "Welcome to the Virtual Exhibitions" on the left, an
// exhibition's picture in the middle and the exhibitions on the right; the
// cooperation band follows (SiteShell.vue). It has no section banner
// (dataset.config.js's `areas.exhibitions`). Every size, colour and position
// is legacy's (_styles.css.php), as its page measures.
//
// Legacy listed the exhibitions by their name (`ORDER BY e.name`), each
// leading to its own website now (its mini-site). The picture is the first
// one's until the pointer is on another, and comes back two seconds after it
// leaves, as legacy did.

const { t, locale } = useI18n()
const { mdStrip, tr } = useData()
const config = useSiteConfig()
const picture = (path) => chromeSource(config.chrome, path)

// The exhibition's legacy number names its picture (<n>/item_<n>.jpg).
const legacyNumber = (exhibition) => /:sh_exhibitions:(\d+)$/.exec(exhibition.backward_compatibility ?? '')?.[1]

const exhibitions = computed(() =>
  exhibitionList.value
    .map((exhibition) => {
      const number = legacyNumber(exhibition)
      return {
        id: exhibition.id,
        title: mdStrip(tr('collections', exhibition.id)?.title ?? exhibition.internal_name),
        href: minisiteHref(exhibition.id, locale.value) ?? undefined,
        picture: number ? picture(`exhibitions/item_${number}.jpg`) : null,
      }
    })
    .sort((a, b) => a.title.localeCompare(b.title, 'en', { sensitivity: 'base' })),
)

const first = computed(() => exhibitions.value.find((exhibition) => exhibition.picture)?.picture ?? null)
const hovered = ref(null)
const shown = computed(() => hovered.value ?? first.value)
let hideTimer = null
function show(exhibition) {
  window.clearTimeout(hideTimer)
  hovered.value = exhibition.picture
}
function hide() {
  window.clearTimeout(hideTimer)
  hideTimer = window.setTimeout(() => { hovered.value = null }, 2000)
}
onBeforeUnmount(() => window.clearTimeout(hideTimer))
</script>

<template>
  <div v-if="!exhibitions.length" class="mwnf-panel not-found">
    <p>{{ t('standalone.notFound.exhibitions') }}</p>
  </div>

  <div v-else class="sh-exh" :style="{ backgroundImage: `url(${picture('exhibitions/index_banner_bg.jpg')})` }">
    <h1 class="sh-exh__title">{{ t('sharinghistory.exhibitions.title') }}</h1>
    <p class="sh-exh__subheading">{{ t('sharinghistory.identity.subheading') }}</p>
    <h2 class="sh-exh__welcome">{{ t('sharinghistory.exhibitions.welcome') }}</h2>

    <div class="sh-exh__picture"><img v-if="shown" :src="shown" alt="" /></div>

    <ul class="sh-exh__list">
      <li v-for="exhibition in exhibitions" :key="exhibition.id">
        <img :src="picture('icons/arrow.gif')" alt="" />
        <a :href="exhibition.href" @mouseenter="show(exhibition)" @focus="show(exhibition)" @mouseleave="hide" @blur="hide">{{ exhibition.title }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.not-found { color: var(--mwnf-color-muted); font-family: 'Roboto', sans-serif; font-size: 13px; }

/* The picture (#backgroundImage, 990 by 502) and what stands on it, at the
   places legacy's page draws them. */
/* Legacy's picture fills the page's 990px under the menu, where the shell's
   content area keeps 20px above and below and its gutters at the sides: it
   steps out of them, centred on the page. */
.sh-exh {
  position: relative;
  width: 990px;
  max-width: 100vw;
  height: 502px;
  margin: -20px 0 -20px 50%;
  transform: translateX(-50%);
  background-repeat: no-repeat;
  background-position: top left;
  font-family: Georgia, 'Times New Roman', Times, serif;
  color: #fff;
  text-align: left;
  text-shadow: 1px 2px 4px #000;
}

.sh-exh :where(h1, h2, p, ul, li) {
  margin: 0;
  padding: 0;
}

.sh-exh__title {
  position: absolute;
  top: 200px;
  left: 20px;
  font: italic 42px/38px Georgia, 'Times New Roman', Times, serif;
  color: #ffc000;
}

.sh-exh__subheading {
  position: absolute;
  top: 250px;
  left: 20px;
  font: normal 19px/22px Georgia, 'Times New Roman', Times, serif;
  color: #ffc000;
}

.sh-exh__welcome {
  position: absolute;
  top: 291px;
  left: 20px;
  font: normal 20px/23px Georgia, 'Times New Roman', Times, serif;
  color: #fff;
}

.sh-exh__picture {
  position: absolute;
  top: 298px;
  left: 371px;
  width: 194px;
  height: 113px;
}

.sh-exh__picture img {
  display: block;
  width: 194px;
  height: 113px;
}

.sh-exh__list {
  position: absolute;
  top: 295px;
  left: 580px;
  width: 400px;
  list-style: none;
}

/* A row is legacy's .MenuColumnEx1Items, in its body's Verdana 11px/15px:
   18px from one to the next. */
.sh-exh__list li {
  padding-bottom: 2px;
  font: normal 11px/15px Verdana, Arial, Helvetica, sans-serif;
}

.sh-exh__list img {
  vertical-align: baseline;
}

.sh-exh__list a {
  font: bold 12px/16px Georgia, 'Times New Roman', Times, serif;
  color: #fff;
  text-decoration: none;
}

.sh-exh__list a:hover,
.sh-exh__list a:focus {
  color: #fdb303;
}

/* Narrower than the picture: the places no longer fit, so its parts follow
   one under the other on it. */
@media (max-width: 1000px) {
  .sh-exh {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: auto;
    height: auto;
    min-height: 502px;
    margin: -20px 0;
    transform: none;
    padding: 24px 16px;
    background-size: cover;
  }

  .sh-exh__title,
  .sh-exh__subheading,
  .sh-exh__welcome,
  .sh-exh__picture,
  .sh-exh__list {
    position: static;
    width: auto;
  }

  .sh-exh__picture {
    display: none;
  }
}
</style>
