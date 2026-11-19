# Stained-glass panel — Grasshopper build

The friar panel (after the Hermitage window, [vol-8.jpg](https://hermitageindy.org/wp-content/uploads/2019/04/vol-8.jpg)),
rebuilt as a parametric construction where every lead line derives from the
structure. The hands are the one allowed exception.

- Definition: `Desktop/Hermitage world 2.gh` + `Desktop/hermitage world 2.3dm` (James saves versions).
- Target: the white sketch below the build in the .3dm (true arcs, 100 × 108.53).
- Claude works on the live canvas through `.tools/rhino-bridge` (see its README).
- Later: once the geometry is final, rebuild in Weft for the web.

## Structure (what everything hangs on)

Frame is **W × H = 100 × 108**, origin bottom-left. Golden cuts use φ' = 0.618034.

| line | height from bottom | how |
|---|---|---|
| bottom / top | 0 / 108 | frame |
| inner bottom / top | 3.72 / 104.28 | 9.74 × φ' cascade, mirrored to the top |
| | 9.74 | 25.5 − 15.76 |
| | 19.48 | 25.5 − 6.02 |
| | 25.5 | 66.75 × (1 − φ') … |
| | 33.37 | midpoint of 25.5 and 41.25 (red only) |
| | 41.25 | H × (1 − φ') |
| | 54 | H / 2 |
| | 66.75 | H × φ' — arch center height |

Verticals: x = 50 (axis), 61.8 / 80.9 (golden from the axis), 88.2, side border 3.72 / 96.28
(the side border is the top/bottom inner border, decided 10/28).
Arch bands: 61.8 → 80.9 divided into 10 (spacing 1.91), arcs centered (50, 66.75), mirrored.

## Canvas organization (10/27)

Groups left → right: INPUTS (origin, W, H, side border) · STRUCTURE horizontals ·
STRUCTURE verticals/centers/regions · ARCH BANDS · ROSETTE · CORNER ARCS ·
UPPER CLOUDS · LOWER ARCHES · LOWER CLOUDS · FRIAR · OUTPUT. PARKED holds the
old rosette prototype at the dimensioned sheet (nothing in the drawing uses it).
Within a group each output chain is one row, sliders in the left column.
Wires that cross groups are drawn faint.

- All 44 sliders are named by what they drive.
- The four referenced Rhino points (BR, BM, TR, TRb) now derive from ORIGIN + W/H/b,
  and the ten typed `-100` / `-108` vector factors read −W / −H.
  Every output matched to 1e-13 except the friar: its apex point had been
  clicked at x = 50.0159 and is now exactly 50 (friar lines moved ≤ 0.025).

## Decisions (10/28)

- **Side border = 3.72**, the same golden inner border as top and bottom (the 4.3 slider is gone).
- **H stays 108** (sacred number), though the sketch measures 108.53.
- **Drawn arch bands: 1, 4, 8, 10** (0 = innermost). Measured off the sketch as 1/4/7/9;
  James moved the outer two out (10/28) so his rosette's satellites sit in the channel
  between bands 8 and 10. Picker = the four "drawn band a–d" sliders on DRAWN BANDS.
- **Layering:** the clouds sit in front of the bands, rays, X and horizontals,
  except that the bands run through the upper clouds as in the sketch. The rosette
  sits in front of the frame's top lines and the bands.
  The friar will sit in front of everything behind him.
- **James's rosette is the drawn one** (10/28): octagon from the band 7 top and band 9,
  satellites r = band spacing (1.91), center circle from the ring picks. Smaller than the
  sketch on purpose; the point is that the satellites fit inside the arch guide lines.
  The rosette trims the frame's top lines and the bands.
- *Alternative kept, not drawn:* **Rosette v2 = the Hermitage eight-around-one.** Its bottom satellite is seated on the
  top of band 5 (slider). The ring diameter is the golden step from 41.25 to 66.75 (25.5), so
  R = 12.75 and the center sits at 100.85 (sketch: 12.8 / 100.9). Center circle and satellites use the logo's
  ratios, 125/211 and 39.3/211 of R (7.55 / 2.37; sketch 7.25 / 2.58). The ring
  ring and an axis are part of it. Group "ROSETTE v2 · logo-ratio alternative (not drawn)".

## Lead lines (10/28), group LEAD LINES

- Horizontals 54, 41.25, 25.5, 19.48 drawn full width behind the clouds. The sketch's line
  at ~38.7 was taken as 41.25 (golden).
- Upper corner rays: (88.2, 108) → band a's leg at y 41.25, plus its mirror.
  Checks against the sketch: 70.8 vs 70.7 at y 60.6.
- The X: the right diagonal (Ext#312) mirrored, from the left frame edge to band
  a's left leg.
- Trap: Grasshopper's **Trim with Region** pairs one curve with one region and
  returns a branch per region, so a curve against two clouds came back whole.
  Use **Trim with Regions** (plural) whenever a curve meets several regions.

## The three V's (10/28)

James redrew the diagonals as three V's on Layer 02 (Moenja's drawing reads them as a
symmetric visual element, not robe edges) and asked that they all meet at the
**foot = bottom midpoint (50, 0)**. Each V's outer end lands on an existing junction:

| V | ends at | derivation | James's line |
|---|---|---|---|
| main | (0/100, 61.0) | right edge × the upper-cloud construction circle (right side as before, left mirrored) | 62.4 |
| middle | (0/100, 75.84) | frame edge × the outermost corner arc | ~74 |
| upper | (11.8/88.2, 108) | top frame × the 88.2 column | 88.6 |

All sit behind the clouds. The old robe-based left diagonal and the X pieces
are still on the canvas as red construction, but no longer drawn.
Against the sketch's arms: the upper V left already passes through the left hand
(≈ (21, 82)); the upper V right meets the right arm's line at (77.2, 76.9), ~3.5
past where the sketch's arm ends; the middle V misses both arms.

## Friar · arms (10/28)

James: the arms are not mirror images, and *every* arm line relates to the whole,
derived by intersections or tangents. His four example lines on the sketch (Default
layer, purple) were read as: A tangent to the left middle corner arc, B from the side
border at the arch-center height to the axis at the inner top, C from the inner top-left
corner to the main V's end, D tangent to the right inner corner arc. Each arm line is a
full line (drawn red as construction); the arm edges (white) run between their crossings.

| line | derivation |
|---|---|
| A, left arm outer | band b's left spring point, tangent to the left middle corner arc |
| B, left forearm | left border at the arch center → axis at the inner top |
| C, right arm top | left border at the inner top → main V end R |
| D, right arm lower | left border at 41.25, tangent to the right inner corner arc |
| S, shoulder line | right border at H/2, tangent to the left inner corner arc |
| 26 | left edge at H/2 → right middle corner arc × right border |
| RS, right sleeve inner | axis at H/2 → right inner corner arc × top |
| F, right forearm | left edge at 9.74 → right inner corner arc × inner top (it crosses C exactly at the sketch's elbow joint) |
| LS, left sleeve inner | left inner corner arc × top → inner bottom-right corner |
| head base (construction) | left border at the arch center, tangent to the right inner corner arc |

Edges: A from A×26 to A×B; B from A×B to the upper V; LS from LS×B to the head base;
S from A×S to S×D; 26 from A×26 to 26×S; RS from S×RS to RS×C; C from RS×C to C×D;
D from the axis to C×D; F from the head base to band d. Because A starts at band b's
spring point, the left arm follows the "drawn band b" slider.

Method note: a pure nearest-fit search over all ~950 junctions finds coincidences;
limiting it to James's vocabulary (frame/inner corners, axis and borders at structural
heights, V ends, corner arcs meeting the frame, tangents to drawn bands and corner arcs)
recovered his own four derivations and gave readable ones for the rest.

## Friar · robe (10/28)

Same method as the arms, plus two shared junctions so the lines that meet in the
sketch meet exactly: the waist W and the fold point F1. The robe's anchors come
from James's own construction where it already had them: the bottom corner
R1 = main V × his apex→(88.2, 0) ray (so the foot and the V place the robe),
the hem = his apex→R1 ray, the hem's left corner R2, and his red fan rays.

| line | derivation |
|---|---|
| robe edge | R1 → axis at the top (50, 108) |
| torso 55 | bottom-right corner (100, 0) → upper V L × band d |
| **W, waist** | robe edge × torso 55 → (54.07, 46.75) |
| torso 43 | W → upper V's top-left end (11.8, 108) |
| torso 54 | W → middle V R at 19.48 |
| fold 11–15 | middle V R × col 80.9 → upper V R × col 61.8 |
| **F1, fold point** | robe edge × fold 11–15 → (55.27, 28.76) |
| fold 10 | R2 → F1 |
| fold 35–38 | axis at 41.25 → upper V R at the arch-center height |
| fold 50–51 | right edge at the inner top → upper V L × col 38.2 |
| inner vertical | axis at the top → middle V R at the inner bottom |
| fold 33–34 | upper V L at 33.37, tangent to band a |
| fan rays 14°, 3°, −8° | James's red rays to (100, 41.25), (100, 25.5), (100, 9.74) |

Ends: the torso lines stop at arm line 26 (55, 43) and at the head base (54);
fold 11 runs from the −27° ray to F1; fold 35 from the −8° ray to torso 54;
fold 50 from the lower-left small cloud to the inner vertical; the inner vertical
from the hem to fold 50; fold 33 between the −8° and 14° rays; the 14° and 3°
rays end at fold 33, the −8° ray at the inner vertical, and the −21° ray (which
was drawn full length) now ends at fold 11.

Both the robe edge and the inner vertical aim at the top of the axis (50, 108).

## Friar · head and hands (10/28)

**Head**, same method. The hood, the left sleeve, torso 54 and the head base all meet at
one point J (left sleeve × head base); torso 54 was re-aimed from the middle V at 19.48
to J so there's no sliver.

| line | derivation |
|---|---|
| hood left | left border at the arch center → upper V L × band c (the same origin as arm line B and the head base) |
| hood right | J → inner top-left corner (C's origin too) |
| face left | right edge at the inner top, tangent to band a (fold 50's origin too) |
| face right | right edge at H/2 → band a's right spring point |
| head base (drawn) | from the shoulder line to the forearm, so the forearm doesn't hang loose |

**Hands**, the free-drawn exception: the sketch's hand curves were copied into the frame
on the Rhino layer **"Friar hands"** and referenced by the HANDS curve param, so editing
them in Rhino updates the drawing. The right hand was rotated −1.9° and scaled 0.95 so the
two places where it met the sketch's arm land on the built arm corners (gaps now under
0.2); the left hand already sat within 0.2–0.9.

## Friar · outline (10/28)

James: the space between the right forearm and the hand is friar. Above the head, between
the raised arms, stays background (the band arcs show there, as in the sketch).
The outline is a closed polygon through 18 derived junctions: fan apex → hem's left
corner → main V L × fold 10 → foot → robe's bottom corner → waist → torso 54 × D → C × D
(right hand) → forearm top (F × band d) → forearm × head base → J → left sleeve × B →
A × B → A × 26 → torso 55 × 26 → torso 55 × fold 50 → fold 50 at the cloud → fold 33 ×
the 14° ray → apex. It's shrunk 0.05% so the foot's V edges, which lie on it, are kept.
Everything behind him is trimmed outside it: the horizontals, all three V's, the arch
bands and the corner arcs. Clouds, rosette and the figure's own lines are untouched.
Added the left sleeve's top edge (A × B → left sleeve × B), so the sleeve line no longer dangles.

## Rosette axis, duplicates, loose ends (10/28)

- **Rosette axis** (in the ROSETTE group): from the top of James's top satellite (113.89)
  down to where the axis meets the head base (76.21); the sketch's axis ends at 76.4.
- **No doubled linework.** Two causes, both fixed: (1) *Trim with Regions* runs once per
  data branch of its region input, so two region sources (e.g. upper + lower clouds)
  ran it twice, each pass cutting with one set and both results drawn. The region
  input of every Trim with Regions is now flattened. (2) Band 10's legs under the
  lower clouds sat exactly on the lower arches' inner legs (both on the golden 80.9 /
  19.1 column); the bands are trimmed by each lower arch's box grown 0.2%. The
  horizontals at 54 / 25.5 are trimmed by the clouds grown 0.05%, so they no longer
  run along the cloud bases. A scan of the whole output finds 0 overlapping
  segments and 0 overlapping arcs.
- **Loose ends (every lead line must end on another).** Fixed: D now starts on torso 54,
  with a new short torso line from there up to 26 × the shoulder line (the sketch's
  segment); fold 35 ends on the robe edge; fold 33 runs up to the lower cloud's base
  (31.04, 25.5), and the outline follows the cloud corner and fold 33 there, so band
  4's leg and the main V land on fold 33.

## Hands back in place, hand edge, hand masks (11/13)

- **Hands were off the panel.** The whole output had been baked onto the "Friar hands"
  layer (the current layer at the time) and that layer's contents moved by
  (−135.05, −0.15), taking the five referenced hand curves with them. The hands were moved
  back by exactly that offset; the 120 baked objects now live on their own layer,
  **"Baked output copy (11-13)"**, so "Friar hands" holds only the hands.
- **Hand edge (James chose option 1):** a drawn line from the forearm tip (F × band d,
  67.87, 91.96) to the hand corner C × D (72.33, 73.07), the outline's own edge. It is cut
  where it passes behind the right hand, so it draws as two pieces (tip → hand, hand →
  C × D). Band 8 now ends on it. Nodes in FRIAR · OUTLINE: "hand edge …", "hand edge x
  hands", "hand edge cut at the hand", and two List Items (first and last piece).
- **Hand masks:** each hand curve is closed by the chord between its own two ends (FRIAR ·
  HANDS: End Points → Line → Merge grafted → Join Curves), and those shapes are added to
  the region of "background behind the friar". The band and corner arcs that ran through
  both hands now stop at the hand. Redrawing a hand updates its mask; a hand curve whose
  chord would cut across the hand needs a closing line drawn instead.
- **Hand ends snapped (James: "they don't quite reach the sleeve; the left overshoots").**
  Edits to the Rhino curves (ids kept, so GH still references them): the right thumb
  starts exactly at RS × C (62.41, 77.58) and ends on C; the right hand's outline ends on
  C; the right crease ends on the thumb; the left hand is trimmed to the sleeve line,
  from the sleeve top (29.27, 87.47) to B (24.41, 83.53). Sleeve top and B are one
  straight line, so the left hand's closing chord lies on it.
- **Left thumb stroke removed** (James: "an extra, unneeded line"). It ran 0.1 beside the
  upper V's left line, which B already ends on. The curve is kept on the hidden layer
  **"Friar hands (unused)"**, out of the HANDS param. The thumb is now the triangle B ×
  upper V L → palm end on B → upper V L × palm (nearest B), shrunk 0.5% so the V line
  on its edge stays, and the background stops at it (that removed a band-arc sliver that
  ran through the thumb).
- **Checks (exact, in Rhino):** 0 overlapping segments, 0 loose ends, nothing passes
  through a hand, no fragment shorter than 0.3.

## Arms, rays, sleeve, legs (11/13, James's second review)

- **Rays, not arms.** The two lines that cross the arch (old "arm edge LS" and "arm edge F")
  are rays: each now runs from band d down to band a (the smallest drawn arch) and is
  no longer part of the friar outline, so the bands run unbroken across them. Ray L:
  (32.76, 92.39) → (42.78, 78.41); ray R: (56.86, 78.62) → (67.87, 91.96). Same
  construction lines as before (Curve | Line on the full lines).
- **Removed:** the forearm-tip → hand edge ("imagined"), the sleeve-top line (A × B →
  LS × B; the sketch has nothing above the sleeve corner), and the head base's stretch
  from J to the forearm. The head base now ends at J, where the robe edge meets it.
- **Left sleeve is a triangle:** corner A × B, B running down-left, and a new **sleeve
  edge** from A × 26 aimed at the frame's top-left corner (0, 108), ending on B at
  (19.43, 79.49). That direction matches the sketch's implied edge (its B end and A
  bottom line up with (0, 108)). B now ends at that corner instead of on the upper V.
- **Left hand:** slid 1.02 along B (from its untrimmed shape in the baked copy) and
  trimmed to B, so it starts 0.39 inside the sleeve corner, as in the sketch.
- **Left thumb:** its V edge (B × upper V L → palm) is drawn as its own line ("thumb
  edge"); the thumb mask is grown 3% so the V line there is always trimmed, never doubled.
  (Trim with Regions misclassified the V piece when it ran exactly along the mask edge.)
- **Rosette axis** ends on band a's top (50, 80.46), where the sketch ends it, since the
  head base no longer reaches x = 50.
- **Legs reach the torso:** fold 50 and the inner vertical both end at torso 55 × fold
  50 (51.84, 49.03); fold 35 ends at W. Ray −8 now ends on the (re-aimed) inner vertical.
- **Outline corners now:** … C × D → RS × C → S × RS → S × torso 54 → J → hood peak →
  A × hood L → A × B → B × sleeve → A × 26 → … Right of the head above the shoulder
  line, and between A and the rays, is background.
- **Sliver filter:** background pieces shorter than 0.2 are dropped (Length → Larger Than
  → Cull Pattern, all flattened) before the output.
- **Checks (exact):** 0 loose ends, 0 overlapping segments, nothing through a hand, no
  piece under 0.3.

## Still to build

1. James's own review: missing friar lines and details to check.
