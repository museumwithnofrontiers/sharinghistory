import { describe, expect, it } from 'vitest'
import { freetileLayout } from '../src/composables/freetile.js'

// Legacy's Freetile packing (about_chronology_txt.php), checked against the
// positions legacy's own page gave event 352's first thumbnails at 390px:
// a 332px column, tiles of 117×81, 117×90, 117×90 and 70×90.
describe('freetileLayout', () => {
  it('puts each tile where it sits highest, the leftmost of equals', () => {
    const { positions } = freetileLayout(
      [{ width: 117, height: 81 }, { width: 117, height: 90 }, { width: 117, height: 90 }, { width: 70, height: 90 }],
      332,
    )
    expect(positions).toEqual([
      { left: 0, top: 0 },
      { left: 117, top: 0 },
      { left: 0, top: 81 },
      { left: 234, top: 0 },
    ])
  })

  it('is as high as its highest stack', () => {
    expect(freetileLayout([{ width: 100, height: 50 }, { width: 100, height: 30 }], 150).height).toBe(80)
  })
})
