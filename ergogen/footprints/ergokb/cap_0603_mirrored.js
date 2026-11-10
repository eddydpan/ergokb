// 0603 (1608 metric) capacitor for a REVERSIBLE board, KiCad 8 format. Pads match KiCad's stock
// Capacitor_SMD:C_0603_1608Metric. Used for the 100 nF decoupling cap next to each SK6812MINI-E.
//
// Why not a plain footprint with pads on both layers? That would stack the front and back
// pads at the same spot. On a reversible board the front-side parts must sit at the MIRROR image
// (about the key's vertical axis) of the back-side parts, because the right half is the same board
// flipped over: its socket, LED, diode and cap end up mirrored. Place this footprint at the KEY CENTRE
// (no `adjust.shift`) and give the back-side position with `offset` / `angle`:
//   back  (B) copy: at offset,                 rotated angle      -> used by the LEFT half
//   front (F) copy: at offset mirrored in x,   rotated 180 - angle -> used by the RIGHT half
// Populate only one copy per half. Both copies carry the same nets (pads "1" and "2" repeat).
//
// Nets:
//    from: pad 1 (+5V)
//    to:   pad 2 (GND)
// Params:
//    offset: [x, y] in mm from the key centre, ergogen convention (x right, y UP)
//    angle:  degrees, counter-clockwise, of the back copy (0 = pad 1 on the left)

module.exports = {
  params: {
    designator: 'C',
    offset: [6.8, -4.5],
    angle: 90,
    from: undefined,
    to: undefined,
  },
  body: p => {
    const ox = p.offset[0], oy = -p.offset[1]          // KiCad local frame: y points down
    const rad = a => a * Math.PI / 180
    const f = v => Math.round(v * 10000) / 10000
    // a point (u, v) of the part, rotated by `a` (CCW on screen) and moved to (cx, cy)
    const pt = (cx, cy, a, u, v) => [f(cx + u * Math.cos(rad(a)) + v * Math.sin(rad(a))),
                                     f(cy - u * Math.sin(rad(a)) + v * Math.cos(rad(a)))]
    const copy = (side, cx, cy, a) => {
      const L = (u1, v1, u2, v2, layer, w) => {
        const [x1, y1] = pt(cx, cy, a, u1, v1), [x2, y2] = pt(cx, cy, a, u2, v2)
        return `(fp_line (start ${x1} ${y1}) (end ${x2} ${y2}) (layer "${side}.${layer}") (stroke (width ${w}) (type solid)))`
      }
      const [p1x, p1y] = pt(cx, cy, a, -0.775, 0), [p2x, p2y] = pt(cx, cy, a, 0.775, 0)
      const [tx, ty] = pt(cx, cy, a, 0, side === 'B' ? -1.5 : 1.5)   // beside the part, along it
      return `
    (fp_text user "${p.ref}" (at ${tx} ${ty} ${f(p.r + a)}) (layer "${side}.SilkS")
      (effects (font (size 0.8 0.8) (thickness 0.12))${side === 'B' ? ' (justify mirror)' : ''}))
    ${L(-0.14, -0.51, 0.14, -0.51, 'SilkS', 0.12)}
    ${L(-0.14, 0.51, 0.14, 0.51, 'SilkS', 0.12)}
    ${L(-1.48, -0.73, 1.48, -0.73, 'CrtYd', 0.05)}
    ${L(1.48, -0.73, 1.48, 0.73, 'CrtYd', 0.05)}
    ${L(1.48, 0.73, -1.48, 0.73, 'CrtYd', 0.05)}
    ${L(-1.48, 0.73, -1.48, -0.73, 'CrtYd', 0.05)}
    (pad "1" smd roundrect (at ${p1x} ${p1y} ${f(p.r + a)}) (size 0.9 0.95) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.25) ${p.from.str})
    (pad "2" smd roundrect (at ${p2x} ${p2y} ${f(p.r + a)}) (size 0.9 0.95) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") (roundrect_rratio 0.25) ${p.to.str})`
    }
    return `
  (footprint "ergokb:C_0603_mirrored"
    (layer "B.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0 0 ${p.r}) (layer "B.SilkS") (hide yes)
      (effects (font (size 0.8 0.8) (thickness 0.12)) (justify mirror)))
    (attr smd)
    ${copy('B', ox, oy, p.angle)}
    ${copy('F', -ox, oy, 180 - p.angle)}
  )
  `
  }
}
