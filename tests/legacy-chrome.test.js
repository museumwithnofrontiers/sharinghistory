import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages } from '@museumwnf/viewer-core'
import { mountSite } from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import config from '../src/dataset.config.js'
import { ABOUT_PICTURES } from '../src/composables/aboutPictures.js'

// The entries the footer, the cooperation band and the About page read
// (inventory-app#2233 T2, T5). Their texts come from legacy through
// inventory-app's site-i18n; until they're in locales/en.json, each block
// that would carry one is left out. The values below are stand-ins for the
// tests only, never shown on the site.
const LEGACY_ENTRIES = [
  'sharinghistory.footer.aboutMwnf', 'sharinghistory.footer.contact', 'sharinghistory.footer.legalNotice',
  'sharinghistory.footer.credits', 'sharinghistory.footer.languagePolicy', 'sharinghistory.footer.cookies',
  'sharinghistory.footer.copyright',
  'sharinghistory.band.cooperation', 'sharinghistory.band.leagueOfArabStates', 'sharinghistory.band.partnersTitle',
  'sharinghistory.band.partnerInstitutions', 'sharinghistory.band.partnersTooltip', 'sharinghistory.band.strategicSponsors',
  'sharinghistory.band.sponsorSharjah', 'sharinghistory.band.sponsorYasar', 'sharinghistory.band.otherSponsors',
  'sharinghistory.band.support', 'sharinghistory.band.partnerMeetingsVideo', 'sharinghistory.band.partnerMeetingsVideoTooltip',
  'sharinghistory.about.bannerTitle', 'sharinghistory.about.tabTeam', 'sharinghistory.about.tabChronology',
  'sharinghistory.about.tabAbout', 'sharinghistory.about.seeAlsoHistoricalBackground', 'sharinghistory.about.heading',
  'sharinghistory.about.projectName', 'sharinghistory.about.body', 'sharinghistory.about.relatedContent',
  'sharinghistory.about.relatedSpeech', 'sharinghistory.about.relatedVideo',
]
const standIns = Object.fromEntries(LEGACY_ENTRIES.map((key) => [key, `[${key}]`]))
const pending = LEGACY_ENTRIES.filter((key) => !(key in ownTexts))

const FOOTER_LINKS = [
  ['sharinghistory.footer.aboutMwnf', 'https://www.museumwnf.org/about'],
  ['sharinghistory.footer.contact', 'https://www.museumwnf.org/about/contact'],
  ['sharinghistory.footer.legalNotice', 'https://www.museumwnf.org/about/legal-notice'],
  ['sharinghistory.footer.credits', 'https://www.museumwnf.org/about/credits'],
  ['sharinghistory.footer.languagePolicy', 'https://www.museumwnf.org/about/language-policy'],
  ['sharinghistory.footer.cookies', 'https://www.museumwnf.org/about/cookies'],
]

describe('legacy chrome', () => {
  it('leaves out every block whose text legacy hasn\'t given yet', async () => {
    const { app, host } = await mountSite(config, mergeMessages(sharedTexts, { en: ownTexts }), '#/about')
    await vi.waitFor(() => expect(host.querySelector('.sh-about')).not.toBeNull(), { timeout: 15000 })
    for (const key of pending) expect(host.textContent, key).not.toContain(key)
    app.unmount()
  }, 20000)

  it('prints legacy\'s six portal links in its order, and the copyright with the year', async () => {
    const { app, host } = await mountSite(config, mergeMessages(sharedTexts, { en: { ...standIns, ...ownTexts } }))
    await vi.waitFor(() => expect(host.querySelector('.mwnf-footer__links')).not.toBeNull(), { timeout: 15000 })
    const links = [...host.querySelectorAll('.mwnf-footer__link')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(FOOTER_LINKS.map(([, href]) => href))
    expect(links.every((a) => !a.hasAttribute('target'))).toBe(true)
    const copyright = ownTexts['sharinghistory.footer.copyright'] ?? standIns['sharinghistory.footer.copyright']
    expect(host.querySelector('.mwnf-footer__text').textContent).toBe(`${copyright}${new Date().getFullYear()}`)
    app.unmount()
  }, 20000)

  it('shows the cooperation band on every page', async () => {
    for (const hash of ['#/', '#/database']) {
      const { app, host } = await mountSite(config, mergeMessages(sharedTexts, { en: { ...standIns, ...ownTexts } }), hash)
      await vi.waitFor(() => expect(host.querySelector('.sh-band')).not.toBeNull(), { timeout: 15000 })
      const hrefs = [...host.querySelectorAll('.sh-band a')].map((a) => a.getAttribute('href'))
      expect(hrefs).toContain('https://www.museumwnf.org/league-of-arab-states/')
      expect(hrefs).toContain('#/partners')
      expect(hrefs).toContain('http://www.sharjahmuseums.ae/?lang=en-us')
      expect(hrefs).toContain('http://www.yasar.edu.tr/en/')
      expect(hrefs).toContain('https://www.museumwnf.org/about/support')
      app.unmount()
    }
  }, 40000)

  it('renders the About page with legacy\'s pictures, each linked record resolved', async () => {
    const { app, host } = await mountSite(config, mergeMessages(sharedTexts, { en: { ...standIns, ...ownTexts } }), '#/about')
    await vi.waitFor(() => expect(host.querySelector('.sh-about__pictures img')).not.toBeNull(), { timeout: 15000 })
    expect(host.querySelectorAll('.sh-about__picture')).toHaveLength(ABOUT_PICTURES.length)

    // Every record legacy linked a picture to is in the package, so none
    // silently loses its link.
    const [items] = await loadEntities(['items'])
    const keys = new Set(items.map((item) => item.backward_compatibility))
    const linked = ABOUT_PICTURES.filter((picture) => picture.item)
    for (const picture of linked) expect(keys.has(picture.item), picture.item).toBe(true)
    await vi.waitFor(() => expect(host.querySelectorAll('a.sh-about__picture')).toHaveLength(linked.length), { timeout: 15000 })

    expect(host.querySelector('.sh-about-tabs .active')).not.toBeNull()
    expect(host.querySelector('.mwnf-banner--section')).not.toBeNull()
    app.unmount()
  }, 20000)
})
