<script setup>
import { computed } from 'vue'
import { useI18n } from '@museumwnf/viewer-core'
import { StandalonePartnerList } from '@museumwnf/viewer-layout/standalone'
import { useData } from '../composables/data.js'
import { partnerListGroups } from '../composables/partner.js'

// The partners as legacy's pm_partner_list.php, the standalone family's
// list (viewer-layout's `StandalonePartnerList`): Back and the Sponsors page,
// then one row a country, its partners with their city beside "See
// Associated Museums", which opens the country's associated partners. Every
// word is legacy's own (sharinghistory.pl.*, its translation table).

const { t, locale } = useI18n()
const { tr } = useData()

// Legacy printed the partner row's own city ("Roma"), the same in every
// language; a package without it gives the translation's.
const link = (partner, withCity) => {
  const text = tr('partners', partner.id)
  const city = partner.city ?? text.city
  return {
    id: partner.id,
    label: withCity && city ? `${text.name},\u00a0${city}` : text.name,
    to: { name: 'partner', params: { id: partner.id }, query: { lang: locale.value } },
  }
}
const groups = computed(() =>
  partnerListGroups().map((group) => ({
    label: group.label,
    main: group.main.map((partner) => link(partner, true)),
    associated: group.associated.map((partner) => link(partner, false)),
  })),
)

const back = computed(() => [
  { label: t('sharinghistory.pcr.back'), history: true },
  { label: t('sharinghistory.pl.sponsors'), to: { name: 'sponsors', query: { lang: locale.value } } },
])
</script>

<template>
  <StandalonePartnerList
    class="sharinghistory-pl"
    type="museum"
    :groups="groups"
    :back="back"
    :see-associated="t('sharinghistory.pl.seeAssociated')"
    :no-associated="t('sharinghistory.pl.noAssociated')"
  />
</template>
