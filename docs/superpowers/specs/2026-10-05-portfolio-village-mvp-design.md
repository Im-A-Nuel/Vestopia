# Portfolio Village — Spesifikasi MVP

> Nama kerja: **Portfolio Village** (boleh diganti sebelum submit).
> Tanggal: 2026-10-05 · Deadline hackathon: **2026-10-13**
> Hackathon: Monad Metropolis · Track utama: **Consumer Products & Payments**
> Dokumen aset gambar: [`2026-10-05-portfolio-village-asset-prompts.md`](./2026-10-05-portfolio-village-asset-prompts.md)

> ## ⚠️ PENTING: seluruh UI frontend wajib berbahasa Inggris
> Dokumen ini ditulis dalam bahasa Indonesia untuk tim, tapi **semua teks yang dilihat pengguna di aplikasi harus bahasa Inggris**: label, tombol, dialog NPC, pesan error, banner event, disclaimer, dan menu Info. Juri hackathon bersifat global.
> Teks UI final dalam bahasa Inggris sudah ditulis di bagian 4 (kolom/kutipan berlabel **UI (EN)**) dan di **Glosarium UI** (bagian 4.0). Developer frontend menyalin teks dari sana, bukan menerjemahkan sendiri dari deskripsi berbahasa Indonesia.

---

## 1. Ringkasan

Portfolio Village adalah aplikasi investasi bergaya game indie (seperti Stardew Valley / Harvest Moon). Pemain membeli **saham simulasi** dari perusahaan nyata (Apple, Nvidia, dan lainnya).
- **Wilayah = sektor.** Setiap sektor yang dimiliki membuka wilayah di desa, misalnya teknologi membuka Tech Office dan komoditas membuka Mine.
- **Petak = saham.** Di dalam setiap wilayah ada petak untuk tiap saham. Bangunannya muncul dan naik level sesuai nilai saham itu.
- **Dividen = panen.** Saat Harvest Day, petak saham yang membagikan dividen menghasilkan panen yang bisa dikumpulkan jadi Koin.
- **Pinjaman.** Saham bisa **dijaminkan ke Bank Desa** untuk meminjam Koin, dan risiko pinjaman ditampilkan sebagai **cuaca** di desa.

Semua aset adalah **simulasi (dummy)**. Kontrak dirancang agar nanti bisa diganti ke tokenized stock asli di Monad (Anchored, misalnya `aAAPL`) dengan mengganti alamat token dan oracle.

### Tujuan
- Membuat konsep portofolio dan pinjaman beragunan bisa dipahami orang awam lewat visual game.
- Tidak ada istilah crypto di UI utama: login dengan passkey, tanpa seed phrase.
- Juri bisa mencoba alur lengkap dalam **demo 2 menit**.

### Kriteria sukses
1. Pemain baru bisa login dengan passkey dan langsung mendapat 1.000 Koin.
2. Membeli saham suatu sektor membuka wilayahnya di peta (≤ 2 detik setelah konfirmasi).
3. Pemain bisa menjaminkan saham, meminjam Koin, dan membayar kembali.
4. Event harga (dipicu admin) mengubah tampilan petak saham terkait dan cuaca secara langsung.
5. Harvest Day (dipicu admin) memunculkan panen di petak saham, dan pemain bisa memanennya jadi Koin.
6. Semua kontrak ter-deploy di Monad dan seluruh unit test Foundry lulus.

### Di luar cakupan MVP
- Saham asli atau integrasi Anchored (hanya antarmuka oracle yang kompatibel).
- Multiplayer, kunjungan desa teman, leaderboard.
- Dividen otomatis on-chain (MVP memakai perhitungan di server, lihat 5.5), quest, NFT, suara/musik.
- Karakter yang berjalan, siklus siang/malam.
- **Opsional (kalau sempat):** tombol Replant (reinvestasi dividen).

---

## 2. Aset simulasi

8 saham dalam 4 sektor, ditambah Koin.

| Wilayah | Sektor (enum) | Token | Nama di UI | Ikon (tanpa logo resmi) | Bangunan petak | Hasil panen (dividen) | Dividen per Harvest Day* |
|---|---|---|---|---|---|---|---|
| Tech Office | `TECH` (0) | `sAAPL` | Apple (AAPL) | Apel pixel generik | Workshop gadget dengan pohon apel kecil | Chip data bercahaya | 1% |
| Tech Office | `TECH` (0) | `sNVDA` | Nvidia (NVDA) | Chip/GPU pixel | Ruang server dengan chip bercahaya | Chip data bercahaya | 0,5% |
| Mine | `COMMODITY` (1) | `sNEM` | Newmont (NEM) | Bongkah emas | Terowongan tambang emas | Bongkah emas di lori | 4% |
| Mine | `COMMODITY` (1) | `sXOM` | Exxon Mobil (XOM) | Tetes minyak / tong | Pompa minyak dan tangki | Tong minyak | 5% |
| Factory | `CONSUMER` (2) | `sKO` | Coca-Cola (KO) | Botol minuman generik | Pabrik pembotolan minuman | Peti barang | 5% |
| Factory | `CONSUMER` (2) | `sPG` | Procter & Gamble (PG) | Botol sabun | Workshop sabun dan barang rumah tangga | Peti barang | 4% |
| Farm | `AGRI` (3) | `sDE` | John Deere (DE) | Traktor hijau | Gudang traktor | Keranjang panen | 4% |
| Farm | `AGRI` (3) | `sADM` | Archer-Daniels-Midland (ADM) | Karung gandum | Silo gandum dan gudang pangan | Keranjang panen | 5% |

\* Persentase dari nilai posisi (wallet + jaminan) saat Harvest Day. Angka **ilustratif dan dipercepat untuk game**, bukan dividen asli. Polanya sengaja mengajarkan bahwa saham teknologi (growth) membagikan dividen kecil, sedangkan consumer goods dan komoditas membagikan dividen lebih besar.

- **Koin** = stablecoin simulasi (1 Koin ≈ $1), simbol `KOIN`, 18 desimal.
- Semua `sToken` memakai 18 desimal (sama dengan Anchored) dan boleh pecahan.
- Harga awal diambil dari harga publik terakhir pada hari deploy dan disimpan di `contracts/config/prices.json`.

### Aturan penamaan dan legal
- Simbol token selalu berprefiks `s` (simulasi).
- Di UI selalu ada label kecil **"Simulated"** di samping harga.
- **Tidak memakai logo atau merek visual resmi** perusahaan.
- Disclaimer di onboarding dan menu Info, **UI (EN):** *"All prices and assets are simulated for educational purposes. They are not real stocks and this is not investment advice."*

---

## 3. Aturan game

| Aturan | Nilai |
|---|---|
| Dana awal | 1.000 KOIN, sekali per alamat (`claimStarter`) |
| Syarat wilayah (sektor) terbuka | Total nilai kepemilikan sektor ≥ **100 KOIN** |
| Petak (saham) | Nilai saham = 0 → petak kosong dengan papan "Available" · > 0 → bangunan muncul |
| Level petak (per saham) | Lv1 > 0 · Lv2 ≥ **250** · Lv3 ≥ **1.000** KOIN (nilai saham itu) |
| Nilai kepemilikan | (saldo di wallet + jaminan di Bank) × harga oracle |
| Dividen (Harvest Day) | Nilai posisi per saham × persentase di tabel bagian 2, dikreditkan sebagai panen yang belum dipanen. Menumpuk sampai dipanen |
| LTV maksimum pinjaman | **50%** dari nilai jaminan |
| Ambang likuidasi | **80%** dari nilai jaminan |
| Health Factor (HF) | `(nilai jaminan × 0,80) / utang`; tanpa utang = ∞ |
| Cuaca | HF ≥ 1,5 atau tanpa utang → **Cerah** · 1,1 ≤ HF < 1,5 → **Mendung** · HF < 1,1 → **Badai** |
| Likuidasi | Boleh jika HF < 1. Likuidator membayar ≤ 50% utang, menerima jaminan senilai bayaran + **bonus 5%** |
| Harga basi | Bank menolak `borrow` dan `withdraw` jika umur harga > **1 jam** |
| Bunga pinjaman | **0%** di MVP (disederhanakan) |

Wilayah dan level petak dihitung ulang setiap kali data dibaca dan tidak disimpan. Kalau harga turun dan nilai sektor < 100, wilayah kembali berkabut. Saham tetap milik pemain, dan petaknya "tidur", tidak hancur.

**Contoh:** pemain punya Nvidia 300 dan Apple 0. Tech Office terbuka, petak Nvidia di Level 2, dan petak Apple kosong dengan papan "Available". Ini mengajak pemain melengkapi portofolio (diversifikasi).

**Tampilan level (pendekatan aset "1 gambar + dekorasi"):** setiap saham punya **satu** gambar bangunan. Level ditampilkan dengan lapisan dekorasi dan skala:
| Level | Tampilan |
|---|---|
| Lv1 | Bangunan dasar, skala 0,85 |
| Lv2 | Ditambah dekorasi Lv2 (peti, bendera, lentera), skala 1,0 |
| Lv3 | Ditambah dekorasi Lv3 (pagar hias, lampu, kilau berkala), skala 1,1 |

---

## 4. Layar dan UI/UX

Gaya visual: pixel art 32×32, palet hangat, font pixel. **Bahasa UI: Inggris.** Kata "blockchain", "wallet", "token", dan "gas" tidak muncul di UI utama. Detail teknis (alamat, tx hash) hanya ada di menu **Info**.

### 4.0 Glosarium UI (istilah desain → teks UI bahasa Inggris)
| Istilah di dokumen ini | **UI (EN)** |
|---|---|
| Desa | Village |
| Wilayah | District |
| Petak (satu saham) | Lot |
| Petak kosong | Available |
| Dividen | Dividend |
| Harvest Day / panen | Harvest Day / Harvest |
| Panen semua | Harvest All |
| Reinvestasi dividen (opsional) | Replant |
| Kantor Teknologi | Tech Office |
| Tambang | Mine |
| Pabrik | Factory |
| Kebun | Farm |
| Toko Desa | Village Shop |
| Bank Desa | Village Bank |
| NPC Pemandu | Elder Oak (the Guide) |
| NPC Pedagang | Mira the Merchant |
| NPC Bankir | Mr. Ledger the Banker |
| Koin (mata uang di UI) | Coins |
| Saham | Shares |
| Jaminan | Collateral |
| Pinjaman / utang | Loan / Debt |
| Batas pinjam | Borrow limit |
| Cuaca: Cerah / Mendung / Badai | Weather: Sunny / Cloudy / Stormy |
| Level bangunan | Level 1 / 2 / 3 |
| Terkunci / terbuka | Locked / Unlocked |
| Event pasar | Market Event |
| Nilai portofolio | Portfolio Value |
| simulasi | Simulated |

### 4.1 Onboarding
- Ilustrasi judul (desa pixel art) dan nama game.
- Tombol, **UI (EN):** **"Start with Passkey"**
- Tagline, **UI (EN):** *"Build your village from your portfolio (simulated)."*
- Disclaimer singkat (teks di bagian 2).
- Setelah login, Elder Oak menyambut. **UI (EN):** *"Welcome, traveler! Here are 1,000 Coins to start your village."* Lalu muncul animasi **+1,000 Coins**.

### 4.2 Peta Desa (layar utama, Phaser)
- Top-down, rumah pemain di tengah, 4 wilayah:
  - **Utara:** Tech Office
  - **Timur:** Mine
  - **Selatan:** Farm
  - **Barat:** Factory
- Setiap wilayah berisi **2 petak** (satu per saham):
```
                 ┌──── TECH OFFICE ────┐
                 │ [Apple]   [Nvidia]  │
                 └─────────────────────┘
┌──── FACTORY ────┐      🏠      ┌──── MINE ────────┐
│ [Coca-Cola]     │  Shop  Bank  │ [Newmont] [Exxon]│
│ [P&G]           │              │                  │
└─────────────────┘              └──────────────────┘
                 ┌──── FARM ───────────┐
                 │ [John Deere] [ADM]  │
                 └─────────────────────┘
```
- Wilayah terkunci tertutup kabut dan pagar dengan gembok. Klik wilayah terkunci memunculkan hint, **UI (EN):** *"Own at least 100 Coins of Technology shares to unlock the Tech Office."* (ganti nama sektor dan wilayah sesuai yang diklik)
- Di wilayah terbuka, setiap petak menampilkan bangunan saham sesuai level (Level 1–3), atau papan **"Available"** kalau sahamnya belum dimiliki. Klik papan Available membuka Shop langsung di saham itu.
- Petak yang sahamnya sedang dijaminkan diberi ikon gembok kecil.
- Petak yang punya panen belum dipanen menampilkan hasil panen di atas bangunan (lihat 4.8).
- Overlay cuaca menutupi seluruh peta: Sunny, Cloudy, atau Stormy (hujan dan petir).
- **HUD atas, UI (EN):** `Coins` · `Portfolio Value` · ikon cuaca · tombol `Harvest All` (hanya muncul kalau ada panen) · tombol `Info`.
- **Bangunan yang bisa diklik:**
  - Village Shop (Mira) membuka layar 4.3.
  - Village Bank (Mr. Ledger) membuka layar 4.5.
  - Setiap wilayah atau petak membuka layar 4.4.

### 4.3 Village Shop (panel React)
- Dialog Mira di atas. **UI (EN):** *"Fresh shares, straight from the market! What catches your eye?"*
- Daftar 8 saham, dikelompokkan per sektor (`Technology`, `Commodities`, `Consumer Goods`, `Agriculture`). Tiap baris menampilkan ikon, nama, ticker, harga, perubahan sejak event terakhir (panah dan %), dan saldo pemain.
- Input jumlah dalam Coins, dengan perkiraan jumlah saham. **UI (EN):** *"You'll get ≈ 1.62 shares"*
- Tombol **UI (EN):** **Buy** / **Sell**
- Sukses: animasi koin, panel tertutup, dan kamera peta bergerak ke wilayah terkait. Kalau baru terbuka, kabut menghilang dan muncul teks **UI (EN):** *"New district unlocked!"*

### 4.4 Detail Wilayah (panel React)
- Nama wilayah dan sektor, serta total nilai sektor.
- **Satu kartu per petak (saham)**, berisi:
  - ikon, nama, ticker, harga, dan level petak;
  - jumlah saham, nilai, dan berapa yang sedang dijaminkan. **UI (EN):** label `Shares`, `Value`, `In collateral`;
  - progres ke level berikutnya (bar). **UI (EN):** *"180 / 250 Coins to Level 2"*;
  - panen yang belum dipanen dan tombol **Harvest**, kalau ada.
- Penjelasan sektor dari Elder Oak (edukasi), **UI (EN):**
  - Tech Office: *"Tech companies build the gadgets and chips the world runs on. They can grow fast, but their prices swing a lot."*
  - Mine: *"Commodities like gold and oil are raw materials. Their prices move with supply, demand, and world events."*
  - Factory: *"Consumer goods companies sell everyday things people buy in good times and bad. They tend to be steadier."*
  - Farm: *"Agriculture feeds the world. Weather, harvests, and food demand drive these companies."*
- Tombol pintas **UI (EN):** **Buy more**, membuka Shop dengan filter sektor ini.

### 4.5 Village Bank (panel React)
- Dialog Mr. Ledger. **UI (EN):** *"Put your shares up as collateral and I'll lend you Coins. Just keep an eye on the sky."*
- **Tab `Collateral`:** pilih saham, lalu **Deposit** / **Withdraw**.
- **Tab `Loan`:** `Borrow limit`, `Debt`, input jumlah, lalu **Borrow** / **Repay**.
- **Pratinjau cuaca:** saat input diubah, ikon cuaca menunjukkan cuaca setelah aksi. **UI (EN):** *"If you borrow 400 Coins, your village will turn Cloudy."*
- Penjelasan risiko, **UI (EN):** *"If a storm hits (health below 1.0), other traders can repay part of your loan and take some of your collateral."*

### 4.6 Market Event (banner)
- Banner di atas peta, teks diambil dari tabel preset bagian 5.4.
- Bangunan dan cuaca diperbarui ≤ 2 detik.
- Dipicu dari panel admin tersembunyi (`/admin`, dilindungi password env). Panel admin juga berbahasa Inggris.

### 4.7 Harvest Day (dividen)
- Dipicu dari panel admin, preset `harvest_day` (lihat 5.5).
- Banner, **UI (EN):** *"Harvest Day! Your companies paid dividends."*
- Hasil panen muncul di atas petak yang punya dividen belum dipanen (jenis panen per saham di tabel bagian 2).
- Pemain mengetuk hasil panen di petak, atau tombol **Harvest All** di HUD.
- Setelah panen pertama, Elder Oak berkata, **UI (EN):** *"Dividends are a share of company profits, paid to people who own the stock."*
- Panen yang tidak diambil tetap menumpuk, dan tumpukannya terlihat lebih besar (1, 2, atau 3 item di atas petak sesuai jumlahnya).
- **Opsional (kalau sempat): Replant.** Di popup panen ada tombol **Replant** yang memakai hasil panen untuk membeli lagi saham yang sama. **UI (EN):** *"Replant your harvest into more shares?"*

### 4.8 Event dan animasi
Prinsip: **setiap perubahan angka harus terlihat sebagai perubahan di desa.** Semua animasi dibuat dengan fitur bawaan Phaser (tween, particle emitter, camera pan/shake), tanpa library animasi tambahan. Kolom **Prioritas** menentukan urutan pengerjaan: **W** = wajib, **S** = kalau sempat.

**a. Harga naik / turun** (dipicu event pasar). Reaksi hanya terjadi di **petak saham yang harganya berubah**.

| Besar perubahan | Naik | Turun | Prioritas |
|---|---|---|---|
| Semua | Angka melayang hijau, misalnya `+12%`, naik lalu memudar (1 dtk). Panah ▲ hijau di Shop | Angka melayang merah, misalnya `−8%`, turun lalu memudar. Panah ▼ merah di Shop | W |
| 5–20% | Ditambah partikel kilau hijau naik dari bangunan | Ditambah partikel daun kering/debu jatuh | S |
| > 20% | Ditambah efek khusus petak (tabel di bawah) dan getaran kamera kecil | Ditambah efek khusus petak | S |

Efek khusus petak saat perubahan > 20% (S):
| Petak | Naik besar | Turun besar |
|---|---|---|
| Apple | Pohon apel berbuah lebat dan berkilau | Daun pohon apel rontok |
| Nvidia | Chip menyala terang, layar berkedip cepat | Layar mati dan muncul percikan listrik |
| Newmont | Kilau emas memancar dari gua | Batu kecil runtuh di pintu gua |
| Exxon | Pompa bergerak cepat | Pompa berhenti |
| Coca-Cola / P&G | Cerobong mengepul tebal | Asap berhenti, pintu tertutup |
| John Deere / ADM | Tanaman bergoyang, kupu-kupu muncul | Tanah retak, tanaman layu |

**b. Beli saham**
| Langkah | Animasi | Prioritas |
|---|---|---|
| 1 | Koin terbang dari HUD saldo ke ikon saham di Shop (0,5 dtk) | W |
| 2 | Panel tertutup, kamera bergeser halus ke petak saham (0,8 dtk) | S |
| 3 | Bangunan petak memantul kecil (squash and stretch) dan angka `+300 Coins` melayang | W |

**c. Petak baru terisi / wilayah baru terbuka** (momen paling besar, W)
1. Gembok bergetar lalu jatuh (0,5 dtk).
2. Kabut tersapu dari tengah ke luar (1 dtk).
3. Bangunan petak muncul dari tanah dengan efek debu.
4. Kilau emas memancar (`unlock-sparkle`).
5. Banner, **UI (EN):** *"New district unlocked: Tech Office!"*
6. Elder Oak memberi satu kalimat penjelasan sektor (teks di 4.4).

Kalau wilayah sudah terbuka dan hanya petak baru yang terisi: papan "Available" tercabut, lalu langkah 3 dan 4 saja.

**d. Naik level petak** (W): bangunan tertutup kilau putih 0,3 dtk, dekorasi level baru muncul, skala naik, dan teks *"Level 2!"* melayang.

**e. Jual saham**
| Kejadian | Animasi | Prioritas |
|---|---|---|
| Jual biasa | Partikel keluar dari petak dan terbang ke HUD, saldo bertambah | W |
| Saldo naik | Angka saldo menghitung naik cepat (rolling number) | S |
| Jual untung (vs harga beli rata-rata di sisi frontend) | Koin berkilau emas dan teks *"Profit +45 Coins"* | S |
| Jual rugi | Koin abu-abu dan teks netral *"Sold"*, tanpa efek menghukum | S |
| Level turun | Bangunan berkedip lalu menyusut ke level di bawahnya | W |
| Petak jadi kosong | Bangunan memudar, papan "Available" muncul | W |
| Wilayah terkunci lagi | Kabut perlahan menutup (1,5 dtk), gembok muncul. Elder Oak, **UI (EN):** *"The Mine is resting for now. Own shares again to reopen it."* | W |

**f. Pinjaman dan cuaca**
| Transisi / aksi | Animasi | Prioritas |
|---|---|---|
| Sunny → Cloudy | Awan masuk dari tepi layar (2 dtk), cahaya meredup 20% | W |
| Cloudy → Stormy | Langit gelap, hujan, satu sambaran petir dengan kilat layar putih, ikon cuaca HUD bergetar | W |
| Stormy/Cloudy → Sunny | Hujan berhenti, awan tersapu, sinar matahari masuk | W |
| ... ditambah pelangi | Pelangi muncul sebentar setelah badai | S |
| Pinjam | Kantong koin terbang dari Bank ke HUD | W |
| Bayar | Koin terbang dari HUD ke Bank, bar utang menyusut | W |
| Pratinjau di panel Bank | Ikon cuaca kecil berubah saat jumlah digeser, peta di belakang panel menggelap tipis | W |

**g. Badai dan likuidasi**
- **Masuk Stormy (W):** hujan terus, petir acak setiap 5–8 dtk. Mr. Ledger muncul di pojok, **UI (EN):** *"Storm's coming! Repay some of your loan or add more collateral."* Tombol cepat **Repay** dan **Add collateral** berdenyut.
- **Dilikuidasi (W):** peti melayang pergi dari petak terkait, lalu teks **UI (EN):** *"A trader repaid part of your loan and took 120 Coins of collateral."* Cuaca diperbarui sesuai HF baru. Tidak ada ledakan atau bangunan hancur.

**h. Banner event pasar** (W)
1. Pita merah-emas meluncur dari atas (0,4 dtk).
2. Teks event tampil (5.4).
3. Kamera bergeser ke petak yang paling terdampak (S), lalu reaksi harga (a) dimainkan.
4. Setelah 4 dtk, banner terangkat dan kamera kembali ke tengah.

**i. Harvest Day** (W)
1. Banner Harvest Day.
2. Hasil panen muncul satu per satu di atas petak, dengan pantulan kecil dan kilau.
3. Ikon tangan kecil berdenyut di atasnya, mengajak pemain mengetuk.
4. Diketuk: hasil panen meletup, koin terbang ke HUD, dan angka *"+18 Coins"* melayang.

**j. Animasi diam (idle)** (S): pohon bergoyang, air berkilau, asap cerobong rumah pemain, NPC bernapas 2 frame.

### 4.9 Info menu
- Alamat akun, tautan ke block explorer, daftar kontrak, dan tx terakhir. **UI (EN):** label `Account`, `View on Explorer`, `Contracts`, `Recent Transactions`.
- Disclaimer lengkap dan penjelasan, **UI (EN):** *"Built on Monad. Designed to work with real tokenized stocks (e.g., Anchored) by swapping the asset and price-feed addresses."*

### Pesan error (gaya NPC)
| Kondisi | **UI (EN)** |
|---|---|
| Saldo MON untuk gas habis | "You're out of travel supplies. Need a refill?" lalu tombol **Get supplies** (drip) |
| Transaksi gagal / ditolak | "Hmm, that didn't go through. Let's try again." Detail di Info |
| Harga basi | "The market is closed right now, so the bank can't lend." |
| Pinjaman melebihi LTV | "Your collateral isn't enough for a loan that big." |
| Browser tanpa passkey | "This browser doesn't support passkeys yet. Try the latest Chrome or Safari." |

---

## 5. Arsitektur

```
[Browser: Next.js (App Router)]
  ├─ Phaser 3   → Peta Desa (wilayah, kabut, level, cuaca)
  ├─ React      → Onboarding, Toko, Bank, Detail Wilayah, Info, Admin
  └─ viem + Mera SDK (passkey → EOA)
        │ read / write
        ▼
[Monad: smart contracts]
  Koin · SimStock ×8 · SimOracle (IPriceOracle) · VillageMarket · VillageBank · VillageLens
        ▲
        │ admin only (server-side key)
[Next.js API routes]
  ├─ POST /api/drip   → kirim MON untuk gas (sekali per alamat + batas harian)
  ├─ POST /api/event  → preset event: set harga oracle atau Harvest Day, butuh ADMIN_PASSWORD
  └─ GET  /api/event/latest → event terakhir (untuk banner)
```

### Struktur folder
```
new/
  contracts/        Foundry: src/, test/, script/, config/prices.json
  frontend/         Next.js + Phaser + viem + Mera
    public/assets/  hasil generate gambar (lihat dokumen aset)
  docs/superpowers/specs/
```

### 5.1 Kontrak

**`Koin` (ERC-20)**
- `mint(address to, uint256 amt)` / `burn(address from, uint256 amt)`, hanya untuk role `MINTER` (Market, Bank).

**`SimStock` (ERC-20, satu deploy per saham)**
- `sector()` → `uint8` (0 TECH, 1 COMMODITY, 2 CONSUMER, 3 AGRI)
- `priceId()` → `bytes32 = keccak256(bytes(ticker))`, sama dengan derivasi Anchored
- `mint` / `burn`, hanya untuk Market

**`IPriceOracle`** (subset kompatibel `StockOracle` Anchored)
```solidity
enum Session { UNKNOWN, PRE_MARKET, REGULAR, POST_MARKET, OVERNIGHT, CLOSED }
function getPrice(bytes32 priceId) external view
    returns (int128 price, uint64 updatedAt, Session session); // price 8 desimal
```

**`SimOracle is IPriceOracle`**
- `setPrices(bytes32[] ids, int128[] prices)`, hanya owner. Mengisi `updatedAt = block.timestamp` dan `session = REGULAR`.

**`VillageMarket`**
- `claimStarter()`: mint 1.000 KOIN, sekali per alamat, dan emit `StarterClaimed(address player)` (dipakai server untuk daftar pemain di 5.5).
- `buy(SimStock s, uint256 koinIn)`: burn Koin, mint saham `= koinIn × 1e8 / price`.
- `sell(SimStock s, uint256 shares)`: burn saham, mint Koin `= shares × price / 1e8`.
- Hanya menerima saham yang terdaftar (`isListed`). Revert jika harga ≤ 0 atau basi.
- `creditDividends(SimStock s, address[] players, uint256[] amounts)`, hanya role `DIVIDEND_ADMIN`. Menambah `pendingHarvest[player][s]`. Revert jika panjang array berbeda.
- `harvest(SimStock s)`: mint Koin sebesar `pendingHarvest[msg.sender][s]`, lalu nolkan.
- `harvestAll()`: memanen semua saham terdaftar sekaligus.
- *(Opsional)* `harvestAndReplant(SimStock s)`: panen lalu langsung `buy` saham yang sama.

**`VillageBank`**
- `deposit(SimStock s, uint256 amt)` / `withdraw(SimStock s, uint256 amt)`. Withdraw revert jika HF setelahnya < 1 atau batas LTV terlampaui.
- `borrow(uint256 koin)`: revert jika utang baru > 50% nilai jaminan.
- `repay(uint256 koin)`: burn Koin dari pemanggil.
- `liquidate(address user, SimStock s, uint256 repayAmt)`: hanya jika HF < 1, `repayAmt` ≤ 50% utang, dan likuidator menerima saham senilai `repayAmt × 1,05`.
- `healthFactor(address)` dan `collateralValue(address)` (view).

**`VillageLens`** (read-only, satu panggilan untuk UI)
```solidity
struct StockView { address token; string ticker; uint8 sector; int128 price;
                   uint256 walletBal; uint256 collateralBal;
                   uint256 value;          // (walletBal + collateralBal) × price, dalam KOIN
                   uint8 level;            // 0 = petak kosong, 1–3
                   uint256 pendingHarvest; }
struct SectorView { uint256 value; bool unlocked; }
struct PlayerView { uint256 koin; uint256 debt; uint256 healthFactor;
                    uint8 weather; bool starterClaimed; uint256 totalPendingHarvest;
                    StockView[] stocks; SectorView[4] sectors; }
function getPlayer(address user) external view returns (PlayerView memory);
function getPlayers(address[] calldata users) external view returns (PlayerView[] memory); // untuk server Harvest Day
```
`weather`: 0 Cerah, 1 Mendung, 2 Badai.

### 5.2 Alur data
1. **Login:** Mera `createPasskeySession`, lalu didapat alamat EOA.
2. **Bekal gas:** frontend memanggil `POST /api/drip {address}`. Server mengirim 0,1 MON, sekali per alamat.
3. **Dana awal:** `claimStarter()` dari wallet pemain.
4. **Aksi** (buy/sell/deposit/withdraw/borrow/repay): ditandatangani wallet, lalu menunggu receipt (~1 detik di Monad) dengan animasi.
5. **Refresh:** `VillageLens.getPlayer` setiap 2 detik dan langsung setelah receipt. State React diteruskan ke scene Phaser lewat event emitter.
6. **Event pasar:** admin memilih preset, lalu `POST /api/event`, lalu server memanggil `SimOracle.setPrices`. Semua klien melihat perubahan saat polling berikutnya.
7. **Harvest Day:** admin memilih preset `harvest_day`, lalu `POST /api/event`. Server menjalankan alur di 5.5.
8. **Deteksi perubahan untuk animasi:** frontend menyimpan snapshot `PlayerView` sebelumnya dan membandingkannya dengan yang baru (harga, level, `unlocked`, `weather`, `pendingHarvest`). Setiap selisih memicu animasi yang sesuai di 4.8. Teks banner event dibaca dari `GET /api/event/latest`.

### 5.3 Keamanan
- `ADMIN_PRIVATE_KEY` (owner oracle dan `DIVIDEND_ADMIN`), `ADMIN_PASSWORD`, dan `DRIP_PRIVATE_KEY` hanya di env server, tidak pernah dengan prefiks `NEXT_PUBLIC_`.
- `/api/drip`: rate limit per alamat dan per IP, batas total harian.
- Kontrak memakai OpenZeppelin (`ERC20`, `AccessControl`, `Ownable`), dan Bank memakai `ReentrancyGuard`.
- Kontrak belum diaudit. Hanya untuk aset simulasi, dan ini ditulis di README.

### 5.4 Preset event pasar (`/api/event`)
| ID | Banner **UI (EN)** | Perubahan harga |
|---|---|---|
| `tech_boom` | "Nvidia unveils a new chip! The Tech Office is buzzing." | sNVDA +25%, sAAPL +10% |
| `gold_crash` | "Gold prices crash! The Mine goes quiet." | sNEM −40%, sXOM −10% |
| `drought` | "A drought hits the Farm." | sDE −15%, sADM −20% |
| `holiday_sale` | "Holiday shopping season! The Factory is busy." | sKO +12%, sPG +8% |
| `reset` | "Markets are back to normal." | semua kembali ke harga awal |
| `harvest_day` | "Harvest Day! Your companies paid dividends." | tidak mengubah harga, menjalankan 5.5 |

Server menyimpan event terakhir (ID, teks banner, waktu) di memori, dan frontend membacanya lewat `GET /api/event/latest` untuk menampilkan banner.

### 5.5 Dividen (Harvest Day)
1. Server mengumpulkan daftar pemain: alamat yang pernah memanggil `claimStarter` (dibaca dari event log `StarterClaimed` milik `VillageMarket`).
2. Server memanggil `VillageLens.getPlayers(players)` untuk mendapat nilai posisi tiap saham (wallet + jaminan).
3. Untuk tiap saham: `amount = value × persentase dividen` (tabel bagian 2). Persentase disimpan di `frontend/src/config/dividends.ts`.
4. Server memanggil `VillageMarket.creditDividends(stock, players, amounts)` sekali per saham (maksimal 8 transaksi), dengan melewati pemain yang `amount`-nya 0.

**Alasan memakai server, bukan otomatis di kontrak:** perhitungan otomatis on-chain harus melacak setiap perpindahan saham, termasuk saham yang dititipkan di Bank. Itu terlalu rumit untuk 8 hari. Pemain demo sedikit dan asetnya simulasi, jadi cukup dihitung di server. Ini ditulis jujur di README.

---

## 6. Testing

**Foundry (wajib lulus sebelum deploy):**
- `Market`: `claimStarter` hanya sekali; `buy`/`sell` menghitung jumlah dengan benar pada 8/18 desimal; revert untuk saham tidak terdaftar dan harga basi.
- `Bank`: borrow tepat di 50% lolos dan di atasnya revert; `withdraw` yang membuat HF < 1 revert; `liquidate` revert saat HF ≥ 1; bonus 5% dan batas 50% utang benar; borrow revert jika harga basi.
- `Market` (dividen): `creditDividends` revert untuk non-admin dan array yang panjangnya beda; `harvest` mint jumlah yang tepat lalu menolkan; panen kedua tanpa kredit baru menghasilkan 0; kredit dua kali menumpuk; `harvestAll` memanen semua saham.
- `Lens`: wilayah terbuka tepat di ambang 100 KOIN; level petak 0/1/2/3 tepat di ambangnya (0, > 0, 250, 1.000); jaminan di Bank ikut dihitung; cuaca sesuai ambang HF; `pendingHarvest` terbaca per saham.
- **Skenario e2e:** claim, beli sNEM 600, deposit, pinjam 280, `gold_crash` (HF ≈ 1,03, cuaca Badai, `liquidate` masih revert), sNEM turun lagi 10% (HF < 1), likuidasi parsial berhasil dengan bonus 5%.

**Server:** unit test perhitungan dividen di 5.5 (nilai posisi × persentase, pemain dengan nilai 0 dilewati).

**Frontend (manual, checklist di testnet):** jalankan naskah demo di bagian 7 dari awal sampai akhir pada Chrome desktop dan Chrome Android, dan pastikan setiap animasi berprioritas **W** di 4.8 muncul.

---

## 7. Naskah demo (≈ 2,5 menit)
1. Buka app, lalu **Start with Passkey**, dan terima 1.000 Coins.
2. Shop: beli **Nvidia 300 Coins**. **Tech Office** terbuka, petak Nvidia Level 2, petak Apple "Available".
3. Shop: beli **Newmont 600 Coins**. **Mine** terbuka, petak Newmont Level 2.
4. Bank: jaminkan semua sNEM, lalu pinjam **280 Coins**. Cuaca **Sunny**.
5. Shop: beli **ADM 250 Coins** dengan uang pinjaman. **Farm** terbuka, petak ADM Level 2.
6. Admin memicu **`gold_crash`**: petak Newmont meredup (−40%), cuaca jadi **Stormy**.
7. Bank: bayar **120 Coins**, cuaca kembali **Sunny**.
8. Admin memicu **`harvest_day`**: panen muncul di petak Nvidia, Newmont, dan ADM. Tekan **Harvest All**, dapat **+28,4 Coins**.
9. Menu Info: tunjukkan kontrak di explorer, dan jelaskan bahwa ini siap memakai tokenized stock asli (Anchored) di Monad.

**Pengecekan angka** (sesuai aturan bagian 3):
| Langkah | Koin | Jaminan sNEM | Utang | HF | Cuaca |
|---|---|---|---|---|---|
| Setelah langkah 3 | 100 | — | 0 | ∞ | Cerah |
| Langkah 4 | 380 | 600 | 280 | 600 × 0,8 / 280 = 1,71 | Cerah |
| Langkah 5 | 130 | 600 | 280 | 1,71 | Cerah |
| Langkah 6 (sNEM −40%) | 130 | 360 | 280 | 360 × 0,8 / 280 = 1,03 | Badai (belum likuidasi) |
| Langkah 7 | 10 | 360 | 160 | 360 × 0,8 / 160 = 1,80 | Cerah |
| Langkah 8 | 38,4 | 360 | 160 | 1,80 | Cerah |

- Batas pinjam di langkah 4 adalah 50% × 600 = 300, jadi 280 lolos.
- Level petak: Nvidia 300 → Lv2; Newmont 600 → Lv2, dan setelah crash 360 tetap Lv2 (≥ 250); ADM 250 → Lv2.
- Dividen langkah 8: Nvidia 300 × 0,5% = 1,5 · Newmont 360 × 4% = 14,4 · ADM 250 × 5% = 12,5 → total **28,4 Coins**.

---

## 8. Rencana kerja (5–13 Oktober)

| Hari | Tanggal | Target |
|---|---|---|
| 1 | 5 Okt | Scaffold `contracts/` dan `frontend/`, cek aturan mainnet/testnet, mulai generate aset gambar |
| 2 | 6 Okt | Koin, SimStock, SimOracle, Market (termasuk dividen) + test |
| 3 | 7 Okt | Bank, Lens + test, deploy testnet |
| 4 | 8 Okt | Peta Phaser: tilemap, 4 wilayah, 8 petak, kabut, level dan dekorasi |
| 5 | 9 Okt | Login Mera, drip, Shop, terhubung ke kontrak, animasi beli/jual/unlock (W) |
| 6 | 10 Okt | Bank, cuaca dan transisinya, event pasar, Harvest Day, admin |
| 7 | 11 Okt | Animasi prioritas S, polish, bug fix, deploy final |
| 8 | 12 Okt | Video demo, write-up, profil proyek |
| — | 13 Okt | **Submit** (buffer) |

**Jika tertinggal, potong berurutan:**
1. Wilayah Factory (petak Coca-Cola dan P&G).
2. Semua animasi berprioritas **S**.
3. Replant.
4. Likuidasi di UI (tetap ada di kontrak).
5. Dekorasi Level 3 (cukup Level 1–2).

---

## 9. Risiko dan keputusan terbuka
| Item | Status / Mitigasi |
|---|---|
| Aturan hackathon: mainnet wajib? | **Belum dicek.** Cek Official Rules setelah login. Script deploy mendukung 10143 dan 143 |
| Nama proyek | Nama kerja "Portfolio Village", final sebelum 12 Okt |
| Mera butuh Node ≥ 24 | Pakai Node 24 di `frontend/` (di Fealty muncul warning EBADENGINE pada Node 22) |
| Konsistensi gaya aset AI | Pakai gambar referensi dan style prompt yang sama (lihat dokumen aset) |
| Kesan judi / regulasi | Label simulasi, tanpa logo resmi, framing edukasi |
