// SOD-123 diode for a REVERSIBLE board, KiCad 8 format.
//
// Why not ceoloide's `diode_tht_sod123` with `reversible: true`? That one stacks the front and back
// pads at the same spot. On a reversible board the front-side parts must sit at the MIRROR image
// (about the key's vertical axis) of the back-side parts, because the right half is the same board
// flipped over: its socket, LED and diode end up mirrored. Place this footprint at the KEY CENTRE
// (no `adjust.shift`) and give the back-side position with `offset` / `angle`:
//   back  (B) copy: at offset,                 rotated angle      -> used by the LEFT half
//   front (F) copy: at offset mirrored in x,   rotated 180 - angle -> used by the RIGHT half
// Populate only one copy per half. Both copies carry the same nets (pads "1" and "2" repeat).
//
// Nets:
//    from: pad 2, anode (the switch side)
//    to:   pad 1, cathode (the row)
// Params:
//    offset: [x, y] in mm from the key centre, ergogen convention (x right, y UP)
//    angle:  degrees, counter-clockwise, of the back copy (0 = cathode pointing left)

module.exports = {
  params: {
    designator: 'D',
    offset: [-6.8, -4.5],
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
      const [k1, k2] = pt(cx, cy, a, -1.65, 0), [a1, a2] = pt(cx, cy, a, 1.65, 0)
      const [tx, ty] = pt(cx, cy, a, 0, side === 'B' ? -1.5 : 1.5)   // beside the part, along it
      return `
    (fp_text user "${p.ref}" (at ${tx} ${ty} ${f(p.r + a)}) (layer "${side}.SilkS")
      (effects (font (size 0.8 0.8) (thickness 0.12))${side === 'B' ? ' (justify mirror)' : ''}))
    ${L(-0.35, -0.55, -0.35, 0.55, 'SilkS', 0.12)}
    ${L(-0.35, 0, 0.25, -0.4, 'SilkS', 0.1)}
    ${L(0.25, -0.4, 0.25, 0.4, 'SilkS', 0.1)}
    ${L(0.25, 0.4, -0.35, 0, 'SilkS', 0.1)}
    ${L(-2.35, -1.05, 2.35, -1.05, 'CrtYd', 0.05)}
    ${L(2.35, -1.05, 2.35, 1.05, 'CrtYd', 0.05)}
    ${L(2.35, 1.05, -2.35, 1.05, 'CrtYd', 0.05)}
    ${L(-2.35, 1.05, -2.35, -1.05, 'CrtYd', 0.05)}
    (pad "1" smd rect (at ${k1} ${k2} ${f(p.r + a)}) (size 0.9 1.2) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") ${p.to.str})
    (pad "2" smd rect (at ${a1} ${a2} ${f(p.r + a)}) (size 0.9 1.2) (layers "${side}.Cu" "${side}.Paste" "${side}.Mask") ${p.from.str})`
    }
    return `
  (footprint "ergokb:D_SOD-123_mirrored"
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
