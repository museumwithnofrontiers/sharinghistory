<script setup>
// viewer-layout's standalone family shell (`StandaloneShell`), which draws
// legacy's header, menu, banners and band titles from `dataset.config.js`'s
// `standalone` and `navigation`. What this file adds is what a config cannot:
// legacy's cooperation band, on the pages legacy shows it on, and legacy's
// footer, through the shell's `#sponsors` and `#footer` slots. `$attrs`
// carries the language state straight through.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { StandaloneShell } from '@museumwnf/viewer-layout/standalone'
import CooperationBand from './components/CooperationBand.vue'
import SiteFooter from './components/SiteFooter.vue'

const route = useRoute()

// The pages legacy shows the band on: the home (`shTemplate.php`) and the
// pages that include `includes/inner_bottom.php` — the About pages, the
// Historical Background and the Permanent Collection's entrance. Its
// database, timeline, partner, profile, item and sponsors pages don't.
const BAND_ROUTES = ['home', 'about', 'about-team', 'historical-background', 'permanent-collection']
const showBand = computed(() => BAND_ROUTES.includes(route.name))
</script>

<template>
  <StandaloneShell v-bind="$attrs">
    <slot />
    <!-- Always passed: the shell decides once, at mount, whether it has a
         slot, and the route resolves after that. The strip stays hidden
         while it holds no band (theme/overrides.css). -->
    <template #sponsors>
      <CooperationBand v-if="showBand" />
    </template>
    <template #footer>
      <SiteFooter />
    </template>
  </StandaloneShell>
</template>
