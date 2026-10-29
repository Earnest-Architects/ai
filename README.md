# API System Enhancer

**Architecture Presentation Integrated System Enhancer** — antarmuka web statis untuk mengedit gambar arsitektur/presentasi dengan **Qwen Image Edit 2.1** melalui ComfyUI.

Proyek ini adalah versi mandiri yang diambil dari tab AI pada proyek tur 360°, dengan struktur web, branding, input file, dan dukungan **1 gambar base + 9 gambar referensi** (maksimal 10 gambar per generasi).

---

## Daftar Isi

1. [Ringkasan](#1-ringkasan)
2. [Fitur](#2-fitur)
3. [Menjalankan Proyek](#3-menjalankan-proyek)
4. [Struktur Proyek](#4-struktur-proyek)
5. [Arsitektur Front-end](#5-arsitektur-front-end)
6. [Input Gambar Base (Detail)](#6-input-gambar-base-detail)
7. [Gambar Referensi (9 Slot)](#7-gambar-referensi-9-slot)
8. [Workflow ComfyUI](#8-workflow-comfyui)
9. [Alur API](#9-alur-api)
10. [Komponen UI Lain](#10-komponen-ui-lain)
11. [Internasionalisasi (ja/en)](#11-internasionalisasi-jaen)
12. [Penyimpanan Data](#12-penyimpanan-data)
13. [Verifikasi yang Sudah Dilakukan](#13-verifikasi-yang-sudah-dilakukan)
14. [Troubleshooting](#14-troubleshooting)
15. [Panduan Perawatan](#15-panduan-perawatan)
16. [Batasan yang Diketahui](#16-batasan-yang-diketahui)

---

## 1. Ringkasan

Aplikasi ini adalah **single-page app tanpa build step**:

- HTML, CSS, dan JavaScript klasik (bukan ES Module).
- Semua modul mendaftarkan fitur ke namespace global `window.AI`.
- Tidak ada framework, bundler, atau `package.json`.
- Komunikasi ke ComfyUI dilakukan lewat HTTP dari browser:

```text
Browser (index.html + js/)
   │  upload gambar
   │  POST workflow JSON
   │  polling hasil
   ▼
ComfyUI / server.py (proxy + access key, opsional)
   ▼
Qwen Image Edit 2.1
```

Gambar base selalu menjadi **slot 1**. Gambar referensi mengisi **slot 2–10**. Di sisi workflow, kesepuluh slot tersebut dipetakan ke sepuluh node `LoadImage`.

---

## 2. Fitur

- Upload gambar base lewat tombol, tombol ganti, atau drag & drop ke stage.
- Hingga **9 gambar referensi** dengan thumbnail bernomor, tombol hapus, dan penghitung `n/9`.
- Drag & drop multi-file ke area composer.
- Red pen untuk menandai area yang ingin diedit; hasil mark dikomposit ke gambar base sebelum dikirim.
- Perbandingan sebelum/sesudah dengan slider.
- Riwayat generasi (IndexedDB, maksimal 50 item).
- Progress estimator + animasi WebGL (dengan fallback CSS).
- Pengaturan alamat server + access key.
- Bahasa Jepang (default) dan Inggris, tombol switch di header.
- Layout responsif untuk desktop dan mobile.

---

## 3. Menjalankan Proyek

### 3.1 Prasyarat

- Browser modern (Chrome, Edge, Firefox, Safari).
- Static HTTP server lokal. **Jangan buka lewat `file://`** karena request ke server ComfyUI dapat diblokir oleh origin/CORS.
- Backend ComfyUI yang mengekspos endpoint berikut:
  - `POST /upload/image`
  - `POST /prompt`
  - `GET /history/{prompt_id}`
  - `GET /view`
  - `GET /system_stats` (untuk tombol connection test)
- Jika memakai `server.py` sebagai proxy, aktifkan `PASSWORD` bila perlu; aplikasi mengirim header `X-Access-Key`.
- Folder ini hanya berisi **front-end statis**; `server.py`/ComfyUI tidak disertakan dan harus berjalan terpisah.

### 3.2 Menjalankan

```bash
cd "E:\AI project\API System v3\API-System-Enhancer"
python -m http.server 8080
```

Buka:

```text
http://localhost:8080
```

Atau gunakan server statis lain (mis. `npx serve`, Live Server).

### 3.3 Konfigurasi server

Klik ikon **sliders** di header:

| Field | Arti |
|---|---|
| Server address | Alamat ComfyUI/proxy. Skema boleh dihilangkan; `*.ts.net` menjadi `https://`, alamat LAN/localhost menjadi `http://`. |
| Access key | Dikirim sebagai `X-Access-Key` jika diisi. |

Default jika kosong:

```text
https://rinaldi18.sardine-lenok.ts.net
```

Nilai disimpan di `localStorage` (`comfy_base2`, `comfy_key`) per origin.

> **HTTPS:** jika halaman dibuka lewat HTTPS, browser memblokir request `http://` ke host lain (mixed content). Gunakan HTTPS (mis. Tailscale Serve) untuk server ComfyUI.

---

## 4. Struktur Proyek

```text
API-System-Enhancer/
├─ index.html                Halaman utama, seluruh markup UI
├─ Qwen_API.json             Workflow Qwen Image 2.1 (sumber kebenaran node)
├─ README.md                 Dokumen ini
├─ assets/
│  ├─ logo.png               Logo brand (dipakai di header)
│  ├─ favicon-64.png         Favicon dari logo
│  └─ apple-touch-icon.png   Ikon iOS dari logo
├─ css/
│  ├─ tokens.css             Variabel warna, radius, ukuran tombol, font
│  ├─ base.css               Stage, branding, empty state, upload card, drop overlay
│  ├─ controls.css           Toolbar, tombol ikon, tombol bahasa, tooltip
│  ├─ composer.css           Panel input, thumbnail referensi, tombol add
│  ├─ compare.css            Slider perbandingan + aksi hasil
│  ├─ settings.css           Panel koneksi server
│  ├─ paint.css              Canvas red pen dan toolbar mark
│  ├─ history.css            Kolom riwayat kanan
│  └─ progress.css           Overlay progress, ring, animasi fallback
└─ js/
   ├─ workflow.js            Salinan Qwen_API.json + AI.NODE + batas gambar
   ├─ core.js                Helper, state global, event bus, status i18n-aware
   ├─ i18n.js                Kamus ja/en, penerapan statis/dinamis, localStorage
   ├─ icons.js               Definisi SVG dan injeksi [data-icon]
   ├─ fx-shader.js           Shader WebGL untuk latar saat generate
   ├─ progress.js            Estimasi progres, ring %, teks tahap
   ├─ settings.js            Normalisasi URL, access key, connection test
   ├─ viewer.js              Stage base image, fit, compare, panel layout
   ├─ paint.js               Red pen, undo/erase, komposit mark ke base
   ├─ history.js             IndexedDB, thumbnail, buka/hapus riwayat
   ├─ api.js                 Upload, build workflow, queue, polling, hasil
   ├─ generate.js            Orkestrasi compose → API → progress → compare → history
   ├─ composer.js            Input prompt + 9 slot referensi
   └─ main.js                Boot: icons, layout, muat riwayat
```

### Urutan load script

Urutan di `index.html` adalah dependensi:

```text
workflow.js → core.js → i18n.js → icons.js → fx-shader.js → progress.js
→ settings.js → viewer.js → paint.js → history.js → api.js → generate.js
→ composer.js → main.js
```

`main.js` berjalan terakhir dan memanggil:

```js
AI.icons.apply();
AI.viewer.layout();
AI.history.load();
```

---

## 5. Arsitektur Front-end

### 5.1 Namespace `window.AI`

Setiap modul berbentuk IIFE:

```js
(function (A) {
  // ...
  A.sesuatu = { ... };
})(window.AI);
```

Modul tidak saling mengimpor. Semua komunikasi lewat `window.AI`, state bersama, dan event bus.

### 5.2 State bersama

```js
AI.state = {
  files: {
    1: null,     // File gambar base
    refs: []     // File[] referensi, maksimal 9
  }
};
```

### 5.3 Event bus

| Event | Pemancar | Konsumen |
|---|---|---|
| `img1:set` | `viewer.js` | `paint.js` (reset coretan) |
| `img1:load` | `viewer.js` | `paint.js` (samakan resolusi canvas) |
| `fit` | `viewer.js` | `paint.js` (posisi & ukuran canvas) |
| `compare:show` | `viewer.js` | `paint.js`, `history.js` |
| `compare:hide` | `viewer.js` | `paint.js` |
| `lang:change` | `i18n.js` | `composer.js`, `history.js`, `progress.js` |
| `refs:change` | `composer.js` | (cadangan untuk modul lain) |

### 5.4 Status bar

`AI.setStatus(key, isError, vars)` menyimpan **key i18n**, bukan teks jadi. Saat bahasa diganti, `AI.refreshStatus()` menerjemahkan ulang status yang sedang tampil.

---

## 6. Input Gambar Base (Detail)

Gambar base adalah **kanvas utama** yang diedit. Hanya ada satu base pada satu waktu.

### 6.1 Titik masuk base image

| Sumber | Elemen | Perilaku |
|---|---|---|
| Tombol besar di empty state | `#upload-card` | Membuka file picker `#f1` |
| Tombol ganti gambar | `#chg` | Membuka file picker; tersembunyi sebelum ada base |
| Drag & drop ke stage | `#hero` | Mengambil **file pertama** sebagai base |
| Hasil generasi | `#use` | Menjadikan blob hasil sebagai base baru |
| Riwayat | `#hlist` | Membuka compare; **tidak** mengubah base |

Semua jalur (kecuali riwayat) berakhir di:

```js
AI.viewer.setImg1(file)
```

### 6.2 Alur `setImg1`

```text
File
 │
 ├─ validasi file.type.startsWith('image/')  → gagal: status file_not_image
 ├─ hideCompare()
 ├─ AI.state.files[1] = file
 ├─ cap.src = URL.createObjectURL(file)
 ├─ cap.style.display = 'block'
 ├─ revoke object URL base lama
 ├─ #capEmpty disembunyikan
 ├─ #chg ditampilkan
 ├─ status_loaded
 └─ emit img1:set
        │
        └─ (saat cap.onload) emit img1:load → paint.js menyiapkan canvas
```

Catatan:

- Validasi berbasis **MIME**. File gambar dengan MIME kosong (mis. sebagian HEIC) bisa ditolak.
- Base **tidak** dihapus dari state saat compare dibuka; hanya `#cap` yang disembunyikan.
- Mengganti base **tidak mengosongkan** gambar referensi. Referensi tetap ada sampai dihapus manual.
- Drag & drop ke stage hanya memakai `files[0]`; file tambahan pada drop yang sama diabaikan. Untuk menambah referensi, drop ke composer atau tombol tambah.
- Referensi boleh dipilih lebih dulu, tetapi tombol generate tetap diblokir dengan status `alert_no_image` sampai base tersedia.

### 6.3 Tampilan & geometri

Base ditampilkan dengan `object-fit: contain`, jadi tidak ada crop.

`viewer.js` menghitung kotak tampilan:

```js
boxOf(img) // mempertahankan rasio natural di dalam area stage
```

Kotak yang sama dipakai untuk:

- `#cap` (gambar base),
- `#paint` (canvas coretan),
- `#cmp` (slider perbandingan).

Karena itu coretan merah selalu menempel tepat pada piksel gambar yang terlihat.

### 6.4 Base dan red pen

1. Klik ikon **pen** (`#mark`) untuk masuk mode mark; panel input disembunyikan sementara.
2. Canvas `#paint` memiliki resolusi internal **sama dengan resolusi natural base**.
3. Stroke disimpan sebagai array, sehingga undo/clear dan resize tetap konsisten.
4. `hasMarks()` mengecek alpha canvas pada sampel maksimal 256 px, sehingga coretan yang sudah dihapus dengan eraser tidak dianggap ada.
5. Saat generate, jika ada mark:
   - base asli + canvas merah dikomposit ke canvas baru,
   - diekspor sebagai JPEG kualitas 0.95 dengan nama `marked.jpg`,
   - file inilah yang menggantikan base untuk upload.
6. Instruksi tambahan ditambahkan ke prompt:

```text
. Only edit the areas marked in red in image 1. ...
```

Jika ada referensi, dipakai `<image1>` agar sesuai konvensi multi-image Qwen 2.1. Hanya base yang dikomposit dengan mark; gambar referensi dikirim apa adanya.

> Prompt yang disimpan di riwayat adalah prompt asli dari user, tanpa tambahan instruksi mark.

### 6.5 Base di dalam workflow

Base selalu menempati **slot 1**:

| Peran | Slot | Node LoadImage |
|---|---|---|
| Base | 1 | `470` |
| Referensi 1 | 2 | `475` |
| Referensi 2 | 3 | `502` |
| Referensi 3 | 4 | `503` |
| Referensi 4 | 5 | `504` |
| Referensi 5 | 6 | `505` |
| Referensi 6 | 7 | `506` |
| Referensi 7 | 8 | `507` |
| Referensi 8 | 9 | `508` |
| Referensi 9 | 10 | `509` |

Konsekuensinya:

- `TextEncodeQwenImage21` (`459:474`) menerima base sebagai `images.image_1`.
- `BatchImagesNode` (`459:485`) menerima base sebagai `images.image0`.
- `ImageCompare` (`472`) memakai node `470` sebagai sisi "original" di UI ComfyUI (tidak dipakai oleh front-end ini).
- Nama file base di server adalah nama upload acak `web_<timestamp>_<rand>.<ext>`.

### 6.6 Base vs original untuk compare/history

Saat generasi:

```text
orig = AI.state.files[1]          // base tanpa mark
src1 = paint.hasMarks()
       ? await paint.compose()    // marked.jpg (dengan mark)
       : orig
```

- Yang di-upload: `src1`.
- Yang dipakai sebagai sisi kiri compare: `orig` (tanpa mark).
- Yang disimpan di riwayat sebagai `original`: `orig`.

Dengan begitu hasil akhir tidak menampilkan coretan merah sebagai bagian dari "sebelum".

### 6.7 Hasil generasi menjadi base baru

Tombol `#use` (ikon replace):

```text
blob hasil → new File([blob], nama, {type})
→ setImg1(file)
→ panel input ditampilkan lagi
```

Coretan di-reset karena `img1:set`. Referensi tetap dipertahankan.

### 6.8 Diagram siklus base

```text
        ┌──────────────────────────────────────────────┐
        │                                              │
        ▼                                              │
  ┌───────────┐   #upload-card / #chg / drop   ┌───────┴──────┐
  │  No base  │ ─────────────────────────────► │  Base aktif  │
  │ (empty)   │                                │ #cap + File  │
  └───────────┘                                └──────┬───────┘
                                                      │
                                    mark? ────────────┤
                                                      ▼
                                             compose() marked.jpg
                                                      │
                                                      ▼
                                             upload slot 1 (470)
                                                      │
                                                      ▼
                                             compare result
                                                      │
                                             #use ────┘
```

---

## 7. Gambar Referensi (9 Slot)

### 7.1 UI

- Tombol tambah `#d2` di kiri prompt, dengan badge `n/9`.
- Thumbnail muncul di baris `#ref-list` di atas prompt, berurutan sesuai waktu ditambahkan.
- Di layar sempit (mis. 390 px) strip thumbnail dapat di-scroll horizontal; badge `n/9` tetap menunjukkan jumlah total.
- Setiap thumbnail memiliki nomor `1..9` dan tombol hapus `×`.
- Memilih lebih dari sisa kuota akan menambahkan sebanyak kuota lalu menampilkan status peringatan.
- Drop multi-file di tombol tambah, daftar thumbnail, atau area composer menambahkan referensi.
- Tombol tambah tetap terlihat saat penuh, tetapi klik akan menampilkan peringatan, bukan membuka picker.

### 7.2 State

```js
AI.state.files.refs // File[]
AI.MAX_REFS         // 9
AI.MAX_IMAGES       // 10 (base + referensi)
```

Menghapus referensi akan menomori ulang thumbnail. Semua referensi dikirim **berurutan**.

### 7.3 Pemetaan ke workflow

`api.js` membangun ulang link gambar supaya selalu rapat dan berurutan:

- Encoder: `images.image_1 … images.image_N`
- Batch: `images.image0 … images.image_{N-1}`

Node `LoadImage` yang tidak terpakai dihapus, lalu semua link yang menunjuk node terhapus dibersihkan sebagai pengaman. Selain menjaga urutan gambar, langkah ini menghindari ketergantungan pada nama file contoh (mis. `portrait_model_denim.png`) yang ada di workflow export tetapi belum tentu tersedia di server.

### 7.4 Contoh payload

Untuk base + 2 referensi:

```json
{
  "459:474": {
    "inputs": {
      "images.image_1": ["470", 0],
      "images.image_2": ["475", 0],
      "images.image_3": ["502", 0]
    }
  },
  "459:485": {
    "inputs": {
      "images.image0": ["470", 0],
      "images.image1": ["475", 0],
      "images.image2": ["502", 0]
    }
  }
}
```

Node/ link referensi yang tidak dipakai tidak ikut dikirim.

---

## 8. Workflow ComfyUI

Sumber: `Qwen_API.json`, disalin ke `js/workflow.js` agar tersedia sinkron saat generate. **Saat runtime aplikasi membaca `js/workflow.js`**, bukan `Qwen_API.json`; file JSON adalah sumber untuk regenerasi.

### 8.1 Peta node

| Peran | Node ID | Tipe |
|---|---|---|
| Base image | `470` | `LoadImage` |
| Referensi 1–9 | `475`, `502`–`509` | `LoadImage` |
| Encoder prompt + gambar | `459:474` | `TextEncodeQwenImage21` |
| Batch gambar (untuk enhancer) | `459:485` | `BatchImagesNode` |
| Switch prompt | `459:484` | `ComfySwitchNode` |
| Preview prompt | `459:480` | `PreviewAny` |
| Prompt enhancer | `459:500` | `TextGenerate` |
| System prompt enhancer | `459:479` | `PrimitiveStringMultiline` |
| CLIP enhancer | `459:477` | `CLIPLoader` |
| Switch latent | `459:468` | `ComfySwitchNode` |
| Empty latent | `459:456` | `EmptyLatentImage` |
| Sampler | `459:458` | `KSampler` |
| VAE decode | `459:457` | `VAEDecode` |
| Save | `461` | `SaveImageAdvanced` |
| Compare (ComfyUI) | `472` | `ImageCompare` |
| Inpaint branch | `510`, `511` | `LoadImageMask`, `VAEEncodeForInpaint` |

Node `510`/`511` tidak terhubung ke output dan tidak dipakai oleh front-end.

### 8.2 Jalur prompt

```text
UI prompt
   │
   ▼
459:484 (If/Else Switch, switch=false)
   │ on_false = prompt
   ▼
459:480 PreviewAny
   │
   ▼
459:474 TextEncodeQwenImage21.prompt
```

- `switch=false` mengikuti default workflow hasil export.
- Enhancer (`459:500`) berada di cabang `on_true` dan **tidak aktif**.
- Aplikasi tidak mengisi `459:500.prompt`; jika ingin mengaktifkan enhancer, perlu perubahan kode agar prompt user juga dikirim ke node tersebut dan `switch` diset `true`.

### 8.3 Latent & sampler

- `459:468` default `switch=false` → memakai latent dari encoder (`459:474` output ke-2).
- `459:458`: `euler`, `simple`, 25 steps, cfg 1, denoise 1.
- Seed diacak di front-end setiap generasi: `Math.floor(Math.random()*1e15)`.
- `negative_prompt` diset kosong.

### 8.4 Output

- `461` menyimpan hasil dengan prefix `Qwen_image_2.1`.
- Front-end memilih gambar pertama bertipe `output` dari `461`.
- Jika `461` tidak ada di output, front-end mencari output lain yang memiliki gambar `output`.

### 8.5 Model yang dibutuhkan

Workflow mengacu pada nama file berikut; pastikan tersedia di mesin ComfyUI:

```text
qwen_image_2.1_int8_convrot.safetensors
qwen3vl_8b_int8_convrot.safetensors
qwen_image_2.1_vae_bf16.safetensors
qwen3.5_9b_qwen_image_2.1_pe_i2i.int8_convrot.safetensors
```

---

## 9. Alur API

Implementasi: `js/api.js`.

### 9.1 Upload

- Semua gambar di-upload paralel dengan `Promise.all`.
- Nama file dibuat unik: `web_<Date.now()>_<random>.<ext>`.
- Form field: `image`, plus `overwrite=true`.
- Respons `{name, subfolder}` digabung menjadi `subfolder/name` bila ada.

### 9.2 Build workflow

`AI.api.build(names, prompt)`:

1. Clone workflow (`structuredClone`).
2. Isi `LoadImage` base dan referensi sesuai urutan.
3. Hapus node referensi yang tidak terpakai.
4. Bangun ulang link encoder/batch secara berurutan.
5. Bersihkan link menggantung.
6. Set prompt pada switch, negative prompt, dan seed sampler.

Fungsi ini murni (tanpa fetch) sehingga mudah diuji.

### 9.3 Queue & polling

```text
POST /prompt  { prompt: <workflow>, client_id: "web-<timestamp>" }
        │
        ▼
   prompt_id
        │
        ▼
GET /history/{prompt_id}  setiap 1,2 detik
        │  status_str === "error" → gagal
        │  outputs tersedia → lanjut
        ▼
GET /view?filename=...&subfolder=...&type=...
        │
        ▼
     Blob hasil
```

Tidak ada timeout eksplisit di front-end; polling berhenti saat hasil diterima atau error.

### 9.4 Error yang ditangani

- `401` → access key salah.
- Upload gagal → status + HTTP code.
- `/prompt` ditolak → pesan `error.message` + detail `node_errors`.
- Eksekusi error → pesan generik untuk cek log ComfyUI.
- Tidak ada gambar hasil → pesan `err_no_result`.
- `Failed to fetch` → pesan koneksi + hint mixed content.

---

## 10. Komponen UI Lain

### 10.1 Stage & panel

- Panel composer dapat disembunyikan lewat `#pnl`; tinggi panel dipublikasikan sebagai CSS variable `--panel-h`.
- `--top-h` dipakai untuk posisi tag compare dan panel setelan.
- Mobile (`≤560px`): branding naik ke baris sendiri di atas toolbar.

### 10.2 Compare

- Slider `#cmp` memakai dua `<img>`; gambar hasil di-clip dengan `clip-path` berdasarkan `--pos`.
- Bisa digeser dengan pointer atau tombol panah saat knob fokus.
- Tombol tutup mengembalikan tampilan base.

### 10.3 Red pen

- Mode draw/erase; ukuran kuas 4–80.
- Undo per stroke; clear all.
- Saat masuk mode mark, panel input disembunyikan; saat selesai, panel dikembalikan jika sebelumnya terbuka.

### 10.4 History

- Disimpan di IndexedDB `ai_history`, object store `items`, keyPath `id`.
- Maksimal 50 item; item tertua dihapus otomatis.
- Thumbnail JPEG 160 px.
- Jika kuota penuh, item tertua dibuang lalu dicoba lagi.
- Klik item membuka compare; tombol `×` menghapus item.

### 10.5 Progress

- Progres adalah **estimasi**, bukan progres nyata dari ComfyUI.
- Durasi sukses terakhir disimpan di `ai_gen_ms` dan dipakai sebagai dasar estimasi (moving average).
- Kurva berhenti di ~95% sampai hasil benar-benar diterima.
- Efek latar memakai WebGL; jika tidak tersedia, fallback CSS.

---

## 11. Internasionalisasi (ja/en)

File: `js/i18n.js`.

- Default: **Jepang**.
- Simpan pilihan di `localStorage` key `ase_lang`.
- Override lewat URL: `?lang=en` atau `?lang=ja`.
- Tombol header menampilkan target bahasa (`EN` saat aktif ja, `JA` saat aktif en).
- Atribut statis yang diterjemahkan:
  - `data-i18n`
  - `data-i18n-aria`
  - `data-i18n-tip`
  - `data-i18n-ph`
  - `data-i18n-alt`
- Label dinamis (mis. `Remove reference image 3`) dibuat ulang saat event `lang:change`.
- Status terakhir disimpan sebagai key + variabel, lalu diterjemahkan ulang.

---

## 12. Penyimpanan Data

| Lokasi | Key | Isi |
|---|---|---|
| localStorage | `ase_lang` | `ja` / `en` |
| localStorage | `comfy_base2` | Alamat server ComfyUI |
| localStorage | `comfy_key` | Access key |
| localStorage | `ai_gen_ms` | Estimasi durasi generasi (ms) |
| IndexedDB | `ai_history` / `items` | Riwayat generasi + thumbnail |

Tidak ada data gambar yang diunggah ke pihak ketiga; semua request menuju server yang dikonfigurasi.

---

## 13. Verifikasi yang Sudah Dilakukan

Pengujian otomatis memakai Chrome headless + CDP dan backend ComfyUI tiruan:

- Upload base berhasil; empty state hilang; tombol ganti muncul.
- Memilih 10 file referensi → hanya 9 tersimpan, thumbnail 9, badge `9/9`, status peringatan.
- Hapus referensi → jumlah dan penomoran diperbarui.
- Payload yang dikirim berisi 10 `LoadImage` dengan nama file sesuai urutan upload.
- Encoder menerima `images.image_1..10`, batch menerima `image0..9`, tanpa link menggantung.
- Prompt user masuk ke `459:484.on_false`; switch `false`; seed acak.
- Compare tampil setelah hasil diterima; status sukses.
- Layout mobile 390×844: composer muat, tidak ada overflow horizontal, 9 referensi terpasang (strip dapat di-scroll horizontal) dan tombol tambah terlihat.
- Ganti bahasa memperbarui aria-label dinamis dan mempertahankan penghitung.
- Tidak ada error console.

Pengujian ini **tidak** memvalidasi kualitas gambar atau ketersediaan model di mesin ComfyUI nyata.

---

## 14. Troubleshooting

| Gejala | Kemungkinan penyebab | Solusi |
|---|---|---|
| `Cannot reach the PC` / `Failed to fetch` | Server mati, alamat salah, atau mixed content | Cek alamat; buka via HTTPS; jalankan connection test |
| `401` | Access key salah/ belum diisi | Isi access key yang sama dengan `server.py` |
| `502` dari connection test | Proxy hidup, ComfyUI mati / port salah | Nyalakan ComfyUI; cek port (Desktop 8000 / Portable 8188) |
| `The workflow was rejected` | Node/ model/ input tidak cocok | Lihat detail `node_errors`; pastikan model tersedia |
| `No result image` | Save node tidak dieksekusi | Cek output ComfyUI dan node `461` |
| Base tidak muncul | File bukan gambar atau MIME kosong | Gunakan JPG/PNG/WebP |
| Referensi tidak bertambah | Sudah 9 gambar | Hapus salah satu thumbnail |
| Hasil mengabaikan referensi | Model/ workflow tidak mendukung multi-image | Pastikan `Qwen_API.json` dan model Qwen 2.1 yang benar |
| Mark tidak terlihat di hasil | Mark hanya panduan; hasil akhir menghapus merah | Normal; prompt meminta mark dihapus |
| Halaman kosong setelah update | Cache lama | Naikkan `?v=` pada CSS/JS atau hard refresh |

---

## 15. Panduan Perawatan

### 15.1 Mengganti workflow

Jika workflow di-export ulang dari ComfyUI:

1. Ganti `Qwen_API.json`.
2. Regenerasi `js/workflow.js` agar tetap sinkron:

```bash
node -e "const fs=require('fs');const wf=JSON.parse(fs.readFileSync('Qwen_API.json','utf8').replace(/^\uFEFF/,''));fs.writeFileSync('js/workflow.js','window.AI=window.AI||{};\nAI.WORKFLOW='+JSON.stringify(wf,null,2)+';\nAI.NODE='+JSON.stringify({base:'470',refs:['475','502','503','504','505','506','507','508','509'],enc:'459:474',batch:'459:485',promptSwitch:'459:484',enhancer:'459:500',sampler:'459:458',save:'461'},null,2)+';\nAI.MAX_IMAGES=10;\nAI.MAX_REFS=9;\n')"
```

3. Sesuaikan daftar `AI.NODE` di dalam perintah (atau edit `js/workflow.js`) jika ID node berubah.
4. Jika jumlah `LoadImage` berubah, sesuaikan `AI.NODE.refs` dan `AI.MAX_REFS`/`AI.MAX_IMAGES`.
5. Naikkan query `?v=` di `index.html` untuk menghindari cache.

### 15.2 Menambah slot referensi

- Tambah node `LoadImage` di workflow dan ID-nya di `AI.NODE.refs`.
- Naikkan `AI.MAX_REFS` dan `AI.MAX_IMAGES`.
- UI otomatis mengikuti `AI.MAX_REFS`.
- Pastikan encoder Qwen mendukung jumlah gambar tersebut.

### 15.3 Mengaktifkan prompt enhancer

Saat ini enhancer dimatikan. Karena `api.js` selalu menulis ulang nilai switch, perubahan harus dilakukan di kode, bukan hanya di `Qwen_API.json`:

- Di fungsi `build` (`js/api.js`), set `wf[NODE.promptSwitch].inputs.switch = true`.
- Isi `wf[NODE.enhancer].inputs.prompt` dengan prompt user.
- Pertimbangkan menambahkan toggle di UI + penyimpanan preferensi.
- Sadari biaya waktu ekstra karena menjalankan model teks 9B.

### 15.4 Mengubah server default

Ubah nilai fallback di `js/settings.js`:

```js
if (!baseEl.value) baseEl.value = 'https://...';
```

---

## 16. Batasan yang Diketahui

- Hanya **satu base image** per generasi.
- Maksimal **10 gambar total** (1 base + 9 referensi).
- Prompt enhancer belum diekspos sebagai opsi UI.
- Tidak ada antrean multi-job; satu generasi pada satu waktu per tab.
- Tidak ada timeout polling; koneksi yang menggantung akan terus menunggu.
- Riwayat dibatasi 50 item dan bergantung pada ruang IndexedDB.
- Perubahan base tidak mereset referensi (disengaja, tetapi perlu diketahui).
- Kualitas hasil sepenuhnya bergantung pada model dan workflow di server ComfyUI.
