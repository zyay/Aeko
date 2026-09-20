#!/usr/bin/env python3
"""Register a GitHub App via manifest flow and push OAuth creds to Vercel."""
from __future__ import annotations

import json
import threading
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

AUTH_URL = "https://aeko.vercel.app"
CALLBACK = f"{AUTH_URL}/api/auth/callback/github"
REDIRECT = "http://127.0.0.1:8765/callback"
PROJECT_ID = "prj_RWDFj4vmAizJLLRYnMR2QUDndbKJ"
TEAM_ID = "team_3kyqrG7Mo0AuHRZLMm8fQZKR"

MANIFEST = {
    "name": "Aeko",
    "url": AUTH_URL,
    "redirect_url": REDIRECT,
    "callback_urls": [CALLBACK],
    "public": False,
    "request_oauth_on_install": False,
    "default_permissions": {"email": "read"},
    "default_events": [],
}


def vercel_token() -> str:
    auth_path = Path.home() / "AppData/Roaming/com.vercel.cli/Data/auth.json"
    return json.loads(auth_path.read_text())["token"]


def set_vercel_env(key: str, value: str, *, sensitive: bool = False):
    token = vercel_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    for target in ("production", "preview", "development"):
        body = json.dumps(
            {
                "key": key,
                "value": value,
                "type": "sensitive" if sensitive else "encrypted",
                "target": [target],
            }
        ).encode()
        url = f"https://api.vercel.com/v10/projects/{PROJECT_ID}/env?teamId={TEAM_ID}&upsert=true"
        req = urllib.request.Request(url, data=body, method="POST", headers=headers)
        with urllib.request.urlopen(req) as resp:
            print(f"  {key}@{target}: {resp.status}")


def convert_manifest(code: str) -> dict:
    url = f"https://api.github.com/app-manifests/{urllib.parse.quote(code, safe='')}/conversions"
    req = urllib.request.Request(url, method="POST", headers={"Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def main():
    result: dict | None = None

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            nonlocal result
            parsed = urllib.parse.urlparse(self.path)
            if parsed.path != "/callback":
                self.send_response(404)
                self.end_headers()
                return
            code = urllib.parse.parse_qs(parsed.query).get("code", [""])[0]
            if not code:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"missing code")
                return
            try:
                result = convert_manifest(code)
                body = b"GitHub App created. You can close this tab."
                self.send_response(200)
                self.send_header("Content-Type", "text/plain")
                self.end_headers()
                self.wfile.write(body)
            except Exception as exc:
                self.send_response(500)
                self.end_headers()
                self.wfile.write(str(exc).encode())

        def log_message(self, *_args):
            return

    server = HTTPServer(("127.0.0.1", 8765), Handler)
    thread = threading.Thread(target=server.handle_request, daemon=True)
    thread.start()

    manifest_q = urllib.parse.quote(json.dumps(MANIFEST), safe="")
    url = f"https://github.com/settings/apps/new?manifest={manifest_q}"
    print("Opening GitHub to create the Aeko GitHub App…")
    print("Click Create GitHub App in the browser.")
    webbrowser.open(url)
    thread.join(timeout=300)
    server.server_close()
    if not result:
        raise SystemExit("Timed out waiting for GitHub manifest callback on http://127.0.0.1:8765/callback")

    client_id = str(result.get("client_id") or result.get("id"))
    client_secret = result["client_secret"]
    print("GitHub App ID:", result.get("id"))
    print("OAuth client ID:", client_id)
    print("Pushing AUTH_GITHUB_* to Vercel…")
    set_vercel_env("AUTH_GITHUB_ID", client_id)
    set_vercel_env("AUTH_GITHUB_SECRET", client_secret, sensitive=True)
    print("Done.")


if __name__ == "__main__":
    main()
