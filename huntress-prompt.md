# HUNTRESS WARRIOR — Midjourney / DALL-E Prompt

## 🎯 Recommended primary prompt (DALL-E friendly, no version flags)

```
A cinematic, painterly portrait of a Native American Sioux huntress warrior,
stalking her prey in a crouch, intense focused gaze toward camera.

Subject: 25-year-old indigenous woman, copper-brown skin, strong cheekbones,
a single long black braid draped over one shoulder, a white painted stripe
across her left cheek and cheekbone (war paint), a thin feather tucked into
her hair behind her right ear.

Attire: traditional minimal Sioux-style — a tan deerskin strap top, a small
fringed deerskin loin wrap at the hip, leather moccasin boots laced up the
calf, copper armbands on both biceps, a single turquoise-and-copper choker,
a bone hairpipe choker at her throat. Nothing revealing or sexualized — the
loincloth is functional and small, the rest is bare arms and midriff only.

Gear: a long recurve bow slung across her back with a quiver of three
flint-tipped arrows, a hand-drawn bowstring visible, a small dreamcatcher
hanging from her belt at the hip, a rabbit-fur medicine pouch at her other
hip, a coup-stick (decorated counting stick) tucked through her belt.

Pose: low stalking crouch, right hand resting on the ground, left hand
gripping the bow handle, weight on the balls of her feet, body coiled as
if about to spring. Three-quarter view, head turned sharply to look
directly at the viewer over her right shoulder with a fierce piercing stare.

Environment: minimal — dark plum-purple mist behind her, embers floating
in the air around her head (like fireflies), one distant full moon haloed
in soft gold light at upper right, the very tip of a pine tree silhouetted
at the lower left, no other landscape detail.

Lighting: strong rim light from upper right (the moon) tracing the edge of
her braid, shoulder, arm and bow in warm gold-copper. Soft warm key light
from the lower left (candle / campfire) filling in her face and front with
amber tones. Slight dark shadow on the side facing away from the moon.

Color palette: copper, ember orange, plum purple, deerskin tan, deep
burgundy, gold leaf accents, bone white, turquoise touches. No pure red,
no pure blue, no neon.

Style: semi-realistic digital painting, in the visual style of a premium
casino slot machine character portrait — between a fantasy book cover
illustration (like Brom or Bastien Lecouffe-Deharme) and a real-cabinet
Aristocrat / IGT slot illustration. Slightly stylized but anatomically
correct. Painterly brushwork visible on close inspection, especially in
the skin and the deerskin textures. Hyper-detailed feathers, beads, and
leather tooling.

Mood: dangerous, regal, focused, the moment before a kill. Proud but
quiet, not screaming or posing dramatically.

Aspect ratio: 3:4 portrait (vertical).
```

## 🛠 DALL-E specific tweaks

If DALL-E is the target, append:
- `--style raw` (Midjourney only, ignore for DALL-E)
- For DALL-E, simplify the long description if it cuts off — DALL-E 3
  handles up to ~4000 chars but simpler is often better

## 🎬 Alternative framing: full-body version

If you want a full-body composition (cabinet centerpiece above the reels,
taking the full height of the title area), use this instead:

```
A full-body, three-quarter-view digital painting of a Native American
Sioux huntress warrior stalking through a moonlit prairie at twilight.
She is mid-stride, low and silent, one hand trailing near the ground, the
other holding a long recurve bow at the ready. She wears minimal
traditional attire — deerskin strap top, small fringed loin wrap, laced
moccasins, copper armbands, bone choker, a single feather in her braided
hair, a dreamcatcher at her hip. A quiver of flint-tipped arrows is
slung across her back. Strong rim light from a low full moon behind her
traces her silhouette in pale gold. Embers from an unseen campfire drift
through the cool plum-purple air. Distant tipis are tiny silhouettes on
the horizon. The foreground grass bends slightly in the wind. The mood
is dangerous, regal, and quiet. Color palette: copper, ember, plum,
deerskin, bone, gold leaf. Style: premium casino slot illustration,
between fantasy book cover and Aristocrat cabinet art. Painterly,
anatomically correct, hyper-detailed feathers and beadwork.
Aspect ratio: 9:16 vertical.
```

## 📐 Cabinet placement (technical)

Whichever version you generate, the image will be:
- **Head-and-shoulders**: place at the top of the cabinet, above the title
  text, ~200-280px tall on desktop, ~120-180px on mobile
- **Full-body 9:16**: place behind the entire cabinet as a vertical
  centerpiece, behind the reels, with title text overlaying her
  shoulder/face area

I recommend the **head-and-shoulders version** for the cabinet — full-body
characters behind reels compete with the symbols visually and reduce
readability of the playing field.

## ✅ After you generate

Drop the file into:
`/home/diego/rollinginthedough/client/public/huntress-warrior.png`

Then I'll:
1. Replace the 🗡️ text fallback in `CabinetTopGlass` with `<img>` src
2. Add it as the scatter symbol on the reels (replacing the sword text)
3. Wire up the Wild flame corona using this image as the symbol
4. Add the per-symbol `outline + box-shadow` glow tuned to her copper/gold
   color palette so her tile glows to match
