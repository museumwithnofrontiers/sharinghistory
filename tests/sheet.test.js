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
