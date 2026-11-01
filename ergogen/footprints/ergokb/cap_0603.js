// 0603 (1608 metric) capacitor, KiCad 8 format.
// Pads match KiCad's stock Capacitor_SMD:C_0603_1608Metric.
// Used for the 100 nF decoupling cap next to each SK6812MINI-E.
//
// Nets:
//    from: pad 1
//    to: pad 2
// Params:
//    side: F or B (default B, same side as the LEDs)

module.exports = {
  params: {
    designator: 'C',
    side: 'B',
    from: undefined,
    to: undefined,
  },
  body: p => `
  (footprint "ergokb:C_0603_1608Metric"
    (layer "${p.side}.Cu")
    ${p.at}
    (property "Reference" "${p.ref}"
      (at 0 -1.43 ${p.r})
      (layer "${p.side}.SilkS")
      ${p.ref_hide}
      (effects (font (size 0.8 0.8) (thickness 0.12)))
    )
    (attr smd)
    (fp_line (start -0.14 -0.51) (end 0.14 -0.51) (layer "${p.side}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_line (start -0.14 0.51) (end 0.14 0.51) (layer "${p.side}.SilkS") (stroke (width 0.12) (type solid)))
    (fp_rect (start -1.48 -0.73) (end 1.48 0.73) (layer "${p.side}.CrtYd") (stroke (width 0.05) (type solid)) (fill none))
    (pad "1" smd roundrect (at -0.775 0 ${p.r}) (size 0.9 0.95) (layers "${p.side}.Cu" "${p.side}.Paste" "${p.side}.Mask") (roundrect_rratio 0.25) ${p.from.str})
    (pad "2" smd roundrect (at 0.775 0 ${p.r}) (size 0.9 0.95) (layers "${p.side}.Cu" "${p.side}.Paste" "${p.side}.Mask") (roundrect_rratio 0.25) ${p.to.str})
  )
  `
}
