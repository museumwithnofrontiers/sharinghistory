<script setup>
// Legacy's Team page (`about_team.php`): the strip of About pages, the
// heading, and the team by category in legacy's order, as an accordion that
// opens one category at a time; the local project teams open by country
// inside theirs. On the right, legacy's picture of the team. Every text is
// legacy's, through site-i18n: one body per category (one person a line),
// composed by legacy's own rules.
import { computed, ref } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import AboutTabs from '../components/AboutTabs.vue'
import { useData } from '../composables/data.js'
import teamPicture from '../../theme/assets/banners/about_image.jpg'

const { t } = useI18n()
const { md } = useData()

const categories = computed(() => [
  { id: 'idea', title: t('sharinghistory.team.ideaTitle'), body: t('sharinghistory.team.ideaBody') },
  { id: 'curatorialCommittee', title: t('sharinghistory.team.curatorialCommitteeTitle'), body: t('sharinghistory.team.curatorialCommitteeBody') },
  { id: 'projectTeam', title: t('sharinghistory.team.projectTeamTitle'), body: t('sharinghistory.team.projectTeamBody') },
  { id: 'webTeam', title: t('sharinghistory.team.webTeamTitle'), body: t('sharinghistory.team.webTeamBody') },
  { id: 'translations', title: t('sharinghistory.team.translationsTitle'), body: t('sharinghistory.team.translationsBody') },
  { id: 'localTeams', title: t('sharinghistory.team.localTeamsTitle'), body: '' },
  { id: 'historicalBackground', title: t('sharinghistory.team.historicalBackgroundTitle'), body: t('sharinghistory.team.historicalBackgroundBody') },
])

const localTeams = computed(() => [
  { id: 'germany', title: t('sharinghistory.team.localGermanyTitle'), body: t('sharinghistory.team.localGermanyBody') },
  { id: 'italy', title: t('sharinghistory.team.localItalyTitle'), body: t('sharinghistory.team.localItalyBody') },
  { id: 'lebanon', title: t('sharinghistory.team.localLebanonTitle'), body: t('sharinghistory.team.localLebanonBody') },
  { id: 'portugal', title: t('sharinghistory.team.localPortugalTitle'), body: t('sharinghistory.team.localPortugalBody') },
  { id: 'serbia', title: t('sharinghistory.team.localSerbiaTitle'), body: t('sharinghistory.team.localSerbiaBody') },
  { id: 'tunisia', title: t('sharinghistory.team.localTunisiaTitle'), body: t('sharinghistory.team.localTunisiaBody') },
  { id: 'turkiye', title: t('sharinghistory.team.localTurkiyeTitle'), body: t('sharinghistory.team.localTurkiyeBody') },
  { id: 'unitedKingdom', title: t('sharinghistory.team.localUnitedKingdomTitle'), body: t('sharinghistory.team.localUnitedKingdomBody') },
])

// Legacy opens nothing at first; a click opens one entry and closes the
// others, or closes the open one.
const openCategory = ref(null)
const openCountry = ref(null)
const toggleCategory = (id) => { openCategory.value = openCategory.value === id ? null : id }
const toggleCountry = (id) => { openCountry.value = openCountry.value === id ? null : id }
</script>

<template>
  <div class="sh-team">
    <AboutTabs />
    <h1 class="sh-team__heading">{{ t('sharinghistory.team.heading') }}</h1>
    <div class="sh-team__columns">
      <div class="sh-team__categories">
        <section v-for="category in categories" :key="category.id" class="sh-team__category">
          <h2>
            <button
              type="button"
              class="sh-team__toggle"
              :class="{ active: openCategory === category.id }"
              :aria-expanded="openCategory === category.id"
              @click="toggleCategory(category.id)"
            ><span class="sh-team__icon" aria-hidden="true"></span>{{ category.title }}</button>
          </h2>
          <div v-if="openCategory === category.id" class="sh-team__content">
            <div v-if="category.body" class="sh-team__people" v-html="md(category.body)" />
            <section v-for="team in category.id === 'localTeams' ? localTeams : []" :key="team.id" class="sh-team__country">
              <h3>
                <button
                  type="button"
                  class="sh-team__country-toggle"
                  :aria-expanded="openCountry === team.id"
                  @click="toggleCountry(team.id)"
                >{{ team.title }}</button>
              </h3>
              <div v-if="openCountry === team.id" class="sh-team__people" v-html="md(team.body)" />
            </section>
          </div>
        </section>
      </div>
      <div class="sh-team__picture">
        <img :src="teamPicture" alt="" :title="t('sharinghistory.about.tabTeam')" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sh-team {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
/* Legacy's `.short_heading h3`. */
.sh-team__heading {
  margin: 0;
  font-size: 19px;
  font-weight: 400;
  color: #222222;
}
.sh-team__columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 48rem) {
  /* Legacy's two col-md-6. */
  .sh-team__columns {
    grid-template-columns: 1fr 1fr;
  }
}
.sh-team__category h2,
.sh-team__country h3 {
  margin: 0;
  font-size: inherit;
}
/* Legacy's `h3.team_txt_head`: an oxblood bar per category. */
.sh-team__toggle {
  display: block;
  width: 100%;
  margin: 0 0 20px;
  padding: 5px 10px;
  border: 0;
  background: #750101;
  color: #ffffff;
  font: inherit;
  font-size: 18px;
  font-weight: 300;
  text-align: left;
  cursor: pointer;
}
/* Legacy's `fa-angle-double-right` icon. */
.sh-team__icon::before {
  content: '»\00a0';
}
.sh-team__content {
  margin: 0 0 10px;
  padding: 0 15px;
}
.sh-team__country-toggle {
  display: block;
  padding: 0 0 5px;
  border: 0;
  background: none;
  color: #000000;
  font: inherit;
  font-size: 18px;
  text-align: left;
  cursor: pointer;
}
.sh-team__people :deep(p) {
  margin: 0 0 10px;
  font-size: 16px;
  line-height: 22px;
  color: #222222;
}
.sh-team__picture img {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
