<script setup>
import { computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { I18nText, useFacets, useI18n } from '@museumwnf/viewer-core'
import { useData } from '../composables/data.js'
import { DECADES, FACETS, exhibitionOptions } from '../composables/catalogue.js'

// The Collections entrance as legacy's pc_entrance.php, the standalone
// family's (viewer-layout's `mwnf-standalone-pc`): "Sort by" and its lists on
// the left — a country or a theme opens the results as soon as it is
// picked, the partners list leads to the partners, the two periods open the
// results once they make a period — and "About" with legacy's text on the
// right. Every word is legacy's own (sharinghistory.pc.*); the lists' values
// are the records' and the exhibitions' own.

const { items } = useData()
const { t, locale } = useI18n()
const router = useRouter()
const options = useFacets(items, FACETS)

const countries = computed(() => [...(options.value.country ?? [])].sort((a, b) => a.label.localeCompare(b.label, locale.value)))
const exhibitions = computed(() => exhibitionOptions())

function open(query) {
  router.push({ name: 'permanent-collection-results', query: { ...query, lang: locale.value } })
}

function openPartners(value) {
  if (value === 'SH') router.push({ name: 'partners-results', query: { lang: locale.value } })
}

// Legacy's selectTimePeriod(): a start after the end is refused with its
// alert; otherwise both are sent as they stand.
const period = reactive({ start: 'none', end: 'none' })
function choosePeriod(key, value) {
  period[key] = value
  const { start, end } = period
  if (start !== 'Before 1800' && start !== 'none' && (end === 'Before 1800' || (end !== 'none' && end !== 'After 1930' && start > end))) {
    window.alert(t('sharinghistory.pc.alertPeriod'))
    return
  }
  open({ start, end })
}
</script>

<template>
  <div class="mwnf-standalone-pc sharinghistory-pc">
    <div class="mwnf-standalone-pc__lists">
      <h3 class="mwnf-standalone-pc__heading">{{ t('sharinghistory.pc.sortBy') }}</h3>
      <p>
        <select @change="open({ country: $event.target.value })">
          <option value="">{{ t('sharinghistory.pc.country') }}</option>
          <option value="" disabled></option>
          <option v-for="o in countries" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </p>
      <p>
        <select @change="open({ exhibition: $event.target.value })">
          <option value="">{{ t('sharinghistory.pc.theme') }}</option>
          <option v-for="o in exhibitions" :key="o.value" :value="o.value">{{ o.label }}</option>
        </select>
      </p>
      <p>
        <select @change="openPartners($event.target.value)">
          <option value="">{{ t('sharinghistory.pc.partners') }}</option>
          <option value="SH">{{ t('sharinghistory.pc.partnersSh') }}</option>
        </select>
      </p>
      <p class="sharinghistory-pc__dates">
        <select :value="period.start" @change="choosePeriod('start', $event.target.value)">
          <option value="none">{{ t('sharinghistory.pc.startDate') }}</option>
          <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
        </select>
        <select :value="period.end" @change="choosePeriod('end', $event.target.value)">
          <option value="none">{{ t('sharinghistory.pc.endDate') }}</option>
          <option v-for="d in DECADES" :key="d" :value="d">{{ d }}</option>
        </select>
      </p>
    </div>
    <div class="mwnf-standalone-pc__about">
      <h3 class="mwnf-standalone-pc__heading">{{ t('sharinghistory.pc.about') }}</h3>
      <I18nText tag="div" keypath="sharinghistory.pc.text" />
    </div>
  </div>
</template>
