"""Penghubung antara halaman web dan ComfyUI di komputer ini.

- Menyajikan index.html (buka http://localhost:8080)
- Meneruskan request API ke ComfyUI (tanpa masalah CORS)
- Mengizinkan halaman dari domain lain (mis. GitHub Pages) lewat header CORS
- Kunci akses opsional lewat PASSWORD

Pengaturan lewat environment variable:
  COMFY     alamat ComfyUI        (default http://127.0.0.1:8000, Desktop=8000, Portable=8188)
  PORT      port server ini       (default 8080)
  PASSWORD  kunci akses opsional  (kosong = tanpa kunci)
  ORIGIN    domain yang boleh memanggil API (default *, mis. https://namamu.github.io)
"""
import os, socket, urllib.request, urllib.error
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

COMFY = os.environ.get("COMFY", "http://127.0.0.1:8000").rstrip("/")
PORT = int(os.environ.get("PORT", "8080"))
PASSWORD = os.environ.get("PASSWORD", "")
ORIGIN = os.environ.get("ORIGIN", "*")
HERE = os.path.dirname(os.path.abspath(__file__))
ALLOWED = ("/prompt", "/history", "/upload/image", "/view", "/system_stats")


class H(BaseHTTPRequestHandler):
    def _send(self, code, ctype, body):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Access-Key")
        self.send_header("Access-Control-Allow-Private-Network", "true")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _proxy(self):
        path = self.path.split("?")[0]
        if not any(path == p or path.startswith(p + "/") for p in ALLOWED):
            return self._send(404, "text/plain", b"Not found")
        if PASSWORD and self.headers.get("X-Access-Key", "") != PASSWORD:
            return self._send(401, "text/plain", b"Kunci akses salah")
        n = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(n) if n else None
        req = urllib.request.Request(COMFY + self.path, data=body, method=self.command)
        if self.headers.get("Content-Type"):
            req.add_header("Content-Type", self.headers["Content-Type"])
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                self._send(r.status, r.headers.get("Content-Type", "application/octet-stream"), r.read())
        except urllib.error.HTTPError as e:
            self._send(e.code, e.headers.get("Content-Type", "application/json"), e.read())
        except Exception as e:
            self._send(502, "text/plain", f"Tidak bisa terhubung ke ComfyUI di {COMFY}: {e}".encode())

    def do_GET(self):
        if self.path.split("?")[0] in ("/", "/index.html"):
            with open(os.path.join(HERE, "index.html"), "rb") as f:
                return self._send(200, "text/html; charset=utf-8", f.read())
        self._proxy()

    def do_POST(self):
        self._proxy()

    def log_message(self, *a):
        pass


def lan_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "IP-komputer"


if __name__ == "__main__":
    print(f"ComfyUI   : {COMFY}")
    print(f"Di PC ini : http://localhost:{PORT}")
    print(f"Di HP/LAN : http://{lan_ip()}:{PORT}")
    print("Kunci akses:", "aktif" if PASSWORD else "tidak diatur")
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
