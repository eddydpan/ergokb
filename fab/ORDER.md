# ergokb PCB order (PCBWay)

Two separate 2-layer designs. Upload each zip as its own PCB item ("Quick-order PCB" → Add Gerber file).
Both zips are plain Gerber (Protel extensions) + Excellon drill, exported from KiCad 10 with `scripts/export_fab.sh`.

| Option on the PCBWay form | Main board | Daughterboard |
|---|---|---|
| Gerber zip | `ergokb-main-gerbers.zip` | `ergokb-daughter-gerbers.zip` |
| Size | 120.6 × 116.7 mm | 42.0 × 37.0 mm |
| Quantity | 5 | 5 |
| Layers | 2 | 2 |
| Material | FR-4, standard Tg | FR-4, standard Tg |
| Thickness | 1.6 mm | 1.6 mm |
| Min track / spacing | 6/6 mil (design: 8/10 mil) | 6/6 mil (design: 6/6 mil) |
| Min hole size | 0.3 mm | 0.3 mm |
| Solder mask | Green | Green |
| Silkscreen | White | White |
| Surface finish | HASL lead-free | HASL lead-free |
| Via process | Tenting vias | Tenting vias |
| Finished copper | 1 oz | 1 oz |
| Notes | Reversible: SMD pads on both sides, no stencil. 168 NPTH switch holes. | 8 plated slots (USB-C shells), 0.4 mm-pitch QFN, 4 M2 holes. |

**Stencil (daughterboard only):** add an SMD stencil to the daughterboard item, top side only (the paste layer
`ergokb-daughter-F_Paste.gtp` is in the same zip), non-framework, 0.10 mm thick (0.4 mm-pitch QFN).

**Shipping:** DHL. Import duty is not in PCBWay's total.
