@echo off
cd /d "%~dp0"
rem ---- Pengaturan (ubah sesuai kebutuhan) ----
set COMFY=http://127.0.0.1:8000
set PORT=8080
set PASSWORD=
set ORIGIN=*
rem Port ComfyUI: Desktop = 8000, Portable = 8188
rem Isi PASSWORD kalau mau pakai kunci akses. Isi ORIGIN dengan https://USERNAME.github.io untuk membatasi.
rem Pengaturan pribadi bisa ditaruh di config.bat (tidak ikut ke GitHub)
if exist config.bat call config.bat
python server.py
pause
