import { languageLabels, mwnfLinks, offeredLanguages, sectionMeta, useDataPackage } from '@museumwnf/viewer-core'
import SiteShell from './SiteShell.vue'
import { OFFERED_LANGUAGES } from './languages.js'
import { exhibitionTiles, historicalProfileLinks } from './composables/menu.js'

// The chrome is legacy's own pictures, kept in this repository under
// theme/assets/ (decision D7; theme/assets/SOURCES.json names where each one
// was taken from), handed to the layout as one map that Vite builds and
// fingerprints. The config below names a file by its path under theme/assets/.
const chrome = import.meta.glob('../theme/assets/**/*.{jpg,jpeg,png,gif,svg}', {
  eager: true, query: '?url', import: 'default',
})

// The whole declaration of this website. Before it mounts, the website reads
// nothing from its package but the manifest: the languages it offers, their
// labels and its name come from `manifest.site`, and every record is loaded
// by the route that reads it.

const { manifest } = useDataPackage()

// What this site chooses to offer (languages.js), kept where the package
// declares the language for the site AND the item translations actually carry
// it. A record may carry more than the site offers — the item sheet's own
// switcher reads those, without touching the site language.
const languages = offeredLanguages({ declared: OFFERED_LANGUAGES })

// Every route says which section it belongs to, and the shell reads that
// (viewer-core's `useSection`) for the active menu entry rather than
// deriving it from the path. Every page loads the collections and the
// countries: the menu's Historical Profiles drop-down names each country
// with a profile, on every page, as legacy's did.
const meta = sectionMeta(['collections', 'countries'])

export default {
  // The dataset package this website renders. Must match the alias in
  // vite.config.js and the dependency in package.json.
  datasetPackage: '@museumwnf/sharinghistory-data',

  siteName: manifest.site?.names?.en ?? 'Sharing History',

  // The absolute origin this build is deployed at (base path included, no
  // trailing slash) — the GitHub Pages address until the domain is decided,
  // matching the base path vite.config.js's BASE_PATH sets. Read by
  // sourceUrl() for the sheet's citation permalink; changes with the domain.
  site: { origin: 'https://museumwithnofrontiers.github.io/sharinghistory' },

  // Every page is a website-specific view (below) reimplementing the legacy
  // site's own pages. The generic entity list/detail pages viewer-core can
  // auto-generate are switched off: they publish the data package's shape
  // rather than the site's, and the two disagree — an exhibition is a
  // Collection here, and the legacy site never had a "collections" index.
  features: {
    entities: [],
  },

  languages,

  // viewer-layout's standalone family shell, around this website's own
  // cooperation band and footer (src/SiteShell.vue): legacy Sharing
  // History's chrome (shTemplates/, includes/header_bottom.php), read from
  // `standalone` below. Every text is an entry of locales/, extracted from
  // legacy by inventory-app's `scripts/site-i18n` (`extract:standalone`).
  shell: SiteShell,

  chrome,

  standalone: {
    // The logo links to the MWNF portal, as legacy's did.
    logo: {
      src: 'logos/logo_sh_en.png',
      alt: 'sharinghistory.identity.pageTitle',
      href: mwnfLinks.portal,
      print: 'logos/logo_print.gif',
    },
    heading: 'sharinghistory.identity.heading',
    subheading: 'sharinghistory.identity.subheading',
    headerLinks: [
      { label: 'sharinghistory.nav.portal', href: mwnfLinks.portal },
      { label: 'sharinghistory.nav.home', to: { name: 'home' }, on: 'inner' },
    ],
    // The home page's picture with its two lines over it (bannerText.php);
    // every other page's band.
    banner: {
      home: 'banners/banner.jpg',
      inner: 'banners/banner_inside.jpg',
      homeTitle: 'sharinghistory.identity.heading',
      homeText: 'sharinghistory.identity.subheading',
    },
    // libs/config.inc.php offers English only: no switcher.
    languages: false,
    // The home page: the exhibitions, each over its own picture, under
    // legacy's caption (shTemplates/exhibitionListImg.php).
    home: {
      tiles: { caption: 'sharinghistory.home.exhibitionsCaption', items: exhibitionTiles },
    },
  },

  // The menu, in legacy's order (shTemplates/menuSH.php), with its two
  // drop-downs: About (The Project, Historical Background) and Historical
  // Profiles (each country with a profile). My Collection leaves for the
  // portal, as legacy's did. It sits under the home page's picture, and
  // above every other page's band.
  navigation: {
    languages: languageLabels(languages),
    links: [
      {
        section: 'about',
        label: 'sharinghistory.nav.introduction',
        to: { name: 'about' },
        children: [
          { label: 'sharinghistory.nav.aboutProject', to: { name: 'about' } },
          { label: 'sharinghistory.nav.historicalBackground', to: { name: 'historical-background' } },
        ],
      },
      { section: 'exhibitions', label: 'sharinghistory.nav.exhibitions', to: { name: 'exhibitions' } },
      { section: 'permanent-collection', label: 'sharinghistory.nav.permanentCollection', to: { name: 'permanent-collection' } },
      { section: 'database', label: 'sharinghistory.nav.database', to: { name: 'database' } },
      { section: 'timeline', label: 'sharinghistory.nav.timeline', to: { name: 'timeline' } },
      { section: 'historical-profiles', label: 'sharinghistory.nav.historicalProfiles', to: { name: 'historical-profiles' }, children: historicalProfileLinks },
      { section: 'partners', label: 'sharinghistory.nav.partners', to: { name: 'partners' } },
      { label: 'sharinghistory.nav.myCollection', href: mwnfLinks.myCollection, external: true },
    ],
    // Legacy's red menu bar sits under the header on every page, the home
    // page's picture included (index.php: `links`, then `banner`).
    placement: 'before-banner',
    // The title on each section's band (each page's <h2><span>).
    sectionTitles: {
      about: 'sharinghistory.about.bannerTitle',
      sponsors: 'sharinghistory.sponsors.bannerTitle',
      'permanent-collection': 'sharinghistory.section.permanentCollection',
      database: 'sharinghistory.section.database',
      timeline: 'sharinghistory.nav.timeline',
      partners: 'sharinghistory.section.partners',
      'historical-background': 'sharinghistory.nav.historicalBackground',
      'historical-profiles': 'sharinghistory.section.historicalBackground',
    },
    // The footer is legacy's own (SiteFooter.vue, in the shell's footer slot).
  },

  // The route map: every route named, kebab-case sections, and the page and
  // every filter in the query. Each route declares the entities its view
  // reads, so the router loads them before the view is created and no page
  // renders against records that are not there yet.
  //
  // The 'home' name replaces viewer-core's generic home route. Exhibitions are
  // three levels deep here — exhibition → theme → chapter — which is what
  // separates this site from Islamic Art and Baroque Art, and each level is
  // its own page in legacy.
  extraViews: [
    {
      path: '/',
      name: 'home',
      component: () => import('@museumwnf/viewer-layout/standalone').then((family) => family.StandaloneHome),
      meta: meta('home'),
    },
    {
      // Legacy's about.php and about_team.php. The Chronology beside them
      // (about_chronology_list.php) is inventory data, a timeline the
      // inventory imports (Pascal, 2026-10-20): its page follows once the
      // data package carries it.
      path: '/about',
      name: 'about',
      component: () => import('./views/AboutProject.vue'),
      meta: meta('about', 'items'),
    },
    {
      path: '/about/team',
      name: 'about-team',
      component: () => import('./views/AboutTeam.vue'),
      meta: meta('about'),
    },
    {
      // Legacy's sponsor_detail.php and sponsor_detail_local.php, reached
      // from the cooperation band's "Other sponsors".
      path: '/sponsors',
      name: 'sponsors',
      component: () => import('./views/SponsorsPage.vue'),
      props: { kind: 'international' },
      meta: meta('sponsors', 'partners'),
    },
    {
      path: '/sponsors/local',
      name: 'sponsors-local',
      component: () => import('./views/SponsorsPage.vue'),
      props: { kind: 'local' },
      meta: meta('sponsors', 'partners', 'countries'),
    },
    {
      path: '/permanent-collection',
      name: 'permanent-collection',
      component: () => import('./views/PermanentCollectionSearch.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'partners', 'collections'),
    },
    {
      path: '/permanent-collection/results',
      name: 'permanent-collection-results',
      component: () => import('./views/PermanentCollectionResults.vue'),
      meta: meta('permanent-collection', 'items', 'countries', 'partners', 'collections'),
    },
    {
      path: '/database',
      name: 'database',
      component: () => import('./views/DatabaseSearch.vue'),
      meta: meta('database'),
    },
    {
      path: '/database/results',
      name: 'database-results',
      component: () => import('./views/DatabaseResults.vue'),
      meta: meta('database', 'items', 'countries'),
    },
    {
      path: '/timeline',
      name: 'timeline',
      component: () => import('./views/TimelineEntrance.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events', 'countries', 'collections'),
    },
    {
      path: '/timeline/results',
      name: 'timeline-results',
      component: () => import('./views/TimelineResults.vue'),
      meta: meta('timeline', 'timelines', 'timeline_events', 'countries', 'collections', 'items'),
    },
    {
      // Decision D1: the legacy hcr_gallery.php gallery of Permanent
      // Collection objects for one country and period, reached from the
      // timeline results' "See gallery" cross-link.
      path: '/timeline/gallery',
      name: 'timeline-gallery',
      component: () => import('./views/TimelineGallery.vue'),
      meta: meta('timeline', 'items', 'countries'),
    },
    {
      path: '/partners',
      name: 'partners',
      component: () => import('./views/PartnersEntrance.vue'),
      meta: meta('partners'),
    },
    {
      path: '/partners/results',
      name: 'partners-results',
      component: () => import('./views/PartnersResults.vue'),
      meta: meta('partners', 'partners', 'countries'),
    },
    {
      path: '/partner/:id',
      name: 'partner',
      component: () => import('./views/PartnerDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      meta: meta('partners', 'partners', 'items', 'countries'),
    },
    {
      path: '/exhibitions',
      name: 'exhibitions',
      component: () => import('./views/ExhibitionsEntrance.vue'),
      meta: meta('exhibitions', 'collections'),
    },
    // Each exhibition is a website of its own now (src/minisites.json): the
    // addresses this site gave its pages lead there.
    {
      path: '/exhibitions/:exhibitionId',
      name: 'exhibition',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: true,
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/introduction',
      name: 'exhibition-introduction',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: (route) => ({ exhibitionId: route.params.exhibitionId, page: 'introduction' }),
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/further-reading',
      name: 'exhibition-further-reading',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: (route) => ({ exhibitionId: route.params.exhibitionId, page: 'further-reading' }),
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId',
      name: 'exhibition-theme',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: true,
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/exhibitions/:exhibitionId/theme/:themeId/chapter/:chapterId',
      name: 'exhibition-chapter',
      component: () => import('./views/ExhibitionMoved.vue'),
      props: true,
      meta: meta('exhibitions', 'collections'),
    },
    {
      path: '/historical-background',
      name: 'historical-background',
      component: () => import('./views/HistoricalBackground.vue'),
      meta: meta('historical-background', 'collections', 'countries'),
    },
    {
      path: '/historical-profiles',
      name: 'historical-profiles',
      component: () => import('./views/HistoricalProfiles.vue'),
      meta: meta('historical-profiles', 'collections', 'countries'),
    },
    {
      // `:pageId` optional: a bare record address (and a bookmarked
      // `?page=N` one, legacy's own query pagination) resolves onto the
      // record's first page's own explicit address —
      // HistoricalBackgroundCountry.vue does that canonicalisation, once,
      // rather than the route itself, which cannot read the collection tree
      // to know which page is first.
      path: '/historical-profiles/:recordId/:pageId?',
      name: 'historical-profile',
      component: () => import('./views/HistoricalBackgroundCountry.vue'),
      props: (route) => ({
        recordId: decodeURIComponent(route.params.recordId),
        pageId: route.params.pageId ? decodeURIComponent(route.params.pageId) : null,
      }),
      meta: meta('historical-profiles', 'collections', 'items', 'countries'),
    },
    {
      path: '/item/:id',
      name: 'item',
      component: () => import('./views/ItemDetail.vue'),
      props: (route) => ({ id: decodeURIComponent(route.params.id) }),
      // Reached from the permanent collection, the timeline and exhibitions as
      // well as the database, but the nav's own generic search over items is
      // Database, so a record opened from any of those still highlights it.
      meta: meta('database', 'items', 'partners', 'countries', 'collections'),
    },
  ],

  // Country profiles were published under /historical-background/:id before
  // the profiles got a section of their own. Those addresses are already
  // handed out, so each one still resolves — onto the canonical route.
  legacyRoutes: [
    {
      path: '/historical-background/:recordId',
      resolve: (params) => ({
        name: 'historical-profile',
        params: { recordId: params.recordId },
      }),
    },
  ],
}
