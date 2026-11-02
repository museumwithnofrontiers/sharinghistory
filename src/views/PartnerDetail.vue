<script setup>
import { useI18n } from '@museumwnf/viewer-core'
import { StandalonePartnerPage } from '@museumwnf/viewer-layout/standalone'
import { partnerItemsLink, partnerProfileView } from '../composables/partner.js'

// The partner profile as legacy's pm_partner.php: the standalone family's
// page (viewer-layout's `StandalonePartnerPage`), with what is this
// website's: its ways back, its link to the partner's items, the band of
// its languages and its map for every partner that has them, and every word
// legacy's own (sharinghistory.pp.*, its translation table).

defineProps({ id: { type: String, required: true } })

const { locale } = useI18n()

const back = () => [
  { label: 'sharinghistory.pcr.back', history: true },
  { label: 'sharinghistory.pp.allPartners', to: { name: 'partners', query: { lang: locale.value } } },
  { label: 'sharinghistory.pl.sponsors', to: { name: 'sponsors', query: { lang: locale.value } } },
]

const labels = {
  about: 'sharinghistory.pp.about',
  contact: 'sharinghistory.pp.contact',
  logo: 'sharinghistory.pp.logo',
  homepage: 'sharinghistory.pp.homepage',
  addresses: 'sharinghistory.pp.addresses',
  phone: 'sharinghistory.pp.phone',
  fax: 'sharinghistory.pp.fax',
  map: 'sharinghistory.pp.map',
}

const hasMap = (record) => record?.latitude != null && record?.longitude != null
const everyPartner = () => true
</script>

<template>
  <StandalonePartnerPage
    :id="id"
    :view="partnerProfileView"
    :back="back"
    :items="partnerItemsLink"
    :map="hasMap"
    :bands="everyPartner"
    :labels="labels"
  />
</template>
