# ergokb
A custom ergo keyboard, fully designed by myself


## design
I had always taken pride in my typing speed. I felt like I can comfortably navigate a computer with the keyboard, and I have been recently growing these skills with KDE Plasma as my DE and vim as my text editor. I had the realization that if I continue typing for the rest of my life, I'd want to make sure I take care of my hands. 

Therefore, I started looking into more ergonomic keyboards. There are plenty of off-the-shelf models--the Sofle, Aurora Corne, and Iris all looked like good options. However, I am a stickler when it comes to price--the absolute worst outcome for me would be buying an expensive off-the-shelf keyboard and it not being a good-fit for my hands that lie on the smaller side. In truth, these keyboards were difficult to vet. With some more research, I came across the [Caldera](https://github.com/christianselig/caldera-keyboard), an open-source keyboard build made by a hobbyist on [YouTube](https://www.youtube.com/watch?v=7UXsD7nSfDY). Aside from the clickbait video title, it was an insightful watch, and it got me interested in learning PCB design. With the price and uncertainties of an off-the-shelf keyboard, I figured I'd rather design my own and put my engineering degree to good use. 


## layout iteration pipeline

In order to test the keyboard geometry custom to my hands, I used Claude Code to build out a pipline to print out the left and right half of the design specified in `ergogen/config.yaml`. After 8 iterations, I landed on a 6-column Colstag split-keyboard with a 4-key thumb cluster. I had to play around with the orientation to ensure everything fits within my reach. This will allow me to map a QWERTY layout as a backup to trying out a more modern and ergonomic layout such as [Gallium](https://layouts.wiki/layouts/2023/gallium/#gallium-colstag).



### pipeline setup guide

```sh
npm --prefix scripts install   # once: ergogen 4.1.0 + pdfkit, pinned (Node tooling lives in scripts/)
```

1. **Edit** `ergogen/config.yaml`. The stagger, splay, and rotation knobs are in its `units:` block.
2. **Visualize**: paste it into [ergogen.xyz](https://ergogen.xyz), or run `npm --prefix scripts run build` for DXFs and the KiCad boards in `output/ergogen/`.
3. **Print sheet**: `npm --prefix scripts run pdf` writes `output/print/ergokb-layout.pdf` (page 1 = left half, page 2 = right, 1:1 scale).
   - Legends come from `keymap.yaml`. Finger rows are written in desk order, left to right; thumbs are keyed by role (`home`, `curl`, `palm`, `extra`).
   - `npm --prefix scripts run pdf -- --layers gallium,qwerty,nav`: the first layer gets the big legend and the others go in the corners (up to 4 layers).
   - `npm --prefix scripts run pdf -- --set ring_stagger=0.5cy --out try.pdf` overrides a tuning knob for one print.
   - `npm --prefix scripts run pdf -- --paper a4`
4. **Print** at 100% / "Actual size" (not "Fit to page"). Check that the 100 mm bar measures 100 mm, then cut along the dashed line.
   The footer records the git commit and every tuning value, so you can tell old prints apart.
