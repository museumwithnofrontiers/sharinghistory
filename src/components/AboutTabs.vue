<script setup>
// The strip under the About pages' banner, as legacy prints it on each of
// them (`about.php`, `about_team.php`, `about_chronology_list.php`): the
// three pages on the left, "See also Historical Background" on the right.
// The Chronology's tab is on for its list and for each of its activities.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// In the order legacy shows them: its markup lists Team, Chronology, About,
// and floats each to the right, so they read About, Chronology, Team.
const tabs = computed(() => [
  { route: 'about', text: t('sharinghistory.about.tabAbout') },
  { route: 'about-chronology', text: t('sharinghistory.about.tabChronology'), also: ['about-chronology-event'] },
  { route: 'about-team', text: t('sharinghistory.about.tabTeam') },
]
  .filter((tab) => router.hasRoute(tab.route))
  .map((tab) => ({ ...tab, active: route.name === tab.route || (tab.also ?? []).includes(route.name) })))
</script>

<template>
  <nav class="sh-about-tabs">
    <ul class="sh-about-tabs__pages">
      <li v-for="tab in tabs" :key="tab.route" :class="{ active: tab.active }">
        <RouterLink :to="{ name: tab.route }" :aria-current="tab.active ? 'page' : undefined">{{ tab.text }}</RouterLink>
      </li>
    </ul>
    <RouterLink class="sh-about-tabs__see-also" :to="{ name: 'historical-background' }">
      <span class="sh-about-tabs__icon" aria-hidden="true"></span>{{ t('sharinghistory.about.seeAlsoHistoricalBackground') }}
    </RouterLink>
  </nav>
</template>

<style scoped>
/* Legacy's `section.language_option` (css/style_inside.css): across the
   page right under the banner, its tabs 26px high, as the Historical
   Background's band (site.css's `.sharinghistory-hbb`). */
.sh-about-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin: calc(-1 * var(--mwnf-content-padding-block, 20px)) calc(50% - 50cqw) 0;
  padding: 0 calc(50cqw - 50%);
  line-height: 16px;
  background-color: #750101;
}
.sh-about-tabs__pages {
  display: flex;
  margin: 0;
  padding: 0;
  list-style: none;
}
.sh-about-tabs__pages li + li {
  border-left: 1px solid #990000;
}
.sh-about-tabs__pages li.active {
  background-color: #990000;
}
.sh-about-tabs a {
  display: block;
  padding: 5px 8px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 400;
  text-decoration: none;
}
/* Legacy's `fa-angle-double-right` icon. */
.sh-about-tabs__icon::before {
  content: '»\00a0';
}
/* On a phone legacy's words are 11px, 9px up to 390px
   (css/responsive_style.css), the strip on one line. */
@media (max-width: 767px) {
  .sh-about-tabs { flex-wrap: nowrap; }
  .sh-about-tabs a { font-size: 11px; line-height: normal; }
}
@media (max-width: 390px) {
  .sh-about-tabs a { font-size: 9px; }
}
</style>
