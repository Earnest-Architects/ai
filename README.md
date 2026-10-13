# Qwen Image Edit Web

Frontend web sederhana untuk workflow ComfyUI `image_qwen_image_2_1_image_edit`.
Isinya hanya: **Gambar 1, Gambar 2, Prompt, Negative prompt, Generate**.

## Cara pakai (paling mudah)

1. Jalankan ComfyUI (Desktop memakai port 8000, Portable port 8188).
2. Install [Python 3](https://www.python.org/downloads/) (tidak perlu library tambahan).
3. Klik dua kali `start.bat`. Ubah `COMFY` di dalamnya kalau port ComfyUI kamu 8188.
4. Buka `http://localhost:8080`. Dari HP di Wi-Fi yang sama, buka alamat "Di HP/LAN" yang tampil di jendela server.

Halaman dan API lewat satu alamat yang sama, jadi tidak ada masalah CORS.

## Dipakai dari GitHub Pages

1. Di repo GitHub: **Settings > Pages > Deploy from a branch > main / (root)**.
2. Buka halaman Pages, lalu di bagian **Koneksi ke komputer** isi alamat `server.py` dan klik **Tes koneksi**.

Syarat koneksinya:

- Halaman Pages memakai HTTPS, jadi browser memblokir alamat `http://` ke komputer lain (kecuali `localhost`).
  - Di PC yang sama: isi `http://localhost:8080`, ini diizinkan.
  - Dari HP atau komputer lain: pakai alamat HTTPS, misalnya dengan Tailscale Serve: `tailscale serve --bg 8080`, lalu pakai alamat `https://nama-pc.xxxx.ts.net` yang diberikan.
- Chrome bisa menampilkan izin "akses jaringan lokal". Pilih Izinkan.
- Disarankan isi `ORIGIN` di `start.bat` dengan `https://USERNAME.github.io` supaya hanya halaman itu yang boleh memanggil API.
- Kalau PC bisa dijangkau dari luar jaringan rumah, isi `PASSWORD` di `start.bat`, lalu isi kunci yang sama di kolom **Kunci akses** pada halaman.

## Berkas

| Berkas | Fungsi |
|---|---|
| `index.html` | Halaman web (workflow sudah tertanam) |
| `server.py` | Penghubung ke ComfyUI, CORS, kunci akses opsional |
| `start.bat` | Menjalankan `server.py` di Windows |
| `workflow.json` | Salinan workflow API untuk referensi |

## Mengganti workflow

Workflow tertanam di `index.html` (baris `const WORKFLOW = ...`). Kalau kamu export ulang dari ComfyUI,
ganti isi objek itu dan sesuaikan ID node di `const NODE = {...}` (Load Image 1 dan 2, Text Encode, KSampler, Save Image).

## Catatan

- Prompt dikirim langsung ke node Text Encode, jadi prompt enhancer di workflow tidak dipakai.
- Seed diacak setiap kali Generate.
- `server.py` hanya meneruskan jalur yang diperlukan: `/prompt`, `/history`, `/upload/image`, `/view`, `/system_stats`.
