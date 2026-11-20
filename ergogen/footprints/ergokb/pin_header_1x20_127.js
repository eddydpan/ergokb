// 1x20 pin header grid, 1.27 mm pitch, through-hole, vertical: J1, the main board <-> daughterboard
// interface (a 20-way 1.27 mm ribbon is soldered straight in; no header is fitted). Pads copy KiCad's
// stock Connector_PinHeader_1.27mm:PinHeader_1x20_P1.27mm_Vertical and the footprint keeps that name,
// so "Update PCB from Schematic" (re-link by reference) treats it as the same footprint. Silkscreen
// and courtyard are drawn on BOTH faces: on the reversible board the ribbon is soldered from the back
// (left half) or the front (right half).
//
// Origin = pin 1, like the stock footprint; pins run along +y, 1.27 apart.
// Nets: P1 ... P20. Pinout: NOTES.md (orientation-proof; a single row only ever maps k -> k or 21 - k).

module.exports = {
  params: {
    designator: 'J',
    P1: undefined, P2: undefined, P3: undefined, P4: undefined, P5: undefined,
    P6: undefined, P7: undefined, P8: undefined, P9: undefined, P10: undefined,
    P11: undefined, P12: undefined, P13: undefined, P14: undefined, P15: undefined,
    P16: undefined, P17: undefined, P18: undefined, P19: undefined, P20: undefined,
  },
  body: p => {
    let pads = ''
    for (let n = 1; n <= 20; n++) {
      const y = Math.round((n - 1) * 1.27 * 1000) / 1000
      const shape = n === 1 ? 'rect' : 'oval'
      pads += `
    (pad "${n}" thru_hole ${shape} (at 0 ${y} ${p.r}) (size 1 1) (drill 0.65) (layers "*.Cu" "*.Mask") (remove_unused_layers no) ${p['P' + n].str})`
    }
    const outline = side => `
    (fp_line (start -1.11 -0.76) (end 0 -0.76) (layer "${side}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start -1.11 -0.76) (end -1.11 0) (layer "${side}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_rect (start -1.55 -1.15) (end 1.55 25.28) (layer "${side}.CrtYd") (stroke (width 0.05) (type solid)) (fill none))
    (fp_rect (start -1.05 -0.635) (end 1.05 24.765) (layer "${side}.Fab") (stroke (width 0.1) (type solid)) (fill none))`
    return `
  (footprint "Connector_PinHeader_1.27mm:PinHeader_1x20_P1.27mm_Vertical"
    (layer "F.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at -2.2 12.065 ${p.r + 90}) (layer "F.SilkS")
      (effects (font (size 1 1) (thickness 0.15))))
    (fp_text user "${p.ref}" (at -2.2 12.065 ${p.r + 90}) (layer "B.SilkS")
      (effects (font (size 1 1) (thickness 0.15)) (justify mirror)))
    (attr through_hole)
    ${outline('F')}
    ${outline('B')}
    ${pads}
  )
  `
  }
}
