<script setup>
// A thin mount of @museumwnf/viewer-layout's own SiteShell: the menu and the
// active entry come from `dataset.config.js`'s `navigation` (SiteShell reads
// it through viewer-core's `useSiteConfig()`); `$attrs` carries the
// language state PageShell needs (`language`, `languages`,
// `update:language`) straight through, the same as before. All this file
// still supplies is what a config cannot: the header lockup markup in the
// #brand slot, legacy's cooperation band in the #sponsors slot, and legacy's
// footer in the #footer slot.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@museumwnf/viewer-core'
import { SiteShell } from '@museumwnf/viewer-layout/components'
import CooperationBand from './components/CooperationBand.vue'
import SiteFooter from './components/SiteFooter.vue'

const { t } = useI18n()
const route = useRoute()

// The pages legacy shows the band on: the home (`shTemplate.php`) and the
// pages that include `includes/inner_bottom.php` — the About pages, the
// Historical Background and the Permanent Collection's entrance. Its
// database, timeline, partner, profile, item and sponsors pages don't.
const BAND_ROUTES = ['home', 'about', 'about-team', 'historical-background', 'permanent-collection']
const showBand = computed(() => BAND_ROUTES.includes(route.name))
</script>

<template>
  <SiteShell v-bind="$attrs">
    <template #brand>
      <a class="site-logo" href="#/">
        <span class="site-logo-org">{{ t('standalone.identity.organisation') }}</span>
        <span class="site-logo-title">{{ t('sharinghistory.identity.title') }}</span>
        <span class="site-logo-sub">{{ t('sharinghistory.identity.strapline') }}</span>
      </a>
    </template>
    <slot />
    <!-- Always passed: viewer-layout's AppSponsors decides once, at mount,
         whether it has a slot, and the route resolves after that. The strip
         stays hidden while it holds no band (theme/overrides.css). -->
    <template #sponsors>
      <CooperationBand v-if="showBand" />
    </template>
    <template #footer>
      <SiteFooter />
    </template>
  </SiteShell>
</template>

<style scoped>
.site-logo {
  display: flex;
  flex-direction: column;
  gap: 1px;
  text-decoration: none !important;
  /* The global `a { color }` rule (site.css) would otherwise win over the
     header's own inherited text colour, since it targets the element
     directly rather than through inheritance. */
  color: var(--mwnf-header-text);
}
.site-logo:hover {
  color: var(--mwnf-header-text);
}
.site-logo-org {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 400;
  opacity: 0.8;
}
.site-logo-title {
  font-size: 28px;
  font-weight: 400;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.site-logo-sub {
  font-size: 12px;
  letter-spacing: 0.04em;
  opacity: 0.9;
}
</style>
