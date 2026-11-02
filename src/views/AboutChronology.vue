<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import AboutTabs from '../components/AboutTabs.vue'
import { activityPlace, activityText, activityYears, chronology, chronologyEvents } from '../composables/chronology.js'

// The Chronology as legacy's about_chronology_list.php: the About strip
// (Chronology), "Project Chronology", the project's own activity in bold,
// then its activities, each its years and place, and its title linking to
// its page. Every word is legacy's own (sharinghistory.chr.*); the
// activities are the package's (composables/chronology.js).

const { t, locale } = useI18n()

const root = computed(() => chronology.value?.extra ?? {})
const rows = computed(() =>
  chronologyEvents.value.map((event) => {
    const text = activityText(event)
    return { id: event.id, years: activityYears(event), place: activityPlace(text), name: text.name, subtitle: text.subtitle ?? '' }
  }),
)
</script>

<template>
  <div class="sh-chronology">
    <AboutTabs />
    <h3 class="sh-chronology__heading">&nbsp;&nbsp;{{ t('sharinghistory.chr.heading') }}</h3>
    <div class="sh-chronology__body">
      <p><br><b>{{ root.title }}</b><template v-if="root.subtitle"><br>{{ root.subtitle }}</template></p>
      <p class="sh-chronology__blank">&nbsp;</p>
      <div v-for="row in rows" :key="row.id" class="sh-chronology__row">
        <p>{{ row.years }}&nbsp;&nbsp;&nbsp;&nbsp;{{ row.place }}</p>
        <p>
          <RouterLink :to="{ name: 'about-chronology-event', params: { id: row.id }, query: { lang: locale } }">
            {{ row.name }}<template v-if="row.subtitle"><br>{{ row.subtitle }}</template>
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
