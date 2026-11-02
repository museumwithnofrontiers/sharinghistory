<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import AboutTabs from '../components/AboutTabs.vue'
import { activityText, activityWhereWhen, chronology, chronologyEvents } from '../composables/chronology.js'
import { useData } from '../composables/data.js'

// An activity of the Chronology as legacy's about_chronology_txt.php: the
// About strip (Chronology), "Project Chronology", the project's activity in
// bold, the activity's title in red; Back, and Next to the following
// activity; its first picture large with its caption, the others in
// thumbnails that show themselves there under the pointer; then its title,
// its place and dates, its organisers and sponsors, its text and its
// remarks. Every word is legacy's own (sharinghistory.chr.*), the ones
// legacy wrote in English as it wrote them.

const props = defineProps({ id: { type: String, required: true } })

const { t, locale } = useI18n()
const { md, mdInline } = useData()

const root = computed(() => chronology.value?.extra ?? {})
const index = computed(() => chronologyEvents.value.findIndex((event) => event.id === props.id))
const event = computed(() => chronologyEvents.value[index.value] ?? null)
const next = computed(() => chronologyEvents.value[index.value + 1] ?? null)
const text = computed(() => (event.value ? activityText(event.value) : {}))
const pictures = computed(() => [...(event.value?.images ?? [])].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0)))
const shown = ref(0)
watch(() => props.id, () => { shown.value = 0 })
const picture = computed(() => pictures.value[shown.value] ?? pictures.value[0] ?? null)

const whereWhen = computed(() => (event.value ? activityWhereWhen(event.value, text.value, { from: t('sharinghistory.chr.from'), to: t('sharinghistory.chr.to') }) : ''))
// Legacy listed its people a blank line apart, each list's ";" as ",".
const people = computed(() =>
  [
    [t('sharinghistory.chr.organisers'), text.value.organisers],
    [t('sharinghistory.chr.coorganisers'), text.value.coorganisers],
    [t('sharinghistory.chr.sponsors'), text.value.sponsors],
  ]
    .filter(([, value]) => value)
    .map(([label, value]) => ({ label, value: String(value).replaceAll(';', ',') })),
)
</script>

<template>
  <div class="sh-chronology sh-chronology--event">
    <AboutTabs />
    <h3 class="sh-chronology__heading">{{ t('sharinghistory.chr.heading') }}</h3>
    <template v-if="event">
      <p class="sh-chronology__path"><b>{{ root.title }}</b></p>
      <h3 class="sh-chronology__title">{{ text.name }}<template v-if="text.subtitle"><br>{{ text.subtitle }}</template></h3>
      <div class="sh-chronology__nav">
        <p class="mwnf-standalone-item__back">
          <button type="button" class="mwnf-standalone-item__back-link" @click="$router.back()">{{ t('sharinghistory.chr.back') }}</button>
        </p>
        <p v-if="next" class="sh-chronology__next">
          <RouterLink :to="{ name: 'about-chronology-event', params: { id: next.id }, query: { lang: locale } }">{{ t('sharinghistory.chr.next') }}</RouterLink>
        </p>
      </div>
      <div class="sh-chronology__columns">
        <div class="sh-chronology__picture">
          <template v-if="picture">
            <a :href="picture.url" target="_blank" rel="noopener"><img :src="picture.url" :alt="picture.alt_text ?? ''"></a>
            <p class="sh-chronology__credit">{{ picture.alt_text || '\u00a0' }}</p>
          </template>
        </div>
        <div class="sh-chronology__text">
          <div v-if="pictures.length" class="sh-chronology__thumbs">
            <a v-for="(p, i) in pictures" :key="p.url" :href="p.url" target="_blank" rel="noopener" @mouseover="shown = i"><img :src="p.url" :alt="p.alt_text ?? ''"></a>
          </div>
          <p><b>{{ text.name }}<template v-if="text.subtitle"><br>{{ text.subtitle }}</template></b><br>{{ whereWhen }}</p>
          <!-- eslint-disable vue/no-v-html -- the package's own Markdown, rendered and escaped by viewer-core -->
          <p v-if="people.length">
            <template v-for="(person, i) in people" :key="person.label"><template v-if="i"><br><br></template>{{ person.label }} <span v-html="mdInline(person.value)"></span></template>
          </p>
          <div v-if="text.description" class="sh-chronology__description" v-html="md(text.description)"></div>
          <p v-if="text.remarks" v-html="mdInline(text.remarks)"></p>
          <!-- eslint-enable vue/no-v-html -->
        </div>
      </div>
    </template>
  </div>
</template>
