<script setup>
// The strip under the About pages' banner, as legacy prints it on each of
// them (`about.php`, `about_team.php`, `about_chronology_list.php`): the
// three pages on the left, "See also Historical Background" on the right.
// The Team and Chronology pages wait on the decision whether their content
// is inventory data (inventory-app#2233 T5); a tab appears with its route,
// and with its text.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { hasText } from '../composables/texts.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// Legacy's own order.
const TABS = [
  { route: 'about-team', label: 'sharinghistory.about.tabTeam' },
  { route: 'about-chronology', label: 'sharinghistory.about.tabChronology' },
  { route: 'about', label: 'sharinghistory.about.tabAbout' },
]

const tabs = computed(() => TABS
  .filter((tab) => router.hasRoute(tab.route) && hasText(t, tab.label))
  .map((tab) => ({ ...tab, text: t(tab.label), active: route.name === tab.route })))

const seeAlso = computed(() => (hasText(t, 'sharinghistory.about.seeAlsoHistoricalBackground')
  ? t('sharinghistory.about.seeAlsoHistoricalBackground')
  : ''))
</script>

<template>
  <nav v-if="tabs.length || seeAlso" class="sh-about-tabs">
    <ul class="sh-about-tabs__pages">
      <li v-for="tab in tabs" :key="tab.route" :class="{ active: tab.active }">
        <RouterLink :to="{ name: tab.route }" :aria-current="tab.active ? 'page' : undefined">{{ tab.text }}</RouterLink>
      </li>
    </ul>
    <RouterLink v-if="seeAlso" class="sh-about-tabs__see-also" :to="{ name: 'historical-background' }">
      <span class="sh-about-tabs__icon" aria-hidden="true"></span>{{ seeAlso }}
    </RouterLink>
  </nav>
</template>

<style scoped>
/* Legacy's `section.language_option` (css/style_inside.css). */
.sh-about-tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
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
</style>
