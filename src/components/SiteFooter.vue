<script setup>
// Legacy's footer (`includes/footer.php`): its six portal links, each in the
// same window, then its copyright entry followed by the current year, on one
// line. Nothing else: legacy has no rights-holder line (Pascal, 2026-10-20).
// viewer-layout 3.4.0 makes this the shared default; until the site moves
// to it, this fills SiteShell's footer slot.
import { useI18n } from '@museumwnf/viewer-core'

const { t } = useI18n()
const year = new Date().getFullYear()
</script>

<template>
  <p class="sh-footer">
    <a class="sh-footer__link" href="https://www.museumwnf.org/about">{{ t('sharinghistory.footer.aboutMwnf') }}</a><span class="sh-footer__sep" aria-hidden="true"></span>
    <a class="sh-footer__link" href="https://www.museumwnf.org/about/contact">{{ t('sharinghistory.footer.contact') }}</a><span class="sh-footer__sep" aria-hidden="true"></span>
    <a class="sh-footer__link" href="https://www.museumwnf.org/about/legal-notice">{{ t('sharinghistory.footer.legalNotice') }}</a><span class="sh-footer__sep" aria-hidden="true"></span>
    <a class="sh-footer__link" href="https://www.museumwnf.org/about/credits">{{ t('sharinghistory.footer.credits') }}</a><span class="sh-footer__sep" aria-hidden="true"></span>
    <a class="sh-footer__link" href="https://www.museumwnf.org/about/language-policy">{{ t('sharinghistory.footer.languagePolicy') }}</a><span class="sh-footer__sep" aria-hidden="true"></span>
    <a class="sh-footer__link" href="https://www.museumwnf.org/about/cookies">{{ t('sharinghistory.footer.cookies') }}</a><span class="sh-footer__sep" aria-hidden="true"></span>
    <span class="sh-footer__copyright">{{ t('sharinghistory.footer.copyright') }} {{ year }}</span>
  </p>
</template>

<style scoped>
/* Legacy's `footer p` and `footer p a`. */
.sh-footer {
  margin: 0;
  text-align: center;
  color: #ffffff;
}
.sh-footer a {
  color: #ffffff;
  font-weight: 400;
  text-decoration: none;
}
/* Legacy's "&nbsp;|&nbsp;" between the entries. */
.sh-footer__sep::before {
  content: '\00a0|\00a0';
}
</style>
