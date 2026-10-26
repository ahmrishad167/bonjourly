"""Run Bonjourly locally.

    python FrenchLearningApp.py          # rebuild content, serve on http://localhost:8000 and open the browser

Serving over localhost (instead of opening index.html directly) lets Chrome and Edge use the
microphone for the speaking exercises.
"""
import http.server
import pathlib
import socketserver
import sys
import webbrowser

import build

ROOT = pathlib.Path(__file__).parent
PORT = 8000


def main():
    build.main([])
    handler = lambda *a: http.server.SimpleHTTPRequestHandler(*a, directory=str(ROOT))  # noqa: E731
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        url = f"http://localhost:{PORT}/index.html"
        print(f"Bonjourly running at {url}  (Ctrl+C to stop)")
        webbrowser.open(url)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    sys.exit(main())
