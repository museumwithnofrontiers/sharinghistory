import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages } from '@museumwnf/viewer-core'
import { mountSite } from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import countryTexts from '@museumwnf/sharinghistory-data/translations/countries.en.json'
import config from '../src/dataset.config.js'
import { ABOUT_PICTURES } from '../src/composables/aboutPictures.js'
import { internationalSponsors, localSponsors } from '../src/composables/sponsors.js'

// The entries the footer, the cooperation band, the About, Team and Sponsors
// pages read (inventory-app#2233 T2, T5). Their texts come from legacy
// through inventory-app's site-i18n, into locales/en.json. The stand-ins
// below fill any entry still missing there, for these tests only, so that
// they check the structure; the smoke test and the Texts check hold the
// texts themselves.
const TEAM_CATEGORIES = ['idea', 'curatorialCommittee', 'projectTeam', 'webTeam', 'translations', 'historicalBackground']
const LOCAL_TEAMS = ['germany', 'italy', 'lebanon', 'portugal', 'serbia', 'tunisia', 'turkiye', 'unitedKingdom']
const SPONSORS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
const cap = (id) => id[0].toUpperCase() + id.slice(1)
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
  'sharinghistory.team.heading', 'sharinghistory.team.localTeamsTitle',
  ...TEAM_CATEGORIES.flatMap((id) => [`sharinghistory.team.${id}Title`, `sharinghistory.team.${id}Body`]),
  ...LOCAL_TEAMS.flatMap((id) => [`sharinghistory.team.local${cap(id)}Title`, `sharinghistory.team.local${cap(id)}Body`]),
  'sharinghistory.sponsors.bannerTitle', 'sharinghistory.sponsors.international', 'sharinghistory.sponsors.local',
  'sharinghistory.sponsors.localIntro', 'sharinghistory.sponsors.partnersLink',
  ...SPONSORS.map((n) => `sharinghistory.sponsors.name${n}`),
  ...SPONSORS.filter((n) => n !== 8).map((n) => `sharinghistory.sponsors.remarks${n}`),
]
const standIns = Object.fromEntries(LEGACY_ENTRIES.map((key) => [key, `[${key}]`]))
const messages = mergeMessages(sharedTexts, { en: { ...standIns, ...ownTexts } })
const text = (key) => ownTexts[key] ?? standIns[key]

const FOOTER_LINKS = [
  'https://www.museumwnf.org/about',
  'https://www.museumwnf.org/about/contact',
  'https://www.museumwnf.org/about/legal-notice',
  'https://www.museumwnf.org/about/credits',
  'https://www.museumwnf.org/about/language-policy',
  'https://www.museumwnf.org/about/cookies',
]

describe('legacy chrome', () => {
  it('prints legacy\'s six portal links in its order, and the copyright with the year', async () => {
    const { app, host } = await mountSite(config, messages)
    await vi.waitFor(() => expect(host.querySelector('.sh-footer')).not.toBeNull(), { timeout: 15000 })
    const links = [...host.querySelectorAll('.sh-footer__link')]
    expect(links.map((a) => a.getAttribute('href'))).toEqual(FOOTER_LINKS)
    expect(links.every((a) => !a.hasAttribute('target'))).toBe(true)
    expect(host.querySelector('.sh-footer__copyright').textContent)
      .toBe(`${text('sharinghistory.footer.copyright')} ${new Date().getFullYear()}`)
    app.unmount()
  }, 60000)

  it('shows the cooperation band where legacy does, and only there', async () => {
    for (const [hash, shown] of [['#/', true], ['#/about', true], ['#/database', false], ['#/sponsors', false]]) {
      const { app, host } = await mountSite(config, messages, hash)
      await vi.waitFor(() => expect(host.querySelector('.sh-footer')).not.toBeNull(), { timeout: 15000 })
      if (shown) {
        await vi.waitFor(() => expect(host.querySelector('.sh-band')).not.toBeNull(), { timeout: 15000 })
        const hrefs = [...host.querySelectorAll('.sh-band a')].map((a) => a.getAttribute('href'))
        expect(hrefs).toEqual(expect.arrayContaining([
          'https://www.museumwnf.org/league-of-arab-states/', '#/partners', 'http://www.sharjahmuseums.ae/?lang=en-us',
          'http://www.yasar.edu.tr/en/', '#/sponsors', 'https://www.museumwnf.org/about/support',
        ]))
      } else {
        expect(host.querySelector('.sh-band'), hash).toBeNull()
      }
      app.unmount()
    }
  }, 60000)

  it('renders the About page with legacy\'s pictures, each linked record resolved', async () => {
    const { app, host } = await mountSite(config, messages, '#/about')
    await vi.waitFor(() => expect(host.querySelector('.sh-about__pictures img')).not.toBeNull(), { timeout: 15000 })
    expect(host.querySelectorAll('.sh-about__picture')).toHaveLength(ABOUT_PICTURES.length)

    // Every record legacy linked a picture to is in the package, so none
    // silently loses its link.
    const [items] = await loadEntities(['items'])
    const keys = new Set(items.map((item) => item.backward_compatibility))
    const linked = ABOUT_PICTURES.filter((picture) => picture.item)
    for (const picture of linked) expect(keys.has(picture.item), picture.item).toBe(true)
    await vi.waitFor(() => expect(host.querySelectorAll('a.sh-about__picture')).toHaveLength(linked.length), { timeout: 15000 })

    // The strip offers the pages that exist, in legacy's order.
    expect([...host.querySelectorAll('.sh-about-tabs__pages a')].map((a) => a.getAttribute('href')))
      .toEqual(['#/about', '#/about/team'])
    expect(host.querySelector('.mwnf-banner--section')).not.toBeNull()
    app.unmount()
  }, 60000)

  it('renders the Team page as legacy\'s accordion', async () => {
    const { app, host } = await mountSite(config, messages, '#/about/team')
    await vi.waitFor(() => expect(host.querySelector('.sh-team__toggle')).not.toBeNull(), { timeout: 15000 })
    const toggles = [...host.querySelectorAll('.sh-team__toggle')]
    expect(toggles.map((b) => b.textContent.trim())).toEqual([
      'idea', 'curatorialCommittee', 'projectTeam', 'webTeam', 'translations', 'localTeams', 'historicalBackground',
    ].map((id) => text(`sharinghistory.team.${id}Title`)))

    // Closed at first, as legacy; one open at a time.
    expect(host.querySelector('.sh-team__content')).toBeNull()
    toggles[1].click()
    await vi.waitFor(() => expect(host.querySelectorAll('.sh-team__content')).toHaveLength(1))
    toggles[2].click()
    await vi.waitFor(() => expect(toggles[2].getAttribute('aria-expanded')).toBe('true'))
    expect(host.querySelectorAll('.sh-team__content')).toHaveLength(1)

    // The local teams open by country inside theirs.
    toggles[5].click()
    await vi.waitFor(() => expect(host.querySelectorAll('.sh-team__country-toggle')).toHaveLength(LOCAL_TEAMS.length))
    expect(host.querySelector('.sh-team__country .sh-team__people')).toBeNull()

    expect(host.querySelector('.sh-about-tabs .active a').getAttribute('href')).toBe('#/about/team')
    app.unmount()
  }, 60000)

  it('renders the international sponsors, each logo linked where legacy links it', async () => {
    const { app, host } = await mountSite(config, messages, '#/sponsors')
    await vi.waitFor(() => expect(host.querySelector('.sh-sponsors__row')).not.toBeNull(), { timeout: 15000 })
    const rows = [...host.querySelectorAll('.sh-sponsors__row')]
    const sponsors = internationalSponsors((key) => key)
    expect(rows).toHaveLength(sponsors.length)

    // Legacy's links to its own partner pages land on the partner's page.
    const [partners] = await loadEntities(['partners'])
    const byKey = new Map(partners.map((partner) => [partner.backward_compatibility, partner]))
    for (const [index, sponsor] of sponsors.entries()) {
      const href = rows[index].querySelector('.sh-sponsors__logo a')?.getAttribute('href')
      if (sponsor.partner) {
        expect(byKey.has(sponsor.partner), sponsor.partner).toBe(true)
        expect(href).toBe(`#/partner/${byKey.get(sponsor.partner).id}`)
      } else {
        expect(href).toBe(sponsor.href)
      }
    }
    expect(host.querySelector('.sh-band')).toBeNull()
    app.unmount()
  }, 60000)

  it('renders the local sponsors under their country', async () => {
    const { app, host } = await mountSite(config, messages, '#/sponsors/local')
    await vi.waitFor(() => expect(host.querySelector('.sh-sponsors__row')).not.toBeNull(), { timeout: 15000 })
    const [countries] = await loadEntities(['countries'])
    for (const group of localSponsors((key) => key)) {
      expect(countries.some((country) => country.id === group.country), group.country).toBe(true)
    }
    expect(host.querySelectorAll('.sh-sponsors__row')).toHaveLength(1)
    expect(host.querySelector('.sh-sponsors__group strong').textContent).toBe(countryTexts.esp.name)
    app.unmount()
  }, 60000)
})
