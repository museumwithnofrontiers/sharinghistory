import { describe, expect, it } from 'vitest'
import { itemSheetSpec } from '../src/composables/sheet.js'

// The item sheet's own rows, over a hand-built record and translation: the
// fields the legacy-parity story (inventory-app#2233) added to the package —
// the free-text Period / Dynasty line and the rights line — and the author's
// life data, read the way legacy `database_item.php` printed them.

const object = { id: 'o1', type: 'object', artist_names: ['W. A. Matthäus'] }
const monument = { id: 'm1', type: 'monument' }

const row = (list, key) => list.find((f) => f.key === key)
const fieldsOf = (record) => itemSheetSpec.fields({ record })
const sectionsOf = (record) => itemSheetSpec.sections({ record })

describe('item sheet spec', () => {
  it("prints an object's free-text Period / Dynasty line after its dimensions, without its ending period", () => {
    const keys = fieldsOf(object).map((f) => f.key)
    expect(keys.indexOf('dynasty')).toBe(keys.indexOf('dimensions') + 1)
    const field = row(fieldsOf(object), 'dynasty')
    expect(field.label).toBe('sheet.field.periodDynasty')
    expect(field.value({ record: object, text: { dynasty: 'Ottoman period.' } })).toBe('Ottoman period')
    expect(field.value({ record: object, text: {} })).toBe('')
  })

  it("prints a monument's Period / Dynasty after its description", () => {
    const keys = sectionsOf(monument).map((s) => s.key)
    expect(keys.indexOf('dynasty')).toBe(keys.indexOf('description') + 1)
    expect(row(sectionsOf(monument), 'dynasty').value({ record: monument, text: { dynasty: 'Habsburg' } })).toBe('Habsburg')
  })

  it("joins the author's life data as legacy did", () => {
    const field = row(fieldsOf(object), 'author')
    const text = {
      artist: 'Wolffgang Andreas Matthäus',
      artist_birthdate: '1660', artist_birthplace: 'Chemnitz', artist_deathdate: '1736', artist_deathplace: 'Augsbourg',
    }
    expect(field.value({ record: object, text })).toBe('Wolffgang Andreas Matthäus (1660, Chemnitz-1736, Augsbourg)')
    expect(field.value({ record: object, text: {} })).toBe('W. A. Matthäus')
  })

  it('closes both sheets with the rights line', () => {
    for (const record of [object, monument]) {
      expect(sectionsOf(record).at(-1)).toMatchObject({ key: 'copyright', label: 'sheet.field.copyrightInformation', value: 'copyright' })
    }
  })
})

describe('the institution lines', () => {
  const object = { id: 'o1', type: 'object' }
  const monument = { id: 'm1', type: 'monument' }

  it("prints an object's holding institution in English and in its own language, as legacy did", () => {
    const text = { holder: 'National Museum of Anthropology', holding_institution_org: 'Museo Nacional de Antropología' }
    expect(row(fieldsOf(object), 'holder').value({ record: object, text })).toBe('National Museum of Anthropology')
    expect(row(fieldsOf(object), 'holdingInstitutionOriginal').value).toBe('holding_institution_org')
  })

  it('prints only the own-language line when legacy has no English name', () => {
    const text = { holder: 'Ministério das Finanças', holding_institution_org: 'Ministério das Finanças' }
    expect(row(fieldsOf(object), 'holder').value({ record: object, text })).toBe('')
  })

  it("prints a monument's institution and its responsible institution in its own language", () => {
    const keys = fieldsOf(monument).map((f) => f.key)
    expect(keys.slice(0, 4)).toEqual(['alsoKnownAs', 'location', 'holder', 'responsibleInstitutionOriginal'])
    const text = { holder: 'Institut national du Patrimoine', responsible_institution_org: 'Institut national du Patrimoine' }
    expect(row(fieldsOf(monument), 'holder').value({ record: monument, text })).toBe('')
  })
})
