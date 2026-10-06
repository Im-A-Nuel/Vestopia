# Portfolio Village — Prompt Aset Gambar

> Pasangan dokumen: [`2026-10-05-portfolio-village-mvp-design.md`](./2026-10-05-portfolio-village-mvp-design.md)

---

## ⚠️ PENTING: generate gambar jangan pakai Claude

**Claude tidak bisa membuat gambar.** Claude hanya bisa menulis prompt dan kode. Untuk mengeksekusi prompt di dokumen ini, developer frontend harus memakai AI pembuat gambar lain, misalnya:

- **ChatGPT** (GPT image / DALL·E)
- **Google Gemini** (Imagen / Gemini image)
- **Midjourney**, **Leonardo.ai**, **Stable Diffusion**, atau **Recraft** (bagus untuk pixel art dan ikon)

Salin prompt di bawah ke salah satu tool tersebut, lalu simpan hasilnya ke path yang tertulis di tiap aset.

---

## Cara pakai supaya gayanya konsisten

1. **Generate aset `REF-01` dulu** (gambar referensi gaya). Upload gambar itu bersama setiap prompt berikutnya dengan instruksi *"match the style of the attached reference image"*.
2. Selalu tempel **STYLE BLOCK** di awal setiap prompt.
3. Minta **latar transparan** untuk sprite, ikon, dan bangunan. Kalau tool tidak mendukung, minta latar polos `#FF00FF` (magenta), lalu hapus latarnya (misalnya remove.bg atau Photopea).
4. Generate di ukuran besar (1024×1024), lalu **perkecil dengan nearest-neighbor** ke ukuran target supaya piksel tetap tajam (Aseprite, Photopea: *Image Size → Nearest Neighbor*).
5. **Jangan pakai logo atau merek resmi.** Kalau hasil generate memunculkan logo mirip Apple, Nvidia, Coca-Cola, dan lainnya, generate ulang.
6. Simpan PNG dengan nama file persis seperti di kolom **Path**. Frontend akan memuat dari sana.

### STYLE BLOCK (tempel di awal setiap prompt)
```
Cozy 32x32 pixel art, top-down 3/4 view like Stardew Valley and Harvest Moon,
warm earthy palette (soft greens, warm browns, golden yellows, muted blues),
clean 1px dark outlines, soft shading with limited colors, no anti-aliasing,
no text, no watermark, no real brand logos.
```

### Palet acuan
| Peran | Hex |
|---|---|
| Rumput | `#7BB661` / `#5A8F45` |
| Tanah/jalan | `#C8A26B` / `#9C7A4D` |
| Kayu | `#8B5A2B` |
| Air | `#5DA9E9` |
| Emas/aksen | `#F2C14E` |
| Outline | `#2B2B3A` |
| Kabut terkunci | `#CFD6E0` (opasitas 80%) |

---

## 0. Referensi gaya

| ID | Path | Ukuran akhir |
|---|---|---|
| REF-01 | `frontend/public/assets/ref/style-reference.png` | 1024×1024 (tidak dipakai di game) |

```
[STYLE BLOCK]
A small cozy village scene: a wooden farmhouse with a red roof in the center,
a dirt path, a small pond, a few trees and flowers, a fence. Bright sunny day.
This image is a style reference sheet for a farming investment game.
```

---

## 1. Peta dan tileset

| ID | Path | Ukuran akhir |
|---|---|---|
| MAP-01 | `frontend/public/assets/map/tileset.png` | 256×256 (grid 32×32) |
| MAP-02 | `frontend/public/assets/map/village-base.png` | 1920×1080 |

**MAP-01: Tileset**
```
[STYLE BLOCK]
A seamless top-down tileset sprite sheet on a 32x32 grid, 8 columns x 8 rows:
grass variations, grass with flowers, dirt path straight/corner/T-junction,
water with shoreline edges, stone path, wooden fence pieces, small bushes,
rocks, tree stump. Each tile clearly separated on the grid, transparent background.
```

**MAP-02: Peta desa dasar (tanpa bangunan wilayah)**
```
[STYLE BLOCK]
Top-down village map, 16:9 landscape. Center: open plaza with dirt paths
leading in four directions (north, east, south, west). Each direction ends in
an EMPTY flat clearing (leave space for a building, no buildings there).
Decorate edges with trees, bushes, flowers, a small river along the bottom-right.
Bright daytime. No buildings, no characters.
```

---

## 2. Bangunan pusat desa

| ID | Path | Ukuran akhir |
|---|---|---|
| BLD-01 | `frontend/public/assets/buildings/home.png` | 128×128 |
| BLD-02 | `frontend/public/assets/buildings/shop.png` | 128×128 |
| BLD-03 | `frontend/public/assets/buildings/bank.png` | 128×128 |

**BLD-01: Rumah pemain**
```
[STYLE BLOCK]
A cozy small wooden farmhouse with a red roof, chimney with a little smoke,
a front porch with a lantern and a flower box. Single building, centered,
transparent background.
```

**BLD-02: Toko Desa**
```
[STYLE BLOCK]
A charming village general store / market stall building, wooden walls,
striped green-and-cream awning, crates of goods and a small chalkboard sign
(blank, no text) in front, a coin-shaped emblem above the door.
Single building, centered, transparent background.
```

**BLD-03: Bank Desa**
```
[STYLE BLOCK]
A small village bank building made of light stone with a blue roof,
two small columns at the entrance, a golden coin emblem above the door,
a little vault door visible through a window. Single building, centered,
transparent background.
```

---

## 3. Wilayah dan petak saham

Konsepnya: **wilayah = sektor, petak = saham** (lihat spesifikasi MVP bagian 3 dan 4.2). Setiap saham punya **satu** gambar bangunan. Level 2 dan 3 ditampilkan dengan **lapisan dekorasi** (bagian 3.4) dan skala, jadi tidak perlu 3 gambar per saham.

### 3.1 Tanah wilayah (latar tiap wilayah)
| ID | Path | Ukuran akhir |
|---|---|---|
| DST-01 | `frontend/public/assets/districts/tech-ground.png` | 512×256 |
| DST-02 | `frontend/public/assets/districts/mine-ground.png` | 512×256 |
| DST-03 | `frontend/public/assets/districts/factory-ground.png` | 512×256 |
| DST-04 | `frontend/public/assets/districts/farm-ground.png` | 512×256 |

Setiap gambar tanah memuat **dua petak kosong** (kiri dan kanan) tempat bangunan saham diletakkan.

**DST-01: Tech Office**
```
[STYLE BLOCK]
Top-down district ground, wide 2:1: a neat paved tech park area with light
stone tiles, small hedges, a few lamp posts and cable trenches. Two EMPTY
square building lots side by side (left and right), clearly outlined with a
thin stone border, nothing built on them. No buildings, no text.
Transparent background outside the district area.
```
**DST-02: Mine**
```
[STYLE BLOCK]
Top-down district ground, wide 2:1: rocky brown terrain at the foot of a
small cliff, scattered pebbles, a short rail track crossing the middle. Two
EMPTY flat building lots side by side (left and right), outlined with small
wooden stakes, nothing built on them. No buildings, no text.
Transparent background outside the district area.
```
**DST-03: Factory**
```
[STYLE BLOCK]
Top-down district ground, wide 2:1: an industrial yard with packed dirt and
concrete patches, a small road for delivery carts, a few pallets at the edges.
Two EMPTY building lots side by side (left and right), outlined with painted
lines, nothing built on them. No buildings, no text.
Transparent background outside the district area.
```
**DST-04: Farm**
```
[STYLE BLOCK]
Top-down district ground, wide 2:1: green farmland with a dirt path, a wooden
fence around the edges, a few hay bales. Two EMPTY tilled-soil building lots
side by side (left and right), nothing built on them. No buildings, no text.
Transparent background outside the district area.
```

### 3.2 Bangunan per saham (8 gambar)
Semua **192×192**, latar transparan, sudut pandang dan skala sama. Generate **LOT-01** dulu, lalu upload LOT-01 sebagai referensi untuk 7 lainnya dengan instruksi *"same style, same camera angle and scale as the attached image"*.

| ID | Saham | Path |
|---|---|---|
| LOT-01 | Apple (sAAPL) | `frontend/public/assets/lots/aapl.png` |
| LOT-02 | Nvidia (sNVDA) | `frontend/public/assets/lots/nvda.png` |
| LOT-03 | Newmont (sNEM) | `frontend/public/assets/lots/nem.png` |
| LOT-04 | Exxon Mobil (sXOM) | `frontend/public/assets/lots/xom.png` |
| LOT-05 | Coca-Cola (sKO) | `frontend/public/assets/lots/ko.png` |
| LOT-06 | Procter & Gamble (sPG) | `frontend/public/assets/lots/pg.png` |
| LOT-07 | John Deere (sDE) | `frontend/public/assets/lots/de.png` |
| LOT-08 | Archer-Daniels-Midland (sADM) | `frontend/public/assets/lots/adm.png` |

**LOT-01: Apple (Tech Office)**
```
[STYLE BLOCK]
A small modern gadget workshop: white-walled building with big rounded glass
windows showing tiny phones and laptops on display tables, and a small leafy
apple tree with red apples growing beside the entrance. Generic, no logos,
no fruit-with-bite symbol. Single building, centered, transparent background.
```
**LOT-02: Nvidia (Tech Office)**
```
[STYLE BLOCK]
A compact server house: dark grey building with glowing green circuit lines
on the walls, server racks with blinking green lights visible through a
window, a large computer chip shape mounted on the roof, cooling fans on the
side. Generic, no logos. Single building, centered, transparent background.
```
**LOT-03: Newmont (Mine)**
```
[STYLE BLOCK]
A gold mine entrance carved into a small rocky hill: wooden support beams,
a lantern on each side, a short rail with one mine cart holding shiny gold
nuggets. Generic, no logos. Single structure, centered, transparent background.
```
**LOT-04: Exxon Mobil (Mine)**
```
[STYLE BLOCK]
A small oil site: one classic oil pump jack next to a round storage tank,
a few black oil barrels, pipes running along the ground. Generic, no logos,
no brand colors. Single structure, centered, transparent background.
```
**LOT-05: Coca-Cola (Factory)**
```
[STYLE BLOCK]
A cheerful brick beverage bottling plant: one chimney with white steam,
a small conveyor visible through a window carrying plain red bottles with no
labels, crates of bottles by the door. Generic, no logos, no script lettering.
Single building, centered, transparent background.
```
**LOT-06: Procter & Gamble (Factory)**
```
[STYLE BLOCK]
A tidy household goods workshop: light blue building with soap bubbles
floating from a vent on the roof, shelves of plain soap bottles, detergent
boxes and toothpaste tubes (no labels) by the entrance. Generic, no logos.
Single building, centered, transparent background.
```
**LOT-07: John Deere (Farm)**
```
[STYLE BLOCK]
A wooden tractor barn with a big open door, a green farm tractor with yellow
wheels parked in front (generic, no logos, no deer symbol), a few tools hanging
on the wall. Single building, centered, transparent background.
```
**LOT-08: Archer-Daniels-Midland (Farm)**
```
[STYLE BLOCK]
A tall metal grain silo next to a small wooden food storage shed, stacked
burlap sacks of wheat and corn, a small wheelbarrow of grain. Generic,
no logos. Single structure, centered, transparent background.
```

### 3.3 Petak kosong ("Available")
| ID | Path | Ukuran akhir |
|---|---|---|
| LOT-00 | `frontend/public/assets/lots/available.png` | 192×192 |

```
[STYLE BLOCK]
An empty building lot: flat patch of dirt with a few small stones and grass
tufts, and a small wooden signpost in the middle with a blank board (no text).
Centered, transparent background.
```
> Tulisan **"Available"** ditempel oleh frontend (bahasa Inggris), bukan oleh AI.

### 3.4 Dekorasi level
| ID | Path | Ukuran akhir |
|---|---|---|
| DEC-02 | `frontend/public/assets/lots/decor-lv2.png` | 192×192 |
| DEC-03 | `frontend/public/assets/lots/decor-lv3.png` | 192×192 |

Dekorasi ditumpuk **di atas** gambar bangunan petak, jadi harus berupa benda-benda di tepi bawah dan samping, dengan area tengah kosong transparan.

**DEC-02: Dekorasi Level 2**
```
[STYLE BLOCK]
A transparent 192x192 overlay frame of small props placed only around the
bottom and side edges, center left completely empty: two wooden crates,
a small colorful pennant flag on a pole, two hanging lanterns, a flower pot.
Transparent background.
```
**DEC-03: Dekorasi Level 3**
```
[STYLE BLOCK]
A transparent 192x192 overlay frame of props placed only around the bottom and
side edges, center left completely empty: a decorative white picket fence
segment along the bottom, two tall glowing street lamps, a small golden trophy
statue, flower bushes, tiny sparkle stars. Transparent background.
```

### 3.5 Hasil panen (dividen)
Semua **48×48**, latar transparan, disimpan di `frontend/public/assets/harvest/`.

| ID | Path | Dipakai di petak |
|---|---|---|
| HRV-01 | `harvest/chip.png` | Apple, Nvidia |
| HRV-02 | `harvest/gold-cart.png` | Newmont |
| HRV-03 | `harvest/oil-barrel.png` | Exxon |
| HRV-04 | `harvest/goods-crate.png` | Coca-Cola, P&G |
| HRV-05 | `harvest/harvest-basket.png` | John Deere, ADM |
| HRV-06 | `harvest/tap-hand.png` | ikon ajakan mengetuk (semua petak) |

**Prompt (sekali jalan untuk semuanya)**
```
[STYLE BLOCK]
A sprite sheet of 6 collectible harvest items, each 48x48, in a single row,
evenly spaced, each with a soft glow outline so it pops on the map:
(1) a glowing blue-green data chip, (2) a tiny mine cart full of gold nuggets,
(3) a small black oil barrel with a shine, (4) a wooden crate of plain goods,
(5) a woven basket of vegetables and wheat, (6) a small white pointing hand
cursor icon. No logos, no text. Transparent background.
```
Setelah generate, potong menjadi 6 file sesuai tabel.

---

## 4. Status terkunci dan efek

| ID | Path | Ukuran akhir |
|---|---|---|
| FX-01 | `frontend/public/assets/fx/fog-locked.png` | 256×256 |
| FX-02 | `frontend/public/assets/fx/padlock-fence.png` | 128×64 |
| FX-03 | `frontend/public/assets/fx/unlock-sparkle.png` | sprite sheet 8 frame × 64×64 |
| FX-04 | `frontend/public/assets/fx/coin-burst.png` | sprite sheet 8 frame × 64×64 |
| FX-05 | `frontend/public/assets/fx/particles.png` | 6 partikel × 16×16 |
| FX-06 | `frontend/public/assets/fx/rainbow.png` | 512×256 |
| FX-07 | `frontend/public/assets/fx/props.png` | 4 benda × 48×48 |

**FX-01: Kabut wilayah terkunci**
```
[STYLE BLOCK]
A soft, swirly pixel art fog cloud covering a square area, pale grey-blue,
semi-transparent edges, mysterious but cozy. Transparent background.
```
**FX-02: Pagar dengan gembok**
```
[STYLE BLOCK]
A short wooden fence segment with a large golden padlock hanging in the middle.
Transparent background.
```
**FX-03: Efek wilayah terbuka**
```
[STYLE BLOCK]
Sprite sheet, 8 frames in a single horizontal row, each frame 64x64:
a magical golden sparkle burst animation, starting small, expanding with
stars and glitter, then fading out. Transparent background.
```
**FX-04: Efek koin**
```
[STYLE BLOCK]
Sprite sheet, 8 frames in a single horizontal row, each frame 64x64:
golden coins bursting upward and falling, shiny, then fading.
Transparent background.
```
**FX-05: Partikel untuk reaksi harga**

Dipakai Phaser particle emitter (spesifikasi 4.8a).
```
[STYLE BLOCK]
Six tiny 16x16 particle sprites in a single row: (1) a green sparkle star,
(2) a small dry brown leaf, (3) a grey dust puff, (4) a small yellow electric
spark, (5) a white soap bubble, (6) a tiny butterfly. Transparent background.
```
**FX-06: Pelangi setelah badai**
```
[STYLE BLOCK]
A soft pixel art rainbow arc, wide 2:1, gentle pastel bands, slightly
transparent edges, a few small clouds at both ends. Transparent background.
```
**FX-07: Benda animasi**

(1) Kantong koin saat pinjam, (2) peti yang melayang pergi saat likuidasi, (3) ikon gembok kecil untuk saham yang dijaminkan, (4) ikon panah naik/turun untuk perubahan harga.
```
[STYLE BLOCK]
Four 48x48 item sprites in a single row: (1) a bulging brown coin bag tied with
a string with gold coins peeking out, (2) a small wooden treasure chest with
tiny wings (floating away), (3) a small golden padlock badge icon,
(4) a pair of arrows: a green up arrow and a red down arrow side by side.
Transparent background.
```

---

## 5. Cuaca (overlay layar penuh)

| ID | Path | Ukuran akhir |
|---|---|---|
| WX-01 | `frontend/public/assets/weather/sunny.png` | 1920×1080 |
| WX-02 | `frontend/public/assets/weather/cloudy.png` | 1920×1080 |
| WX-03 | `frontend/public/assets/weather/storm-rain.png` | sprite sheet 4 frame × 480×270 |
| WX-04 | `frontend/public/assets/weather/lightning.png` | 480×270 |
| WX-05 | `frontend/public/assets/ui/icon-weather.png` | 3 ikon × 32×32 |

**WX-01: Cerah**
```
[STYLE BLOCK]
Full-screen transparent overlay for a top-down game: soft warm sunbeams
from the top-left corner, a few tiny floating light particles.
Mostly transparent, only light rays. 16:9.
```
**WX-02: Mendung**
```
[STYLE BLOCK]
Full-screen transparent overlay for a top-down game: soft grey cloud shadows
drifting across, slightly darkened mood. Mostly transparent. 16:9.
```
**WX-03: Hujan badai**
```
[STYLE BLOCK]
Sprite sheet, 4 frames in a single horizontal row, each 480x270:
diagonal heavy rain streaks over a transparent background with a dark
blue-grey tint, loopable animation. Pixel art rain.
```
**WX-04: Petir**
```
[STYLE BLOCK]
A single bright pixel art lightning bolt with a white flash glow,
on a transparent background, 16:9 frame.
```
**WX-05: Ikon cuaca HUD**
```
[STYLE BLOCK]
Three 32x32 pixel art icons in a single row: (1) a smiling sun,
(2) a grey cloud, (3) a dark storm cloud with a lightning bolt.
Transparent background.
```

---

## 6. Karakter NPC

| ID | Path | Ukuran akhir |
|---|---|---|
| NPC-01 | `frontend/public/assets/npc/guide-portrait.png` | 128×128 |
| NPC-02 | `frontend/public/assets/npc/merchant-portrait.png` | 128×128 |
| NPC-03 | `frontend/public/assets/npc/banker-portrait.png` | 128×128 |
| NPC-04 | `frontend/public/assets/npc/npc-sprites.png` | 3 sprite × 32×48 |

**NPC-01: Pemandu (edukasi, penyambut)**
```
[STYLE BLOCK]
Pixel art character portrait, bust shot, facing the viewer: a friendly
elderly village elder with a white beard, round glasses, straw hat,
green vest, holding a small notebook. Warm smile. Transparent background.
```
**NPC-02: Pedagang (Toko Desa)**
```
[STYLE BLOCK]
Pixel art character portrait, bust shot, facing the viewer: a cheerful
young merchant woman with a brown bandana, apron with pockets, holding
a small sack of coins. Energetic smile. Transparent background.
```
**NPC-03: Bankir (Bank Desa)**
```
[STYLE BLOCK]
Pixel art character portrait, bust shot, facing the viewer: a calm,
trustworthy middle-aged banker with neat hair, a blue vest with a golden
coin pin, a small monocle, holding a ledger book. Gentle smile.
Transparent background.
```
**NPC-04: Sprite NPC di peta**
```
[STYLE BLOCK]
Three small full-body pixel art character sprites in one row, each 32x48,
facing down: (1) elderly village elder with straw hat, (2) young merchant
woman with bandana and apron, (3) banker with blue vest. Transparent background.
```

---

## 7. Ikon saham (tanpa logo resmi)

Semua ikon **32×32**, latar transparan, disimpan di `frontend/public/assets/icons/`.

| ID | Path | Saham | Isi ikon |
|---|---|---|---|
| ICO-01 | `icons/aapl.png` | sAAPL | apel merah generik dengan daun |
| ICO-02 | `icons/nvda.png` | sNVDA | chip komputer hijau dengan pin |
| ICO-03 | `icons/nem.png` | sNEM | bongkah emas berkilau |
| ICO-04 | `icons/xom.png` | sXOM | tong minyak hitam dengan tetes minyak |
| ICO-05 | `icons/ko.png` | sKO | botol minuman merah polos |
| ICO-06 | `icons/pg.png` | sPG | botol sabun biru dengan gelembung |
| ICO-07 | `icons/de.png` | sDE | traktor hijau kecil |
| ICO-08 | `icons/adm.png` | sADM | karung gandum |
| ICO-09 | `icons/koin.png` | KOIN | koin emas dengan simbol daun |

**Prompt (sekali jalan untuk semua ikon)**
```
[STYLE BLOCK]
A sprite sheet of 9 game item icons, each 32x32, in a single row, evenly spaced:
(1) a generic red apple with a leaf, (2) a green computer chip with pins,
(3) a sparkling gold nugget, (4) a black oil barrel with an oil drop,
(5) a plain red soda bottle with no label, (6) a blue soap bottle with bubbles,
(7) a small green farm tractor, (8) a burlap sack of wheat,
(9) a golden coin with a leaf symbol.
Absolutely no brand logos or text. Transparent background.
```
Setelah generate, potong menjadi 9 file sesuai tabel.

---

## 8. Ikon sektor (untuk Toko dan Detail Wilayah)

| ID | Path | Ukuran akhir |
|---|---|---|
| SEC-01 | `frontend/public/assets/icons/sectors.png` | 4 ikon × 32×32 |

```
[STYLE BLOCK]
Four 32x32 sector icons in a single row: (1) a small office building with a
glowing screen (technology), (2) a pickaxe crossed with a lantern (mining),
(3) a factory with a chimney (consumer goods), (4) a wheat bundle (agriculture).
Transparent background.
```

---

## 9. UI (panel, tombol, HUD)

| ID | Path | Ukuran akhir |
|---|---|---|
| UI-01 | `frontend/public/assets/ui/dialog-box.png` | 9-slice, 96×96 |
| UI-02 | `frontend/public/assets/ui/panel-wood.png` | 9-slice, 96×96 |
| UI-03 | `frontend/public/assets/ui/buttons.png` | 3 tombol × 96×32 |
| UI-04 | `frontend/public/assets/ui/hud-bar.png` | 960×64 |
| UI-05 | `frontend/public/assets/ui/progress-bar.png` | 160×16 (frame + isi) |
| UI-06 | `frontend/public/assets/ui/event-banner.png` | 960×128 |

**UI-01: Kotak dialog NPC**
```
[STYLE BLOCK]
A pixel art RPG dialog box frame, cream parchment interior with a dark
brown wooden border and small golden corner rivets, empty inside,
designed for 9-slice scaling. Transparent background.
```
**UI-02: Panel kayu (Toko / Bank)**
```
[STYLE BLOCK]
A pixel art wooden UI panel frame, warm brown planks border with a lighter
inner area, small nails at corners, empty inside, designed for 9-slice
scaling. Transparent background.
```
**UI-03: Tombol**
```
[STYLE BLOCK]
Three pixel art game buttons in one row, each 96x32, empty (no text):
(1) green button (normal), (2) lighter green (hover), (3) darker pressed green
with inset shading. Rounded pixel corners, wooden-game style.
Transparent background.
```
**UI-04: Bar HUD atas**
```
[STYLE BLOCK]
A horizontal pixel art top HUD bar for a farming game, wooden plank style
with three empty slots/plaques for values (coins, portfolio value, weather icon)
and a small round button slot on the right. Empty, no text.
Transparent background.
```
**UI-05: Progress bar**
```
[STYLE BLOCK]
A pixel art progress bar: a wooden frame 160x16 and a separate golden
fill bar segment. Empty, no text. Transparent background.
```
**UI-06: Banner event pasar**
```
[STYLE BLOCK]
A wide pixel art ribbon banner, red-and-gold cloth unfurled horizontally,
with a small bell icon on the left, empty center for text (no text).
Transparent background.
```

---

## 10. Layar judul / onboarding

| ID | Path | Ukuran akhir |
|---|---|---|
| TTL-01 | `frontend/public/assets/title/title-bg.png` | 1920×1080 |
| TTL-02 | `frontend/public/assets/title/logo-frame.png` | 640×200 |

**TTL-01: Ilustrasi judul**
```
[STYLE BLOCK]
Wide 16:9 title screen illustration: a cozy village at golden hour seen from
a hill, the four districts visible in the distance — a small tech office with
glowing windows, a mine in a rocky hill, a brick factory with chimneys,
and golden farm fields with a barn — a farmhouse in the center, warm sky,
birds. Leave the top-center area calm and empty for a title. No text.
```
**TTL-02: Bingkai judul**
```
[STYLE BLOCK]
A decorative wooden sign frame for a game title, with leaves and small
golden coins on the corners, empty center (no text). Transparent background.
```
> Teks judul "Portfolio Village" ditulis di frontend dengan font pixel. Jangan minta AI menulis teks, karena hasilnya sering salah eja.
> Semua teks yang tampil di atas gambar (judul, label, banner) ditulis oleh frontend dan **wajib berbahasa Inggris**, sesuai Glosarium UI di dokumen spesifikasi MVP (bagian 4.0).

---

## 11. Checklist aset

Prioritas mengikuti prioritas animasi di spesifikasi MVP bagian 4.8 (W = wajib, S = kalau sempat) dan urutan pemotongan fitur di bagian 8.

**Prioritas 1 (wajib demo):**
- [ ] REF-01
- [ ] MAP-02 (atau MAP-01 + susun sendiri)
- [ ] BLD-01..03
- [ ] DST-01 (Tech), DST-02 (Mine), DST-04 (Farm)
- [ ] LOT-00 (Available), LOT-01..04, LOT-07, LOT-08
- [ ] DEC-02
- [ ] HRV-01, HRV-02, HRV-03, HRV-05, HRV-06
- [ ] FX-01..04, FX-07
- [ ] WX-01..05
- [ ] NPC-01..03
- [ ] ICO-01..09
- [ ] UI-01, UI-02, UI-03, UI-06

**Prioritas 2 (kalau sempat):**
- [ ] DST-03, LOT-05, LOT-06, HRV-04 (wilayah Factory, dipotong pertama kalau tertinggal)
- [ ] DEC-03 (Level 3)
- [ ] FX-05 (partikel), FX-06 (pelangi)
- [ ] NPC-04
- [ ] SEC-01
- [ ] UI-04, UI-05 (bisa diganti CSS sederhana)
- [ ] TTL-01, TTL-02 (onboarding bisa memakai MAP-02 sementara)

Total: **61 file PNG** setelah sprite sheet dipotong (ikon saham 9 file, hasil panen 6 file). Prioritas 1: 47 file · Prioritas 2: 13 file · MAP-01 (tileset) 1 file, hanya kalau MAP-02 tidak dipakai.

### Font (tidak perlu generate)
Pakai font pixel gratis dari Google Fonts: **"Press Start 2P"** (judul) dan **"VT323"** (teks panel).

### Alternatif kalau hasil AI tidak konsisten
Pakai asset pack pixel art gratis atau berbayar murah dari **itch.io** (cari "top-down farm tileset", "cozy village 32x32"). Cek lisensinya boleh dipakai untuk komersial atau hackathon, dan cantumkan kredit di README.
