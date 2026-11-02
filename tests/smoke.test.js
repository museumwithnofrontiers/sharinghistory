import { describe, expect, it, vi } from 'vitest'
import { loadEntities, mergeMessages, useDataPackage } from '@museumwnf/viewer-core'
import {
  checkOfferedLanguages, checkRoutes, checkSectionMeta, checkTextsRendered, mountSite,
} from '@museumwnf/viewer-core/testing'
import { catalogues as sharedTexts } from '@museumwnf/viewer-i18n/standalone'
import ownTexts from '../locales/en.json'
import collectionTexts from '@museumwnf/sharinghistory-data/translations/collections.en.json'
import countryTexts from '@museumwnf/sharinghistory-data/translations/countries.en.json'
import itemTexts from '@museumwnf/sharinghistory-data/translations/items.en.json'
import partnerTexts from '@museumwnf/sharinghistory-data/translations/partners.en.json'
import { collectionTitle, inPeriod, itemIdsUnder } from '../src/composables/catalogue.js'
import config from '../src/dataset.config.js'
import { exhibitionsTree, minisiteHref } from '../src/composables/exhibitions.js'
import minisites from '../src/minisites.json'
import { historicalProfilesTree } from '../src/composables/history.js'
import { OFFERED_LANGUAGES } from '../src/languages.js'
import { useData } from '../src/composables/data.js'

// The same two layers main.js assembles, in the same order: the shared bundle
// first, this website's own file last. Mounting without them would prove
// nothing about the chrome — every text would render as its own name.
const messages = mergeMessages(sharedTexts, { en: ownTexts })

describe('website smoke test', () => {
  it('mounts against the configured data package', async () => {
    const { app, host } = await mountSite(config, messages)

    // The site name comes from the package alone, which is the rule. This
    // package's English name is the project's full title with its subtitle,
    // while the lockup renders the short title over a strapline — so the two
    // are not one string, and asserting the page shows `siteName` would only
    // pass once a name was written back into the config. The config carries
    // the manifest; the page carries the lockup.
    const { manifest } = useDataPackage()
    expect(config.siteName).toBe(manifest.site.names.en)
    expect(host.querySelector('.mwnf-page')).not.toBeNull()

    // The home route renders legacy's home page (inventory-app#2233): the
    // picture with its two lines, the menu under it, the exhibitions over
    // their own pictures — no card grid, no welcome text legacy never had.
    expect(host.querySelector('.vc-home')).toBeNull()
    await vi.waitFor(() => expect(host.querySelectorAll('.mwnf-standalone-tiles__tile').length).toBe(10), { timeout: 15000 })
    expect(host.querySelector('.mwnf-cards')).toBeNull()
    expect(host.querySelector('.mwnf-standalone-home-banner__title').textContent).toBe(ownTexts['sharinghistory.identity.heading'])
    expect(host.querySelector('.mwnf-standalone-home-banner__line').textContent).toBe(ownTexts['sharinghistory.identity.subheading'])
    expect(host.querySelector('.mwnf-standalone-tiles__caption').textContent).toBe(ownTexts['sharinghistory.home.exhibitionsCaption'])
    expect(host.querySelector('.mwnf-standalone-tiles__image').getAttribute('src')).toMatch(/homeImg\d+/)
    // Legacy's menu, in its order, with its two drop-downs.
    expect([...host.querySelectorAll('.mwnf-nav__link')].map((l) => l.textContent.trim())).toEqual([
      'About', 'Exhibitions', 'Collections', 'Database', 'Timeline', 'Historical Profiles', 'Partners', 'My Collection',
    ])
    const dropDowns = host.querySelectorAll('.mwnf-nav__item--parent')
    expect([...dropDowns[0].querySelectorAll('.mwnf-nav__sublink')].map((a) => a.textContent.trim())).toEqual(['The Project', 'Historical Background'])
    expect(dropDowns[1].querySelectorAll('.mwnf-nav__sublink').length).toBeGreaterThan(5)

    app.unmount()
  }, 20000)

  // The footer is legacy's (SiteFooter.vue): its six links, then its
  // copyright entry, a space and the current year — legacy's
  // "© Museum With No Frontiers (MWNF) 2004 – <year>". The rights-holder
  // line is not asserted either way (Pascal, 2026-10-20; #128).
  it('renders legacy\'s footer line', async () => {
    const { app, host } = await mountSite(config, messages)
    await vi.waitFor(() => expect(host.querySelector('.sh-footer__copyright')).not.toBeNull(), { timeout: 15000 })
    expect(host.querySelector('.sh-footer__copyright').textContent)
      .toBe(`${ownTexts['sharinghistory.footer.copyright']} ${new Date().getFullYear()}`)
    app.unmount()
  }, 20000)

  // Legacy's pclist_all.php for a country: the heading with legacy's count
  // (Portugal: 49 objects and 17 monuments, measured on its page on
  // 2026-11-02), "Navigation by Country", twenty tiles, the lists and the
  // Related Content beside them; its band titled "Collections".
  it("renders the Collections results as legacy's pclist_all.php", async () => {
    const { app, host } = await mountSite(config, messages, '#/permanent-collection/results?country=prt&lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-results__tile')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-standalone-pcr__heading').textContent.replace(/\s+/g, ' ').trim())
      .toBe('Collections | Portugal [49 Objects, 17 Monuments]')
    expect(host.querySelector('.sharinghistory-pcr__navigation').textContent).toBe('Navigation by Country')
    expect(host.querySelectorAll('.mwnf-standalone-results__tile').length).toBe(20)
    expect(host.querySelector('.mwnf-standalone-banner__title').textContent).toBe('Collections')
    const related = [...host.querySelectorAll('.mwnf-standalone-pcr__related a')].map((a) => a.textContent)
    expect(related).toEqual(['Historical Profile | Portugal', 'Timeline | Portugal'])
    app.unmount()
  }, 60000)

  // A theme (an exhibition) narrows the list to its subtree, the exhibition
  // tree's own membership (itemIdsUnder, composables/catalogue.js); a period
  // follows legacy's rule (inPeriod).
  it('narrows the Collections to one theme and to a period', async () => {
    const [collections] = await loadEntities(['collections'])
    const marker = collections.find((c) => c.purpose === 'exhibitions-root')
    const exhibition = collections.find((c) => c.parent_id === marker.id)
    const scopedIds = itemIdsUnder(exhibition.id)

    const { app, host } = await mountSite(config, messages,
      `#/permanent-collection/results?exhibition=${encodeURIComponent(exhibition.id)}&lang=en`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-results__tile')).not.toBeNull(), { timeout: 20000 })
    const rowIds = Array.from(host.querySelectorAll('.mwnf-standalone-results__tile a[href*="/item/"]')).map((a) =>
      decodeURIComponent(a.getAttribute('href').split('/').pop().split('?')[0]),
    )
    expect(rowIds.length).toBeGreaterThan(0)
    for (const id of rowIds) expect(scopedIds.has(id)).toBe(true)
    expect(host.querySelector('.sharinghistory-pcr__navigation').textContent).toBe('Navigation by Theme')
    app.unmount()

    const item = (start_date, end_date) => ({ start_date, end_date })
    expect(inPeriod(item(1820, 1850), '1820', '1850')).toBe(true)
    expect(inPeriod(item(1815, 1850), '1820', '1850')).toBe(false)
    expect(inPeriod(item(1790, 1795), 'Before 1800', 'Before 1800')).toBe(true)
    expect(inPeriod(item(1790, 1840), 'Before 1800', '1850')).toBe(true)
    expect(inPeriod(item(1935, 1950), '1900', 'After 1930')).toBe(true)
    expect(inPeriod(item(null, null), '1900', 'none')).toBe(false)
    expect(inPeriod(item(null, null), 'none', 'none')).toBe(true)
  }, 60000)

  // Each exhibition is a website of its own (a mini-site, inventory-app#2359):
  // this site lists the exhibitions and links each to its own address
  // (src/minisites.json), and the addresses its exhibition pages had lead
  // there.
  it('lists the exhibitions, each leading to its own website', async () => {
    await loadEntities(['collections'])
    const exhibitions = exhibitionsTree.children(exhibitionsTree.root.value.id)
    expect(exhibitions.length).toBeGreaterThan(0)
    for (const exhibition of exhibitions) expect(minisites[exhibition.id], exhibition.internal_name).toMatch(/^https:\/\//)

    const { app, host } = await mountSite(config, messages, '#/exhibitions?lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards')).not.toBeNull(), { timeout: 20000 })
    const hrefs = Array.from(host.querySelectorAll('.mwnf-cards__link')).map((a) => a.getAttribute('href'))
    expect(hrefs).toHaveLength(exhibitions.length)
    for (const href of hrefs) expect(Object.values(minisites).some((base) => href.startsWith(base))).toBe(true)
    app.unmount()
  }, 60000)

  // A theme's address on this site is the same theme's overview on the
  // mini-site, numbered as the mini-site lists its themes (those with a title).
  it('places a theme and a chapter where their mini-site shows them', async () => {
    await loadEntities(['collections'])
    const exhibition = exhibitionsTree.children(exhibitionsTree.root.value.id)[0]
    const theme = exhibitionsTree.children(exhibition.id).find((t) => collectionTexts[t.id]?.title)
    const chapter = exhibitionsTree.children(theme.id).find((c) => collectionTexts[c.id]?.title)
    const { minisitePlace } = useData()
    const titled = (node) => !!collectionTexts[node.id]?.title?.trim()
    const themeNumber = exhibitionsTree.children(exhibition.id).filter(titled).indexOf(theme) + 1
    expect(minisitePlace(theme.id)).toEqual({ theme: themeNumber, page: 0 })
    if (chapter) {
      const page = exhibitionsTree.children(theme.id).filter(titled).indexOf(chapter) + 1
      expect(minisitePlace(chapter.id)).toEqual({ theme: themeNumber, page })
    }
    expect(minisiteHref(exhibition.id, 'en', { theme: 2, page: 3 })).toBe(`${minisites[exhibition.id]}#/theme/2/3?lang=en`)
    expect(minisiteHref(exhibition.id, 'en', { theme: 2, page: 0 })).toBe(`${minisites[exhibition.id]}#/theme/2?lang=en`)
    expect(minisiteHref(exhibition.id, 'en', 'introduction')).toBe(`${minisites[exhibition.id]}#/introduction?lang=en`)
  }, 60000)

  // Legacy always named a National Context collection by its country
  // (class.nationalcontext.inc.php joins mwnf3.countrynames for every list);
  // the importer writes it no title of its own, so `collectionTitle` reads
  // the country instead (composables/catalogue.js).
  it('labels a National Context collection by its country, not its internal name', async () => {
    const [collections] = await loadEntities(['collections'])
    const nc = collections.find((c) => c.purpose === 'national-context')
    expect(nc, 'fixture: a National Context collection').toBeDefined()

    const { loadTranslations } = useDataPackage()
    await loadTranslations('countries', 'en')

    const expectedName = countryTexts[nc.country_id]?.name
    expect(expectedName, 'fixture: the collection\'s country has an English name').toBeTruthy()
    expect(collectionTitle(nc)).toBe(expectedName)
    expect(collectionTitle(nc)).not.toContain(nc.internal_name)
  })

  // An item attached to a National Context collection links to the exhibition
  // introduction (themeId is null), not to the National Context id itself.
  it('links an item in a National Context to its exhibition, not the context', async () => {
    const [collections] = await loadEntities(['collections', 'items'])
    const nc = collections.find((c) => c.purpose === 'national-context' && c.items?.length)
    expect(nc, 'fixture: a National Context collection with items').toBeDefined()
    const itemId = nc.items[0].id
    const exhibition = collections.find((c) => c.id === nc.parent_id)
    expect(exhibition, 'fixture: the National Context collection\'s exhibition').toBeDefined()

    const { exhibitionLinksForItem } = useData()
    const links = exhibitionLinksForItem(itemId)
    expect(links.some((l) => l.exhibitionId === nc.parent_id && l.themeId === null && l.at === 'introduction')).toBe(true)
    expect(links.every((l) => l.themeId !== nc.id)).toBe(true)
  })

  // Legacy's Historical Background (historical_background*.php): the band of
  // its pages, the About page's twenty portraits, its word to the visitor,
  // the three perspectives and Related Content; a perspective's portraits,
  // text and countries; Read more's topics; Country Insight's lists and a
  // country's maps with their words (Austria's first: "1815").
  it("renders the Historical Background pages as legacy's", async () => {
    const about = await mountSite(config, messages, '#/historical-background?lang=en')
    await vi.waitFor(() => expect(about.host.querySelectorAll('.sharinghistory-hb__pages a').length).toBe(3), { timeout: 20000 })
    expect([...about.host.querySelectorAll('.sharinghistory-hbb__tabs a')].map((a) => a.textContent)).toEqual(['About', 'Country Insight', 'Read more'])
    expect(about.host.querySelector('.sharinghistory-hbb__tab--active').textContent.trim()).toBe('About')
    expect(about.host.querySelectorAll('.sharinghistory-hb__mosaic img').length).toBe(20)
    expect([...about.host.querySelectorAll('.sharinghistory-hb__pages a')].map((a) => a.textContent)).toEqual(['Arab Perspective', 'Ottoman Perspective', 'European Perspective'])
    expect([...about.host.querySelectorAll('.sharinghistory-hb__related a')].map((a) => a.textContent)).toEqual(['Timeline', 'Historical Profiles', 'Maps'])
    about.app.unmount()

    const page = await mountSite(config, messages, '#/historical-background/perspective/1?lang=en')
    await vi.waitFor(() => expect(page.host.querySelector('.sharinghistory-hbp__text h2')?.textContent).toBe('Arab Perspective'), { timeout: 20000 })
    expect(page.host.querySelectorAll('.sharinghistory-hbp__portraits img').length).toBe(8)
    expect(page.host.querySelector('.sharinghistory-hbp__others').textContent.replace(/\s+/g, ' ').trim()).toBe('Ottoman Perspective | European Perspective')
    expect(page.host.querySelector('.sharinghistory-hbp__countries').textContent).toContain('Saudi Arabia')
    page.app.unmount()

    const more = await mountSite(config, messages, '#/historical-background/read-more?lang=en')
    await vi.waitFor(() => expect(more.host.querySelectorAll('.sharinghistory-hbr__topics a').length).toBe(10), { timeout: 20000 })
    expect(more.host.querySelector('.sharinghistory-hbr__heading').textContent).toBe('Select a topic')
    more.app.unmount()

    const insight = await mountSite(config, messages, '#/historical-background/insight?mapcountry=aut&lang=en')
    await vi.waitFor(() => expect(insight.host.querySelector('.sharinghistory-hbi__words')?.textContent).toBe('1815'), { timeout: 20000 })
    expect(insight.host.querySelector('.sharinghistory-hbi__maps h3').textContent).toBe('Maps | Austria')
    expect(insight.host.querySelectorAll('.sharinghistory-hbi__thumbs img').length).toBe(3)
    insight.app.unmount()
  }, 60000)

  it('renders the Historical Profiles list on SectionCards', async () => {
    const { app, host } = await mountSite(config, messages, '#/historical-profiles')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-cards__card')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-cards--covers')).not.toBeNull()
    app.unmount()
  }, 60000)

  // A country whose record carries more than one page, to prove the
  // `navigation: 'siblings'` crossing that replaces the old `?page=N` query.
  function findProfileWithPages() {
    const root = historicalProfilesTree.root.value
    if (!root) return null
    for (const record of historicalProfilesTree.children(root.id)) {
      if (!record.country_id) continue
      const pages = historicalProfilesTree.children(record.id)
      if (pages.length > 1) return { record, pages }
    }
    return null
  }

  it('renders the country page on EssayView, canonicalising the bare record address onto its first page', async () => {
    await loadEntities(['collections'])
    const fixture = findProfileWithPages()
    expect(fixture, 'fixture: a country record with more than one page').not.toBeNull()

    const { app, host } = await mountSite(config, messages, `#/historical-profiles/${encodeURIComponent(fixture.record.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-essay')).not.toBeNull(), { timeout: 20000 })

    // The redirect (`router.replace`) lands on the record's own first page,
    // not a bare address — asserted once it settles, separately from the
    // essay itself, which renders off the same fallback immediately.
    await vi.waitFor(
      () => expect(decodeURIComponent(window.location.hash)).toContain(fixture.pages[0].id),
      { timeout: 20000 },
    )
    expect(decodeURIComponent(window.location.hash)).toContain(fixture.record.id)
    expect(host.querySelector('.mwnf-essay__breadcrumb-link')).not.toBeNull()
    expect(host.querySelector('.mwnf-essay__breadcrumb-link').textContent).not.toBe('')
    expect(host.querySelector('.mwnf-essay__nav-link--next')).not.toBeNull()

    // The view reads the collection's title through the tree's own entity,
    // not through a fallback to the spec's entity. A wrong entity renders
    // the internal_name instead of the translated title.
    const titleEl = host.querySelector('.mwnf-essay__title')
    expect(titleEl).not.toBeNull()
    const expectedTitle = collectionTexts[fixture.pages[0].id]?.title
    expect(titleEl.textContent.trim()).toContain(expectedTitle)
    expect(titleEl.textContent).not.toContain(fixture.pages[0].internal_name)

    // When the collection carries a description, the body must render it.
    if (collectionTexts[fixture.pages[0].id]?.description) {
      const bodyEl = host.querySelector('.mwnf-essay__body, .mwnf-essay__prose')
      expect(bodyEl).not.toBeNull()
      expect(bodyEl.textContent).toBeTruthy()
    }

    app.unmount()
  }, 60000)

  // The item sheet runs on the platform's composed record view
  // (metanull/viewer-core#50): the rows and their labels come from the sheet
  // spec in composables/sheet.js, and what only this website has — the
  // header, the holder text and its partner's summary, the special features —
  // fills the view's slots.
  it("renders the item sheet as legacy's three columns, in legacy's words", async () => {
    const [items, partners] = await loadEntities(['items', 'partners'])
    const partnerIds = new Set(partners.map((p) => p.id))
    const object = items.find((i) => i.type === 'object' && i.partner_id && partnerIds.has(i.partner_id)) ?? items[0]
    const { app, host } = await mountSite(config, messages, `#/item/${encodeURIComponent(object.id)}?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-sheet__label--name')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-standalone-item')).not.toBeNull()
    expect(host.querySelector('.mwnf-sheet__label--name').textContent).toBe('Name of Object:')
    expect([...host.querySelectorAll('.mwnf-standalone-item__back-link')].map((a) => a.textContent)).toEqual(['Back', 'Collections start page'])
    expect(host.querySelector('.mwnf-standalone-related__heading').textContent).toBe('Related Content')
    expect([...host.querySelectorAll('.mwnf-standalone-related__download button')].map((b) => b.textContent))
      .toEqual(['As PDF (including images)', 'As Word (text only)'])
    // The holder's partner, as viewer-layout's `PartnerPanel` summary — "About
    // {name}, {city}, {country}" — linking to its page (inventory-app#2035).
    const summary = host.querySelector('.mwnf-partner-panel--summary')
    expect(summary).not.toBeNull()
    expect(summary.textContent).toContain('About')
    expect(summary.querySelector('a').getAttribute('href')).toBe(`#/partner/${object.partner_id}`)

    // The citation's permalink (viewer-core's sourceUrl, sharinghistory#52):
    // the declared site origin plus this record's own hash route.
    const creditLink = host.querySelector('.mwnf-source-credit a')
    expect(creditLink).not.toBeNull()
    expect(creditLink.getAttribute('href').startsWith(`${config.site.origin}/#`)).toBe(true)
    expect(decodeURIComponent(creditLink.getAttribute('href'))).toContain(`/item/${object.id}`)
    expect(creditLink.textContent).toBe(creditLink.getAttribute('href'))

    // Legacy's citation: the name in quotes, its phrase for the project, the
    // year, then the page's address.
    expect(host.querySelector('.mwnf-credits__citation').textContent).toContain('in "Sharing History", Museum With No Frontiers,')

    app.unmount()
  }, 60000)

  // The blocks after the sheet are viewer-layout's item-page blocks. An item
  // with a video and THG galleries shows both: the video as a link out, the
  // galleries by name — the package carries no address for them, and a
  // same-page anchor would lead the hash router to its not-found page. This
  // package's own media entries carry no `language` of their own (unlike
  // islamicart's), so `RelatedMedia` falls back to showing every entry —
  // exactly `relatedMedia`'s own old fallback rule, before the refactor.
  it('shows the related video and the THG galleries through the shared item-page blocks', async () => {
    const [items] = await loadEntities(['items'])
    const item = items.find((i) => i.media?.length && i.thg_galleries?.length)
    expect(item, 'fixture: an item with media and THG galleries').toBeTruthy()
    const { app, host } = await mountSite(config, messages, `#/item/${encodeURIComponent(item.id)}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-related-media')).not.toBeNull(), { timeout: 20000 })

    const video = host.querySelector('.mwnf-related-media__link')
    expect(video.getAttribute('href')).toBe(item.media[0].url)
    expect(video.getAttribute('target')).toBe('_blank')

    const galleries = Array.from(host.querySelectorAll('.mwnf-on-display')).find((block) =>
      item.thg_galleries.every((g) => block.textContent.includes(g.name)))
    expect(galleries).toBeTruthy()
    expect(galleries.querySelector('a[href*="ThematicGallery"]')).toBeNull()

    app.unmount()
  }, 60000)

  // Legacy's hcr.php ("Timeline for this item"): the sheet offers the window
  // when the item's country has events; the window shows the item's country
  // and period, the item, and legacy's events for it (this Austrian fez,
  // 1890–1900: legacy's eleven events, from 1850 to 1897, measured on legacy's window on
  // 2026-11-02).
  it("opens the item's timeline as legacy's hcr.php", async () => {
    const fez = 'bb542d79-d99d-5291-a57c-0b72137d0e2f'
    const sheet = await mountSite(config, messages, `#/item/${fez}?lang=en`)
    await vi.waitFor(() => expect(sheet.host.querySelector('.sharinghistory-timeline-link a')).not.toBeNull(), { timeout: 20000 })
    const link = sheet.host.querySelector('.sharinghistory-timeline-link a')
    expect(link.textContent).toBe('Timeline for this item')
    expect(link.getAttribute('href')).toContain(`#/item/${fez}/timeline`)
    sheet.app.unmount()

    const { app, host } = await mountSite(config, messages, `#/item/${fez}/timeline?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-hcr__event')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-standalone-hcr__main h3').textContent).toBe('Austria - 1890 - 1900 A.D.')
    expect([...host.querySelectorAll('.mwnf-standalone-hcr__event b')].map((b) => b.textContent)).toEqual([
      '1850 - 1900 A.D.', '1850 - 1900 A.D.', '1858 - 1910 A.D.', '1872 - 1891 A.D.', '1887 - 1918 A.D.', '1891 - 1891 A.D.',
      '1893 - 1893 A.D.', '1895 - 1895 A.D.', '1896 - 1896 A.D.', '1896 - 1896 A.D.', '1897 - 1897 A.D.',
    ])
    expect(host.querySelector('.mwnf-standalone-hcr__left strong').textContent).toContain('Fez of a common soldier')
    app.unmount()
  }, 60000)

  // Legacy's hcr_home.php: its word to the visitor, the Political Context
  // Timeline of a country and the Thematic Timelines of a theme, each with
  // legacy's periods and Go, refused without a country or a theme.
  it("renders the Timeline entrance as legacy's hcr_home.php", async () => {
    const { app, host, router } = await mountSite(config, messages, '#/timeline?lang=en')
    await vi.waitFor(() => expect(host.querySelectorAll('.sharinghistory-tle__form').length).toBe(2), { timeout: 20000 })
    expect(host.querySelector('.sharinghistory-tle__intro').textContent).toContain('The purpose of this Timeline is to contextualise')
    expect([...host.querySelectorAll('.sharinghistory-tle__title')].map((p) => p.textContent)).toEqual(['Political Context Timeline', 'Thematic Timelines'])
    const [countries, , , themes] = host.querySelectorAll('.sharinghistory-tle select')
    await vi.waitFor(() => expect([...countries.options].map((o) => o.textContent)).toContain('Austria'), { timeout: 20000 })
    expect([...countries.options].slice(0, 2).map((o) => o.textContent)).toEqual(['Select a Country', 'All Countries'])
    expect([...themes.options].slice(0, 3).map((o) => o.textContent)).toEqual(['Select a Theme', 'All Themes', 'Cities and Urban Spaces'])

    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    host.querySelector('.sharinghistory-tle__go button').click()
    expect(alert).toHaveBeenCalledWith('Please select Country')
    alert.mockRestore()

    countries.value = 'aut'
    countries.dispatchEvent(new window.Event('change'))
    host.querySelector('.sharinghistory-tle__go button').click()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('timeline-results'), { timeout: 20000 })
    expect(router.currentRoute.value.query).toMatchObject({ country: 'aut', theme: 'pc' })
    app.unmount()
  }, 60000)

  // Legacy's hcr_result.php for Austria's Political Context: the band with
  // the search in words and its four lists, the Theme list shut; the events
  // by date, ten a page, each its date, its pictures and "Country | Theme";
  // the Related Content column and the downloads.
  it("renders the Timeline results as legacy's hcr_result.php", async () => {
    const { app, host } = await mountSite(config, messages, '#/timeline/results?country=aut&theme=pc&lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-tlr__row')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-standalone-tlr__summary').textContent).toBe('Timeline | Before 1800 to After 1930 | AUSTRIA | POLITICAL CONTEXT')
    expect([...host.querySelectorAll('.mwnf-standalone-tlr__selects label')].map((l) => l.textContent)).toEqual(['Start Date', 'End Date', 'Country', 'Theme'])
    expect(host.querySelectorAll('.mwnf-standalone-tlr__selects select')[3].disabled).toBe(true)
    expect([...host.querySelectorAll('.mwnf-standalone-tlr__heads h3')].map((h) => h.textContent)).toEqual(['Date', 'Country | Theme | Description'])
    const rows = host.querySelectorAll('.mwnf-standalone-tlr__row')
    expect(rows.length).toBe(10)
    expect(rows[0].querySelector('.mwnf-standalone-tlr__date span').textContent).toBe('1797')
    expect(rows[0].querySelector('.mwnf-standalone-tlr__content span').textContent).toBe('Austria | Political Context')
    expect(rows[0].querySelector('.sharinghistory-tlp__words').textContent).toContain('Campo Formio')
    expect(rows[0].querySelector('.sharinghistory-tlp__see').textContent).toBe('See Database Entry')
    expect([...host.querySelectorAll('.mwnf-standalone-tlr__related a')].map((a) => a.textContent)).toEqual([
      'Add dates from Thematic Timelines', 'See Gallery', 'Historical Profile Austria', 'Historical Background',
      'As PDF (including images)', 'As Word (text only)',
    ])
    expect(host.querySelector('.mwnf-standalone-pages')).not.toBeNull()
    app.unmount()
  }, 60000)

  // Legacy's hcr_gallery.php: Close and the Timeline start page, the search
  // in words with "Gallery", the records of the theme's exhibition of the
  // period by date, twenty a page, beside "See Timeline".
  it("renders the timeline gallery as legacy's hcr_gallery.php", async () => {
    const collections = await loadEntities(['collections']).then(([rows]) => rows)
    const economy = collections.find((c) => /sh_exhibitions:6$/.test(c.backward_compatibility ?? ''))
    const { app, host } = await mountSite(config, messages, `#/timeline/gallery?start=1850&end=1900&country=all&theme=${economy.id}&lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-results__cell')).not.toBeNull(), { timeout: 20000 })
    expect([...host.querySelectorAll('.mwnf-standalone-item__back-link')].map((a) => a.textContent.trim())).toEqual(['Close', 'Timeline start page'])
    expect(host.querySelector('.mwnf-standalone-pcr__heading').textContent).toBe('Timeline | 1850 to 1900 | Economy and Trade | Gallery')
    expect(host.querySelectorAll('.mwnf-standalone-results__cell').length).toBe(20)
    expect(host.querySelector('.mwnf-standalone-pcr__related a').textContent.trim()).toBe('See Timeline')
    expect(host.querySelector('.mwnf-standalone-pages')).not.toBeNull()
    app.unmount()
  }, 60000)

  // Legacy's pm_partner_list.php: Back and Sponsors, then one row a country
  // by its name, its partners as "Name, City", and "See Associated Museums",
  // which opens the country's associated partners. A partner needs a name
  // translation and a country (legacy's INNER JOINs): 114 of the package's 120.
  it("renders the partner list as legacy's pm_partner_list.php", async () => {
    const [partners] = await loadEntities(['partners'])
    const listed = partners.filter((p) => p.country_id && partnerTexts[p.id]?.name)
    const fixture = listed.find((p) => p.level === 'partner' && partnerTexts[p.id]?.city)
    const countryName = countryTexts[fixture.country_id]?.name
    const associated = listed.filter((p) => p.level === 'associated_partner' && p.country_id === fixture.country_id)

    const { app, host } = await mountSite(config, messages, '#/partners?lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-pl__group')).not.toBeNull(), { timeout: 20000 })

    expect([...host.querySelectorAll('.mwnf-standalone-pl__back .mwnf-standalone-item__back-link')].map((a) => a.textContent)).toEqual(['Back', 'Sponsors'])
    expect(host.querySelectorAll('.mwnf-standalone-pl__main p, .mwnf-standalone-pl__associated p:not(.mwnf-standalone-pl__none)').length).toBe(listed.length)
    const group = [...host.querySelectorAll('.mwnf-standalone-pl__group')].find((g) => g.querySelector('.mwnf-standalone-pl__head h3').textContent === countryName)
    expect(group.querySelector('.mwnf-standalone-pl__main').textContent).toContain(`${partnerTexts[fixture.id].name},\u00a0${partnerTexts[fixture.id].city}`)
    expect(group.querySelector('.mwnf-standalone-pl__toggle').textContent).toBe('See Associated Partners')
    expect(group.querySelectorAll('.mwnf-standalone-pl__associated p:not(.mwnf-standalone-pl__none)').length).toBe(associated.length)

    app.unmount()
  }, 60000)

  // The partner profile as legacy's pm_partner.php (viewer-layout's
  // `StandalonePartnerPage`): the ways back, the name over its place, the
  // About | Contact | Logo | homepage pill beside "View Objects", the map
  // under legacy's heading. Its pill leads to legacy's pm_items.php: the
  // partner's objects, twenty a page, beside "Partner Profile".
  it("renders a partner profile as legacy's pm_partner.php, and its objects as pm_items.php", async () => {
    const [partners, items] = await loadEntities(['partners', 'items'])
    const fixture = partners.find(
      (p) => partnerTexts[p.id]?.description && partnerTexts[p.id]?.phone && p.logos?.length && p.latitude != null
        && items.some((i) => i.partner_id === p.id && i.type === 'object'),
    )
    expect(fixture, 'fixture: a partner with a description, a phone, a logo, coordinates and objects').toBeTruthy()
    const text = partnerTexts[fixture.id]
    const objects = items.filter((i) => i.partner_id === fixture.id && i.type === 'object')

    const { app, host, router } = await mountSite(config, messages, `#/partner/${encodeURIComponent(fixture.id)}?lang=en`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-partner__name')?.textContent).toContain(text.name.replace(/\.$/, '')), { timeout: 20000 })

    expect([...host.querySelectorAll('.mwnf-standalone-item__back-link')].map((link) => link.textContent.trim()))
      .toEqual(['Back', 'All Partners', 'Sponsors'])
    expect(host.querySelector('.mwnf-standalone-partner__location').textContent).toContain(countryTexts[fixture.country_id].name)
    expect([...host.querySelectorAll('[role="tab"]')].map((tab) => tab.textContent.trim())).toEqual(['About', 'Contact', 'Logo'])
    expect(host.querySelector('.mwnf-standalone-partner__map-heading').textContent).toBe('Google Maps')
    const viewItems = host.querySelector('.mwnf-standalone-partner__items')
    expect(viewItems.textContent.trim()).toBe('View Objects')

    viewItems.click()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('partner-items'), { timeout: 20000 })
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-pmi')).not.toBeNull(), { timeout: 20000 })
    expect(host.querySelector('.mwnf-standalone-pmi .mwnf-standalone-pcr__heading').textContent).toBe(text.name.replace(/\.$/, ''))
    expect(host.querySelectorAll('.mwnf-standalone-results__cell').length).toBe(Math.min(objects.length, 20))
    expect(host.querySelector('.mwnf-standalone-pcr__related a').textContent).toBe('Partner Profile')
    app.unmount()
  }, 60000)

  // Legacy's database.php on the standalone family's form: three keyword rows
  // and their categories, the period before 1800 to after 1930, English or
  // French; legacy's check before searching; Go writes the results' query.
  it("renders the Database entrance as legacy's database.php", async () => {
    const { app, host, router } = await mountSite(config, messages, '#/database?lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-db')).not.toBeNull(), { timeout: 20000 })

    expect(host.querySelector('.mwnf-standalone-db__criteria').textContent).toBe('Enter your criteria:')
    const keywords = host.querySelectorAll('.mwnf-standalone-db__keyword')
    expect(keywords.length).toBe(3)
    const fields = host.querySelectorAll('.mwnf-standalone-db__field select')
    expect([...fields[0].options].map((o) => o.value)).toEqual([
      'keyword', 'name', 'location', 'provenance', 'dynasty', 'patron', 'artist', 'material', 'other',
    ])

    const [from, to] = host.querySelectorAll('.mwnf-standalone-db__dates select')
    const years = [...from.options].map((o) => o.textContent)
    expect(years.slice(1, 3)).toEqual(['Before 1800', '1800'])
    expect(years.at(-1)).toBe('After 1930')
    expect(from.options.length).toBe(17)
    expect(to.options.length).toBe(17)
    await vi.waitFor(() => expect([...host.querySelector('.mwnf-standalone-db__language select').options].map((o) => o.value)).toEqual(['', 'en', 'fr']), { timeout: 20000 })

    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    host.querySelector('.mwnf-standalone-db__go button').click()
    expect(alert).toHaveBeenCalledWith('Please enter one Keyword /Select one Language/ Select From To Dates')
    alert.mockRestore()

    keywords[0].value = 'trade'
    keywords[0].dispatchEvent(new window.Event('input'))
    fields[0].value = 'name'
    fields[0].dispatchEvent(new window.Event('change'))
    from.value = '1800'
    from.dispatchEvent(new window.Event('change'))
    host.querySelector('.mwnf-standalone-db__go button').click()
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('database-results'), { timeout: 20000 })
    expect(router.currentRoute.value.query).toMatchObject({ q: 'trade', field: 'name', from: '1800' })
    app.unmount()
  }, 30000)

  // Legacy's database_results.php counts, read on legacy on 2026-11-02, one
  // search a field: the keyword search over every column with the country
  // and glossary expansions, the location's country match, an object-only
  // field and the names.
  it.each([
    ['trade', 'keyword', 180],
    ['Istanbul', 'location', 203],
    ['silk', 'material', 46],
    ['portrait', 'name', 43],
    ['Tunis', 'keyword', 221],
    ['ottoman', 'keyword', 411],
  ])('finds legacy\'s count for "%s" in %s (%i)', async (q, field, count) => {
    const { app, host } = await mountSite(config, messages, `#/database/results?lang=en&q=${encodeURIComponent(q)}&field=${field}`)
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-pcr__heading')?.textContent).toContain(`| ${count} records`), { timeout: 30000 })
    app.unmount()
  }, 60000)

  // Legacy's database_results.php: a word naming a country, in Location,
  // finds that country's records (legacy's country match); the heading
  // counts them, as "Results of your search | N records"; twelve a page, each
  // its name and its place with the country's name.
  it('renders database results for a country name typed into the Location field', async () => {
    const [items] = await loadEntities(['items'])
    const countryId = 'ita'
    const countryName = countryTexts[countryId]?.name
    expect(countryName, 'fixture: Italy has an English name').toBeTruthy()
    const visibleItalyItems = items.filter((i) => i.display_status !== 'N' && i.country_id === countryId)
    expect(visibleItalyItems.length, 'fixture: Italy has visible items').toBeGreaterThan(12)

    const { app, host } = await mountSite(config, messages,
      `#/database/results?lang=en&q=${encodeURIComponent(countryName)}&field=location`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-list__cell')).not.toBeNull(), { timeout: 30000 })

    const heading = host.querySelector('.mwnf-standalone-pcr__heading').textContent
    expect(heading).toMatch(/^Results of your search \| \d+\u00a0records$/)
    // A place named after the country ("Italy Street") counts too: a floor.
    expect(Number(heading.match(/\| (\d+)/)[1])).toBeGreaterThanOrEqual(visibleItalyItems.length)
    const cells = host.querySelectorAll('.mwnf-standalone-list__cell')
    expect(cells.length).toBe(12)
    // The country's records come first: the country match adds to their relevance.
    expect(cells[0].textContent).toContain(`, ${countryName}`)
    expect(host.querySelector('.mwnf-standalone-refine')).not.toBeNull()

    app.unmount()
  }, 60000)

  // The refine band ANDs a fourth keyword onto the three the entrance wrote —
  // asserted here narrowing a country's items down to the one whose name
  // carries a word found nowhere else.
  it('narrows the database results with the refine band\'s fourth keyword', async () => {
    const [items] = await loadEntities(['items'])
    const fixture = items.find((i) => i.display_status !== 'N' && /worthy/i.test(itemTexts[i.id]?.name ?? ''))
    expect(fixture, 'fixture: a visible item with a distinctive name word').not.toBeNull()
    const expectedName = itemTexts[fixture.id].name.replace(/[*_]/g, '')

    const { app, host } = await mountSite(config, messages,
      `#/database/results?lang=en&q=${encodeURIComponent(countryTexts[fixture.country_id].name)}&field=location&q4=worthy&field4=name&op4=AND`,
    )
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-list__cell')).not.toBeNull(), { timeout: 30000 })

    expect(host.querySelector('.mwnf-standalone-pcr__heading').textContent).toContain('| 1\u00a0records')
    expect(host.querySelectorAll('.mwnf-standalone-list__cell').length).toBe(1)
    expect(host.querySelector('.mwnf-standalone-list__records').textContent).toContain(expectedName)

    app.unmount()
  }, 60000)

  // Legacy's pc_entrance.php: "Sort by" and its five lists (the countries the
  // records carry, the themes, the partners, legacy's periods), "About" with
  // legacy's text; a country opens the results.
  it("renders the Collections entrance as legacy's pc_entrance.php", async () => {
    const { app, host, router } = await mountSite(config, messages, '#/permanent-collection?lang=en')
    await vi.waitFor(() => expect(host.querySelector('.mwnf-standalone-pc')).not.toBeNull(), { timeout: 20000 })
    expect([...host.querySelectorAll('.mwnf-standalone-pc__heading')].map((h) => h.textContent)).toEqual(['Sort by', 'About'])
    const selects = host.querySelectorAll('.mwnf-standalone-pc select')
    expect([...selects].map((s) => s.options[0].textContent)).toEqual(['Country', 'Theme', 'Partners', 'Start Date', 'End Date'])
    await vi.waitFor(() => expect([...selects[0].options].map((o) => o.textContent)).toContain('Portugal'), { timeout: 20000 })
    expect([...selects[3].options].map((o) => o.textContent).slice(1, 3)).toEqual(['Before 1800', '1800'])
    expect(host.querySelector('.mwnf-standalone-pc__about').textContent).toContain('offers two ways to explore the items')
    selects[0].value = 'prt'
    selects[0].dispatchEvent(new window.Event('change'))
    await vi.waitFor(() => expect(router.currentRoute.value.name).toBe('permanent-collection-results'), { timeout: 20000 })
    expect(router.currentRoute.value.query.country).toBe('prt')
    app.unmount()
  }, 30000)

  it('declares every route by name, and leaves the catch-all to the router', () => {
    expect(checkRoutes(config, {
      names: [
        'home', 'about', 'about-team', 'sponsors', 'sponsors-local', 'permanent-collection', 'permanent-collection-results', 'database',
        'database-results', 'timeline', 'timeline-results', 'timeline-gallery', 'partners', 'partners-results',
        'partner', 'exhibitions', 'exhibition', 'exhibition-introduction',
        'exhibition-further-reading', 'exhibition-theme', 'exhibition-chapter',
        'historical-background', 'historical-profiles', 'historical-profile', 'item', 'item-timeline', 'partner-items',
      ],
      legacyPaths: ['/historical-background/:recordId'],
    })).toEqual([])
  })

  it('declares the entities every route reads', () => {
    // A view that renders records against `null` is the failure this prevents:
    // the router loads what a route names before the view is created.
    for (const route of config.extraViews) {
      expect(Array.isArray(route.meta?.entities), route.name).toBe(true)
    }
    expect(config.extraViews.find((r) => r.name === 'item').meta.entities).toContain('items')
  })

  it('declares the section every route belongs to', () => {
    // The shell highlights the current menu entry off `meta.section`
    // (viewer-core's `useSection`) rather than deriving it from the path, so
    // a route without one would silently light up no entry at all.
    expect(checkSectionMeta(config)).toEqual([])
  })

  it('keeps the old country-profile addresses working', () => {
    // Those links were handed out before the section was renamed. A legacy
    // route resolves one onto the canonical route rather than 404ing; testing
    // `resolve` directly avoids driving a second router over the same hash.
    const legacy = config.legacyRoutes.find(
      (r) => r.path === '/historical-background/:recordId',
    )
    expect(legacy).toBeDefined()
    expect(legacy.resolve({ recordId: 'abc' })).toEqual({
      name: 'historical-profile',
      params: { recordId: 'abc' },
    })
  })

  // The record lookups are viewer-core's shared indexes now, and a Map is not
  // an object: `byId(...)[id]` reads as undefined rather than failing, so a
  // page would simply render nothing. This is where that shows.
  it('resolves a record through the shared index', async () => {
    const { loadEntities } = await import('@museumwnf/viewer-core')
    const { itemById } = useData()
    const [items] = await loadEntities(['items'])
    expect(itemById.value).toBeInstanceOf(Map)
    expect(itemById.value.get(items[0].id)).toBe(items[0])
  }, 20000)

  it('offers only what the site declares and the package can serve', () => {
    // This site narrows the package's declared set to its own list, which is
    // the point of languages.js: a language whose item sheets would all read
    // English is worse than no switcher at all. The check is given the same
    // list the config gives offeredLanguages(), so it holds the site to the
    // rule it applies rather than to the package's wider declaration.
    expect(checkOfferedLanguages(config, { declared: OFFERED_LANGUAGES })).toEqual([])
    for (const code of config.languages) {
      expect(OFFERED_LANGUAGES).toContain(code)
    }
    expect(config.languages).toContain('en')
    const switcher = config.navigation.languages
    expect(switcher.map((l) => l.code)).toEqual(config.languages)
    expect(switcher.every((l) => Boolean(l.label))).toBe(true)
  })

  it('publishes no generic entity pages', () => {
    // Every page is a hand-built view. Leaving `entities` at the package
    // default would additionally publish one list and one detail page per
    // exported entity — routes the legacy site never had, exposing the data
    // package's shape (collections, timelines) rather than the site's.
    expect(config.features.entities).toEqual([])
  })

  // The chrome is now two layers, and either one failing is silent: a missing
  // entry renders as its own name rather than as an error. These assert the
  // rendered page, not the files, so a bundle that installs but never reaches
  // the components fails here too.
  it('renders the shared texts and its own over them', async () => {
    const { app, host } = await mountSite(config, messages)

    const text = host.textContent
    // From viewer-i18n: the layout's skip link.
    expect(text).toContain('Skip to content')
    // From locales/en.json: the banner's words, a menu entry, the footer.
    expect(text).toContain('Sharing History')
    expect(text).toContain('Collections')
    expect(text).toContain('Museum With No Frontiers')
    // Nothing rendered as a bare entry name, which is what a missing text
    // looks like — there is no exception to throw for one. Every namespace
    // the pages render, not just this site's own: a raw shared key (record,
    // sheet, timeline, partner, catalogue, exhibition — this site's product
    // section) otherwise passes the check unseen.
    expect(checkTextsRendered(host, {
      namespaces: ['sharinghistory', 'core', 'layout', 'catalogue', 'record', 'sheet', 'timeline', 'partner', 'exhibition'],
    })).toEqual([])

    app.unmount()
  }, 20000)
})
