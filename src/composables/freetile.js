// Legacy's thumbnail packing on a chronology event (about_chronology_txt.php):
// Freetile.js v0.3.1 (js/randum_positionig.js) with its default score, the
// highest top. The skyline is a list of steps, { left, top }, left to right.
// Each tile, in order, takes the step where it sits highest (the leftmost of
// equals); its width covers that step and the ones under it, whose top it
// must clear; the skyline then rises under the tile.
//
//   sizes: [{ width, height }] (each tile's outer size), width: the box's
//   → { positions: [{ left, top }], height }
export function freetileLayout(sizes, width) {
  const steps = [{ left: 0, top: 0 }]
  const positions = []
  for (const tile of sizes) {
    let top = steps[0].top
    let end = 1
    while (end < steps.length && steps[end].left < tile.width) top = Math.max(top, steps[end++].top)
    let best = { start: 0, end, top }
    for (let start = 1; start < steps.length && steps[start].left + tile.width <= width; start++) {
      let tested = steps[start].top
      let next = start + 1
      while (next < steps.length && steps[next].left - steps[start].left < tile.width) tested = Math.max(tested, steps[next++].top)
      if (tested < best.top) best = { start, end: next, top: tested }
    }
    positions.push({ left: steps[best.start].left, top: best.top })
    const lastTop = steps[best.end - 1].top
    const nextLeft = steps[best.end] ? steps[best.end].left : width
    const right = steps[best.start].left + tile.width
    steps[best.start].top = best.top + tile.height
    if (right < nextLeft) steps.splice(best.start + 1, best.end - best.start - 1, { left: right, top: lastTop })
    else steps.splice(best.start + 1, best.end - best.start - 1)
  }
  return { positions, height: Math.max(...steps.map((step) => step.top)) }
}
