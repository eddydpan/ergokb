// 2x10 pin header, 1.27 mm pitch, through-hole, vertical: J1, the main board <-> daughterboard
// interface. Pads copy KiCad's stock Connector_PinHeader_1.27mm:PinHeader_2x10_P1.27mm_Vertical
// and the footprint keeps that name, so "Update PCB from Schematic" (re-link by reference)
// treats it as the same footprint. Through-hole pads exist on both faces, which is what a reversible
// board needs: the header is soldered in from the back (left half) or the front (right half).
//
// Origin = pin 1, like the stock footprint. Odd pins at x = 0, even pins at x = 1.27, rows 1.27 apart.
// Nets: P1 ... P20. Pinout: NOTES.md (2026-11-10, orientation-proof 2x10).

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
      const x = n % 2 ? 0 : 1.27
      const y = Math.round(Math.floor((n - 1) / 2) * 1.27 * 1000) / 1000
      const shape = n === 1 ? 'rect' : 'circle'
      pads += `
    (pad "${n}" thru_hole ${shape} (at ${x} ${y} ${p.r}) (size 1 1) (drill 0.65) (layers "*.Cu" "*.Mask") (remove_unused_layers no) ${p['P' + n].str})`
    }
    const outline = side => `
    (fp_line (start -1.18 -0.81) (end 0 -0.81) (layer "${side}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start -1.18 -0.81) (end -1.18 0) (layer "${side}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_rect (start -1.57 -1.14) (end 2.84 12.57) (layer "${side}.CrtYd") (stroke (width 0.05) (type solid)) (fill none))
    (fp_rect (start -1.07 -0.635) (end 2.34 12.065) (layer "${side}.Fab") (stroke (width 0.1) (type solid)) (fill none))`
    return `
  (footprint "Connector_PinHeader_1.27mm:PinHeader_2x10_P1.27mm_Vertical"
    (layer "F.Cu")
    ${p.at}
    (property "Reference" "${p.ref}" (at 0.635 -2.2 ${p.r}) (layer "F.SilkS")
      (effects (font (size 1 1) (thickness 0.15))))
    (fp_text user "${p.ref}" (at 0.635 -2.2 ${p.r}) (layer "B.SilkS")
      (effects (font (size 1 1) (thickness 0.15)) (justify mirror)))
    (attr through_hole)
    ${outline('F')}
    ${outline('B')}
    ${pads}
  )
  `
  }
}
