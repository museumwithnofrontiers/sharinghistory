<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { DECADES } from '../composables/catalogue.js'
import { ALL, POLITICAL, periodRunsForward, timelineCountryOptions, timelineThemeOptions } from '../composables/timeline.js'

// The Timeline entrance as legacy's hcr_home.php: its word to the visitor,
// then two forms side by side — the Political Context Timeline of a country
// and the Thematic Timelines of a theme — each with legacy's periods and Go,
// which opens the results, and legacy's checks before it. Every word is
// legacy's own (sharinghistory.tle.*).

const { t, locale } = useI18n()
const router = useRouter()

const countries = computed(() => timelineCountryOptions())
const themes = computed(() => timelineThemeOptions())

const political = reactive({ country: 'none', start: 'none', end: 'none' })
const thematic = reactive({ theme: 'none', start: 'none', end: 'none' })

function go(form, key, query) {
  if (form[key] === 'none') {
    window.alert(key === 'country' ? t('sharinghistory.tle.alertCountry') : t('sharinghistory.tle.alertTheme'))
    return
  }
  if (!periodRunsForward(form.start, form.end)) {
    window.alert(t('sharinghistory.tle.alertPeriod'))
    return
  }
  const period = Object.fromEntries(['start', 'end'].filter((k) => form[k] !== 'none').map((k) => [k, form[k]]))
  router.push({ name: 'timeline-results', query: { ...query, ...period, lang: locale.value } })
}
</script>

<template>
  <div class="sharinghistory-tle">
    <p class="sharinghistory-tle__intro">{{ t('sharinghistory.tle.intro') }}</p>
    <div class="sharinghistory-tle__forms">
      <form class="sharinghistory-tle__form" @submit.prevent="go(political, 'country', { country: political.country, theme: POLITICAL })">
        <p class="sharinghistory-tle__title"><strong>{{ t('sharinghistory.tle.political') }}</strong></p>
        <p>
          <select v-model="political.country" class="sharinghistory-tle__list">
            <option value="none">{{ t('sharinghistory.tle.selectA') }} {{ t('sharinghistory.tle.country') }}</option>
            <option :value="ALL">{{ t('sharinghistory.tle.allCountries') }}</option>
            <option v-for="o in countries" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </p>
        <p class="sharinghistory-tle__dates">
          <select v-model="political.start">
            <option value="none">{{ t('sharinghistory.tle.startDate') }}</option>
            <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
          </select>
          <select v-model="political.end">
            <option value="none">{{ t('sharinghistory.tle.endDate') }}</option>
            <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
          </select>
        </p>
        <p class="sharinghistory-tle__go"><button type="submit">{{ t('sharinghistory.tle.go') }}</button></p>
      </form>
      <form class="sharinghistory-tle__form" @submit.prevent="go(thematic, 'theme', { theme: thematic.theme })">
        <p class="sharinghistory-tle__title"><strong>{{ t('sharinghistory.tle.thematic') }}</strong></p>
        <p>
          <select v-model="thematic.theme" class="sharinghistory-tle__list">
            <option value="none">{{ t('sharinghistory.tle.selectA') }} {{ t('sharinghistory.tle.theme') }}</option>
            <option :value="ALL">{{ t('sharinghistory.tle.allThemes') }}</option>
            <option v-for="o in themes" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
        </p>
        <p class="sharinghistory-tle__dates">
          <select v-model="thematic.start">
            <option value="none">{{ t('sharinghistory.tle.startDate') }}</option>
            <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
          </select>
          <select v-model="thematic.end">
            <option value="none">{{ t('sharinghistory.tle.endDate') }}</option>
            <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
          </select>
        </p>
        <p class="sharinghistory-tle__go"><button type="submit">{{ t('sharinghistory.tle.go') }}</button></p>
      </form>
    </div>
  </div>
</template>
