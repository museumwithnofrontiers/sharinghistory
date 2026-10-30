import { useI18n } from '@museumwnf/viewer-core'
import { exhibitionList, minisiteHref } from './exhibitions.js'
import { historicalProfileCountries, historicalProfileNodeRoute, historicalProfilesTree } from './history.js'
import { useData } from './data.js'

// The two parts of legacy's chrome that are drawn from the data rather than
// written into the page: the Historical Profiles drop-down, one country per
// profile (shTemplates/menuSH.php, `$hbcountries`), and the home page's
// exhibitions, each over its own picture (shTemplates/exhibitionListImg.php).
// Both read what the data package carries, with the names in it; nothing
// here is text of the site's own.

/** The menu's Historical Profiles drop-down: each country with a profile, by name. */
export function historicalProfileLinks() {
  const { labelOf } = useData()
  return [...historicalProfileCountries.value]
    .map((record) => ({ record, name: labelOf('countries', record.country_id) }))
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ record, name }) => ({
      text: name,
      to: historicalProfileNodeRoute(historicalProfilesTree.children(record.id)[0] ?? record),
    }))
}

// Legacy names an exhibition's home picture after its id
// (`…/exhibitions/AWE/<id>/homeImg<id>.jpg`); the site keeps them under
// theme/assets/exhibitions/ (theme/assets/SOURCES.json).
const exhibitionNumber = (exhibition) => String(exhibition.backward_compatibility ?? '').split(':').pop()

/**
 * The home page's tiles: every exhibition, its title from the package, over
 * legacy's picture, leading to the exhibition's own website (its mini-site).
 */
export function exhibitionTiles() {
  const { tr } = useData()
  const { locale } = useI18n()
  return exhibitionList.value.map((exhibition) => ({
    image: `exhibitions/homeImg${exhibitionNumber(exhibition)}.jpg`,
    text: tr('collections', exhibition.id)?.title ?? exhibition.internal_name,
    href: minisiteHref(exhibition.id, locale.value) ?? undefined,
  }))
}
