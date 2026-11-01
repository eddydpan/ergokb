#!/usr/bin/env node
// Render the ergogen layout as a 1:1 printable PDF: one page per half,
// with keymap legends on each keycap.
//
//   npm --prefix scripts run pdf                                  # qwerty + gallium, letter
//   npm --prefix scripts run pdf -- --layers gallium,qwerty,nav   # first layer = big legend
//   npm --prefix scripts run pdf -- --paper a4 --out somewhere.pdf
//   npm --prefix scripts run pdf -- --set ring_stagger=0.5cy --set thumb_home_y=-22 --out try.pdf
//                                                # override ergogen units for one print

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { parseArgs } from 'node:util'
import ergogen from 'ergogen'
import yaml from 'js-yaml'
import PDFDocument from 'pdfkit'

// npm runs this from scripts/; keep every path relative to the repo root.
process.chdir(path.resolve(import.meta.dirname, '..'))

const { values: args } = parseArgs({
    options: {
        config: { type: 'string', default: 'ergogen/config.yaml' },
        keymap: { type: 'string', default: 'keymap.yaml' },
        layers: { type: 'string', default: 'qwerty,gallium' },
        paper: { type: 'string', default: 'letter' },
        out: { type: 'string', default: 'output/print/ergokb-layout.pdf' },
        set: { type: 'string', multiple: true, default: [] },
    },
})

const PAPER = { letter: [215.9, 279.4], a4: [210, 297] }
const CUT_MARGIN = 5            // mm of paper left around the keys when cutting out
const PT = 72 / 25.4            // mm -> pt

const COLS = ['outer', 'pinky', 'ring', 'middle', 'index', 'inner']
const ROWS = ['num', 'top', 'home', 'bottom']
const THUMBS = ['home', 'curl', 'palm', 'extra']

// [position, font size (pt), color] for layer 0, 1, 2, 3
const LEGEND_STYLE = [
    ['center', 10, '#000000'],
    ['bottom-right', 6.5, '#1f5fbf'],
    ['top-left', 6.5, '#b0302a'],
    ['top-right', 6.5, '#2a7a3a'],
]

// --- inputs ---------------------------------------------------------------

const config = yaml.safeLoad(fs.readFileSync(args.config, 'utf8'))
const overrides = args.set.map(kv => {
    const [k, ...v] = kv.split('=')
    if (!(k in (config.units || {})) || !v.length) throw new Error(`--set ${kv}: expected <unit>=<value> for a unit in ${args.config}`)
    config.units[k] = v.join('=')
    return k
})
// The print only needs points; pcbs reference bundle footprints this script doesn't load.
delete config.pcbs
const results = await ergogen.process(yaml.safeDump(config), true)
const points = results.points
const KEYCAP = [results.units.cap_w ?? 17.5, results.units.cap_h ?? 16.5]
const tuning = Object.keys(config.units || {}).filter(k => !/^(mcu_|usbc_|top_margin$|pcb_close$)/.test(k)) // key geometry only

const keymap = yaml.safeLoad(fs.readFileSync(args.keymap, 'utf8'))
const layerNames = args.layers.split(',').map(s => s.trim()).filter(Boolean)
if (layerNames.length > LEGEND_STYLE.length) {
    throw new Error(`At most ${LEGEND_STYLE.length} layers fit on a keycap`)
}
for (const name of layerNames) {
    if (!keymap.layers?.[name]) throw new Error(`Layer "${name}" not found in ${args.keymap}`)
}

// Map each layer's desk-order rows onto ergogen point names.
const legendsFor = (layer) => {
    const out = {}
    const put = (list, names, where) => {
        if (!list) return
        if (list.length !== names.length) {
            throw new Error(`${where}: expected ${names.length} keys, got ${list.length}`)
        }
        list.forEach((label, i) => { out[names[i]] = label == null ? '' : String(label) })
    }
    for (const row of ROWS) {
        put(layer.left?.[row], COLS.map(c => `matrix_${c}_${row}`), `left.${row}`)
        put(layer.right?.[row], [...COLS].reverse().map(c => `mirror_matrix_${c}_${row}`), `right.${row}`)
    }
    // thumbs are keyed by role ({home: Space, ...}), not by position
    for (const [side, prefix] of [['left', ''], ['right', 'mirror_']]) {
        for (const [role, label] of Object.entries(layer[side]?.thumb || {})) {
            if (!THUMBS.includes(role)) throw new Error(`${side}.thumb.${role}: expected one of ${THUMBS.join(', ')}`)
            out[`${prefix}thumb_${role}`] = label == null ? '' : String(label)
        }
    }
    return out
}
const layers = layerNames.map(name => {
    try { return legendsFor(keymap.layers[name]) }
    catch (e) { throw new Error(`keymap layer "${name}": ${e.message}`) }
})

for (const name of Object.keys(points)) {
    if (!(name in layers[0])) console.warn(`warning: no "${layerNames[0]}" legend for point ${name}`)
}

// --- geometry -------------------------------------------------------------

const corners = (p, [w, h]) => {
    const rad = p.r * Math.PI / 180
    const c = Math.cos(rad), s = Math.sin(rad)
    return [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
        .map(([dx, dy]) => [p.x + dx * c - dy * s, p.y + dx * s + dy * c])
}

// Andrew's monotone chain
const hull = (pts) => {
    pts = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    const half = (list) => {
        const h = []
        for (const p of list) {
            while (h.length >= 2 && cross(h[h.length - 2], h[h.length - 1], p) <= 0) h.pop()
            h.push(p)
        }
        h.pop()
        return h
    }
    return [...half(pts), ...half([...pts].reverse())]
}

// --- drawing --------------------------------------------------------------

const gitInfo = () => {
    try {
        const sha = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
        const dirty = execSync(`git status --porcelain -- ${args.config}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
        return dirty ? `${sha}+uncommitted` : sha
    } catch { return 'no-git' }
}

const fmt = (v) => Number.isInteger(v) ? String(v) : v.toFixed(2)

const [paperW, paperH] = PAPER[args.paper] ?? (() => { throw new Error(`Unknown paper "${args.paper}"`) })()
const doc = new PDFDocument({ size: [paperW * PT, paperH * PT], autoFirstPage: false, margin: 0 })
fs.mkdirSync(path.dirname(args.out), { recursive: true })
doc.pipe(fs.createWriteStream(args.out))
doc.info.Title = 'ergokb layout print'

const fitText = (text, font, size, maxW) => {
    doc.font(font)
    while (size > 4 && doc.fontSize(size).widthOfString(text) > maxW) size -= 0.5
    return size
}

const drawKey = (p, mm) => {
    const [w, h] = KEYCAP.map(v => v * mm)
    doc.save()
    doc.translate(...toPage([p.x, p.y]))
    doc.rotate(-p.r) // ergogen: CCW-positive, y-up; pdfkit: CW-positive, y-down
    doc.lineWidth(0.6).strokeColor('#000').roundedRect(-w / 2, -h / 2, w, h, 1.2 * mm).stroke()

    // home-row bumps
    if (p.meta.name.endsWith('matrix_index_home') || p.meta.name.endsWith('thumb_home')) {
        doc.lineWidth(1.4).moveTo(-2.5 * mm, h / 2 - 2 * mm).lineTo(2.5 * mm, h / 2 - 2 * mm).stroke()
    }

    const pad = 1.4 * mm
    layers.forEach((legends, i) => {
        const label = legends[p.meta.name]
        if (!label) return
        if (i > 0 && label === layers[0][p.meta.name]) return // same as main legend, skip clutter
        const [pos, baseSize, color] = LEGEND_STYLE[i]
        const font = i === 0 ? 'Helvetica-Bold' : 'Helvetica'
        const maxW = (pos === 'center' ? w - 2 * pad : w / 2 - pad)
        const size = fitText(label, font, baseSize, maxW)
        const tw = doc.widthOfString(label)
        const th = size * 0.72 // cap height, roughly
        let x, y
        if (pos === 'center') { x = -tw / 2; y = -th / 2 }
        if (pos === 'bottom-right') { x = w / 2 - pad - tw; y = h / 2 - pad - th }
        if (pos === 'top-left') { x = -w / 2 + pad; y = -h / 2 + pad }
        if (pos === 'top-right') { x = w / 2 - pad - tw; y = -h / 2 + pad }
        // pdfkit places text by its ascender box; nudge so y is the cap top
        doc.fillColor(color).text(label, x, y - size * 0.2, { lineBreak: false })
    })
    doc.restore()
}

let toPage

const drawPage = (title, pts) => {
    doc.addPage()
    const mm = PT

    // fit the half into the space between header and footer
    const all = pts.flatMap(p => corners(p, KEYCAP.map(v => v + 2 * CUT_MARGIN)))
    const xs = all.map(c => c[0]), ys = all.map(c => c[1])
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
    const top = 32, bottom = paperH - 48
    if (maxX - minX > paperW - 10 || maxY - minY > bottom - top) {
        console.warn(`warning: ${title} (${fmt(maxX - minX)} x ${fmt(maxY - minY)} mm) does not fit on ${args.paper}`)
    }
    const ox = (paperW - (maxX - minX)) / 2 - minX
    const oy = top + ((bottom - top) - (maxY - minY)) / 2 + maxY
    toPage = ([x, y]) => [(ox + x) * mm, (oy - y) * mm]

    // header
    doc.fillColor('#000').font('Helvetica-Bold').fontSize(14).text(`ergokb - ${title}`, 15 * mm, 12 * mm)
    let lx = 15 * mm
    doc.fontSize(8)
    layerNames.forEach((name, i) => {
        const [pos, , color] = LEGEND_STYLE[i]
        const s = `${name} (${pos})`
        doc.font(i === 0 ? 'Helvetica-Bold' : 'Helvetica').fillColor(color).text(s, lx, 20 * mm, { lineBreak: false })
        lx += doc.widthOfString(s) + 5 * mm
    })
    doc.fillColor('#888').font('Helvetica').fontSize(8)
        .text('Cut along the dashed line. Bar = home position (index + thumb).', 15 * mm, 25 * mm, { lineBreak: false })

    // cut line
    const cut = hull(all).map(toPage)
    doc.save().lineWidth(0.5).strokeColor('#888').dash(4, { space: 3 })
    doc.polygon(...cut).stroke()
    doc.undash().restore()

    for (const p of pts) drawKey(p, mm)

    // footer: scale check + what config this print came from
    const fy = paperH - 34
    const bx = 15
    doc.lineWidth(0.8).strokeColor('#000')
    doc.moveTo(bx * mm, fy * mm).lineTo((bx + 100) * mm, fy * mm).stroke()
    for (let t = 0; t <= 100; t += 10) {
        const len = t % 50 === 0 ? 3 : 1.8
        doc.moveTo((bx + t) * mm, fy * mm).lineTo((bx + t) * mm, (fy - len) * mm).stroke()
    }
    doc.fillColor('#000').font('Helvetica').fontSize(7)
        .text('100 mm - print at 100% / "Actual size" and check this with a ruler', bx * mm, (fy + 1.5) * mm, { lineBreak: false })

    const knobs = tuning.map(k => `${overrides.includes(k) ? '*' : ''}${k}=${fmt(results.units[k])}`).join('   ')
        + (overrides.length ? '   (* = --set override)' : '')
    doc.fillColor('#555').fontSize(6.5)
        .text(`config ${gitInfo()}  |  ${new Date().toISOString().slice(0, 16).replace('T', ' ')}  |  keycap ${KEYCAP.join('x')} mm`,
            bx * mm, (fy + 7) * mm, { lineBreak: false })
        .text(knobs, bx * mm, (fy + 11) * mm, { width: (paperW - 2 * bx) * mm })
}

const left = Object.values(points).filter(p => !p.meta.mirrored)
const right = Object.values(points).filter(p => p.meta.mirrored)
drawPage('LEFT half', left)
if (right.length) drawPage('RIGHT half', right)
doc.end()
console.log(`wrote ${args.out} (${right.length ? 2 : 1} pages, layers: ${layerNames.join(', ')})`)
